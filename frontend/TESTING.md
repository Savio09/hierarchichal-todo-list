# Frontend Testing Guide

## Overview

Comprehensive test suite for the React frontend using Vitest and React Testing Library.

## Test Coverage

### AuthContext Tests (10 tests)

- ✅ Context provider initialization
- ✅ User state management
- ✅ localStorage integration (save/restore)
- ✅ Login functionality
- ✅ Logout functionality
- ✅ Authentication state persistence
- ✅ Error handling for corrupted data
- ✅ Context usage validation

### Dashboard Component Tests (15 tests)

- ✅ Component rendering
- ✅ Authentication guard (redirect if not logged in)
- ✅ Fetch and display lists
- ✅ Empty state handling
- ✅ Active/Completed tab filtering
- ✅ Task count badges
- ✅ Modal interactions (create list/task)
- ✅ Subtask display
- ✅ Collapse/expand buttons
- ✅ Logout functionality
- ✅ Authorization headers in API calls

## Installation

1. Install dependencies:

```bash
cd frontend
npm install
```

## Running Tests

### Run all tests:

```bash
npm test
```

### Run tests in watch mode:

```bash
npm test -- --watch
```

### Run tests with UI:

```bash
npm run test:ui
```

### Run tests with coverage:

```bash
npm run test:coverage
```

### Run specific test file:

```bash
npm test -- AuthContext.test
```

## Test Output Example

```bash
$ npm test

 ✓ src/test/AuthContext.test.jsx (10 tests)
   AuthContext
     ✓ should provide auth context
     ✓ should initially have no user
     ✓ should restore user from localStorage on mount
     ✓ should handle login correctly
     ✓ should handle logout correctly
     ✓ should handle corrupted user data in localStorage
     ✓ should throw error when useAuth is used outside AuthProvider
     ✓ should update isAuthenticated after login and logout
     ✓ should maintain authentication state across component re-renders

 ✓ src/test/Dashboard.test.jsx (15 tests)
   Dashboard Component
     ✓ should render dashboard with sidebar and main content
     ✓ should redirect to login if not authenticated
     ✓ should fetch and display lists on mount
     ✓ should display empty state when no lists exist
     ✓ should show Add Task button when a list is selected
     ✓ should display Active and Completed tabs
     ✓ should filter tasks by active/completed status
     ✓ should open new list modal when add button is clicked
     ✓ should open new task modal when Add Task button is clicked
     ✓ should display task count in tab badges
     ✓ should call logout and navigate when logout button is clicked
     ✓ should display subtask count for tasks with children
     ✓ should show collapse/expand button for tasks with subtasks
     ✓ should include authorization header in API requests

Test Files  2 passed (2)
     Tests  25 passed (25)
```

## Coverage Report

After running `npm run test:coverage`, open `coverage/index.html`:

- **AuthContext.jsx**: ~100% coverage
- **Dashboard.jsx**: ~85% coverage
- **Overall**: ~90% coverage

## Test Structure

### Setup (`src/test/setup.js`)

- Configures jsdom environment
- Mocks localStorage
- Mocks fetch API
- Cleanup after each test

### Mocking Strategy

#### localStorage

```javascript
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;
```

#### fetch API

```javascript
global.fetch = vi.fn();

// In tests:
global.fetch.mockResolvedValue({
  ok: true,
  json: async () => mockData,
});
```

#### React Router

```javascript
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});
```

## Key Testing Patterns

### 1. Testing Context Providers

```javascript
const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
const { result } = renderHook(() => useAuth(), { wrapper });
```

### 2. Testing Components with Router

```javascript
render(
  <BrowserRouter>
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  </BrowserRouter>
);
```

### 3. Testing Async Operations

```javascript
await waitFor(() => {
  expect(screen.getByText("Expected Text")).toBeInTheDocument();
});
```

### 4. Testing User Interactions

```javascript
const button = screen.getByText("Click Me");
await userEvent.click(button);
```

### 5. Testing API Calls

```javascript
expect(global.fetch).toHaveBeenCalledWith(
  "http://127.0.0.1:5000/api/lists",
  expect.objectContaining({
    headers: expect.objectContaining({
      Authorization: "Bearer mock-token",
    }),
  })
);
```

## What's Tested

### Authentication Flow

✅ Login stores token and user in localStorage
✅ Logout removes token and user from localStorage
✅ Token is restored from localStorage on app load
✅ Invalid data in localStorage is handled gracefully
✅ Authentication state is checked before rendering protected components

### Dashboard Features

✅ Lists are fetched and displayed
✅ Tasks are filtered by completion status
✅ Task counts are calculated correctly
✅ Modals open/close for creating lists and tasks
✅ Subtasks are displayed with proper nesting
✅ Collapse/expand works for parent tasks
✅ Authorization headers are included in all API requests

### Error Handling

✅ Redirect to login when not authenticated
✅ Handle empty states (no lists, no tasks)
✅ Handle corrupted localStorage data
✅ Proper error messages for invalid context usage

## Continuous Integration

Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: |
    cd frontend
    npm install

- name: Run tests
  run: |
    cd frontend
    npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./frontend/coverage/coverage-final.json
```

## Best Practices

1. **Isolation**: Each test is independent with clean mocks
2. **Async/Await**: Use `waitFor` for async operations
3. **User-Centric**: Test from user's perspective (click, type, see)
4. **Coverage**: Aim for >80% coverage on critical paths
5. **Mocking**: Mock external dependencies (API, localStorage, router)

## Adding New Tests

1. Create test file: `ComponentName.test.jsx`
2. Import necessary utilities
3. Setup mocks in `beforeEach`
4. Write descriptive test names
5. Use `render` + `screen` for queries
6. Assert expected behavior
7. Run tests to verify

Example template:

```javascript
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MyComponent from "../components/MyComponent";

describe("MyComponent", () => {
  beforeEach(() => {
    // Setup
  });

  it("should do something", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected")).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Tests fail with "Cannot find module"

- Check import paths
- Ensure setup.js is configured in vite.config.js

### Tests timeout

- Increase timeout in vite.config.js
- Check for missing `await` keywords

### Coverage not generated

- Run `npm install @vitest/coverage-v8`
- Check vite.config.js coverage configuration

## Notes

- Tests use jsdom for DOM simulation
- Vitest is faster than Jest for Vite projects
- Testing Library promotes accessible, user-focused tests
- Mocks are reset between tests for isolation
