# tsks - Hierarchical Todo List Application

A modern, feature-rich todo list application that enables users to organize tasks hierarchically with **infinite nesting depth**. Built with Flask and React, featuring user authentication, real-time updates, and a beautiful, intuitive interface.

## Features

- **User Authentication** - Secure sign up and login with JWT tokens
- **Multiple Lists** - Create and manage multiple todo lists (collections)
- **Hierarchical Tasks** - Create tasks with infinite subtask nesting
- **Smart Completion** - Auto-complete parent tasks when all children are done
- **Task Management** - Edit, delete, and move tasks between lists
- **Responsive Design** - Works seamlessly on desktop and mobile
- **User Indicators** - Live avatar with active status indicator
- **Modern UI** - Clean, beautiful interface with smooth animations
- **Task Filtering** - View active or completed tasks separately
- **Comprehensive Tests** - 81 unit tests across backend and frontend

## Demo

[Loom video](https://www.loom.com/share/755132e933774426a107bc4616833c5d)

## Technologies Used

### Backend

- [Flask](https://flask.palletsprojects.com/) - Python web framework
- [Flask-SQLAlchemy](https://flask-sqlalchemy.palletsprojects.com/) - ORM for database
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/) - JWT authentication
- [PostgreSQL](https://www.postgresql.org/) - Production database
- [pytest](https://pytest.org/) - Testing framework

### Frontend

- [React](https://reactjs.org/) - UI library (v19)
- [React Router](https://reactrouter.com/) - Client-side routing
- [Vite](https://vitejs.dev/) - Build tool and dev server
- [Vitest](https://vitest.dev/) - Testing framework

## Folder Structure

```
hierarchichal-todo-list/
│
├── backend/                      # Flask backend API
│   ├── tests/                    # Backend test suite
│   │   ├── __init__.py
│   │   ├── conftest.py          # Shared test fixtures
│   │   ├── test_models.py       # Model tests (25 tests)
│   │   ├── test_auth.py         # Authentication tests (14 tests)
│   │   └── test_routes.py       # API route tests (17 tests)
│   ├── app.py                   # Flask app initialization
│   ├── models.py                # Database models (User, List, Task)
│   ├── auth.py                  # Authentication routes
│   ├── routes.py                # API endpoints
│   ├── init_db.py               # Database initialization script
│   ├── requirements.txt         # Python dependencies
│   ├── .env                     # Environment variables (create this)
│   ├── .env.example             # Example environment variables
│   ├── AUTHENTICATION.md        # Authentication documentation
│   └── TESTING.md               # Backend testing guide
│
├── frontend/                    # React frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/             # Images, fonts, etc.
│   │   ├── components/         # Reusable React components
│   │   │   ├── Header.jsx
│   │   │   ├── Logo.jsx
│   │   │   ├── SignIn.jsx
│   │   │   └── SignIn.css
│   │   ├── contexts/           # React contexts
│   │   │   └── AuthContext.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Home.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── styles/             # CSS stylesheets
│   │   │   ├── AuthForm.css
│   │   │   ├── Dashboard.css
│   │   │   └── Home.css
│   │   ├── test/               # Frontend tests (25 tests)
│   │   │   ├── setup.js
│   │   │   ├── AuthContext.test.jsx
│   │   │   └── Dashboard.test.jsx
│   │   ├── App.jsx             # Main app component
│   │   ├── App.css             # App-level styles
│   │   └── main.jsx            # Entry point
│   ├── index.html              # HTML entry point
│   ├── package.json            # NPM dependencies
│   ├── package-lock.json       # NPM lockfile
│   ├── vite.config.js          # Vite configuration
│   ├── eslint.config.js        # ESLint configuration
│   ├── README.md               # Frontend-specific README
│   └── TESTING.md              # Frontend testing guide
│
├── README.md                    # This file (main documentation)
├── TESTING_OVERVIEW.md         # Complete testing documentation
└── .gitignore                  # Git ignore rules
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### 🚀 Quick Start (For Testing - No PostgreSQL Required!)

Want to test the app quickly without setting up PostgreSQL? Follow these steps:

```bash
# 1. Clone and navigate
git clone https://github.com/Savio09/hierarchichal-todo-list.git
cd hierarchichal-todo-list

# 2. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Create .env with SQLite (no database installation needed!)
echo 'DATABASE_URL=sqlite:///dev.db' > .env
echo 'SECRET_KEY=test-secret-key' >> .env
echo 'JWT_SECRET_KEY=test-jwt-secret-key' >> .env

# 4. Start backend
python3 app.py  # That's it! SQLite auto-creates tables

# 5. In a new terminal, start frontend
cd ../frontend
npm install
npm run dev
```

Visit **http://localhost:5173** and start testing! 🎉

### Prerequisites

Before you begin, ensure you have the following installed:

**Required:**

- **Node.js** (v18 or later)
- **npm** (v9 or later)
- **Python** (v3.9 or later)
- **Git** - Version control

**Optional:**

- **PostgreSQL** (v12 or later) - Only if you want to use PostgreSQL instead of SQLite
  - For quick testing, SQLite is built into Python - no installation needed!

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Savio09/hierarchichal-todo-list.git
cd hierarchichal-todo-list
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
touch .env
```

**Configure `.env` file:**

For **PostgreSQL** (production/cloud database):

```env
DATABASE_URL=postgresql://username:password@localhost:5432/your_database
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
```

For **SQLite** (simple testing - no PostgreSQL needed):

```env
DATABASE_URL=sqlite:///dev.db
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
```

> ** Quick Start Tip:** If you don't have PostgreSQL installed and just want to test the app, use SQLite! Simply set `DATABASE_URL=sqlite:///dev.db` and skip the database initialization step. SQLite works out of the box with zero setup.

**Initialize the Database:**

After configuring your `.env` file, you need to create the database tables:

```bash
# If using PostgreSQL - REQUIRED before first run
python3 init_db.py

# If using SQLite - OPTIONAL (tables auto-create, but you can still run this)
python3 init_db.py
```

**Alternative method using Python shell:**

```bash
python3
>>> from app import app, db
>>> with app.app_context():
...     db.create_all()
>>> exit()
```

> **📊 Database Choice Guide:**
>
> | Database       | Setup Required?       | Best For                                    | Installation                     |
> | -------------- | --------------------- | ------------------------------------------- | -------------------------------- |
> | **SQLite**     | No setup needed       | Testing, development, quick demos           | Built into Python                |
> | **PostgreSQL** | Must run `init_db.py` | Production, cloud deployment, team projects | Requires PostgreSQL installation |
>
> **Why is this necessary?**
>
> - **SQLite**: Creates tables automatically when the app starts (perfect for testing!)
> - **PostgreSQL**: Requires explicit table creation using `db.create_all()` before use
> - The `init_db.py` script ensures tables (`users`, `lists`, `tasks`) exist before you run the app
>
> **What if I skip this step with PostgreSQL?**
> You'll encounter errors like: `relation "users" does not exist` when trying to register or log in.

#### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install
```

### Starting the Application

#### Running the Backend

```bash
# From backend directory
cd backend

# Activate virtual environment (if not already activated)
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Initialize database (REQUIRED for PostgreSQL, OPTIONAL for SQLite)
python3 init_db.py

# Start the Flask server
python3 app.py
```

The backend server will start on **http://127.0.0.1:5000**

> ** Testing without PostgreSQL?**
>
> 1. Set `DATABASE_URL=sqlite:///dev.db` in your `.env` file
> 2. Skip `init_db.py` if you want (SQLite auto-creates tables)
> 3. Just run `python3 app.py` and you're good to go!

#### Running the Frontend

```bash
# From frontend directory (in a new terminal)
cd frontend

# Start the development server
npm run dev
```

The React app will start on **http://localhost:5173**

Open your browser and navigate to **http://localhost:5173** to use the application.

## Testing

### Backend Tests (56 tests)

```bash
# From backend directory
cd backend

# Run all tests with verbose output
pytest -v

# Run specific test file
pytest tests/test_models.py -v
pytest tests/test_auth.py -v
pytest tests/test_routes.py -v

# Run with coverage report
pytest --cov=. --cov-report=html

# View coverage report
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

### Frontend Tests (25 tests)

```bash
# From frontend directory
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Run All Tests

```bash
# From project root
chmod +x run_all_tests.sh
./run_all_tests.sh
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Lists

- `GET /api/lists` - Get all lists for user
- `POST /api/lists` - Create new list
- `GET /api/lists/:id` - Get specific list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list

### Tasks

- `POST /api/lists/:id/tasks` - Create task in list
- `POST /api/tasks/:id/subtasks` - Create subtask
- `GET /api/tasks/:id` - Get task with subtasks
- `PUT /api/tasks/:id` - Update task (completion, description, move)
- `DELETE /api/tasks/:id` - Delete task (cascades to subtasks)

## Key Features Explained

### Infinite Task Nesting

Unlike traditional todo apps, tsks allows unlimited nesting depth:

```
📋 List
  ✅ Task
    ✅ Subtask
      ✅ Sub-subtask
        ✅ Sub-sub-subtask
          ... (unlimited)
```

### Smart Parent Completion

When you mark all subtasks as complete, the parent task automatically completes. Similarly, unchecking any subtask will uncheck the parent.

### Task Movement

Top-level tasks can be moved between lists, while subtasks remain tied to their parent task's list.

### Cascade Completion

Mark a parent task complete and choose to cascade - all subtasks will be marked complete instantly.

## UI/UX Features

- **User Avatar** - Shows first letter of username with live green indicator
- **Logout Button** - Clear, prominent button at sidebar bottom
- **Active/Completed Tabs** - Filter tasks by status
- **Hover Actions** - Edit and delete buttons appear on hover
- **Loading States** - Smooth loading animations
- **Responsive Design** - Works on all screen sizes
- **Keyboard Accessible** - Full keyboard navigation support

## Documentation

- `README.md` - This file (project overview)
- `TESTING_OVERVIEW.md` - Complete testing guide
- `backend/TESTING.md` - Backend-specific tests
- `frontend/TESTING.md` - Frontend-specific tests

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Protected API routes

## Contributing

This is an assignment project, but suggestions and feedback are welcome!

## License

This project is part of a college assignment.

## Author

**Savio09**

- GitHub: [@Savio09](https://github.com/Savio09)

## Acknowledgments

- Assignment provided by Minerva University
- Inspired by modern task management applications
- Built with love by [Fortune Declan](https://declann.codes)

## A.I. Notes

I used Copilot to assist me with writing some of the logic and bug fixes. I also used Copilot to assist me with comments for the code.

---

**Note:** Remember to create a `.env` file in the backend directory with your database credentials before running the application.
