"""
Unit tests for database models
Tests User, List, and Task models including relationships and methods
"""

import pytest
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
def sample_user(app):
    """Create a sample user for testing"""
    with app.app_context():
        user = User(username="testuser", email="test@example.com")
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        return user


@pytest.fixture
def sample_list(app, sample_user):
    """Create a sample list for testing"""
    with app.app_context():
        user = db.session.merge(sample_user)
        list_obj = List(
            name="Test List", description="Test Description", user_id=user.id
        )
        db.session.add(list_obj)
        db.session.commit()
        return list_obj


class TestUserModel:
    """Test cases for User model"""

    def test_user_creation(self, app):
        """Test creating a new user"""
        with app.app_context():
            user = User(username="newuser", email="new@example.com")
            user.set_password("password123")
            db.session.add(user)
            db.session.commit()

            assert user.id is not None
            assert user.username == "newuser"
            assert user.email == "new@example.com"
            assert user.password_hash is not None

    def test_password_hashing(self, app):
        """Test that passwords are properly hashed"""
        with app.app_context():
            user = User(username="hashtest", email="hash@example.com")
            user.set_password("mypassword")

            # Password should be hashed, not stored as plain text
            assert user.password_hash != "mypassword"
            assert len(user.password_hash) > 20

    def test_password_verification(self, app):
        """Test password verification works correctly"""
        with app.app_context():
            user = User(username="verifytest", email="verify@example.com")
            user.set_password("correctpassword")

            # Correct password should return True
            assert user.check_password("correctpassword") is True

            # Incorrect password should return False
            assert user.check_password("wrongpassword") is False

    def test_user_to_dict(self, app, sample_user):
        """Test user serialization to dictionary"""
        with app.app_context():
            user = db.session.merge(sample_user)
            user_dict = user.to_dict()

            assert "id" in user_dict
            assert "username" in user_dict
            assert "email" in user_dict
            assert "created_at" in user_dict
            assert "updated_at" in user_dict
            # Password should NOT be in the dict
            assert "password_hash" not in user_dict

    def test_user_list_relationship(self, app, sample_user):
        """Test that user-list relationship works"""
        with app.app_context():
            user = db.session.merge(sample_user)

            # Create lists for the user
            list1 = List(name="List 1", user_id=user.id)
            list2 = List(name="List 2", user_id=user.id)
            db.session.add_all([list1, list2])
            db.session.commit()

            # Refresh user to get updated relationships
            db.session.refresh(user)

            assert len(user.lists) == 2
            assert list1 in user.lists
            assert list2 in user.lists


class TestListModel:
    """Test cases for List model"""

    def test_list_creation(self, app, sample_user):
        """Test creating a new list"""
        with app.app_context():
            user = db.session.merge(sample_user)
            list_obj = List(name="My Tasks", description="Daily tasks", user_id=user.id)
            db.session.add(list_obj)
            db.session.commit()

            assert list_obj.id is not None
            assert list_obj.name == "My Tasks"
            assert list_obj.description == "Daily tasks"
            assert list_obj.user_id == user.id

    def test_list_to_dict(self, app, sample_list):
        """Test list serialization to dictionary"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)
            list_dict = list_obj.to_dict()

            assert "id" in list_dict
            assert "name" in list_dict
            assert "description" in list_dict
            assert "created_at" in list_dict
            assert "updated_at" in list_dict
            assert "tasks" in list_dict
            assert isinstance(list_dict["tasks"], list)

    def test_list_tasks_relationship(self, app, sample_list):
        """Test that list-task relationship works"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)

            # Create tasks for the list
            task1 = Task(description="Task 1", list_id=list_obj.id)
            task2 = Task(description="Task 2", list_id=list_obj.id)
            db.session.add_all([task1, task2])
            db.session.commit()

            # Refresh list to get updated relationships
            db.session.refresh(list_obj)

            assert len(list_obj.tasks) == 2


