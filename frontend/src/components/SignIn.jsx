import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import "../styles/AuthForm.css";
import { useAuth } from "../contexts/AuthContext.jsx";

function AuthForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const isSignUp = location.pathname === "/sign-up";
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const response = await fetch(`http://127.0.0.1:5000${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        login(data?.access_token, data.user);
        navigate("/dashboard");
      } else {
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Auth error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="form-container">
      <div className="form-left">
        <Logo />
        <div className="form-illustration"></div>
      </div>

      <div className="form-right">
        <div className="form-header">
          <span className="auth-prompt">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>
          <Link to={isSignUp ? "/login" : "/sign-up"} className="auth-link">
            {isSignUp ? "Sign in" : "Sign up"}
          </Link>
        </div>

        <div className="form-content">
          <h1 className="form-title">{isSignUp ? "Sign up" : "Sign in"}</h1>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="signin-form">
            {/* Username field - only show on sign up */}
            {isSignUp && (
              <div className="form-group">
                <div className="input-wrapper">
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

            {/* Email field */}
            <div className="form-group">
              <div className="input-wrapper">
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

            <div className="form-group">
              <div className="input-wrapper">
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

            {isSignUp && (
              <div className="form-group">
                <div className="input-wrapper">
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

export default AuthForm;
