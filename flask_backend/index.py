from flask import Flask
import os
import sys
from PythonScripts import Locations
from PythonScripts import Resolution
from PythonScripts import Prediction
from PythonScripts import FaceDetection
import constants
from werkzeug.utils import secure_filename
from PythonScripts import cctvClean
from PythonScripts import profilesClean
from flask import Blueprint, jsonify, request, url_for, current_app
from flask_socketio import SocketIO, emit
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

Locations.load_all_data()

app = Flask(__name__)

from flask_cors import CORS
CORS(app) 

socketio = SocketIO(app, cors_allowed_origins="*")

try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    print("Please make sure you have a .env file with your GOOGLE_API_KEY")

app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_images')
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    entity_id = data.get("entity_id")
    day_of_week = data.get("day")
    recieved_data = Prediction.predict_daily_schedule(entity_id, day_of_week)
    return recieved_data

@app.route("/image-search", methods=["POST"])
def imageSearch():

    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400
        
    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(save_path)

        imageUrl = url_for('static', filename=f'test_images/{filename}', _external=True)
        
        try:
            entityId = FaceDetection.identify_entity_from_image(save_path)
            return jsonify({"entityId": entityId})
        except Exception as e:
            return jsonify({"error": f"An error occurred during face detection: {str(e)}"}), 500
    else:
        return jsonify({"error": "File type not allowed"}), 400
    

@app.route('/cctv-cleaner',methods = ['POST'])
def CctvClean():
    data = request.get_json()
    output = cctvClean.CCTVCleaner(data)
    return output

@app.route('/profile-cleaner', methods=['POST'])
def profileClean():
    data = request.get_json()
    output = profilesClean.ProfilesCleaner(data)
    return output

@app.route('/locations', methods=['POST'])
def locations_density():
    data = request.get_json()
    day_of_week = data.get("day_of_week")
    department = data.get("department") 
    if department and department != "all":
        output = Locations.calculate_department_density(day_of_week, department)
    else:
        output = Locations.calculate_predicted_density(day_of_week)
    return output

@app.route("/")
def home():
    return "Ethos Backend is running!"

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

def _run_summarize_stream(sid, data):
    formattedData = data.get('formattedData')
    userName = data.get('userName')
    print(f"Received summarize_stream request for user: {userName} (sid: {sid})")

    system_prompt = constants.USER_PREDICTION_PROMPT
    user_query = f"Summarize the following predicted schedule for user, it should be moderately short and in 3 paragraphs {userName}: {formattedData}"""

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            system_instruction=system_prompt
        )
        response_stream = model.generate_content(user_query, stream=True)

        for chunk in response_stream:
            if chunk.text:
                socketio.emit('summary_chunk', {'text': chunk.text}, room=sid)
                socketio.sleep(0.05)

    except Exception as e:
        print(f"Error during Gemini stream for {sid}: {e}")
        socketio.emit('stream_error', {'error': 'Failed to generate summary. Check backend console for details.'}, room=sid)
    finally:
        socketio.emit('stream_end', room=sid)
        print(f"Stream ended for user: {userName} (sid: {sid})")

@socketio.on('summarize_stream')
def handle_summarize_stream(data):
    sid = request.sid
    socketio.start_background_task(_run_summarize_stream, sid, data)

def _run_heatmap_summary(sid, data):
    day = data.get('day')
    hour = data.get('hour')
    department = data.get('department')
    density = data.get('density')

    print(f"Received summarize_heatmap request for {day} at {hour}:00, Dept: {department} (sid: {sid})")

    system_prompt = constants.HEATMAP_HOURLY_PROMPT
    
    hour_str = f"{hour:02d}:00"
    dept_str = f"for the {department} department" if department and department != "all" else "for all users"

    user_query = f"Provide a brief summary for campus activity on {day} at {hour_str}, {dept_str}. The current density is: {density}"

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            system_instruction=system_prompt
        )
        response_stream = model.generate_content(user_query, stream=True)

        for chunk in response_stream:
            if chunk.text:
                socketio.emit('heatmap_summary_chunk', {'text': chunk.text}, room=sid)
                socketio.sleep(0.05)

    except Exception as e:
        print(f"Error during Gemini heatmap stream for {sid}: {e}")
        socketio.emit('stream_error', {'error': 'Failed to generate heatmap summary.'}, room=sid)
    finally:
        socketio.emit('heatmap_stream_end', room=sid)
        print(f"Heatmap stream ended for: {sid}")

@socketio.on('summarize_heatmap')
def handle_heatmap_summary(data):
    sid = request.sid
    socketio.start_background_task(_run_heatmap_summary, sid, data)

def _run_daily_heatmap_summary(sid, data):
    day = data.get('day')
    department = data.get('department')
    daily_data = data.get('dailyData')

    print(f"Received summarize_daily_heatmap request for {day}, Dept: {department} (sid: {sid})")

    system_prompt = constants.HEATMAP_DAILY_PROMPT
    
    dept_str = f"for the {department} department" if department and department != "all" else "for all users"

    user_query = constants.HEATMAP_DAILY_QUERY.format(day=day, dept_str=dept_str, daily_data=daily_data) 

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            system_instruction=system_prompt
        )
        response_stream = model.generate_content(user_query, stream=True)

        for chunk in response_stream:
            if chunk.text:
                socketio.emit('daily_summary_chunk', {'text': chunk.text}, room=sid)
                socketio.sleep(0.05)

    except Exception as e:
        print(f"Error during Gemini daily heatmap stream for {sid}: {e}")
        socketio.emit('stream_error', {'error': 'Failed to generate daily heatmap summary.'}, room=sid)
    finally:
        socketio.emit('daily_summary_end', room=sid)
        print(f"Daily heatmap stream ended for: {sid}")

@socketio.on('summarize_daily_heatmap')
def handle_daily_heatmap_summary(data):
    sid = request.sid
    socketio.start_background_task(_run_daily_heatmap_summary, sid, data)

if __name__ == "__main__":
    print("--- Starting server: Pre-loading all data files... ---")
    socketio.run(app, debug=True, use_reloader=False)

