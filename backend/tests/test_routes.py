"""
Unit tests for List and Task API routes (routes.py)
Tests CRUD operations, task hierarchy, and completion logic
"""

import pytest


class TestListRoutes:
    """Test cases for list API endpoints"""

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
        """Test creating a list without authentication fails"""
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

    def test_update_list(self, client, auth_headers):
        """Test updating a list"""
        # Create a list
        create_response = client.post(
            "/api/lists", headers=auth_headers, json={"name": "Original"}
        )
        list_id = create_response.json["id"]

        # Update the list
        response = client.put(
            f"/api/lists/{list_id}", headers=auth_headers, json={"name": "Updated"}
        )

        assert response.status_code == 200
        assert response.json["name"] == "Updated"

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


class TestTaskRoutes:
    """Test cases for task API endpoints"""

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

    def test_create_subtask(self, client, auth_headers, sample_list):
        """Test creating a subtask"""
        # Create parent task
        parent = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        ).json

        # Create subtask
        response = client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Subtask"},
        )

        assert response.status_code == 201
        assert response.json["depth"] == 1

    def test_toggle_task_completion(self, client, auth_headers, sample_list):
        """Test marking a task as complete"""
        # Create task
        task = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Task"},
        ).json

        # Mark as complete
        response = client.put(
            f'/api/tasks/{task["id"]}', headers=auth_headers, json={"completed": True}
        )

        assert response.status_code == 200
        assert response.json["completed"] is True

    def test_cascade_completion_to_subtasks(self, client, auth_headers, sample_list):
        """Test marking parent complete cascades to all subtasks"""
        # Create parent with subtasks
        parent = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        ).json

        client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Sub 1"},
        )
        client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Sub 2"},
        )

        # Mark parent as complete with cascade
        client.put(
            f'/api/tasks/{parent["id"]}',
            headers=auth_headers,
            json={"completed": True, "cascade": True},
        )

        # Get parent and verify all subtasks are complete
        result = client.get(f'/api/tasks/{parent["id"]}', headers=auth_headers).json

        assert result["completed"] is True
        assert all(sub["completed"] for sub in result["subtasks"])

    def test_parent_autocomplete_when_all_children_complete(
        self, client, auth_headers, sample_list
    ):
        """Test parent auto-completes when ALL children are complete"""
        # Create parent with two subtasks
        parent = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        ).json

        sub1 = client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Sub 1"},
        ).json

        sub2 = client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Sub 2"},
        ).json

        # Complete first subtask - parent should still be incomplete
        client.put(
            f'/api/tasks/{sub1["id"]}', headers=auth_headers, json={"completed": True}
        )

        parent_status = client.get(
            f'/api/tasks/{parent["id"]}', headers=auth_headers
        ).json
        assert parent_status["completed"] is False

        # Complete second subtask - parent should auto-complete
        client.put(
            f'/api/tasks/{sub2["id"]}', headers=auth_headers, json={"completed": True}
        )

        parent_status = client.get(
            f'/api/tasks/{parent["id"]}', headers=auth_headers
        ).json
        assert parent_status["completed"] is True

    def test_parent_auto_uncomplete_when_child_unchecked(
        self, client, auth_headers, sample_list
    ):
        """Test parent auto-uncompletes when a child is unchecked"""
        # Create parent with subtasks and complete them
        parent = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        ).json

        sub1 = client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Sub 1"},
        ).json

        sub2 = client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Sub 2"},
        ).json

        # Complete both (parent will auto-complete)
        client.put(
            f'/api/tasks/{sub1["id"]}', headers=auth_headers, json={"completed": True}
        )
        client.put(
            f'/api/tasks/{sub2["id"]}', headers=auth_headers, json={"completed": True}
        )

        # Uncheck one subtask - parent should auto-uncomplete
        client.put(
            f'/api/tasks/{sub1["id"]}', headers=auth_headers, json={"completed": False}
        )

        parent_status = client.get(
            f'/api/tasks/{parent["id"]}', headers=auth_headers
        ).json
        assert parent_status["completed"] is False

    def test_move_task_to_different_list(self, client, auth_headers):
        """Test moving a top-level task to a different list"""
        # Create two lists
        list1 = client.post(
            "/api/lists", headers=auth_headers, json={"name": "List 1"}
        ).json

        list2 = client.post(
            "/api/lists", headers=auth_headers, json={"name": "List 2"}
        ).json

        # Create task in list1
        task = client.post(
            f'/api/lists/{list1["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Task"},
        ).json

        # Move to list2
        response = client.put(
            f'/api/tasks/{task["id"]}',
            headers=auth_headers,
            json={"list_id": list2["id"]},
        )

        assert response.status_code == 200

    def test_cannot_move_subtask_to_different_list(
        self, client, auth_headers, sample_list
    ):
        """Test that subtasks cannot be moved between lists"""
        # Create parent and subtask
        parent = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        ).json

        subtask = client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Subtask"},
        ).json

        # Create another list
        list2 = client.post(
            "/api/lists", headers=auth_headers, json={"name": "List 2"}
        ).json

        # Try to move subtask
        response = client.put(
            f'/api/tasks/{subtask["id"]}',
            headers=auth_headers,
            json={"list_id": list2["id"]},
        )

        assert response.status_code == 400

    def test_delete_task_cascades_to_subtasks(self, client, auth_headers, sample_list):
        """Test that deleting a task deletes all its subtasks"""
        # Create parent with subtask
        parent = client.post(
            f'/api/lists/{sample_list["id"]}/tasks',
            headers=auth_headers,
            json={"description": "Parent"},
        ).json

        subtask = client.post(
            f'/api/tasks/{parent["id"]}/subtasks',
            headers=auth_headers,
            json={"description": "Subtask"},
        ).json

        # Delete parent
        client.delete(f'/api/tasks/{parent["id"]}', headers=auth_headers)

        # Verify subtask is also deleted
        response = client.get(f'/api/tasks/{subtask["id"]}', headers=auth_headers)
        assert response.status_code == 404
