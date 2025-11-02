import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newListName, setNewListName] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [showNewListModal, setShowNewListModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
    } else {
      fetchLists();
    }
  }, [navigate]);

  // Fetch all lists
  const fetchLists = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch("http://localhost:5000/api/lists", {
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
      const response = await fetch("http://localhost:5000/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newListName, description: "" }),
      });
      if (response.ok) {
        setNewListName("");
        setShowNewListModal(false);
        fetchLists();
      }
    } catch (error) {
      console.error("Error creating list:", error);
    }
  };

  // Create a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedList) return;

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:5000/api/lists/${selectedList.id}/tasks`,
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

  // Toggle task completion
  const handleToggleTask = async (taskId, currentStatus) => {
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completed: !currentStatus }),
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
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}`,
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  // Get tasks for selected list
  const getListTasks = () => {
    if (!selectedList) return [];
    return selectedList.tasks || [];
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

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-small">
            <svg
              width="32"
              height="32"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 5L35 15V25L20 35L5 25V15L20 5Z"
                fill="#0066FF"
                stroke="#0066FF"
                strokeWidth="2"
              />
            </svg>
            <h2>tsks.</h2>
          </div>
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

            {/* Task List or Subtask View */}
            {!selectedTask ? (
              <div className="tasks-container">
                <div className="tasks-header">
                  <span className="tasks-count">
                    Tasks - {getListTasks().length}
                  </span>
                </div>

                {getListTasks().length === 0 ? (
                  <div className="empty-state">
                    <p>No tasks yet. Add your first task!</p>
                  </div>
                ) : (
                  <div className="task-list">
                    {getListTasks().map((task) => (
                      <div key={task.id} className="task-card">
                        <div className="task-card-content">
                          <div
                            className={`task-checkbox ${
                              task.completed ? "checked" : ""
                            }`}
                            onClick={() =>
                              handleToggleTask(task.id, task.completed)
                            }
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
                            {task.subtasks && task.subtasks.length > 0 && (
                              <span className="subtask-count">
                                {task.subtasks.length} subtask
                                {task.subtasks.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                          <button
                            className="view-subtasks-btn"
                            onClick={() => setSelectedTask(task)}
                          >
                            →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="subtasks-container">
                <div className="subtask-header">
                  <h2>{selectedTask.description}</h2>
                </div>

                <div className="subtasks-list">
                  {getSubtasks().length === 0 ? (
                    <div className="empty-state">
                      <p>No subtasks yet</p>
                      <p className="empty-subtitle">
                        Add subtasks to break down this task into smaller steps
                      </p>
                    </div>
                  ) : (
                    getSubtasks().map((subtask) => (
                      <div key={subtask.id} className="task-card subtask-card">
                        <div className="task-card-content">
                          <div
                            className={`task-checkbox ${
                              subtask.completed ? "checked" : ""
                            }`}
                            onClick={() =>
                              handleToggleTask(subtask.id, subtask.completed)
                            }
                          >
                            {subtask.completed && <span>✓</span>}
                          </div>
                          <div className="task-info">
                            <p
                              className={`task-description ${
                                subtask.completed ? "completed" : ""
                              }`}
                            >
                              {subtask.description}
                            </p>
                            {subtask.subtasks &&
                              subtask.subtasks.length > 0 && (
                                <span className="subtask-count">
                                  {subtask.subtasks.length} sub-subtask
                                  {subtask.subtasks.length !== 1 ? "s" : ""}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
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
    </div>
  );
}

export default Dashboard;
