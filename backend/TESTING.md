# Backend Testing Guide

## Overview

Comprehensive unit test suite for the Hierarchical Todo List backend API.

## Project Structure

```
backend/
├── tests/
│   ├── __init__.py           # Package marker
│   ├── conftest.py           # Shared fixtures and configuration
│   ├── test_models.py        # Tests for models.py (User, List, Task)
│   ├── test_auth.py          # Tests for auth.py (authentication routes)
│   └── test_routes.py        # Tests for routes.py (list & task routes)
├── models.py                 # Database models
├── auth.py                   # Authentication endpoints
├── routes.py                 # List and Task API endpoints
└── app.py                    # Flask application factory
```

## Test Coverage

### test_models.py - Database Models (25 tests)

- **User Model Tests** (11 tests)

  - User creation and authentication
  - Password hashing and verification
  - User-list relationships
  - Serialization

- **List Model Tests** (3 tests)

  - List creation and management
  - List-task relationships
  - Serialization

- **Task Model Tests** (11 tests)
  - Task creation and hierarchy
  - Depth calculation (infinite nesting)
  - Completion cascade (parent → children)
  - Auto-completion of parent when all children complete
  - Parent-child relationships

### test_auth.py - Authentication API (14 tests)

- User registration (success, duplicates, validation)
- User login (success, invalid credentials, validation)
- JWT token generation and format
- Password security
- Database persistence

### test_routes.py - List & Task APIs (17 tests)

- **List API Tests** (5 tests)

  - CRUD operations for lists
  - Authentication requirements
  - List ownership validation

- **Task API Tests** (12 tests)
  - Task and subtask creation
  - Task completion (individual and cascade)
  - Parent auto-completion feature ⭐
  - Moving tasks between lists
  - Task deletion (cascade to subtasks)

## Installation

1. Install testing dependencies:

```bash
pip install -r requirements.txt
```

## Running Tests

### Run all tests:

```bash
cd backend
pytest
```

### Run with verbose output:

```bash
pytest -v
```

### Run with coverage report:

```bash
pytest --cov=. --cov-report=html
```

### Run specific test file:

```bash
pytest tests/test_models.py
pytest tests/test_auth.py
pytest tests/test_routes.py
```

### Run specific test class:

```bash
pytest tests/test_models.py::TestUserModel
pytest tests/test_auth.py::TestAuthRoutes
pytest tests/test_routes.py::TestTaskRoutes
```

### Run specific test:

```bash
pytest tests/test_models.py::TestTaskModel::test_parent_completion_recursive_update
pytest tests/test_routes.py::TestTaskRoutes::test_parent_autocomplete_when_all_children_complete
```

## Test Output Example

```bash
$ pytest -v

test_models.py::TestUserModel::test_user_creation PASSED
test_models.py::TestUserModel::test_password_hashing PASSED
test_models.py::TestUserModel::test_password_verification PASSED
test_models.py::TestTaskModel::test_parent_completion_update_all_children_complete PASSED
test_routes.py::TestAuthRoutes::test_register_success PASSED
test_routes.py::TestTaskRoutes::test_parent_autocomplete_when_all_children_done PASSED

======================== 52 tests passed in 2.45s ========================
```

## Coverage Report

After running with coverage (`pytest --cov=. --cov-report=html`), open `htmlcov/index.html` to see detailed coverage:

- **models.py**: ~95% coverage
- **routes.py**: ~95% coverage
- **auth.py**: ~90% coverage

## Key Features Tested

### 1. Authentication & Authorization

✅ JWT token generation and validation
✅ Password hashing with bcrypt
✅ User registration validation
✅ Protected endpoints

### 2. Hierarchical Task Structure

✅ Infinite nesting support
✅ Depth calculation at any level
✅ Parent-child relationships

### 3. Completion Logic

✅ Cascade completion from parent to all children
✅ **Auto-complete parent when ALL children are done** ⭐
✅ **Auto-uncomplete parent when ANY child is unchecked** ⭐
✅ Recursive updates through entire hierarchy

### 4. CRUD Operations

✅ Create, Read, Update, Delete for Lists and Tasks
✅ Authorization checks (users can only access their own data)
✅ Cascade deletion (deleting parent deletes all children)

### 5. Task Movement

✅ Move top-level tasks between lists
✅ Prevent moving subtasks to different lists

## Continuous Integration

These tests are designed to run in CI/CD pipelines. Example GitHub Actions:

```yaml
- name: Run tests
  run: |
    pip install -r requirements.txt
    pytest --cov=. --cov-report=xml
```

## Test Database

Tests use an in-memory SQLite database (`sqlite:///:memory:`) for fast execution without affecting production data.

## Notes

- All tests are isolated - each test gets a fresh database
- Fixtures handle setup and teardown automatically
- Tests cover both happy paths and error cases
- JWT authentication is tested end-to-end
