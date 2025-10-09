from flask import Flask
from routes import routes
import os

app = Flask(__name__)

from flask_cors import CORS
CORS(app) 

app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'test_images')

app.register_blueprint(routes)

if __name__ == "__main__":
    app.run(debug=True)