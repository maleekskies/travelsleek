import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Check, X, ChevronRight, ChevronLeft, Archive, Bookmark,
  FileText, Clock, MapPin, GraduationCap, Briefcase, Settings as SettingsIcon,
  Inbox as InboxIcon, Layers, ArrowUpDown, Download, RefreshCw, Trash2, Send,
  Upload, Loader2, Menu, ExternalLink
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tsgbrupkcejntodznspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ2JydXBrY2VqbnRvZHpuc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTc1OTQsImV4cCI6MjEwNDMzMzU5NH0.6QyuO7-4cCy97Yly8sPUTE7omOyBtfu0oFUhoGxJgK0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Maps a Supabase row (snake_case) to the shape the UI components expect.
function rowToOpportunity(row) {
  return {
    id: row.id,
    externalId: row.external_id,
    type: row.type,
    org: row.org,
    title: row.title,
    country: row.country,
    degree: row.degree,
    field: row.field,
    deadline: row.deadline,
    score: row.score,
    reason: row.reason,
    fit: row.fit || [],
    gap: row.gap || [],
    eligibility: row.eligibility,
    eligCriteria: row.elig_criteria || [],
    docs: row.docs || [],
    nextAction: row.next_action,
    nextDate: row.next_date,
    stage: row.stage,
    source: row.source,
    sourceUrl: row.source_url,
  };
}

// ---------------------------------------------------------------------------
// Theme — Deep Forest: saturated forest-green page background, ivory panels
// floating on top for readability, warm coral/amber accents.
// ---------------------------------------------------------------------------

const THEME = {
  bg: "#12261F", darkBorder: "#24392F",
  panel: "#FBF8F0", panelBorder: "#DCD5BF", rowDivider: "#E7E1CC",
  ink: "#1F231D", sub: "#5E5A4B", faint: "#8E8975",
  good: "#3E6E4E", goodBg: "#E3EEDF",
  warn: "#C07A2E", warnBg: "#F6E5CC",
  bad: "#B5503A", badBg: "#F4DCD1",
  heading: "#F2EEDF", subHeading: "#A9C2AE",
};

// ---------------------------------------------------------------------------
// Sample data — stands in for the scan/scrape layer (DAAD, Chevening, Fulbright,
// Erasmus Mundus, UK Skilled Worker route, Canada Express Entry, Australia
// Skilled visas, Germany Job Seeker visa, etc.)
// ---------------------------------------------------------------------------

const SOURCES = {
  scholarship: ["DAAD", "Chevening", "Fulbright", "Erasmus Mundus", "Commonwealth", "Gates Cambridge"],
  visa: ["UK Skilled Worker", "Canada Express Entry", "Australia Skilled 189/190", "Germany Job Seeker", "Ireland Critical Skills"],
};

