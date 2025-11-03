import React from "react";
import { Link } from "react-router-dom";

/**
 * Logo Component
 *
 * A simple, reusable branding component that displays the application logo
 * and name. Used throughout the app (landing page, auth forms, dashboard).
 *
 * Features:
 * - SVG hexagon icon in brand blue (#0066FF)
 * - "tsks." text branding
 * - Clickable link that navigates to home page
 * - Consistent styling across all pages
 */
function Logo() {
  return (
    <div className="logo">
      {/* Link wraps entire logo for home navigation */}
      <Link to="/">
        {/* Hexagon SVG icon - brand identity shape */}
        <svg
          width="40"
          height="40"
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
        </svg>{" "}
        {/* Brand name with period as signature styling */}
        <h1>tsks.</h1>
      </Link>
    </div>
  );
}

// Export for use in Header, auth pages, and dashboard
export default Logo;
