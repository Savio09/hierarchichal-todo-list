import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "../styles/Home.css";

function Home() {
  return (
    <div className="landing-page">
      <Header />

      <main className="mainContent">
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Tsks, just tasks<span className="accent-dot">.</span>
            </h1>
            <p className="hero-subtitle">
              Keep track of the daily tasks in life and
              <br />
              get that satisfaction upon completion.
            </p>

            <div className="hero-buttons">
              <Link to="/login" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="#features" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          </div>

          {/* Decorative gradient orbs */}
          <div className="gradient-orb orb-left"></div>
          <div className="gradient-orb orb-right"></div>
        </section>

        {/* Preview Section */}
        <section className="preview-section">
          <div className="preview-container">
            <div className="sidebar-preview">
              <div className="sidebar-header">
                <div className="sidebar-menu-icon">☰</div>
                <div className="sidebar-title">Dashboard</div>
              </div>

              <div className="collections-section">
                <div className="collections-header">Collections</div>
                <div className="collection-item active">
                  <div className="collection-icon school"></div>
                  <span>School</span>
                  <span className="collection-count">5</span>
                </div>
                <div className="collection-item">
                  <div className="collection-icon personal"></div>
                  <span>Personal</span>
                  <span className="collection-count">12</span>
                </div>
                <div className="collection-item">
                  <div className="collection-icon design"></div>
                  <span>Design</span>
                  <span className="collection-count">8</span>
                </div>
              </div>
            </div>

            {/* Main Content Preview */}
            <div className="main-preview">
              <div className="preview-header">
                <div className="preview-back">← School</div>
                <div className="preview-menu">•••</div>
              </div>

              <div className="tasks-header">
                <span className="tasks-count">Tasks - 5</span>
                <div className="sort-button">⇅ Sort</div>
              </div>

              <div className="task-list">
                <div className="task-item">
                  <div className="task-checkbox"></div>
                  <span>Finish the essay collaboration</span>
                </div>
                <div className="task-item">
                  <div className="task-checkbox"></div>
                  <span>Do the math for next monday</span>
                </div>
                <div className="task-item">
                  <div className="task-checkbox"></div>
                  <span>Read the next chapter of the book</span>
                </div>
                <div className="task-item">
                  <div className="task-checkbox"></div>
                  <span>Send the collaboration files to Jemma</span>
                </div>
                <div className="task-item">
                  <div className="task-checkbox"></div>
                  <span>Finish the powerpoint presentation</span>
                </div>
                <div className="add-task-button">
                  <span className="add-icon">+</span>
                  <span>Add task</span>
                </div>
              </div>

              <div className="tasks-footer">Completed - 1</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Home;
