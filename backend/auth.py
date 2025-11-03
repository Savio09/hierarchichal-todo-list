from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import db, User

# Create a blueprint for authentication routes
auth = Blueprint("auth", __name__)


@auth.route("/register", methods=["POST"])
def register():
    """Register a new user"""
    data = request.get_json()

    # Validate required fields
    if not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify({"error": "Username, email, and password are required"}), 400

    # Check if user already exists
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "Username already exists"}), 400

    if User.query.filter_by(email=data["email"]).first():
        return jsonify({"error": "Email already exists"}), 400

    # Create new user
    new_user = User(username=data["username"], email=data["email"])
    new_user.set_password(data["password"])

    db.session.add(new_user)
    db.session.commit()

    # Create access token (identity must be a string)
    access_token = create_access_token(identity=str(new_user.id))

    return (
        jsonify(
            {
                "message": "User created successfully",
                "user": new_user.to_dict(),
                "access_token": access_token,
            }
        ),
        201,
    )


@auth.route("/login", methods=["POST"])
def login():
    """Login an existing user"""
    data = request.get_json()

    # Validate required fields
    if not data.get("email") or not data.get("password"):
        return jsonify({"error": "email and password are required"}), 400

    # Find user
    user = User.query.filter_by(email=data["email"]).first()

    # Validate password
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "Invalid username or password"}), 401

    # Login user (for session-based auth)
    login_user(user)

    # Create access token (for JWT auth - identity must be a string)
    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "message": "Login successful",
            "user": user.to_dict(),
            "access_token": access_token,
        }
    )


@auth.route("/logout", methods=["POST"])
@login_required
def logout():
    """Logout the current user"""
    logout_user()
    return jsonify({"message": "Logout successful"})


@auth.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get the current logged-in user's information"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user.to_dict())
