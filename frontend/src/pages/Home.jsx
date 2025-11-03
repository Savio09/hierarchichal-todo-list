import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import "../styles/Home.css";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Home Component (Landing Page)
 *
 * The main landing page that welcomes visitors to the tsks application.
 * Presents the value proposition and provides visual preview of the app's interface.
 *
 * Structure:
 * 1. Header - Navigation with auth-aware CTAs
 * 2. Hero Section - Main title, subtitle, and action buttons
 * 3. Preview Section - Visual mockup of the dashboard interface
 *
 * Features:
 * - Dynamic routing based on auth status (guests → login, users → dashboard)
 * - Decorative gradient orbs for visual appeal
 * - Interactive preview showing collections and tasks layout
 * - Responsive design for all screen sizes
 */
function Home() {
  // Check if user is already logged in
  const { isAuthenticated } = useAuth();

  // Determine where "Get Started" button should navigate
  // Authenticated users go to dashboard, guests go to login
  const url = isAuthenticated() ? "/dashboard" : "/login";

  return (
    <div className="landing-page">
      {/* Navigation header with logo and auth links */}
      <Header />

      <main className="mainContent">
        {/* HERO SECTION: Main value proposition and CTAs */}
        <section className="hero-section">
          <div className="hero-content">
            {/* Main headline with accent period */}
            <h1 className="hero-title">
              Tsks, just tasks<span className="accent-dot">.</span>
            </h1>

            {/* Subtitle explaining the app's purpose */}
            <p className="hero-subtitle">
              Keep track of the daily tasks in life and
              <br />
              get that satisfaction upon completion.
            </p>

            {/* Call-to-action buttons */}
            <div className="hero-buttons">
              {/* Primary CTA - changes text based on auth status */}
              <Link to={url} className="btn btn-primary">
                {isAuthenticated() ? "Go to Dashboard" : "Get Started"}
              </Link>
              {/* Secondary CTA - scrolls to features section */}
              <Link to="#features" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          </div>

          {/* Decorative elements - gradient orbs for visual interest */}
          <div className="gradient-orb orb-left"></div>
          <div className="gradient-orb orb-right"></div>
        </section>

        {/* PREVIEW SECTION: Visual mockup of the dashboard interface */}
        {/* Shows potential users what the app looks like before signing up */}
        <section className="preview-section">
          <div className="preview-container">
            {/* LEFT SIDEBAR PREVIEW: Shows collections/lists */}
            <div className="sidebar-preview">
              <div className="sidebar-header">
                <div className="sidebar-menu-icon">☰</div>
                <div className="sidebar-title">Dashboard</div>
              </div>

              <div className="collections-section">
                <div className="collections-header">Collections</div>

                {/* Sample collection items with colored icons and task counts */}
                {/* "active" class highlights the currently selected collection */}
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

            {/* MAIN CONTENT PREVIEW: Shows task list interface */}
            <div className="main-preview">
              {/* Preview header with back navigation and menu */}
              <div className="preview-header">
                <div className="preview-back">← School</div>
                <div className="preview-menu">•••</div>
              </div>

              {/* Tasks section header with count and sort option */}
              <div className="tasks-header">
                <span className="tasks-count">Tasks - 5</span>
                <div className="sort-button">⇅ Sort</div>
              </div>

              {/* Sample task list - shows 5 example tasks */}
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

                {/* Add task button preview */}
                <div className="add-task-button">
                  <span className="add-icon">+</span>
                  <span>Add task</span>
                </div>
              </div>

              {/* Footer showing completed tasks count */}
              <div className="tasks-footer">Completed - 1</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// Export for use in App routing
export default Home;
