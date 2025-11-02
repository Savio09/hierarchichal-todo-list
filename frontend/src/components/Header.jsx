import React from "react";
import { Link } from "react-router-dom";
import Logo from "./Logo";
function Header() {
  return (
    <header className="header">
      <Logo />
      <div className="cta">
        <Link to="/sign-up">Sign up</Link>
        <Link to="/login">Log in</Link>
      </div>
    </header>
  );
}

export default Header;
