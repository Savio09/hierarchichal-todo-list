from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from models import db, bcrypt, User
from routes import api
from auth import auth

load_dotenv()

app = Flask(__name__)

# Enable CORS for frontend communication
CORS(app, supports_credentials=True)

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Secret key for sessions and JWT
app.config["SECRET_KEY"] = os.getenv(
    "SECRET_KEY", "dev-secret-key-change-in-production"
)
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "jwt-secret-key-change-in-production"
)

# Initialize extensions with app
db.init_app(app)
bcrypt.init_app(app)
jwt = JWTManager(app)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "api.login"


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Register blueprints
app.register_blueprint(api, url_prefix="/api")
app.register_blueprint(auth, url_prefix="/api/auth")


@app.route("/")
def home():
    return "Hierarchical Todo List API"


# Create database tables
with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True)
