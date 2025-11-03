import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";
import Logo from "../components/Logo.jsx";

function Dashboard() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [newListDescription, setNewListDescription] = useState("");
  const [selectedTask, setSelectedTask] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showNewSubtaskModal, setShowNewSubtaskModal] = useState(false);
  const [newSubtaskDescription, setNewSubtaskDescription] = useState("");
  const [subtaskParentId, setSubtaskParentId] = useState(null);
  const [collapsedTasks, setCollapsedTasks] = useState({});
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [taskToMove, setTaskToMove] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
    } else {
      fetchLists();
    }
  }, [navigate]);

  // Update selectedList when lists change to keep it in sync
  useEffect(() => {
    if (selectedList && lists.length > 0) {
      const updatedList = lists.find((list) => list.id === selectedList.id);
      if (updatedList) {
        setSelectedList(updatedList);

        // Also update selectedTask if we're viewing one
        if (selectedTask) {
          const findTaskInList = (tasks) => {
            for (const task of tasks) {
              if (task.id === selectedTask.id) {
                return task;
              }
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

  // Fetch all lists
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
        if (data.length > 0 && !selectedList) {
          setSelectedList(data[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  // Create a new list
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
        setNewListName("");
        setNewListDescription("");
        setShowNewListModal(false);
        fetchLists();
      } else {
        // Log the error response for debugging
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

  // Create a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedList) return;

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
        setNewTaskDescription("");
        setShowNewTaskModal(false);
        fetchLists();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  // Toggle task completion with cascade option
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
        fetchLists();
      }
    } catch (error) {
      console.error("Error toggling task:", error);
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
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
        fetchLists();
        setSelectedTask(null);
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
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

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Logo />
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ⎋
          </button>
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
                  <span className="collection-count">
                    {list.tasks?.length || 0}
                  </span>
                </div>
              ))
            )}
          </div>
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
    </div>
  );
}

export default Dashboard;
