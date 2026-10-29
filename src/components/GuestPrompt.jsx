import React from "react";
import Contours from "./Contours.jsx";

export default function GuestPrompt({ message, onSignUp }) {
  return (
    <div className="guest-prompt">
      <Contours className="contours-bg" seed={4} />
      <div className="guest-card">
        <p>{message}</p>
        <button onClick={onSignUp} className="btn btn-primary">Sign up — no verification step</button>
      </div>
    </div>
  );
}