const seedOpportunities = [
  {
    id: "o1", type: "scholarship", org: "DAAD", title: "EPOS Master's Scholarship — Development Studies",
    country: "Germany", degree: "Master's", field: "Development Economics",
    deadline: "2026-10-15", score: 88,
    reason: "Strong field match and you meet every stated eligibility line.",
    fit: ["Field match", "Under age cap", "IELTS meets minimum"],
    gap: ["No prior study-abroad experience listed"],
    eligibility: "eligible",
    eligCriteria: [
      { label: "Bachelor's degree completed", pass: true },
      { label: "Nationality: developing country per DAAD list", pass: true },
      { label: "2 years relevant work experience", pass: true },
      { label: "English proficiency (IELTS 6.5+)", pass: true },
    ],
    docs: [
      { name: "Statement of Purpose", status: "drafting" },
      { name: "Recommendation Letter 1", status: "not started" },
      { name: "Recommendation Letter 2", status: "not started" },
      { name: "Transcripts (certified)", status: "ready" },
      { name: "CV (Europass format)", status: "ready" },
    ],
    nextAction: "Request recommendation letters", nextDate: "2026-09-20",
    stage: "saved",
  },
  {
    id: "o2", type: "visa", org: "UK Skilled Worker", title: "Skilled Worker visa — Data & AI occupation code",
    country: "United Kingdom", degree: "N/A", field: "Software / Data",
    deadline: "2026-12-01", score: 74,
    reason: "Route is open to your occupation, but you don't yet have a sponsor.",
    fit: ["Occupation on eligible list", "Salary threshold met if offer lands"],
    gap: ["No certificate of sponsorship yet"],
    eligibility: "review",
    eligCriteria: [
      { label: "Job offer from licensed sponsor", pass: false },
      { label: "Occupation on eligible list", pass: true },
      { label: "Salary at or above going rate", pass: true },
      { label: "English requirement", pass: true },
    ],
    docs: [
      { name: "Certificate of Sponsorship", status: "not started" },
      { name: "Financial evidence", status: "ready" },
      { name: "TB test certificate", status: "not started" },
      { name: "Passport", status: "ready" },
    ],
    nextAction: "Shortlist licensed sponsors in target occupation", nextDate: "2026-09-25",
    stage: "saved",
  },
  {
    id: "o3", type: "scholarship", org: "Chevening", title: "Chevening Scholarship — Public Policy",
    country: "United Kingdom", degree: "Master's", field: "Public Policy",
    deadline: "2026-11-05", score: 65,
    reason: "Good field fit, but your work experience is a year short of the usual bar.",
    fit: ["Field match", "Leadership examples in profile"],
    gap: ["2 years work experience vs. your 1"],
    eligibility: "review",
    eligCriteria: [
      { label: "Min. 2 years work experience", pass: false },
      { label: "Bachelor's degree completed", pass: true },
      { label: "Return to home country for 2 years post-study", pass: true },
      { label: "No dual UK/home citizenship", pass: true },
    ],
    docs: [
      { name: "Personal statement (4 essays)", status: "drafting" },
      { name: "Reference 1", status: "not started" },
      { name: "Reference 2", status: "not started" },
    ],
    nextAction: "Draft leadership essay", nextDate: "2026-09-18",
    stage: "preparing",
  },
  {
    id: "o4", type: "visa", org: "Canada Express Entry", title: "Federal Skilled Worker Program",
    country: "Canada", degree: "N/A", field: "Software / Data",
    deadline: "Rolling — draw-based", score: 81,
    reason: "CRS estimate lands above recent draw cutoffs for your profile.",
    fit: ["Age band", "Education points maxed", "French as second language possible"],
    gap: ["ECA not yet completed"],
    eligibility: "eligible",
    eligCriteria: [
      { label: "CRS score above recent draws", pass: true },
      { label: "Educational Credential Assessment", pass: false },
      { label: "Language test (IELTS/CELPIP)", pass: true },
      { label: "Proof of funds", pass: true },
    ],
    docs: [
      { name: "ECA report", status: "not started" },
      { name: "Language test results", status: "ready" },
      { name: "Proof of funds statement", status: "ready" },
    ],
    nextAction: "Book ECA with WES", nextDate: "2026-09-22",
    stage: "preparing",
  },
  {
    id: "o5", type: "scholarship", org: "Erasmus Mundus", title: "Joint Master's — Data Science for Sustainability",
    country: "Multiple (EU)", degree: "Master's", field: "Data Science",
    deadline: "2027-01-10", score: 91,
    reason: "Near-perfect field and profile match, deadline is comfortably far out.",
    fit: ["Field match", "STEM background", "Mobility across 3 countries fine with you"],
    gap: [],
    eligibility: "eligible",
    eligCriteria: [
      { label: "Bachelor's in related field", pass: true },
      { label: "English proficiency", pass: true },
      { label: "No more than one prior EM scholarship", pass: true },
    ],
    docs: [
      { name: "Motivation letter", status: "ready" },
      { name: "Recommendation Letter", status: "ready" },
      { name: "Transcripts", status: "ready" },
    ],
    nextAction: "Submit application", nextDate: "2026-09-10",
    stage: "submitted",
  },
  {
    id: "o6", type: "visa", org: "Australia Skilled 189/190", title: "Skilled Independent visa (subclass 189)",
    country: "Australia", degree: "N/A", field: "Software / Data",
    deadline: "Rolling — invitation-based", score: 52,
    reason: "Points estimate is below recent invitation rounds for your occupation.",
    fit: ["Occupation on MLTSSL"],
    gap: ["Points estimate ~15 below last invitation round", "No state nomination yet"],
    eligibility: "not eligible",
    eligCriteria: [
      { label: "Points test ≥ 65", pass: true },
      { label: "Competitive score vs. recent rounds", pass: false },
      { label: "Skills assessment completed", pass: false },
    ],
    docs: [
      { name: "Skills assessment", status: "not started" },
    ],
    nextAction: "Consider state nomination (190) to add points", nextDate: "2026-10-01",
    stage: "saved",
  },
  {
    id: "o7", type: "scholarship", org: "Fulbright", title: "Fulbright Foreign Student Program",
    country: "United States", degree: "Master's / PhD", field: "Public Health",
    deadline: "2026-09-30", score: 79,
    reason: "Strong fit, but the deadline is very close for the document list still open.",
    fit: ["Field match", "Community leadership emphasis matches profile"],
    gap: ["No standardized test score on file yet"],
    eligibility: "review",
    eligCriteria: [
      { label: "Bachelor's degree completed", pass: true },
      { label: "2 years relevant experience or plans", pass: true },
      { label: "TOEFL/IELTS on file", pass: false },
    ],
    docs: [
      { name: "Statement of Grant Purpose", status: "drafting" },
      { name: "Personal Statement", status: "not started" },
      { name: "TOEFL score report", status: "not started" },
    ],
    nextAction: "Book TOEFL test slot", nextDate: "2026-09-12",
    stage: "saved",
  },
  {
    id: "o8", type: "visa", org: "Germany Job Seeker", title: "Job Seeker Visa — IT occupations",
    country: "Germany", degree: "N/A", field: "Software / Data",
    deadline: "Rolling", score: 84,
    reason: "You clear every stated requirement for the job-seeker route.",
    fit: ["Recognized degree", "Sufficient funds", "German A2 not required for IT shortage list"],
    gap: [],
    eligibility: "eligible",
    eligCriteria: [
      { label: "Recognized university degree", pass: true },
      { label: "Proof of funds for 6 months", pass: true },
      { label: "Health insurance for stay", pass: true },
    ],
    docs: [
      { name: "Degree recognition (anabin check)", status: "ready" },
      { name: "Blocked account / proof of funds", status: "ready" },
      { name: "Health insurance", status: "not started" },
    ],
    nextAction: "Arrange travel health insurance", nextDate: "2026-09-14",
    stage: "interview",
  },
];

const daysUntil = (dateStr) => {
  if (!dateStr || dateStr.toLowerCase().includes("rolling")) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date("2026-09-06")) / 86400000);
  return diff;
};

