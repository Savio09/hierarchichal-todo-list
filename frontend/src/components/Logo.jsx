import React from "react";
import { Link } from "react-router-dom";

function Logo() {
  return (
    <div className="logo">
      <Link to="/">
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
        <h1>tsks.</h1>
      </Link>
    </div>
  );
}

export default Logo;
