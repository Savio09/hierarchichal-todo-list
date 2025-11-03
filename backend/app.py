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


def create_app(config=None):
    """Application factory pattern for creating Flask app instances"""
    app = Flask(__name__)

    # Enable CORS for frontend communication
    # Apply CORS to all routes with wildcard
    CORS(
        app,
        origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        supports_credentials=True,
    )

    # Database configuration
    if config:
        app.config.update(config)
    else:
        database_url = os.getenv("DATABASE_URL")
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url
        app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

        # Configure engine options based on database type
        if database_url and database_url.startswith("postgresql"):
            # PostgreSQL-specific configuration
            app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
                "pool_pre_ping": True,
                "pool_recycle": 300,
                "connect_args": {"sslmode": "require"},
            }
        else:
            # SQLite configuration (or other databases)
            app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
                "pool_pre_ping": True,
            }

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

    return app


# Create the app instance for running
app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