class TestTaskModel:
    """Test cases for Task model"""

    def test_task_creation(self, app, sample_list):
        """Test creating a new task"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)
            task = Task(
                description="Buy groceries", list_id=list_obj.id, completed=False
            )
            db.session.add(task)
            db.session.commit()

            assert task.id is not None
            assert task.description == "Buy groceries"
            assert task.completed is False
            assert task.list_id == list_obj.id
            assert task.parent_id is None

    def test_task_depth_calculation(self, app, sample_list):
        """Test that task depth is calculated correctly"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)

            # Create parent task
            parent = Task(description="Parent", list_id=list_obj.id)
            db.session.add(parent)
            db.session.commit()

            # Create child task
            child = Task(description="Child", list_id=list_obj.id, parent_id=parent.id)
            db.session.add(child)
            db.session.commit()

            # Create grandchild task
            grandchild = Task(
                description="Grandchild", list_id=list_obj.id, parent_id=child.id
            )
            db.session.add(grandchild)
            db.session.commit()

            assert parent.get_depth() == 0
            assert child.get_depth() == 1
            assert grandchild.get_depth() == 2

    def test_task_can_have_subtasks(self, app, sample_list):
        """Test that infinite nesting is allowed"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)
            task = Task(description="Test", list_id=list_obj.id)
            db.session.add(task)
            db.session.commit()

            # Should always return True for infinite nesting
            assert task.can_have_subtasks() is True

    def test_task_completion_cascade(self, app, sample_list):
        """Test that completion cascades to all subtasks"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)

            # Create parent with two children
            parent = Task(description="Parent", list_id=list_obj.id, completed=False)
            db.session.add(parent)
            db.session.commit()

            child1 = Task(
                description="Child 1",
                list_id=list_obj.id,
                parent_id=parent.id,
                completed=False,
            )
            child2 = Task(
                description="Child 2",
                list_id=list_obj.id,
                parent_id=parent.id,
                completed=False,
            )
            db.session.add_all([child1, child2])
            db.session.commit()

            # Mark parent as complete with cascade
            parent.set_completion_cascade(True)
            db.session.commit()

            # Refresh to get updated values
            db.session.refresh(parent)
            db.session.refresh(child1)
            db.session.refresh(child2)

            assert parent.completed is True
            assert child1.completed is True
            assert child2.completed is True

    def test_parent_completion_update_all_children_complete(self, app, sample_list):
        """Test that parent is marked complete when all children are complete"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)

            # Create parent with two children
            parent = Task(description="Parent", list_id=list_obj.id, completed=False)
            db.session.add(parent)
            db.session.commit()

            child1 = Task(
                description="Child 1",
                list_id=list_obj.id,
                parent_id=parent.id,
                completed=False,
            )
            child2 = Task(
                description="Child 2",
                list_id=list_obj.id,
                parent_id=parent.id,
                completed=False,
            )
            db.session.add_all([child1, child2])
            db.session.commit()

            # Mark first child as complete
            child1.completed = True
            child1.update_parent_completion()
            db.session.commit()
            db.session.refresh(parent)

            # Parent should still be incomplete (one child incomplete)
            assert parent.completed is False

            # Mark second child as complete
            child2.completed = True
            child2.update_parent_completion()
            db.session.commit()
            db.session.refresh(parent)

            # Now parent should be complete (all children complete)
            assert parent.completed is True

    def test_parent_completion_update_child_unchecked(self, app, sample_list):
        """Test that parent is marked incomplete when a child is unchecked"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)

            # Create parent with two children, all complete
            parent = Task(description="Parent", list_id=list_obj.id, completed=True)
            db.session.add(parent)
            db.session.commit()

            child1 = Task(
                description="Child 1",
                list_id=list_obj.id,
                parent_id=parent.id,
                completed=True,
            )
            child2 = Task(
                description="Child 2",
                list_id=list_obj.id,
                parent_id=parent.id,
                completed=True,
            )
            db.session.add_all([child1, child2])
            db.session.commit()

            # Uncheck one child
            child1.completed = False
            child1.update_parent_completion()
            db.session.commit()
            db.session.refresh(parent)

            # Parent should now be incomplete
            assert parent.completed is False

    def test_parent_completion_recursive_update(self, app, sample_list):
        """Test that completion updates cascade up the hierarchy"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)

            # Create 3-level hierarchy: grandparent -> parent -> child
            grandparent = Task(
                description="Grandparent", list_id=list_obj.id, completed=False
            )
            db.session.add(grandparent)
            db.session.commit()

            parent = Task(
                description="Parent",
                list_id=list_obj.id,
                parent_id=grandparent.id,
                completed=False,
            )
            db.session.add(parent)
            db.session.commit()

            child = Task(
                description="Child",
                list_id=list_obj.id,
                parent_id=parent.id,
                completed=False,
            )
            db.session.add(child)
            db.session.commit()

            # Mark child as complete
            child.completed = True
            child.update_parent_completion()
            db.session.commit()

            db.session.refresh(parent)
            db.session.refresh(grandparent)

            # Both parent and grandparent should be complete
            assert child.completed is True
            assert parent.completed is True
            assert grandparent.completed is True

    def test_task_to_dict(self, app, sample_list):
        """Test task serialization to dictionary"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)
            task = Task(description="Test Task", list_id=list_obj.id)
            db.session.add(task)
            db.session.commit()

            task_dict = task.to_dict()

            assert "id" in task_dict
            assert "description" in task_dict
            assert "completed" in task_dict
            assert "created_at" in task_dict
            assert "updated_at" in task_dict
            assert "depth" in task_dict
            assert "can_have_subtasks" in task_dict
            assert "subtasks" in task_dict

    def test_subtask_relationship(self, app, sample_list):
        """Test parent-child task relationship"""
        with app.app_context():
            list_obj = db.session.merge(sample_list)

            parent = Task(description="Parent Task", list_id=list_obj.id)
            db.session.add(parent)
            db.session.commit()

            child = Task(
                description="Child Task", list_id=list_obj.id, parent_id=parent.id
            )
            db.session.add(child)
            db.session.commit()

            db.session.refresh(parent)

            assert len(parent.subtasks) == 1
            assert parent.subtasks[0].id == child.id
            assert child.parent.id == parent.id
