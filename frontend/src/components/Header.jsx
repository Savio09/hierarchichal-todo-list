import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext.jsx";

/**
 * Header Component
 *
 * Navigation bar displayed at the top of the landing/home page.
 * Provides different call-to-action options based on user authentication status.
 *
 * Features:
 * - Always displays Logo component on the left
 * - Conditionally renders CTAs on the right based on auth state:
 *   - Authenticated users: See "Dashboard" button
 *   - Guests: See "Sign up" and "Log in" links
 * - Responsive design that adapts to screen size
 *
 * Used in: Home.jsx (landing page)
 */
function Header() {
  // Get authentication status from global AuthContext
  const { isAuthenticated } = useAuth();

  return (
    <header className="header">
      {/* Brand logo - always visible, links to home */}
      <Logo />

      {/* Call-to-action section - changes based on auth state */}
      <div className="cta">
        {
          // Conditional rendering: Different UI for authenticated vs guest users
          isAuthenticated() ? (
            // AUTHENTICATED: Show dashboard access button
            <Link to="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
          ) : (
            // GUEST: Show sign-up and login options
            <>
              <Link to="/sign-up">Sign up</Link>
              <Link to="/login">Log in</Link>
            </>
          )
        }
      </div>
    </header>
  );
}

// Export for use in landing page
export default Header;