const eligStamp = {
  eligible: { label: "ELIGIBLE", color: THEME.good, bg: THEME.goodBg },
  review: { label: "REVIEW", color: THEME.warn, bg: THEME.warnBg },
  "not eligible": { label: "NOT ELIGIBLE", color: THEME.bad, bg: THEME.badBg },
};

const docStatusColor = {
  "not started": THEME.faint,
  drafting: THEME.warn,
  ready: THEME.good,
};

const STAGES = [
  { id: "saved", label: "Saved" },
  { id: "preparing", label: "Preparing" },
  { id: "submitted", label: "Submitted" },
  { id: "interview", label: "Interview / Decision" },
];

// ---------------------------------------------------------------------------

function ScoreBadge({ score, size = 44 }) {
  const color = score >= 80 ? THEME.good : score >= 60 ? THEME.warn : THEME.bad;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        border: `2px solid ${color}`, color,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Source Serif 4', serif", fontWeight: 600,
        fontSize: size * 0.36, flexShrink: 0, background: THEME.panel,
      }}
    >
      {score}
    </div>
  );
}

function EligStamp({ status, small }) {
  const s = eligStamp[status];
  return (
    <span
      style={{
        color: s.color, background: s.bg, border: `1px solid ${s.color}55`,
        padding: small ? "1px 6px" : "3px 10px", borderRadius: 3,
        fontSize: small ? 10 : 11, fontWeight: 700, letterSpacing: "0.03em",
        display: "inline-block", transform: "rotate(-1.2deg)", whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const isScholarship = type === "scholarship";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: 11, color: isScholarship ? "#2E6E63" : "#8B4A3D",
      fontWeight: 600,
    }}>
      {isScholarship ? <GraduationCap size={13} /> : <Briefcase size={13} />}
      {isScholarship ? "Scholarship" : "Work visa"}
    </span>
  );
}

function DeadlinePill({ deadline, onDark }) {
  const d = daysUntil(deadline);
  if (d === null) return <span style={{ fontSize: 12, color: onDark ? THEME.subHeading : THEME.sub }}>Rolling</span>;
  const urgent = d <= 21;
  return (
    <span style={{
      fontSize: 12, fontWeight: urgent ? 700 : 500,
      color: urgent ? THEME.bad : (onDark ? THEME.subHeading : THEME.ink),
      display: "inline-flex", alignItems: "center", gap: 4,
    }}>
      <Clock size={12} /> {d} {d === 1 ? "day" : "days"} left
    </span>
  );
}

// ---------------------------------------------------------------------------

function AuthScreen({ onAuthed }) {
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
    <div style={{
      minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: THEME.bg, padding: 24,
    }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 400, background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "40px 36px" }}>
        <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, margin: "0 0 6px", color: THEME.ink }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </h2>
        <p style={{ fontSize: 13, color: THEME.sub, margin: "0 0 22px", lineHeight: 1.5 }}>
          {mode === "signup" ? "Just an email and password — no verification step, straight in." : "Log back in to your saved profile and board."}
        </p>

        <div style={{ display: "grid", gap: 14, marginBottom: 18 }}>
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <div>
            <label style={labelStyle}>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" style={inputStyle} />
          </div>
        </div>

        {error && <p style={{ fontSize: 12.5, color: THEME.bad, marginTop: 0, marginBottom: 14 }}>{error}</p>}

        <button type="submit" disabled={busy} style={{ ...primaryBtn, width: "100%", justifyContent: "center", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); }}
          style={{ ...ghostBtn, width: "100%", justifyContent: "center", marginTop: 12 }}
        >
          {mode === "signup" ? "Already have an account? Log in" : "New here? Sign up"}
        </button>
      </form>
    </div>
  );
}

function mapDbProfile(json) {
  return {
    name: json?.name || "",
    nationality: json?.nationality || "",
    degreeLevel: json?.degree_level || "Master's",
    fields: json?.fields || [],
    countries: json?.countries || [],
    mustHaves: json?.must_haves || [],
    dealBreakers: json?.deal_breakers || [],
    cv: json?.cv || "",
  };
}

