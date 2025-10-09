# routes.py

from flask import Blueprint, jsonify, request
from PythonScripts import Prob
  # import your logic

routes = Blueprint("routes", __name__)

@routes.route("/")
def home():
    return jsonify({"message": "Welcome to Flask backend!"})

@routes.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    entity_id = data.get("entity_id")
    day = data.get("day")
    recieved_data = Prob.predict_person_timeline(entity_id,day)

    return recieved_data
