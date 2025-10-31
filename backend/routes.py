from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, List, Task

# Create a blueprint for API routes
api = Blueprint("api", __name__)


# List endpoints
@api.route("/lists", methods=["GET", "POST"])
@jwt_required()
def lists():
    user_id = get_jwt_identity()

    if request.method == "POST":
        data = request.get_json()
        new_list = List(
            name=data["name"],
            description=data.get("description", ""),
            user_id=user_id,
        )
        db.session.add(new_list)
        db.session.commit()
        return jsonify(new_list.to_dict()), 201

    # GET all lists belonging to the current user
    user_lists = List.query.filter_by(user_id=user_id).all()
    return jsonify([lst.to_dict() for lst in user_lists])


@api.route("/lists/<int:list_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def list_detail(list_id):
    user_id = get_jwt_identity()
    list_obj = List.query.get_or_404(list_id)

    # Ensure the list belongs to the current user
    if list_obj.user_id != user_id:
        return jsonify({"error": "Unauthorized access to this list"}), 403

    if request.method == "DELETE":
        db.session.delete(list_obj)
        db.session.commit()
        return "", 204

    if request.method == "PUT":
        data = request.get_json()
        list_obj.name = data.get("name", list_obj.name)
        list_obj.description = data.get("description", list_obj.description)
        db.session.commit()

    return jsonify(list_obj.to_dict())


# Task endpoints
@api.route("/lists/<int:list_id>/tasks", methods=["POST"])
@jwt_required()
def create_task(list_id):
    user_id = get_jwt_identity()
    list_obj = List.query.get_or_404(list_id)

    # Ensure the list belongs to the current user
    if list_obj.user_id != user_id:
        return jsonify({"error": "Unauthorized access to this list"}), 403

    data = request.get_json()
    new_task = Task(
        description=data["description"],
        list_id=list_id,
        completed=data.get("completed", False),
    )
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201


@api.route("/tasks/<int:task_id>/subtasks", methods=["POST"])
@jwt_required()
def create_subtask(task_id):
    user_id = get_jwt_identity()
    parent_task = Task.query.get_or_404(task_id)

    # Ensure the parent task's list belongs to the current user
    if parent_task.list.user_id != user_id:
        return jsonify({"error": "Unauthorized access to this task"}), 403

    # Check depth limit
    if not parent_task.can_have_subtasks():
        return jsonify({"error": "Maximum depth reached (3 levels)"}), 400

    data = request.get_json()
    new_subtask = Task(
        description=data["description"],
        parent_id=task_id,
        list_id=parent_task.list_id,
        completed=data.get("completed", False),
    )
    db.session.add(new_subtask)
    db.session.commit()
    return jsonify(new_subtask.to_dict()), 201


@api.route("/tasks/<int:task_id>", methods=["GET", "PUT", "DELETE"])
@jwt_required()
def task_detail(task_id):
    user_id = get_jwt_identity()
    task = Task.query.get_or_404(task_id)

    # Ensure the task's list belongs to the current user
    if task.list.user_id != user_id:
        return jsonify({"error": "Unauthorized access to this task"}), 403

    if request.method == "DELETE":
        db.session.delete(task)
        db.session.commit()
        return "", 204

    if request.method == "PUT":
        data = request.get_json()
        task.description = data.get("description", task.description)
        task.completed = data.get("completed", task.completed)
        db.session.commit()

    return jsonify(task.to_dict())
