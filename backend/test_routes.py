"""
Unit tests for API routes
Tests authentication, list operations, and task operations
"""

import pytest
import json
from models import db, User, List, Task
from app import create_app


@pytest.fixture
def app():
    """Create and configure a test app instance"""
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    app.config["JWT_SECRET_KEY"] = "test-secret-key"

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create a test client"""
    return app.test_client()


@pytest.fixture
def auth_headers(client):
    """Create a user and return auth headers"""
    # Register a user
    client.post(
        "/api/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "password123",
        },
    )

    # Login and get token
    response = client.post(
        "/api/auth/login", json={"email": "test@example.com", "password": "password123"}
    )

    token = response.json["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestAuthRoutes:
    """Test cases for authentication routes"""

    def test_register_success(self, client):
        """Test successful user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "new@example.com",
                "password": "password123",
            },
        )

        assert response.status_code == 201
        assert "access_token" in response.json
        assert "user" in response.json
        assert response.json["user"]["username"] == "newuser"
        assert response.json["user"]["email"] == "new@example.com"

    def test_register_duplicate_username(self, client):
        """Test registration with duplicate username"""
        # Register first user
        client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test1@example.com",
                "password": "password123",
            },
        )

        # Try to register with same username
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test2@example.com",
                "password": "password123",
            },
        )

        assert response.status_code == 400
        assert "error" in response.json
        assert "already exists" in response.json["error"].lower()

    def test_register_duplicate_email(self, client):
        """Test registration with duplicate email"""
        # Register first user
        client.post(
            "/api/auth/register",
            json={
                "username": "user1",
                "email": "test@example.com",
                "password": "password123",
            },
        )

        # Try to register with same email
        response = client.post(
            "/api/auth/register",
            json={
                "username": "user2",
                "email": "test@example.com",
                "password": "password123",
            },
        )

        assert response.status_code == 400
        assert "error" in response.json

    def test_register_missing_fields(self, client):
        """Test registration with missing required fields"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser"
                # Missing email and password
            },
        )

        assert response.status_code == 400
        assert "error" in response.json

    def test_login_success(self, client):
        """Test successful login"""
        # Register a user first
        client.post(
            "/api/auth/register",
            json={
                "username": "loginuser",
                "email": "login@example.com",
                "password": "password123",
            },
        )

        # Login
        response = client.post(
            "/api/auth/login",
            json={"email": "login@example.com", "password": "password123"},
        )

        assert response.status_code == 200
        assert "access_token" in response.json
        assert "user" in response.json

    def test_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "error" in response.json

    def test_login_missing_fields(self, client):
        """Test login with missing fields"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com"
                # Missing password
            },
        )

        assert response.status_code == 400
        assert "error" in response.json


class TestListRoutes:
    """Test cases for list routes"""

    def test_create_list(self, client, auth_headers):
        """Test creating a new list"""
        response = client.post(
            "/api/lists",
            headers=auth_headers,
            json={"name": "My Tasks", "description": "Daily tasks"},
        )

        assert response.status_code == 201
        assert response.json["name"] == "My Tasks"
        assert response.json["description"] == "Daily tasks"
        assert "id" in response.json

    def test_create_list_without_auth(self, client):
        """Test creating a list without authentication"""
        response = client.post("/api/lists", json={"name": "My Tasks"})

        assert response.status_code == 401

    def test_get_all_lists(self, client, auth_headers):
        """Test getting all lists for a user"""
        # Create some lists
        client.post("/api/lists", headers=auth_headers, json={"name": "List 1"})
        client.post("/api/lists", headers=auth_headers, json={"name": "List 2"})

        # Get all lists
        response = client.get("/api/lists", headers=auth_headers)

        assert response.status_code == 200
        assert len(response.json) == 2
        assert response.json[0]["name"] == "List 1"
        assert response.json[1]["name"] == "List 2"

    def test_get_lists_without_auth(self, client):
        """Test getting lists without authentication"""
        response = client.get("/api/lists")

        assert response.status_code == 401

    def test_get_single_list(self, client, auth_headers):
        """Test getting a single list by ID"""
        # Create a list
        create_response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "Test List"}
        )
        list_id = create_response.json["id"]

        # Get the list
        response = client.get(f"/api/lists/{list_id}", headers=auth_headers)

        assert response.status_code == 200
        assert response.json["id"] == list_id
        assert response.json["name"] == "Test List"

    def test_update_list(self, client, auth_headers):
        """Test updating a list"""
        # Create a list
        create_response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "Original Name"}
        )
        list_id = create_response.json["id"]

        # Update the list
        response = client.put(
            f"/api/lists/{list_id}",
            headers=auth_headers,
            json={"name": "Updated Name", "description": "New description"},
        )

        assert response.status_code == 200
        assert response.json["name"] == "Updated Name"
        assert response.json["description"] == "New description"

    def test_delete_list(self, client, auth_headers):
        """Test deleting a list"""
        # Create a list
        create_response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "To Delete"}
        )
        list_id = create_response.json["id"]

        # Delete the list
        response = client.delete(f"/api/lists/{list_id}", headers=auth_headers)

        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(f"/api/lists/{list_id}", headers=auth_headers)
        assert get_response.status_code == 404