// ---------------------------------------------------------------------------

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "", fields: [], nationality: "", degreeLevel: "Master's",
    countries: [], mustHaves: [], dealBreakers: [], cv: "",
  });
  const steps = ["Profile", "Targets", "Filters", "Master CV"];

  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  return (
    <div style={{
      minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: THEME.bg, padding: 24,
    }}>
      <div style={{ width: "100%", maxWidth: 560, background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "40px 40px 32px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1 }}>
              <div style={{ height: 2, background: i <= step ? THEME.ink : THEME.panelBorder, marginBottom: 6 }} />
              <div style={{ fontSize: 11, color: i === step ? THEME.ink : THEME.faint, fontWeight: i === step ? 700 : 400 }}>{s}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 24, margin: "0 0 6px", color: THEME.ink }}>
          {step === 0 && "Who's applying?"}
          {step === 1 && "Where are you headed?"}
          {step === 2 && "Must-haves and deal-breakers"}
          {step === 3 && "Your master CV"}
        </h2>
        <p style={{ fontSize: 13, color: THEME.sub, margin: "0 0 24px", lineHeight: 1.5 }}>
          {step === 0 && "This grounds every eligibility check — nothing is invented beyond what you enter here."}
          {step === 1 && "Countries, degree level, and field shape which scholarships and visa routes get scanned."}
          {step === 2 && "Used to downrank or exclude opportunities automatically."}
          {step === 3 && "Paste it in. Kits and checklists are only ever built from facts found here."}
        </p>

        {step === 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Full name" value={profile.name} onChange={(v) => update("name", v)} />
            <TagInput label="Field of study / occupation" values={profile.fields} onChange={(v) => update("fields", v)} placeholder="Type one, press Enter — add as many as you're open to" />
            <Field label="Nationality" value={profile.nationality} onChange={(v) => update("nationality", v)} />
          </div>
        )}
        {step === 1 && (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label style={labelStyle}>Degree level (for scholarships)</label>
              <select value={profile.degreeLevel} onChange={(e) => update("degreeLevel", e.target.value)} style={inputStyle}>
                <option>Bachelor's</option><option>Master's</option><option>PhD</option><option>N/A — visa route only</option>
              </select>
            </div>
            <TagInput label="Target countries" values={profile.countries} onChange={(v) => update("countries", v)} placeholder="Type one, press Enter — leave empty for anywhere" hint="Press Enter to add. Leave blank to see opportunities from any country." />
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "grid", gap: 14 }}>
            <TagInput label="Must-haves" values={profile.mustHaves} onChange={(v) => update("mustHaves", v)} placeholder="e.g. fully funded only — press Enter" />
            <TagInput label="Deal-breakers" values={profile.dealBreakers} onChange={(v) => update("dealBreakers", v)} placeholder="e.g. requires spousal sponsorship — press Enter" />
          </div>
        )}
        {step === 3 && (
          <Field label="Paste your CV / background" value={profile.cv} onChange={(v) => update("cv", v)} area tall placeholder="Education, work history, publications, test scores…" />
        )}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
            style={{ ...ghostBtn, opacity: step === 0 ? 0.35 : 1 }}>
            <ChevronLeft size={15} /> Back
          </button>
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} style={primaryBtn}>Continue <ChevronRight size={15} /></button>
          ) : (
            <button onClick={() => onComplete(profile)} style={primaryBtn}>Enter Inbox <ChevronRight size={15} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 12, color: THEME.sub, fontWeight: 600, display: "block", marginBottom: 5 };
const inputStyle = {
  width: "100%", border: `1px solid ${THEME.panelBorder}`, padding: "9px 11px", fontSize: 14,
  fontFamily: "Inter, sans-serif", color: THEME.ink, background: "#F5F1E4",
};
const ghostBtn = {
  border: "none", background: "none", color: THEME.sub, fontSize: 13, fontWeight: 600,
  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "8px 4px",
};
const lightGhostBtn = {
  border: "none", background: "none", color: THEME.subHeading, fontSize: 13, fontWeight: 600,
  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "8px 4px",
};
const primaryBtn = {
  border: "none", background: THEME.ink, color: THEME.heading, fontSize: 13, fontWeight: 600,
  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "10px 18px",
};
const secondaryBtn = {
  border: `1px solid ${THEME.ink}`, background: "none", color: THEME.ink, fontSize: 13, fontWeight: 600,
  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "9px 16px",
};
const lightSecondaryBtn = {
  border: `1px solid ${THEME.subHeading}`, background: "none", color: THEME.heading, fontSize: 13, fontWeight: 600,
  display: "inline-flex", alignItems: "center", gap: 4, cursor: "pointer", padding: "9px 16px",
};

function Field({ label, value, onChange, placeholder, area, tall }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          rows={tall ? 8 : 3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function TagInput({ label, hint, values, onChange, placeholder }) {
  const [text, setText] = useState("");

  const addTag = () => {
    const v = text.trim();
    if (!v) return;
    if (!values.includes(v)) onChange([...values, v]);
    setText("");
  };
  const removeTag = (t) => onChange(values.filter((x) => x !== t));
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Backspace" && text === "" && values.length > 0) {
      removeTag(values[values.length - 1]);
    }
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div
        onClick={(e) => e.currentTarget.querySelector("input")?.focus()}
        style={{
          ...inputStyle, display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center",
          minHeight: 42, cursor: "text",
        }}
      >
        {values.map((v) => (
          <span key={v} style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: THEME.panelBorder + "55", border: `1px solid ${THEME.panelBorder}`,
            borderRadius: 3, padding: "2px 6px 2px 9px", fontSize: 12.5, color: THEME.ink,
          }}>
            {v}
            <X size={12} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); removeTag(v); }} />
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={values.length === 0 ? placeholder : ""}
          style={{ border: "none", outline: "none", background: "transparent", flex: 1, minWidth: 100, fontSize: 14, color: THEME.ink, fontFamily: "Inter, sans-serif" }}
        />
      </div>
      <p style={{ fontSize: 11, color: THEME.faint, marginTop: 4, marginBottom: 0 }}>{hint || "Press Enter to add — as many as you like."}</p>
    </div>
  );
}

