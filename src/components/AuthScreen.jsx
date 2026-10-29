import React, { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { Field } from "./ui.jsx";
import Contours from "./Contours.jsx";

export default function AuthScreen({ onAuthed, onCancel }) {
  const [mode, setMode] = useState("signup"); // "signup" | "login"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || password.length < 6) {
      setError("Enter an email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const fn = mode === "signup" ? "signup_user" : "login_user";
      const { data, error: rpcError } = await supabase.rpc(fn, { p_email: email.trim(), p_password: password });
      if (rpcError) {
        const msg = rpcError.message || "";
        if (msg.includes("EMAIL_TAKEN")) setError("That email is already registered — try logging in instead.");
        else if (msg.includes("RATE_LIMITED")) setError("Too many signups right now — please try again in a few minutes.");
        else if (msg.includes("INVALID_CREDENTIALS")) setError("Wrong email or password.");
        else if (msg.includes("INVALID_INPUT")) setError("Enter an email and a password of at least 6 characters.");
        else setError("Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      onAuthed(data);
    } catch (err) {
      setError("Something went wrong. Try again.");
      setBusy(false);
    }
  };

  return (
    <div className="stage-screen">
      <Contours className="contours-bg" seed={2} rings={12} />
      <div className="auth-wrap">
        <div className="auth-pitch">
          <div className="brand-mark big"><span className="brand-dot" aria-hidden="true" />TravelSleek</div>
          <h2>Scholarships and work visas, with the deadlines in order.</h2>
          <p>Every opportunity scored against your profile, so you spend the week on the ones you can actually win.</p>
        </div>
        <form onSubmit={submit} className="paper auth-card">
          {onCancel && (
            <button type="button" onClick={onCancel} aria-label="Back to browsing" className="btn btn-quiet back">
              <ChevronLeft size={15} /> Back to browsing
            </button>
          )}
          <h2>{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <p className="lede">
            {mode === "signup" ? "Just an email and password — no verification step, straight in." : "Log back in to your saved profile and board."}
          </p>
          <div className="stack">
            <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" type="email" />
            <Field label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" type="password" />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={busy} className="btn btn-primary block">
            {busy ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
          </button>
          <button type="button" className="btn btn-quiet block"
            onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}>
            {mode === "signup" ? "Already have an account? Log in" : "New here? Sign up"}
          </button>
          <p className="fineprint">
            TravelSleek is an independent aggregator, not an immigration lawyer or university. Always verify details on the official page before applying.
          </p>
        </form>
      </div>
    </div>
  );
}