class TestTaskRoutes:
    """Test cases for task routes"""

    @pytest.fixture
    def sample_list(self, client, auth_headers):
        """Create a sample list for task testing"""
        response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "Task List"}
        )
        return response.json

    def test_create_task(self, client, auth_headers, sample_list):
        """Test creating a new task"""
        response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Buy groceries"},
        )

        assert response.status_code == 201
        assert response.json["description"] == "Buy groceries"
        assert response.json["completed"] is False
        assert "id" in response.json

    def test_create_task_without_auth(self, client, sample_list):
        """Test creating a task without authentication"""
        response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks', json={"description": "Task"}
        )

        assert response.status_code == 401

    def test_create_subtask(self, client, auth_headers, sample_list):
        """Test creating a subtask"""
        # Create parent task
        parent_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent Task"},
        )
        parent_id = parent_response.json["id"]

        # Create subtask
        response = client.post(
            f"/api/tasks/{parent_id}/subtasks",
            headers=auth_headers,
            json={"description": "Subtask"},
        )

        assert response.status_code == 201
        assert response.json["description"] == "Subtask"
        assert "id" in response.json

    def test_get_task(self, client, auth_headers, sample_list):
        """Test getting a single task"""
        # Create task
        create_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Test Task"},
        )
        task_id = create_response.json["id"]

        # Get task
        response = client.get(f"/api/tasks/{task_id}", headers=auth_headers)

        assert response.status_code == 200
        assert response.json["id"] == task_id
        assert response.json["description"] == "Test Task"

    def test_update_task_description(self, client, auth_headers, sample_list):
        """Test updating a task's description"""
        # Create task
        create_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Original"},
        )
        task_id = create_response.json["id"]

        # Update task
        response = client.put(
            f"/api/tasks/{task_id}",
            headers=auth_headers,
            json={"description": "Updated"},
        )

        assert response.status_code == 200
        assert response.json["description"] == "Updated"

    def test_toggle_task_completion(self, client, auth_headers, sample_list):
        """Test toggling task completion status"""
        # Create task
        create_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Task"},
        )
        task_id = create_response.json["id"]

        # Mark as complete
        response = client.put(
            f"/api/tasks/{task_id}", headers=auth_headers, json={"completed": True}
        )

        assert response.status_code == 200
        assert response.json["completed"] is True

    def test_cascade_completion_to_subtasks(self, client, auth_headers, sample_list):
        """Test that marking a task complete cascades to subtasks"""
        # Create parent task
        parent_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        )
        parent_id = parent_response.json["id"]

        # Create subtasks
        client.post(
            f"/api/tasks/{parent_id}/subtasks",
            headers=auth_headers,
            json={"description": "Subtask 1"},
        )
        client.post(
            f"/api/tasks/{parent_id}/subtasks",
            headers=auth_headers,
            json={"description": "Subtask 2"},
        )

        # Mark parent as complete with cascade
        client.put(
            f"/api/tasks/{parent_id}",
            headers=auth_headers,
            json={"completed": True, "cascade": True},
        )

        # Get parent task and verify all subtasks are complete
        response = client.get(f"/api/tasks/{parent_id}", headers=auth_headers)

        assert response.json["completed"] is True
        assert len(response.json["subtasks"]) == 2
        assert all(sub["completed"] for sub in response.json["subtasks"])

    def test_parent_autocomplete_when_all_children_done(
        self, client, auth_headers, sample_list
    ):
        """Test that parent is auto-marked complete when all children are"""
        # Create parent task
        parent_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        )
        parent_id = parent_response.json["id"]

        # Create two subtasks
        sub1_response = client.post(
            f"/api/tasks/{parent_id}/subtasks",
            headers=auth_headers,
            json={"description": "Subtask 1"},
        )
        sub2_response = client.post(
            f"/api/tasks/{parent_id}/subtasks",
            headers=auth_headers,
            json={"description": "Subtask 2"},
        )

        sub1_id = sub1_response.json["id"]
        sub2_id = sub2_response.json["id"]

        # Complete first subtask
        client.put(
            f"/api/tasks/{sub1_id}", headers=auth_headers, json={"completed": True}
        )

        # Parent should still be incomplete
        response = client.get(f"/api/tasks/{parent_id}", headers=auth_headers)
        assert response.json["completed"] is False

        # Complete second subtask
        client.put(
            f"/api/tasks/{sub2_id}", headers=auth_headers, json={"completed": True}
        )

        # Now parent should be auto-completed
        response = client.get(f"/api/tasks/{parent_id}", headers=auth_headers)
        assert response.json["completed"] is True

    def test_move_task_to_different_list(self, client, auth_headers):
        """Test moving a top-level task to a different list"""
        # Create two lists
        list1_response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "List 1"}
        )
        list2_response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "List 2"}
        )

        list1_id = list1_response.json["id"]
        list2_id = list2_response.json["id"]

        # Create task in list1
        task_response = client.post(
            f"/api/lists/{list1_id}/tasks",
            headers=auth_headers,
            json={"description": "Movable Task"},
        )
        task_id = task_response.json["id"]

        # Move task to list2
        response = client.put(
            f"/api/tasks/{task_id}", headers=auth_headers, json={"list_id": list2_id}
        )

        assert response.status_code == 200

        # Verify task is now in list2
        list2_data = client.get(f"/api/lists/{list2_id}", headers=auth_headers).json
        assert any(task["id"] == task_id for task in list2_data["tasks"])

    def test_cannot_move_subtask_to_different_list(
        self, client, auth_headers, sample_list
    ):
        """Test that subtasks cannot be moved to a different list"""
        # Create parent task
        parent_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        )
        parent_id = parent_response.json["id"]

        # Create subtask
        subtask_response = client.post(
            f"/api/tasks/{parent_id}/subtasks",
            headers=auth_headers,
            json={"description": "Subtask"},
        )
        subtask_id = subtask_response.json["id"]

        # Create another list
        list2_response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "List 2"}
        )
        list2_id = list2_response.json["id"]

        # Try to move subtask to different list
        response = client.put(
            f"/api/tasks/{subtask_id}", headers=auth_headers, json={"list_id": list2_id}
        )

        assert response.status_code == 400
        assert "error" in response.json

    def test_delete_task(self, client, auth_headers, sample_list):
        """Test deleting a task"""
        # Create task
        create_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "To Delete"},
        )
        task_id = create_response.json["id"]

        # Delete task
        response = client.delete(f"/api/tasks/{task_id}", headers=auth_headers)

        assert response.status_code == 204

        # Verify it's deleted
        get_response = client.get(f"/api/tasks/{task_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_delete_task_cascades_to_subtasks(self, client, auth_headers, sample_list):
        """Test that deleting a task also deletes its subtasks"""
        # Create parent task
        parent_response = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        )
        parent_id = parent_response.json["id"]

        # Create subtask
        subtask_response = client.post(
            f"/api/tasks/{parent_id}/subtasks",
            headers=auth_headers,
            json={"description": "Subtask"},
        )
        subtask_id = subtask_response.json["id"]

        # Delete parent
        client.delete(f"/api/tasks/{parent_id}", headers=auth_headers)

        # Verify subtask is also deleted
        response = client.get(f"/api/tasks/{subtask_id}", headers=auth_headers)
        assert response.status_code == 404