function Sidebar({ view, setView, profile, mobileOpen, onClose }) {
  const items = [
    { id: "inbox", label: "Inbox", icon: InboxIcon },
    { id: "pipeline", label: "Pipeline", icon: Layers },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];
  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onClose} />}
      <div className={`app-sidebar${mobileOpen ? " open" : ""}`} style={{
        width: 200, borderRight: `1px solid ${THEME.darkBorder}`, background: THEME.bg,
        display: "flex", flexDirection: "column", padding: "24px 0", flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px 24px", fontFamily: "'Source Serif 4', serif", fontSize: 20, color: THEME.heading, borderBottom: `1px solid ${THEME.darkBorder}`, marginBottom: 8, paddingBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            TravelSleek
            <div style={{ fontSize: 11, color: THEME.subHeading, fontFamily: "Inter, sans-serif", fontWeight: 400, marginTop: 2 }}>
              {profile?.name || "your"} · case file
            </div>
          </div>
          <button onClick={onClose} className="mobile-menu-btn" style={{ border: "none", background: "none", color: THEME.subHeading, cursor: "pointer", padding: 2 }}>
            <X size={18} />
          </button>
        </div>
        {items.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setView(id); onClose?.(); }} style={{
            border: "none", background: view === id ? THEME.panel : "none",
            borderLeft: view === id ? `2px solid ${THEME.ink}` : "2px solid transparent",
            color: view === id ? THEME.ink : THEME.subHeading, fontSize: 13, fontWeight: view === id ? 700 : 500,
            display: "flex", alignItems: "center", gap: 9, padding: "10px 18px",
            cursor: "pointer", textAlign: "left",
          }}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function Inbox({ opportunities, onOpen, onBulk, onSync, syncing }) {
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("score");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);

  const filtered = useMemo(() => {
    let list = opportunities.filter((o) => tab === "all" || o.type === tab);
    if (query) list = list.filter((o) => (o.title + o.org + o.country).toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => sort === "score" ? b.score - a.score : (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999));
    return list;
  }, [opportunities, tab, query, sort]);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <div style={{ padding: "28px 36px", flex: 1, overflow: "auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, margin: 0, color: THEME.heading }}>Inbox</h1>
        <button onClick={onSync} disabled={syncing} style={{ ...lightGhostBtn, opacity: syncing ? 0.6 : 1 }}>
          {syncing ? <Loader2 size={13} /> : <RefreshCw size={13} />} {syncing ? "Syncing..." : "Sync now"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: THEME.subHeading, marginBottom: 4 }}>Live sources: GOV.UK, IRCC Open Data · Curated: {SOURCES.scholarship.join(" · ")}</div>
      <p style={{ fontSize: 13, color: THEME.subHeading, marginTop: 6, marginBottom: 20 }}>Untouched listings auto-archive after 30 days. Nothing here submits itself.</p>

      <div style={{ display: "flex", gap: 18, borderBottom: `1px solid ${THEME.darkBorder}`, marginBottom: 18 }}>
        {[["all", "All"], ["scholarship", "Scholarships"], ["visa", "Work visas"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            border: "none", background: "none", padding: "0 0 10px", cursor: "pointer",
            fontSize: 13, fontWeight: tab === id ? 700 : 500, color: tab === id ? THEME.heading : THEME.subHeading,
            borderBottom: tab === id ? `2px solid ${THEME.heading}` : "2px solid transparent", marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: THEME.faint }} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search opportunities"
            style={{ ...inputStyle, paddingLeft: 30 }} />
        </div>
        <button onClick={() => setSort(sort === "score" ? "deadline" : "score")} style={lightGhostBtn}>
          <ArrowUpDown size={13} /> Sort: {sort === "score" ? "Score" : "Deadline"}
        </button>
        {selected.length > 0 && (
          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <span style={{ fontSize: 12, color: THEME.subHeading, alignSelf: "center", marginRight: 4 }}>{selected.length} selected</span>
            <button onClick={() => { onBulk(selected, "saved"); setSelected([]); }} style={lightSecondaryBtn}><Bookmark size={13} /> Save</button>
            <button onClick={() => { onBulk(selected, "archived"); setSelected([]); }} style={lightSecondaryBtn}><Archive size={13} /> Archive</button>
          </div>
        )}
      </div>

      <div style={{ border: `1px solid ${THEME.panelBorder}`, background: THEME.panel }}>
        {filtered.map((o) => (
          <div key={o.id} onClick={() => onOpen(o.id)} style={{
            display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
            borderBottom: `1px solid ${THEME.rowDivider}`, cursor: "pointer",
          }}>
            <input type="checkbox" checked={selected.includes(o.id)} onClick={(e) => e.stopPropagation()}
              onChange={() => toggle(o.id)} style={{ width: 15, height: 15 }} />
            <ScoreBadge score={o.score} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3, flexWrap: "wrap" }}>
                <TypeBadge type={o.type} />
                <EligStamp status={o.eligibility} small />
                <span style={{ fontSize: 11, color: THEME.faint }}>{o.org} · {o.country}</span>
              </div>
              <div style={{ fontFamily: "'Source Serif 4', serif", fontSize: 15.5, color: THEME.ink, marginBottom: 3 }}>{o.title}</div>
              <div style={{ fontSize: 12.5, color: THEME.sub, marginBottom: 6 }}>{o.reason}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {o.fit.map((f) => <Tag key={f} text={f} good />)}
                {o.gap.map((f) => <Tag key={f} text={f} />)}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, width: 100 }}>
              <DeadlinePill deadline={o.deadline} />
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 30, textAlign: "center", color: THEME.faint, fontSize: 13 }}>Nothing matches. Try a different search or tab.</div>}
      </div>
    </div>
  );
}

function Tag({ text, good }) {
  return (
    <span style={{
      fontSize: 10.5, padding: "2px 7px", borderRadius: 2,
      background: good ? THEME.goodBg : THEME.badBg, color: good ? THEME.good : THEME.bad,
      border: `1px solid ${good ? THEME.good + "22" : THEME.bad + "22"}`,
    }}>{text}</span>
  );
}

// ---------------------------------------------------------------------------

