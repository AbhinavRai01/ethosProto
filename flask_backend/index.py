from flask import Flask
from routes import routes

app = Flask(__name__)

from flask_cors import CORS
CORS(app) 

app.register_blueprint(routes)

if __name__ == "__main__":
    app.run(debug=True)