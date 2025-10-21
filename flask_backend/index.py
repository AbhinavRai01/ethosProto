from flask import Flask
# from app import app
import os
from PythonScripts import Locations
from PythonScripts import Prob
from PythonScripts import FaceDetection
from werkzeug.utils import secure_filename
from PythonScripts import cctvClean
from PythonScripts import profilesClean
from PythonScripts import Locations
from flask import Blueprint, jsonify, request, url_for, current_app
from flask_socketio import SocketIO, emit
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

from flask_cors import CORS
CORS(app) 

# --- Configure Gemini API ---
try:
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    print("Please make sure you have a .env file with your GOOGLE_API_KEY")

app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_images')
# It's good practice to define constants here, but the main app will configure them.
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# --- Helper Function ---
def allowed_file(filename):
    """Checks if the file's extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# app = Blueprint("app", __name__)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    entity_id = data.get("entity_id")
    day = data.get("day")
    recieved_data = Prob.predict_person_timeline(entity_id, day)
    return recieved_data

@app.route("/image-search", methods=["POST"])
def imageSearch():

    print("Request files:", request.files)
    print("Request form:", request.form)
    print("Content-Type:", request.headers.get('Content-Type'))

    if 'image' not in request.files:
        return jsonify({"error": "No image part in the request"}), 400
        
    file = request.files['image']

    print(file.filename)

    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        
        # Fixed: Replaced 'app.config' with 'current_app.config'
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

@app.route('/locations', methods = ['POST'])
def locations_density():
    print("shit")
    data = request.get_json()
    day_of_week = data.get("day_of_week")
    # time_window_hours = data.get("time_window_hours", 1)
    output = Locations.calculate_predicted_density(day_of_week, time_window_hours=1)
    print("pls")
    return output

if __name__ == "__main__":
    print("--- Starting server: Pre-loading all data files... ---")
    print("--- (This may take a minute, the server will be ready shortly) ---")
    Locations.load_all_data()
    app.run(debug=True)

# make a default route
@app.route("/")
def home():
    print("home route accessed")
    return "Ethos Backend is running!"

socketio = SocketIO(app, cors_allowed_origins="*")

@socketio.on('connect')
def handle_connect():
    print(f'Client connected: {request.sid}')

@socketio.on('disconnect')
def handle_disconnect():
    print(f'Client disconnected: {request.sid}')

@socketio.on('summarize_stream')
def handle_summarize_stream(data):
    formattedData = data.get('formattedData')
    userName = data.get('userName')
    print(f"Received summarize_stream request for user: {userName}")

    system_prompt = """You are a behavioral analyst for a university. Your task is to create a detailed narrative of a user's predicted daily schedule based on probabilistic data.

The output should be structured into three distinct paragraphs, one for each period of the day:
1.  **Morning (roughly 12 AM to 7 AM):** Describe their likely morning routine, including potential breakfast spots, early classes, or study sessions.
2.  **Daytime (roughly 8 AM to 3 PM):** Detail their activities during the main part of the day. This could involve lunch, lectures, lab work, or time spent in common areas like the library or gym.
3.  **Evening (roughly 4 PM to 12 AM):** Describe their potential evening activities, such as dinner, late study sessions, social gatherings, or returning to their hostel."""
    user_query = f"Summarize the following predicted schedule for user, it should be moderately short and in 3 paragraphs {userName}: {formattedData}"""

    try:
        model = genai.GenerativeModel(
            model_name="gemini-2.5-pro",
            system_instruction=system_prompt
        )
        response_stream = model.generate_content(user_query, stream=True)

        for chunk in response_stream:
            if chunk.text:
                emit('summary_chunk', {'text': chunk.text})
                socketio.sleep(0.05) # Small delay to allow client to render

    except Exception as e:
        print(f"Error during Gemini stream for {request.sid}: {e}")
        emit('stream_error', {'error': 'Failed to generate summary. Check backend console for details.'})
    finally:
        emit('stream_end')
        print(f"Stream ended for user: {userName}")