function Detail({ opp, onBack, onStageChange, onDocStatus }) {
  if (!opp) return null;
  return (
    <div className="detail-page" style={{ padding: "28px 36px", flex: 1, overflow: "auto", maxWidth: 760 }}>
      <button onClick={onBack} style={lightGhostBtn}><ChevronLeft size={15} /> Back to inbox</button>

      <div style={{ background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "20px 22px", marginTop: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
          <TypeBadge type={opp.type} />
          <EligStamp status={opp.eligibility} />
          <span style={{ fontSize: 12, color: THEME.faint }}>{opp.org} · {opp.country}</span>
        </div>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 25, margin: "0 0 10px", color: THEME.ink }}>{opp.title}</h1>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 16 }}>
          <DeadlinePill deadline={opp.deadline} />
          <span style={{ fontSize: 12, color: THEME.sub }}>{opp.field}{opp.degree !== "N/A" ? ` · ${opp.degree}` : ""}</span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {opp.sourceUrl ? (
            <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ ...primaryBtn, textDecoration: "none" }}>
              Open official apply page <ExternalLink size={14} />
            </a>
          ) : (
            <span style={{ fontSize: 12, color: THEME.faint, fontStyle: "italic", alignSelf: "center" }}>No official link on file for this entry yet.</span>
          )}
        </div>
      </div>

      <Section title="Score breakdown">
        <div style={{ display: "flex", gap: 22, alignItems: "center", marginBottom: 14 }}>
          <ScoreBadge score={opp.score} size={56} />
          <p style={{ fontSize: 13.5, color: THEME.sub, margin: 0, lineHeight: 1.5 }}>{opp.reason}</p>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {opp.fit.map((f) => <Tag key={f} text={f} good />)}
          {opp.gap.map((f) => <Tag key={f} text={f} />)}
        </div>
      </Section>

      <Section title="Eligibility check">
        {opp.eligCriteria.map((c) => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: `1px solid ${THEME.rowDivider}`, fontSize: 13.5 }}>
            {c.pass ? <Check size={15} color={THEME.good} /> : <X size={15} color={THEME.bad} />}
            <span style={{ color: c.pass ? THEME.ink : THEME.bad }}>{c.label}</span>
          </div>
        ))}
      </Section>

      <Section title="Documents">
        {opp.docs.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: `1px solid ${THEME.rowDivider}`, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, color: THEME.ink, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <FileText size={14} color={THEME.faint} style={{ flexShrink: 0 }} /> {d.name}
            </span>
            <select value={d.status} onChange={(e) => onDocStatus(opp.id, d.name, e.target.value)}
              style={{ fontSize: 12, border: `1px solid ${THEME.panelBorder}`, padding: "4px 8px", color: docStatusColor[d.status], fontWeight: 600 }}>
              <option value="not started">Not started</option>
              <option value="drafting">Drafting</option>
              <option value="ready">Ready</option>
            </select>
          </div>
        ))}
        <p style={{ fontSize: 11.5, color: THEME.faint, marginTop: 10 }}>
          Drafts are built only from facts in your master CV — nothing here is invented. Recommendation letters always require the actual recommender.
        </p>
      </Section>

      <Section title="Next action">
        <div style={{ fontSize: 13.5, color: THEME.ink }}>{opp.nextAction}</div>
        <div style={{ fontSize: 12, color: THEME.sub, marginTop: 3 }}>by {opp.nextDate}</div>
      </Section>

      <div style={{ background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "16px 18px", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={primaryBtn} onClick={() => onStageChange(opp.id, "preparing")}><Bookmark size={14} /> Save to pipeline</button>
        <button style={secondaryBtn} onClick={() => onStageChange(opp.id, "submitted")}><Send size={14} /> Mark submitted</button>
        <button style={{ ...ghostBtn, color: THEME.bad }} onClick={() => onStageChange(opp.id, "rejected")}><X size={14} /> Reject with reason</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16, background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "18px 20px" }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: "0.02em", color: THEME.sub, marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Pipeline({ opportunities, onOpen }) {
  return (
    <div style={{ padding: "28px 36px", flex: 1, overflow: "auto" }}>
      <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, margin: "0 0 20px", color: THEME.heading }}>Pipeline</h1>
      <div style={{ display: "flex", gap: 16 }}>
        {STAGES.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage.id);
          return (
            <div key={stage.id} style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: THEME.subHeading, marginBottom: 10, display: "flex", justifyContent: "space-between" }}>
                {stage.label} <span style={{ color: THEME.subHeading, fontWeight: 400, opacity: 0.7 }}>{items.length}</span>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {items.map((o) => (
                  <div key={o.id} onClick={() => onOpen(o.id)} style={{
                    background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "12px 13px", cursor: "pointer",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <TypeBadge type={o.type} />
                      <ScoreBadge score={o.score} size={26} />
                    </div>
                    <div style={{ fontSize: 13, fontFamily: "'Source Serif 4', serif", color: THEME.ink, marginBottom: 4, lineHeight: 1.3 }}>{o.title}</div>
                    <div style={{ fontSize: 11, color: THEME.faint, marginBottom: 6 }}>{o.org}</div>
                    <DeadlinePill deadline={o.deadline} />
                  </div>
                ))}
                {items.length === 0 && <div style={{ fontSize: 12, color: THEME.subHeading, opacity: 0.6, fontStyle: "italic", padding: "8px 0" }}>Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function SettingsView({ profile, setProfile, opportunities, onImported, onLogout }) {
  const [minScore, setMinScore] = useState(60);
  const [digest, setDigest] = useState(true);
  const [importType, setImportType] = useState("scholarship");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [sponsorQuery, setSponsorQuery] = useState("");
  const [sponsorResults, setSponsorResults] = useState(null);
  const [sponsorSearching, setSponsorSearching] = useState(false);

  const checkSponsor = async () => {
    const q = sponsorQuery.trim();
    if (!q) return;
    setSponsorSearching(true);
    setSponsorResults(null);
    try {
      const { data, error } = await supabase
        .from("uk_sponsors")
        .select("organisation_name, town_city, county, type_rating, route")
        .ilike("organisation_name", `%${q}%`)
        .limit(10);
      setSponsorResults(error ? [] : data);
    } finally {
      setSponsorSearching(false);
    }
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ profile, opportunities }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "travelsleek-export.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    try {
      const dataBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch("/api/upload-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, dataBase64, type: importType }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportMsg(`Imported ${data.inserted} entries from ${file.name} — check Inbox, tagged "review".`);
        onImported?.();
      } else {
        setImportMsg(`Import failed: ${data.error || "unknown error"}`);
      }
    } catch (err) {
      setImportMsg(`Import failed: ${String(err?.message || err)}`);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ padding: "28px 36px", flex: 1, overflow: "auto", maxWidth: 560 }}>
      <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, margin: "0 0 20px", color: THEME.heading }}>Settings</h1>

      <Section title="Profile">
        <Field label="Full name" value={profile.name} onChange={(v) => setProfile((p) => ({ ...p, name: v }))} />
      </Section>

      <Section title="Preferences">
        <p style={{ fontSize: 12, color: THEME.faint, marginTop: 0, marginBottom: 14 }}>
          Open to a wide range? Add as many fields and countries as you like — leave a list empty to mean "anywhere" / "anything."
        </p>
        <div style={{ display: "grid", gap: 14 }}>
          <TagInput label="Field of study / occupation" values={profile.fields || []} onChange={(v) => setProfile((p) => ({ ...p, fields: v }))} placeholder="Type one, press Enter" />
          <TagInput label="Target countries" values={profile.countries || []} onChange={(v) => setProfile((p) => ({ ...p, countries: v }))} placeholder="Type one, press Enter" hint="Press Enter to add. Leave blank to see opportunities from any country." />
          <TagInput label="Must-haves" values={profile.mustHaves || []} onChange={(v) => setProfile((p) => ({ ...p, mustHaves: v }))} placeholder="e.g. fully funded only" />
          <TagInput label="Deal-breakers" values={profile.dealBreakers || []} onChange={(v) => setProfile((p) => ({ ...p, dealBreakers: v }))} placeholder="e.g. requires spousal sponsorship" />
        </div>
      </Section>

      <Section title="Filters">
        <label style={labelStyle}>Minimum score cutoff: {minScore}</label>
        <input type="range" min={0} max={100} value={minScore} onChange={(e) => setMinScore(+e.target.value)} style={{ width: "100%" }} />
      </Section>

      <Section title="Digest">
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, color: THEME.ink }}>
          <input type="checkbox" checked={digest} onChange={(e) => setDigest(e.target.checked)} />
          Send a daily email when new matches clear my cutoff
        </label>
      </Section>

      <Section title="Import a PDF compilation">
        <p style={{ fontSize: 12, color: THEME.faint, marginTop: 0, marginBottom: 10 }}>
          Drop in a PDF (e.g. a Grok compilation of listings). Text is extracted and split into candidate entries,
          landing in your Inbox tagged "review" — nothing is invented, and nothing auto-applies.
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={importType} onChange={(e) => setImportType(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
            <option value="scholarship">Scholarships</option>
            <option value="visa">Work visas</option>
          </select>
          <label style={{ ...secondaryBtn, cursor: importing ? "default" : "pointer", opacity: importing ? 0.6 : 1 }}>
            <Upload size={13} /> {importing ? "Importing..." : "Choose PDF"}
            <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={importing} style={{ display: "none" }} />
          </label>
        </div>
        {importMsg && <p style={{ fontSize: 12, color: THEME.sub, marginTop: 10 }}>{importMsg}</p>}
      </Section>

      <Section title="Check UK sponsor register">
        <p style={{ fontSize: 12, color: THEME.faint, marginTop: 0, marginBottom: 10 }}>
          Live lookup against the official Home Office register of licensed Skilled Worker sponsors — synced daily, straight from GOV.UK.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={sponsorQuery}
            onChange={(e) => setSponsorQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkSponsor()}
            placeholder="Employer name, e.g. Amazon"
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={checkSponsor} disabled={sponsorSearching} style={{ ...secondaryBtn, opacity: sponsorSearching ? 0.6 : 1 }}>
            <Search size={13} /> {sponsorSearching ? "Checking..." : "Check"}
          </button>
        </div>
        {sponsorResults !== null && (
          <div style={{ marginTop: 12 }}>
            {sponsorResults.length === 0 ? (
              <p style={{ fontSize: 12.5, color: THEME.faint }}>No licensed sponsor matched that name.</p>
            ) : (
              sponsorResults.map((s, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: i < sponsorResults.length - 1 ? `1px solid ${THEME.rowDivider}` : "none" }}>
                  <div style={{ fontSize: 13.5, color: THEME.ink, fontWeight: 600 }}>{s.organisation_name}</div>
                  <div style={{ fontSize: 11.5, color: THEME.faint }}>
                    {[s.town_city, s.county].filter(Boolean).join(", ")}{s.type_rating ? ` · ${s.type_rating}` : ""}{s.route ? ` · ${s.route}` : ""}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Section>

      <Section title="Maintenance">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={secondaryBtn} onClick={exportData}><Download size={13} /> Export data as JSON</button>
          <button style={{ ...secondaryBtn, color: THEME.bad, borderColor: THEME.bad }}><Trash2 size={13} /> Clear board</button>
        </div>
      </Section>

      <Section title="Account">
        <button style={{ ...secondaryBtn, color: THEME.bad, borderColor: THEME.bad }} onClick={onLogout}>Log out</button>
      </Section>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("travelsleek_token"));
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfileState] = useState(null);
  const [view, setView] = useState("inbox");
  const [openId, setOpenId] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const persistProfile = async (p, tok) => {
    const useToken = tok || token;
    if (!useToken) return;
    await supabase.rpc("save_profile", {
      p_token: useToken,
      p_name: p.name || "",
      p_nationality: p.nationality || "",
      p_degree_level: p.degreeLevel || "Master's",
      p_fields: p.fields || [],
      p_countries: p.countries || [],
      p_must_haves: p.mustHaves || [],
      p_deal_breakers: p.dealBreakers || [],
      p_cv: p.cv || "",
    });
  };

  const setProfile = (updater) => {
    setProfileState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      persistProfile(next);
      return next;
    });
  };

  const handleAuthed = async (newToken) => {
    localStorage.setItem("travelsleek_token", newToken);
    setToken(newToken);
    const { data } = await supabase.rpc("get_profile_by_token", { p_token: newToken });
    setProfileState(mapDbProfile(data));
  };

  const handleLogout = async () => {
    if (token) await supabase.rpc("logout_session", { p_token: token });
    localStorage.removeItem("travelsleek_token");
    setToken(null);
    setProfileState(null);
  };

  useEffect(() => {
    (async () => {
      if (!token) {
        setAuthChecked(true);
        return;
      }
      const { data, error } = await supabase.rpc("get_profile_by_token", { p_token: token });
      if (error) {
        localStorage.removeItem("travelsleek_token");
        setToken(null);
      } else {
        setProfileState(mapDbProfile(data));
      }
      setAuthChecked(true);
    })();
  }, []);

  const loadOpportunities = async () => {
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .neq("stage", "archived")
      .order("score", { ascending: false });
    if (!error && data) setOpportunities(data.map(rowToOpportunity));
  };

  useEffect(() => {
    loadOpportunities().finally(() => setLoading(false));
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await loadOpportunities();
    } finally {
      setSyncing(false);
    }
  };

  const handleBulk = async (ids, stage) => {
    setOpportunities((list) => list.map((o) => ids.includes(o.id) ? { ...o, stage } : o));
    await supabase.from("opportunities").update({ stage }).in("id", ids);
  };
  const handleStageChange = async (id, stage) => {
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, stage } : o));
    setOpenId(null);
    await supabase.from("opportunities").update({ stage }).eq("id", id);
  };
  const handleDocStatus = async (id, docName, status) => {
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;
    const newDocs = opp.docs.map((d) => d.name === docName ? { ...d, status } : d);
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, docs: newDocs } : o));
    await supabase.from("opportunities").update({ docs: newDocs }).eq("id", id);
  };

  const openOpp = opportunities.find((o) => o.id === openId);

  if (!authChecked) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: THEME.bg, color: THEME.subHeading, fontFamily: "Inter, sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (!token) return <AuthScreen onAuthed={handleAuthed} />;

  if (!profile) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: THEME.bg, color: THEME.subHeading, fontFamily: "Inter, sans-serif" }}>
        Loading your profile…
      </div>
    );
  }

  if (!profile.name) return <Onboarding onComplete={setProfile} />;

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: THEME.bg, color: THEME.subHeading, fontFamily: "Inter, sans-serif" }}>
        Loading opportunities…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: THEME.bg, fontFamily: "Inter, sans-serif", color: THEME.ink, position: "relative" }}>
      <button
        onClick={() => setMobileNavOpen(true)}
        className="mobile-menu-btn"
        style={{
          position: "fixed", top: 14, left: 14, zIndex: 30,
          border: `1px solid ${THEME.darkBorder}`, background: THEME.panel, color: THEME.ink,
          borderRadius: 4, padding: 8, cursor: "pointer",
        }}
      >
        <Menu size={18} />
      </button>
      <Sidebar view={view} setView={(v) => { setView(v); setOpenId(null); }} profile={profile} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {view === "inbox" && !openId && <Inbox opportunities={opportunities} onOpen={setOpenId} onBulk={handleBulk} onSync={handleSync} syncing={syncing} />}
      {view === "inbox" && openId && (
        <Detail opp={openOpp} onBack={() => setOpenId(null)} onStageChange={handleStageChange} onDocStatus={handleDocStatus} />
      )}
      {view === "pipeline" && !openId && <Pipeline opportunities={opportunities} onOpen={setOpenId} />}
      {view === "pipeline" && openId && (
        <Detail opp={openOpp} onBack={() => setOpenId(null)} onStageChange={handleStageChange} onDocStatus={handleDocStatus} />
      )}
      {view === "settings" && <SettingsView profile={profile} setProfile={setProfile} opportunities={opportunities} onImported={loadOpportunities} onLogout={handleLogout} />}
    </div>
  );
}
