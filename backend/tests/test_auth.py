"""
Unit tests for authentication routes (auth.py)
Tests user registration, login, and authentication flows
"""

import pytest


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
        # Password should NOT be in response
        assert "password" not in response.json["user"]
        assert "password_hash" not in response.json["user"]

    def test_register_duplicate_username(self, client):
        """Test registration with duplicate username fails"""
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
        """Test registration with duplicate email fails"""
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
        assert "email" in response.json["error"].lower()

    def test_register_missing_username(self, client):
        """Test registration fails with missing username"""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "password123",
                # Missing username
            },
        )

        assert response.status_code == 400
        assert "error" in response.json

    def test_register_missing_email(self, client):
        """Test registration fails with missing email"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "password": "password123",
                # Missing email
            },
        )

        assert response.status_code == 400
        assert "error" in response.json

    def test_register_missing_password(self, client):
        """Test registration fails with missing password"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                # Missing password
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
        assert response.json["message"] == "Login successful"
        # Verify token is a non-empty string
        assert isinstance(response.json["access_token"], str)
        assert len(response.json["access_token"]) > 20

    def test_login_wrong_password(self, client):
        """Test login fails with wrong password"""
        # Register a user first
        client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@example.com",
                "password": "correctpassword",
            },
        )

        # Try to login with wrong password
        response = client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "wrongpassword"},
        )

        assert response.status_code == 401
        assert "error" in response.json

    def test_login_nonexistent_user(self, client):
        """Test login fails for non-existent user"""
        response = client.post(
            "/api/auth/login",
            json={"email": "nonexistent@example.com", "password": "password123"},
        )

        assert response.status_code == 401
        assert "error" in response.json

    def test_login_missing_email(self, client):
        """Test login fails with missing email"""
        response = client.post(
            "/api/auth/login",
            json={
                "password": "password123"
                # Missing email
            },
        )

        assert response.status_code == 400
        assert "error" in response.json

    def test_login_missing_password(self, client):
        """Test login fails with missing password"""
        response = client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com"
                # Missing password
            },
        )

        assert response.status_code == 400
        assert "error" in response.json

    def test_jwt_token_format(self, client):
        """Test that JWT token is properly formatted"""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "jwtuser",
                "email": "jwt@example.com",
                "password": "password123",
            },
        )

        response = client.post(
            "/api/auth/login",
            json={"email": "jwt@example.com", "password": "password123"},
        )

        token = response.json["access_token"]

        # JWT tokens have 3 parts separated by dots
        parts = token.split(".")
        assert len(parts) == 3
        # Each part should be base64 encoded (alphanumeric + - _)
        for part in parts:
            assert part.replace("-", "").replace("_", "").isalnum()

    def test_register_creates_user_in_database(self, client, app):
        """Test that registration actually creates a user in the database"""
        from models import User

        response = client.post(
            "/api/auth/register",
            json={
                "username": "dbuser",
                "email": "db@example.com",
                "password": "password123",
            },
        )

        assert response.status_code == 201

        # Check user exists in database
        with app.app_context():
            user = User.query.filter_by(email="db@example.com").first()
            assert user is not None
            assert user.username == "dbuser"
            assert user.email == "db@example.com"
            # Password should be hashed
            assert user.password_hash != "password123"
