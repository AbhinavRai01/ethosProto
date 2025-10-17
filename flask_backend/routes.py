# routes.py

# Import 'current_app' from flask
from flask import Blueprint, jsonify, request, url_for, current_app
from PythonScripts import Prob
from PythonScripts import FaceDetection
from werkzeug.utils import secure_filename
from PythonScripts import cctvClean
from PythonScripts import profilesClean
import os

# It's good practice to define constants here, but the main app will configure them.
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# --- Helper Function ---
def allowed_file(filename):
    """Checks if the file's extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

routes = Blueprint("routes", __name__)

@routes.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    entity_id = data.get("entity_id")
    day = data.get("day")
    recieved_data = Prob.predict_person_timeline(entity_id, day)
    return recieved_data

@routes.route("/image-search", methods=["POST"])
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
    

@routes.route('/cctv-cleaner',methods = ['POST'])
def CctvClean():
    data = request.get_json()
    output = cctvClean.CCTVCleaner(data)
    return output

@routes.route('/profile-cleaner', methods=['POST'])
def profileClean():
    data = request.get_json()
    output = profilesClean.ProfilesCleaner(data)
    return output
