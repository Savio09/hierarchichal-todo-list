import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Logo from "../components/Logo.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Dashboard Component
 *
 * The main application interface where users manage their todo lists and tasks.
 * This is the core feature of the app with full CRUD operations for lists and tasks.
 *
 * Key Features:
 * - Create, read, update, delete lists (collections)
 * - Create, complete, edit, delete, move tasks
 * - Infinite task nesting (subtasks within subtasks)
 * - Smart parent-child completion cascade
 * - Collapsible task hierarchy
 * - Active/Completed task filtering
 * - User profile display with avatar
 * - Responsive sidebar navigation
 *
 * Architecture:
 * - Left sidebar: Collections list + user profile + logout
 * - Right panel: Selected list's tasks with hierarchy
 * - Modal dialogs: For creating/editing lists and tasks
 *
 * Protected Route: Requires authentication to access
 */
function Dashboard() {
  // Navigation hook for redirecting unauthenticated users
  const navigate = useNavigate();

  // === CORE STATE ===
  // Lists state - all user's collections
  const [lists, setLists] = useState([]);
  // Currently selected/active list being viewed
  const [selectedList, setSelectedList] = useState(null);
  // Currently selected task (for viewing subtasks)
  const [selectedTask, setSelectedTask] = useState(null);

  // === LIST MANAGEMENT STATE ===
  const [newListDescription, setNewListDescription] = useState("");
  const [newListName, setNewListName] = useState("");
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [listToEdit, setListToEdit] = useState(null);
  const [editListName, setEditListName] = useState("");
  const [editListDescription, setEditListDescription] = useState("");

  // === TASK MANAGEMENT STATE ===
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewSubtaskModal, setShowNewSubtaskModal] = useState(false);
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("");
  const [subtaskParentId, setSubtaskParentId] = useState(null);
  const [taskToMove, setTaskToMove] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);

  // === UI STATE ===
  // Tracks which tasks are collapsed/expanded in the hierarchy
  const [collapsedTasks, setCollapsedTasks] = useState({});
  // Active tab: "active" or "completed" tasks
  const [activeTab, setActiveTab] = useState("active");
  // Current logged-in user info
  const [currentUser, setCurrentUser] = useState(null);

  // === AUTH STATE ===
  // Get auth functions and loading state from context
  const { logout, isAuthenticated, loading } = useAuth();

  /**
   * EFFECT: Authentication Guard & Initial Data Load
   *
   * Runs on component mount and when auth state changes.
   * Protects this route by redirecting unauthenticated users to login.
   * Loads initial data (lists and user info) for authenticated users.
   */
  useEffect(() => {
    // Wait for auth context to finish checking authentication status
    if (loading) return;

    if (!isAuthenticated()) {
      // Redirect to login if not authenticated
      navigate("/login");
    } else {
      // User is authenticated - load their data
      fetchLists();
      fetchCurrentUser();
    }
  }, [navigate, isAuthenticated, loading]);

  /**
   * fetchCurrentUser - Retrieves logged-in user's profile information
   *
   * Makes authenticated API call to get current user details.
   * Used to display user avatar and name in sidebar.
   */
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  /**
   * EFFECT: Sync Selected List and Task with Latest Data
   *
   * Whenever lists are refreshed (after create/update/delete operations),
   * this ensures the currently selected list and task reflect the latest state.
   *
   * Why needed: Prevents stale data issues where UI shows outdated task status
   * or hierarchy after operations like completing a task or adding subtasks.
   */
  useEffect(() => {
    if (selectedList && lists.length > 0) {
      // Find the latest version of the selected list
      const updatedList = lists.find((list) => list.id === selectedList.id);
      if (updatedList) {
        setSelectedList(updatedList);

        // Also update selectedTask if we're viewing one
        if (selectedTask) {
          // Recursive function to find task in nested hierarchy
          const findTaskInList = (tasks) => {
            for (const task of tasks) {
              if (task.id === selectedTask.id) {
                return task;
              }
              // Search in subtasks recursively
              if (task.subtasks && task.subtasks.length > 0) {
                const found = findTaskInList(task.subtasks);
                if (found) return found;
              }
            }
            return null;
          };

          const updatedTask = findTaskInList(updatedList.tasks || []);
          if (updatedTask) {
            setSelectedTask(updatedTask);
          }
        }
      }
    }
  }, [lists]);

  // ========================================
  // === API FUNCTIONS: LISTS (CRUD) ===
  // ========================================

  /**
   * fetchLists - Retrieves all lists (collections) for current user
   *
   * Called:
   * - On component mount (initial load)
   * - After creating, updating, or deleting lists
   * - After task operations (to refresh task counts)
   *
   * Also automatically selects first list if none selected.
   */
  const fetchLists = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:5000/api/lists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setLists(data);
        // Auto-select first list if none selected (initial load)
        if (data.length > 0 && !selectedList) {
          setSelectedList(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  /**
   * handleCreateList - Creates a new list (collection)
   *
   * @param {Event} e - Form submit event
   *
   * Flow:
   * 1. Prevent form reload
   * 2. Send POST request with list name and description
   * 3. On success: Clear form, close modal, refresh lists
   * 4. On error: Show alert with error message
   */
  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://127.0.0.1:5000/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newListName,
          description: newListDescription,
        }),
      });

      if (response.ok) {
        // Success: Clear form and refresh
        setNewListName("");
        setNewListDescription("");
        setShowNewListModal(false);
        fetchLists();
      } else {
        // Error: Show detailed error message
        const errorData = await response.json();
        console.error("Error response:", response.status, errorData);
        alert(
          `Failed to create list: ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error creating list:", error);
      alert("Network error. Please check your connection.");
    }
  };

  // ========================================
  // === API FUNCTIONS: TASKS (CRUD) ===
  // ========================================

  /**
   * handleCreateTask - Creates a new top-level task in selected list
   *
   * @param {Event} e - Form submit event
   *
   * Creates a task at the root level (no parent).
   * For subtasks, use handleCreateSubtask instead.
   */
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedList) return; // Guard: Ensure a list is selected

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/lists/${selectedList.id}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description: newTaskDescription }),
        }
      );
      if (response.ok) {
        // Success: Clear form, close modal, refresh data
        setNewTaskDescription("");
        setShowNewTaskModal(false);
        fetchLists();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  /**
   * handleToggleTask - Toggles task completion status
   *
   * @param {number} taskId - ID of task to toggle
   * @param {boolean} currentStatus - Current completed status
   * @param {boolean} cascade - Whether to cascade completion to subtasks (default: true)
   *
   * Features:
   * - Cascade completion: When parent marked complete, all children complete too
   * - Smart parent updates: Backend automatically updates parent when children change
   */
  const handleToggleTask = async (taskId, currentStatus, cascade = true) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            completed: !currentStatus,
            cascade: cascade, // Enable cascading to all subtasks
          }),
        }
      );
      if (response.ok) {
        fetchLists(); // Refresh to show updated completion states
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  /**
   * handleDeleteTask - Deletes a task and all its subtasks
   *
   * @param {number} taskId - ID of task to delete
   *
   * Shows confirmation dialog before deletion.
   * Deletion cascades: All child subtasks are also deleted.
   */
  const handleDeleteTask = async (taskId) => {
    // Confirmation prompt to prevent accidental deletion
    if (
      !confirm(
        "Are you sure you want to delete this task? This will also delete all subtasks."
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        fetchLists(); // Refresh list
        setSelectedTask(null); // Clear selection if deleted task was selected
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Create a subtask
  const handleCreateSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskParentId) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/${subtaskParentId}/subtasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ description: newSubtaskDescription }),
        }
      );
      if (response.ok) {
        setNewSubtaskDescription("");
        setShowNewSubtaskModal(false);
        setSubtaskParentId(null);
        fetchLists();
      }
    } catch (error) {
      console.error("Error creating subtask:", error);
    }
  };

  // Toggle collapse/expand for a task
  const toggleCollapse = (taskId) => {
    setCollapsedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Move a task to a different list
  const handleMoveTask = async (newListId) => {
    if (!taskToMove) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/${taskToMove.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ list_id: newListId }),
        }
      );
      if (response.ok) {
        setShowMoveModal(false);
        setTaskToMove(null);
        fetchLists();
      }
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  // Delete a list
  const handleDeleteList = async (listId) => {
    if (
      !confirm(
        "Are you sure you want to delete this list? This will also delete all tasks in it."
      )
    ) {
      return;
    }
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/lists/${listId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        // If the deleted list was selected, clear selection
        if (selectedList?.id === listId) {
          setSelectedList(null);
        }
        fetchLists();
      }
    } catch (error) {
      console.error("Error deleting list:", error);
    }
  };

  // Edit a list
  const handleEditList = async (e) => {
    e.preventDefault();
    if (!listToEdit) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://127.0.0.1:5000/api/lists/${listToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editListName,
            description: editListDescription,
          }),
        }
      );
      if (response.ok) {
        setShowEditListModal(false);
        setListToEdit(null);
        setEditListName("");
        setEditListDescription("");
        fetchLists();
      }
    } catch (error) {
      console.error("Error editing list:", error);
    }
  };

  // Open edit modal with list data
  const openEditListModal = (list, e) => {
    e.stopPropagation(); // Prevent selecting the list
    setListToEdit(list);
    setEditListName(list.name);
    setEditListDescription(list.description || "");
    setShowEditListModal(true);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get tasks for selected list filtered by completion status
  const getListTasks = () => {
    if (!selectedList) return [];
    const allTasks = selectedList.tasks || [];

    if (activeTab === "active") {
      return allTasks.filter((task) => !task.completed);
    } else {
      return allTasks.filter((task) => task.completed);
    }
  };

  // Count active and completed tasks
  const getTaskCounts = () => {
    if (!selectedList) return { active: 0, completed: 0 };
    const allTasks = selectedList.tasks || [];

    return {
      active: allTasks.filter((task) => !task.completed).length,
      completed: allTasks.filter((task) => task.completed).length,
    };
  };

  // Get subtasks for selected task
  const getSubtasks = () => {
    if (!selectedTask) return [];
    return selectedTask.subtasks || [];
  };

  // Generate gradient colors for lists
  const gradientColors = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  ];

  // Recursive component to render tasks with nesting
  const TaskItem = ({ task, depth = 0, isTopLevel = false }) => {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isCollapsed = collapsedTasks[task.id];

    return (
      <div
        className="task-item-wrapper"
        style={{ marginLeft: depth > 0 ? "24px" : "0" }}
      >
        <div
          className={`task-card ${task.completed ? "completed-task" : ""}`}
          style={{
            borderLeft: depth > 0 ? "2px solid #e5e7eb" : "none",
            paddingLeft: depth > 0 ? "12px" : "0",
          }}
        >
          <div className="task-card-content">
            {hasSubtasks && (
              <button
                className="collapse-btn"
                onClick={() => toggleCollapse(task.id)}
                title={isCollapsed ? "Expand" : "Collapse"}
              >
                {isCollapsed ? "▶" : "▼"}
              </button>
            )}
            <div
              className={`task-checkbox ${task.completed ? "checked" : ""}`}
              onClick={() => handleToggleTask(task.id, task.completed)}
            >
              {task.completed && <span>✓</span>}
            </div>
            <div className="task-info">
              <p
                className={`task-description ${
                  task.completed ? "completed" : ""
                }`}
              >
                {task.description}
              </p>
              {hasSubtasks && (
                <span className="subtask-count">
                  {task.subtasks.length} subtask
                  {task.subtasks.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="task-actions">
              <button
                className="action-btn add-subtask-btn"
                onClick={() => {
                  setSubtaskParentId(task.id);
                  setShowNewSubtaskModal(true);
                }}
                title="Add subtask"
              >
                +
              </button>
              {isTopLevel && (
                <button
                  className="action-btn move-btn"
                  onClick={() => {
                    setTaskToMove(task);
                    setShowMoveModal(true);
                  }}
                  title="Move to another list"
                >
                  ⇄
                </button>
              )}
              <button
                className="action-btn delete-btn"
                onClick={() => handleDeleteTask(task.id)}
                title="Delete task"
              >
                🗑
              </button>
            </div>
          </div>
        </div>
        {hasSubtasks && !isCollapsed && (
          <div className="subtasks-nested">
            {task.subtasks.map((subtask) => (
              <TaskItem
                key={subtask.id}
                task={subtask}
                depth={depth + 1}
                isTopLevel={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Show loading indicator while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
          {currentUser && currentUser.username && (
            <div
              className="user-avatar"
              title={`Logged in as ${currentUser.username}`}
            >
              <div className="avatar-circle">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div className="active-indicator"></div>
            </div>
          )}
        </div>

        <div className="collections-section">
          <div className="collections-header">
            <h3>Collections</h3>
            <button
              className="add-collection-btn"
              onClick={() => setShowNewListModal(true)}
            >
              +
            </button>
          </div>

          <div className="collections-list">
            {lists.length === 0 ? (
              <p className="empty-message">No lists yet. Create one!</p>
            ) : (
              lists.map((list, index) => (
                <div
                  key={list.id}
                  className={`collection-item ${
                    selectedList?.id === list.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedList(list);
                    setSelectedTask(null);
                  }}
                >
                  <div
                    className="collection-icon"
                    style={{
                      background: gradientColors[index % gradientColors.length],
                    }}
                  ></div>
                  <span className="collection-name">{list.name}</span>
                  <div className="collection-actions">
                    <button
                      className="collection-action-btn edit-btn"
                      onClick={(e) => openEditListModal(list, e)}
                      title="Edit list"
                    >
                      ✎
                    </button>
                    <button
                      className="collection-action-btn delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                      title="Delete list"
                    >
                      🗑
                    </button>
                  </div>
                  <span className="collection-count">
                    {list.tasks?.length || 0}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logout Button at Bottom */}
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            <span className="logout-icon">⎋</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {selectedList ? (
          <>
            {/* Header */}
            <div className="content-header">
              <div className="header-left">
                <h1>{selectedList.name}</h1>
                {selectedTask && (
                  <>
                    <span className="breadcrumb-separator">›</span>
                    <button
                      className="breadcrumb-link"
                      onClick={() => setSelectedTask(null)}
                    >
                      Back to Tasks
                    </button>
                  </>
                )}
              </div>
              <button
                className="add-task-btn"
                onClick={() => setShowNewTaskModal(true)}
              >
                + Add Task
              </button>
            </div>

            {/* Task List with Active/Completed Tabs */}
            <div className="tasks-container">
              {/* Tab Navigation */}
              <div className="tabs-container">
                <button
                  className={`tab-btn ${
                    activeTab === "active" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("active")}
                >
                  Active
                  <span className="tab-count">{getTaskCounts().active}</span>
                </button>
                <button
                  className={`tab-btn ${
                    activeTab === "completed" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("completed")}
                >
                  Completed
                  <span className="tab-count">{getTaskCounts().completed}</span>
                </button>
              </div>

              {/* Task List */}
              {getListTasks().length === 0 ? (
                <div className="empty-state">
                  <p>
                    {activeTab === "active"
                      ? "No active tasks. Add your first task!"
                      : "No completed tasks yet."}
                  </p>
                </div>
              ) : (
                <div className="task-list">
                  {getListTasks().map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      depth={0}
                      isTopLevel={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state-main">
            <h2>Welcome to tsks!</h2>
            <p>Select a collection from the sidebar to get started</p>
          </div>
        )}
      </main>

      {/* New List Modal */}
      {showNewListModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowNewListModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New List</h2>
            <form onSubmit={handleCreateList}>
              <input
                type="text"
                placeholder="List name"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
              />
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowNewListModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Task Modal */}
      {showNewTaskModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowNewTaskModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <textarea
                placeholder="Task description"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                required
                autoFocus
                rows="4"
              />
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowNewTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Subtask Modal */}
      {showNewSubtaskModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowNewSubtaskModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Subtask</h2>
            <form onSubmit={handleCreateSubtask}>
              <textarea
                placeholder="Subtask description"
                value={newSubtaskDescription}
                onChange={(e) => setNewSubtaskDescription(e.target.value)}
                required
                autoFocus
                rows="4"
              />
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowNewSubtaskModal(false);
                    setSubtaskParentId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move Task Modal */}
      {showMoveModal && (
        <div className="modal-overlay" onClick={() => setShowMoveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Move Task to Another List</h2>
            <div className="move-list-options">
              {lists
                .filter((list) => list.id !== selectedList?.id)
                .map((list, index) => (
                  <button
                    key={list.id}
                    className="move-list-option"
                    onClick={() => handleMoveTask(list.id)}
                  >
                    <div
                      className="collection-icon-small"
                      style={{
                        background:
                          gradientColors[index % gradientColors.length],
                      }}
                    ></div>
                    <span>{list.name}</span>
                  </button>
                ))}
            </div>
            <div className="modal-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowMoveModal(false);
                  setTaskToMove(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit List Modal */}
      {showEditListModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditListModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit List</h2>
            <form onSubmit={handleEditList}>
              <input
                type="text"
                placeholder="List name"
                value={editListName}
                onChange={(e) => setEditListName(e.target.value)}
                required
                autoFocus
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={editListDescription}
                onChange={(e) => setEditListDescription(e.target.value)}
              />
              <div className="modal-buttons">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowEditListModal(false);
                    setListToEdit(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
