import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import "../styles/AuthForm.css";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * AuthForm Component
 *
 * A dual-purpose authentication form that handles both user sign-in and sign-up.
 * The form dynamically adapts its fields and behavior based on the current route.
 *
 * Features:
 * - Conditional rendering (sign-up shows username & confirm password fields)
 * - Real-time error handling and validation
 * - Loading states during authentication
 * - Integration with AuthContext for global auth state management
 * - Automatic navigation to dashboard on successful authentication
 */
function AuthForm() {
  // Get current route location to determine if this is sign-up or sign-in
  const location = useLocation();

  // Hook to programmatically navigate after successful authentication
  const navigate = useNavigate();

  // Check if current path is sign-up (true) or sign-in (false)
  const isSignUp = location.pathname === "/sign-up";

  // Get login function from AuthContext to update global auth state
  const { login } = useAuth();

  // Form state: stores all input field values
  const [formData, setFormData] = useState({
    username: "", // Only used for sign-up
    email: "", // Required for both sign-up and sign-in
    password: "", // Required for both
    confirmPassword: "", // Only used for sign-up
  });

  // Error state: displays authentication or validation errors to user
  const [error, setError] = useState("");

  // Loading state: shows loading indicator and disables submit button during API calls
  const [loading, setLoading] = useState(false);

  /**
   * handleChange - Updates form data as user types in input fields
   *
   * @param {Event} e - The input change event
   *
   * This function:
   * 1. Updates the specific field that changed (using computed property name)
   * 2. Clears any existing error messages (gives user a fresh start)
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value, // Dynamic key based on input's name attribute
    });
    setError(""); // Clear error when user starts typing
  };

  /**
   * handleSubmit - Processes form submission and authenticates user
   *
   * @param {Event} e - The form submit event
   *
   * Flow:
   * 1. Prevent default form submission (no page reload)
   * 2. Set loading state and clear any previous errors
   * 3. Send POST request to appropriate endpoint (register or login)
   * 4. On success: save auth token, update global state, redirect to dashboard
   * 5. On failure: display error message to user
   * 6. Always reset loading state when done
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page reload on form submission
    setLoading(true); // Show loading indicator
    setError(""); // Clear any previous errors

    try {
      // Determine API endpoint based on whether this is sign-up or sign-in
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";

      // Make POST request to Flask backend
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Send form data as JSON
      });

      // Parse JSON response from server
      const data = await response.json();

      if (response.ok) {
        // SUCCESS: Save token to localStorage and update global auth state
        login(data?.access_token, data.user);

        // Redirect user to dashboard
        navigate("/dashboard");
      } else {
        // FAILURE: Display error message from server or generic message
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      // NETWORK ERROR: Could not reach server
      setError("Network error. Please try again.");
      console.error("Auth error:", err);
    } finally {
      // Always reset loading state (whether success or failure)
      setLoading(false);
    }
  };

  return (
    <section className="form-container">
      {/* LEFT SIDE: Branding and illustration */}
      <div className="form-left">
        <Logo />
        <div className="form-illustration"></div>
      </div>

      {/* RIGHT SIDE: Authentication form */}
      <div className="form-right">
        {/* Header: Toggle between sign-in and sign-up */}
        <div className="form-header">
          <span className="auth-prompt">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          {/* Link to switch between sign-in and sign-up pages */}
          <Link to={isSignUp ? "/login" : "/sign-up"} className="auth-link">
            {isSignUp ? "Sign in" : "Sign up"}
          </Link>
        </div>

        <div className="form-content">
          {/* Dynamic title based on current mode */}
          <h1 className="form-title">{isSignUp ? "Sign up" : "Sign in"}</h1>

          {/* Error message display (only shows if error exists) */}
          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="signin-form">
            {/* 
              USERNAME FIELD (Conditional)
              Only displayed during sign-up flow
              Includes user icon and validates as required
            */}
            {isSignUp && (
              <div className="form-group">
                <div className="input-wrapper">
                  {/* User icon SVG */}
                  <svg
                    className="input-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 10a5 5 0 100-10 5 5 0 000 10zm0 2.5c-3.33 0-10 1.67-10 5v2.5h20v-2.5c0-3.33-6.67-5-10-5z"
                      fill="#9CA3AF"
                    />
                  </svg>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* 
              EMAIL FIELD (Always visible)
              Required for both sign-in and sign-up
              Includes email icon and HTML5 email validation
            */}
            <div className="form-group">
              <div className="input-wrapper">
                {/* Email envelope icon SVG */}
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                    fill="#9CA3AF"
                  />
                  <path d="M20 6L10 13 0 6" stroke="white" strokeWidth="2" />
                </svg>
                <input
                  type="email"
                  name="email"
                  placeholder="tam@ui8.net"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 
              PASSWORD FIELD (Always visible)
              Required for both sign-in and sign-up
              Includes lock icon and masked input for security
            */}
            <div className="form-group">
              <div className="input-wrapper">
                {/* Lock icon SVG */}
                <svg
                  className="input-icon"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.5 8h-1V5.5a4.5 4.5 0 00-9 0V8h-1A1.5 1.5 0 003 9.5v9A1.5 1.5 0 004.5 20h11a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0015.5 8zm-6.75 7.5v1.75a.75.75 0 01-1.5 0V15.5a2 2 0 111.5 0zM12.5 8h-5V5.5a2.5 2.5 0 015 0V8z"
                    fill="#9CA3AF"
                  />
                </svg>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* 
              CONFIRM PASSWORD FIELD (Conditional)
              Only displayed during sign-up flow
              Used to verify user entered password correctly
              Backend should validate that password and confirmPassword match
            */}
            {isSignUp && (
              <div className="form-group">
                <div className="input-wrapper">
                  {/* Lock icon SVG (same as password field) */}
                  <svg
                    className="input-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15.5 8h-1V5.5a4.5 4.5 0 00-9 0V8h-1A1.5 1.5 0 003 9.5v9A1.5 1.5 0 004.5 20h11a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0015.5 8zm-6.75 7.5v1.75a.75.75 0 01-1.5 0V15.5a2 2 0 111.5 0zM12.5 8h-5V5.5a2.5 2.5 0 015 0V8z"
                      fill="#9CA3AF"
                    />
                  </svg>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm •••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* 
              SUBMIT BUTTON
              - Disabled during loading to prevent duplicate submissions
              - Shows "Loading..." during API call
              - Dynamic text: "Create Account" (sign-up) or "Continue" (sign-in)
            */}
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading
                ? "Loading..."
                : isSignUp
                ? "Create Account"
                : "Continue"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

// Export component as default for use in routing
export default AuthForm;
