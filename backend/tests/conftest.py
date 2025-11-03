"""
Pytest configuration for backend tests
Provides fixtures and setup for all test modules
"""

import sys
import os

# Add the parent directory (backend) to the path so we can import app modules
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from models import db
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
    """Create a user and return auth headers with JWT token"""
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
