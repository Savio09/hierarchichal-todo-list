import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../contexts/AuthContext.jsx";

function Header() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="header">
      <Logo />
      <div className="cta">
        {isAuthenticated() ? (
          <Link to="/dashboard" className="btn btn-primary">
            Dashboard
          </Link>
        ) : (
          <>
            <Link to="/sign-up">Sign up</Link>
            <Link to="/login">Log in</Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
