/**
 * Integration tests for Dashboard component
 * Tests task management, list operations, and UI interactions
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import { AuthProvider } from "../contexts/AuthContext";

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("Dashboard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Mock authenticated state
    localStorage.getItem.mockImplementation((key) => {
      if (key === "access_token") return "mock-token";
      if (key === "user") return JSON.stringify({ id: 1, username: "test" });
      return null;
    });

    // Mock fetch responses - handle both /api/lists and /api/auth/me
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        // Mock user data response
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      // Default: mock lists response (empty array)
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });
  });

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Dashboard />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it("should render dashboard with sidebar and main content", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("Collections")).toBeInTheDocument();
    });
  });

  it("should redirect to login if not authenticated", async () => {
    localStorage.getItem.mockReturnValue(null);

    renderDashboard();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should fetch and display lists on mount", async () => {
    const mockLists = [
      { id: 1, name: "Personal", tasks: [] },
      { id: 2, name: "Work", tasks: [] },
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      if (url.includes("/api/lists")) {
        return Promise.resolve({
          ok: true,
          json: async () => mockLists,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText("Personal")[0]).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
    });
  });

  it("should display empty state when no lists exist", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("No lists yet. Create one!")).toBeInTheDocument();
    });
  });

  it("should show Add Task button when a list is selected", async () => {
    const mockLists = [{ id: 1, name: "My List", tasks: [] }];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLists,
      });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("+ Add Task")).toBeInTheDocument();
    });
  });

  it("should display Active and Completed tabs", async () => {
    const mockLists = [
      {
        id: 1,
        name: "Tasks",
        tasks: []
      }
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLists,
      });
    });

    renderDashboard();

    await waitFor(() => {
      const activeButton = screen.getByRole("button", { name: /Active/i });
      const completedButton = screen.getByRole("button", { name: /Completed/i });
      expect(activeButton).toBeInTheDocument();
      expect(completedButton).toBeInTheDocument();
    });
  });

  it("should filter tasks by active/completed status", async () => {
    const mockLists = [
      {
        id: 1,
        name: "Tasks",
        tasks: [
          { id: 1, description: "Active Task", completed: false, subtasks: [] },
          {
            id: 2,
            description: "Completed Task",
            completed: true,
            subtasks: [],
          },
        ],
      },
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLists,
      });
    });

    renderDashboard();

    await waitFor(() => {
      // Active tab should show active task
      expect(screen.getByText("Active Task")).toBeInTheDocument();
      expect(screen.queryByText("Completed Task")).not.toBeInTheDocument();
    });

    // Click on Completed tab
    const completedTab = screen.getByText("Completed");
    await userEvent.click(completedTab);

    await waitFor(() => {
      // Completed tab should show completed task
      expect(screen.getByText("Completed Task")).toBeInTheDocument();
      expect(screen.queryByText("Active Task")).not.toBeInTheDocument();
    });
  });

  it("should open new list modal when add button is clicked", async () => {
    renderDashboard();

    await waitFor(() => {
      const addButton = screen.getByRole("button", { name: "+" });
      userEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Create New List")).toBeInTheDocument();
    });
  });

  it("should open new task modal when Add Task button is clicked", async () => {
    const mockLists = [{ id: 1, name: "My List", tasks: [] }];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLists,
      });
    });

    renderDashboard();

    await waitFor(() => {
      const addTaskButton = screen.getByText("+ Add Task");
      userEvent.click(addTaskButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Create New Task")).toBeInTheDocument();
    });
  });

  it("should display task count in tab badges", async () => {
    const mockLists = [
      {
        id: 1,
        name: "Tasks",
        tasks: [
          { id: 1, description: "Task 1", completed: false, subtasks: [] },
          { id: 2, description: "Task 2", completed: false, subtasks: [] },
          { id: 3, description: "Task 3", completed: true, subtasks: [] },
        ],
      },
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLists,
      });
    });

    renderDashboard();

    await waitFor(() => {
      const activeTab = screen.getByText("Active").closest("button");
      const completedTab = screen.getByText("Completed").closest("button");

      expect(within(activeTab).getByText("2")).toBeInTheDocument();
      expect(within(completedTab).getByText("1")).toBeInTheDocument();
    });
  });

  it("should call logout and navigate when logout button is clicked", async () => {
    renderDashboard();

    await waitFor(() => {
      const logoutButton = screen.getByText("Logout");
      userEvent.click(logoutButton);
    });

    await waitFor(() => {
      expect(localStorage.removeItem).toHaveBeenCalledWith("access_token");
      expect(localStorage.removeItem).toHaveBeenCalledWith("user");
      expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("should display subtask count for tasks with children", async () => {
    const mockLists = [
      {
        id: 1,
        name: "Tasks",
        tasks: [
          {
            id: 1,
            description: "Parent Task",
            completed: false,
            subtasks: [
              { id: 2, description: "Child 1", completed: false, subtasks: [] },
              { id: 3, description: "Child 2", completed: false, subtasks: [] },
            ],
          },
        ],
      },
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLists,
      });
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText("2 subtasks")).toBeInTheDocument();
    });
  });

  it("should show collapse/expand button for tasks with subtasks", async () => {
    const mockLists = [
      {
        id: 1,
        name: "Tasks",
        tasks: [
          {
            id: 1,
            description: "Parent Task",
            completed: false,
            subtasks: [
              { id: 2, description: "Child 1", completed: false, subtasks: [] },
            ],
          },
        ],
      },
    ];

    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, username: "testuser", email: "test@example.com" }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => mockLists,
      });
    });

    renderDashboard();

    await waitFor(() => {
      const collapseButton = screen.getByTitle("Collapse");
      expect(collapseButton).toBeInTheDocument();
      expect(collapseButton.textContent).toBe("▼");
    });
  });

  it("should include authorization header in API requests", async () => {
    renderDashboard();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://127.0.0.1:5000/api/lists",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token",
          }),
        })
      );
    });
  });
});
