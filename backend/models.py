from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from flask_bcrypt import Bcrypt
from datetime import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()


class User(db.Model, UserMixin):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationship: A user has many lists
    lists = db.relationship(
        "List", backref="owner", lazy=True, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = bcrypt.generate_password_hash(password).decode("utf-8")

    def check_password(self, password):
        """Check if provided password matches the hash"""
        return bcrypt.check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }


class List(db.Model):
    __tablename__ = "lists"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Foreign key to User - each list belongs to a user
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    # Relationship: A list has many tasks (only top-level tasks)
    tasks = db.relationship(
        "Task",
        backref="list",
        lazy=True,
        cascade="all, delete-orphan",
        foreign_keys="Task.list_id",
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "tasks": [task.to_dict() for task in self.tasks if task.parent_id is None],
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.Text, nullable=False)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Foreign key to the List model, indicating which list this task belongs to
    list_id = db.Column(db.Integer, db.ForeignKey("lists.id"), nullable=False)

    # Self-referential foreign key for hierarchical tasks
    # If parent_id is null, this is a top-level task
    # If parent_id has a value, this is a subtask of another task
    parent_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=True)

    # Relationship: A task can have many subtasks
    subtasks = db.relationship(
        "Task",
        backref=db.backref("parent", remote_side=[id]),
        lazy=True,
        cascade="all, delete-orphan",
    )

    def get_depth(self):
        """Calculate the depth of the task in the hierarchy.
        A top-level task has a depth of 0,
        a subtask of a top-level task has a depth of 1, and so on."""
        depth = 0
        current_task = self
        while current_task.parent is not None:
            depth += 1
            current_task = current_task.parent
        return depth

    def can_have_subtasks(self):
        """Determine if the task can have subtasks.
        Now allows infinite nesting (no depth limit).
        """
        return True

    def set_completion_cascade(self, completed_status):
        """Set completion status for this task and all its subtasks recursively."""
        self.completed = completed_status
        for subtask in self.subtasks:
            subtask.set_completion_cascade(completed_status)

    def update_parent_completion(self):
        """Check if all siblings are complete and update parent accordingly.
        This should be called after a task's completion status changes."""
        if self.parent is None:
            # This is a top-level task, no parent to update
            return

        # Check if all siblings (including self) are complete
        all_siblings_complete = all(
            sibling.completed for sibling in self.parent.subtasks
        )

        if all_siblings_complete and not self.parent.completed:
            # All subtasks are complete, mark parent as complete
            self.parent.completed = True
            # Recursively check the parent's parent
            self.parent.update_parent_completion()
        elif not all_siblings_complete and self.parent.completed:
            # At least one subtask is incomplete, mark parent as incomplete
            self.parent.completed = False
            # Recursively check the parent's parent
            self.parent.update_parent_completion()

    def to_dict(self, include_subtasks=True):
        result = {
            "id": self.id,
            "description": self.description,
            "completed": self.completed,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "depth": self.get_depth(),
            "can_have_subtasks": self.can_have_subtasks(),
        }
        if include_subtasks:
            result["subtasks"] = [
                subtask.to_dict(include_subtasks=True) for subtask in self.subtasks
            ]
        return result
