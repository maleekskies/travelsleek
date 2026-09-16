import React, { useState, useMemo, useEffect } from "react";
import {
  Search, Check, X, ChevronRight, ChevronLeft, Archive, Bookmark,
  FileText, Clock, MapPin, GraduationCap, Briefcase, Settings as SettingsIcon,
  Inbox as InboxIcon, Layers, ArrowUpDown, Download, RefreshCw, Trash2, Send,
  Upload, Loader2, Menu, ExternalLink, HelpCircle
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tsgbrupkcejntodznspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ2JydXBrY2VqbnRvZHpuc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTc1OTQsImV4cCI6MjEwNDMzMzU5NH0.6QyuO7-4cCy97Yly8sPUTE7omOyBtfu0oFUhoGxJgK0";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Maps a Supabase row (snake_case) to the shape the UI components expect.
function rowToOpportunity(row) {
  return {
    id: row.external_id,
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
    criteriaVerifiedAt: row.criteria_verified_at || null,
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
  eligible: { label: "ELIGIBLE", color: THEME.good, bg: THEME.goodBg, hint: "You meet every stated eligibility line we could check automatically." },
  review: { label: "REVIEW", color: THEME.warn, bg: THEME.warnBg, hint: "At least one requirement is unconfirmed or unmet — check the details before applying." },
  "not eligible": { label: "NOT ELIGIBLE", color: THEME.bad, bg: THEME.badBg, hint: "You don't currently meet a stated requirement for this one." },
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
      title={`Fit score out of 100 — how closely this matches your profile and its own requirements.`}
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
      title={s.hint}
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

function GuestPrompt({ message, onSignUp }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 28 }}>
      <div style={{ maxWidth: 360, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: THEME.subHeading, marginBottom: 18, lineHeight: 1.5 }}>{message}</p>
        <button onClick={onSignUp} style={primaryBtn}>Sign up — no verification step</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function AuthScreen({ onAuthed, onCancel }) {
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
    <div style={{
      minHeight: "100%", display: "flex", alignItems: "center", justifyContent: "center",
      background: THEME.bg, padding: 24,
    }}>
      <form onSubmit={submit} style={{ width: "100%", maxWidth: 400, background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "40px 36px" }}>
        {onCancel && (
          <button type="button" onClick={onCancel} aria-label="Back to browsing" style={{ ...ghostBtn, padding: 0, marginBottom: 16 }}>
            <ChevronLeft size={15} /> Back to browsing
          </button>
        )}
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

        <p style={{ fontSize: 11, color: THEME.faint, textAlign: "center", marginTop: 18, marginBottom: 0, lineHeight: 1.5 }}>
          TravelSleek is an independent aggregator, not an immigration lawyer or university. Always verify details on the official page before applying.
        </p>
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
    age: json?.age ?? null,
    workExperienceYears: json?.work_experience_years ?? null,
    academicRecord: json?.academic_record || "",
    minScoreCutoff: json?.min_score_cutoff ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Eligibility engine — actually evaluates what we can check (degree level,
// field, deal-breakers, must-haves) against the profile, instead of leaving
// every criterion permanently unconfirmed. Anything we genuinely can't
// verify (nationality lists, work-experience years, etc.) stays pass: null
// rather than being guessed at.
// ---------------------------------------------------------------------------

const FIELD_WILDCARDS = ["any", "various", "varies by program", "any eligible occupation", "any recognized degree"];
const COUNTRY_WILDCARDS = ["multiple", "multiple (eu)"];
const NEGATION_WORDS = ["no ", "not ", "without ", "non-", "never ", "isn't ", "doesn't ", "won't ", "excludes ", "excluding ", "no need for "];

// Finds a phrase in text and reports whether it's negated ("no bond", "not required")
// right before it — a plain substring match can't tell "has a bond" from "no bond."
function affirmativeMatch(haystack, phrase) {
  const p = phrase.toLowerCase();
  const idx = haystack.indexOf(p);
  if (idx === -1) return { found: false, negated: false };
  const preceding = haystack.slice(Math.max(0, idx - 25), idx);
  const negated = NEGATION_WORDS.some((w) => preceding.endsWith(w));
  return { found: true, negated };
}

// A few common country-name variants so "UK" / "South Korea" / "USA" etc. match
// the canonical names stored in each scholarship's nationality rules.
const NATIONALITY_ALIASES = {
  "uk": "united kingdom", "britain": "united kingdom", "great britain": "united kingdom",
  "england": "united kingdom", "scotland": "united kingdom", "wales": "united kingdom",
  "usa": "united states", "us": "united states", "america": "united states",
  "korea": "south korea", "republic of korea": "south korea",
  "uae": "united arab emirates",
};
function normalizeNationality(n) {
  const lower = (n || "").trim().toLowerCase();
  return NATIONALITY_ALIASES[lower] || lower;
}

function computeEligibility(opp, profile) {
  if (!profile) return opp;

  const computedCriteria = [];
  let hardFail = false;
  let softReview = false;

  // Degree level — a hard requirement when the opportunity states one.
  if (opp.degree && opp.degree !== "N/A") {
    const wantsVisaOnly = profile.degreeLevel === "N/A — visa route only";
    const degreeOk = !wantsVisaOnly && opp.degree.includes(profile.degreeLevel);
    computedCriteria.push({ label: `Degree level matches your profile (${profile.degreeLevel})`, pass: degreeOk });
    if (!degreeOk) hardFail = true;
  }

  // Field of study/occupation — soft signal, since categorization is fuzzy.
  const fieldIsWildcard = opp.field && FIELD_WILDCARDS.includes(opp.field.toLowerCase());
  if (profile.fields?.length > 0 && !fieldIsWildcard && opp.field) {
    const fieldOk = profile.fields.some((f) =>
      opp.field.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(opp.field.toLowerCase())
    );
    computedCriteria.push({ label: `Field matches one you listed (${profile.fields.join(", ")})`, pass: fieldOk });
    if (!fieldOk) softReview = true;
  }

  const haystack = `${opp.title} ${opp.reason} ${(opp.fit || []).join(" ")} ${(opp.gap || []).join(" ")} ${opp.field || ""} ${opp.degree || ""}`.toLowerCase();

  // Deal-breakers — an affirmed (non-negated) match is a hard stop.
  // A negated match ("no bond required") is actually reassuring, not a fail.
  (profile.dealBreakers || []).forEach((db) => {
    const { found, negated } = affirmativeMatch(haystack, db.toLowerCase());
    if (found && !negated) {
      computedCriteria.push({ label: `Deal-breaker mentioned: "${db}"`, pass: false });
      hardFail = true;
    } else if (found && negated) {
      computedCriteria.push({ label: `Explicitly rules out "${db}"`, pass: true });
    }
  });

  // Must-haves — an affirmed match satisfies it; a negated match clearly fails it;
  // no mention at all is unconfirmed, not assumed missing.
  (profile.mustHaves || []).forEach((mh) => {
    const { found, negated } = affirmativeMatch(haystack, mh.toLowerCase());
    const pass = !found ? null : negated ? false : true;
    computedCriteria.push({ label: `Must-have mentioned: "${mh}"`, pass });
    if (pass !== true) softReview = true;
  });

  // Resolve any stored criteria that carry a structured, checkable rule
  // (age limits, work experience, nationality) against the profile's actual data.
  // GPA/CGPA, degree class, and anything else without a "check" stays exactly
  // as stored — grading scales don't compare reliably enough to automate.
  const myNationality = normalizeNationality(profile.nationality);
  const resolvedStoredCriteria = (opp.eligCriteria || []).map((c) => {
    if (!c.check) return c;
    if (c.check.type === "age_max") {
      if (profile.age == null) return c;
      const pass = profile.age <= c.check.value;
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "experience_min_years") {
      if (profile.workExperienceYears == null) return c;
      const pass = profile.workExperienceYears >= c.check.value;
      if (!pass) softReview = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "nationality_exclude") {
      if (!myNationality) return c;
      const pass = myNationality !== normalizeNationality(c.check.value);
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "nationality_include_list") {
      if (!myNationality) return c;
      const pass = c.check.value.some((v) => normalizeNationality(v) === myNationality);
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "nationality_exclude_list") {
      if (!myNationality) return c;
      const pass = !c.check.value.some((v) => normalizeNationality(v) === myNationality);
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    return c;
  });

  const mergedCriteria = [...computedCriteria, ...resolvedStoredCriteria];
  const anyUnconfirmed = mergedCriteria.some((c) => c.pass === null || c.pass === undefined);

  let eligibility;
  if (hardFail) eligibility = "not eligible";
  else if (softReview || anyUnconfirmed) eligibility = "review";
  else eligibility = "eligible";

  // Country targeting is a preference, not an eligibility rule — surface it as a tag instead.
  const extraFit = [...(opp.fit || [])];
  const extraGap = [...(opp.gap || [])];
  const countryIsWildcard = opp.country && COUNTRY_WILDCARDS.includes(opp.country.toLowerCase());
  if (profile.countries?.length > 0 && opp.country && !countryIsWildcard) {
    const inTargets = profile.countries.some((c) => c.toLowerCase() === opp.country.toLowerCase());
    if (inTargets) extraFit.push("Matches a target country");
    else extraGap.push("Outside your target countries");
  }

  return { ...opp, eligCriteria: mergedCriteria, eligibility, fit: extraFit, gap: extraGap };
}

// ---------------------------------------------------------------------------

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "", fields: [], nationality: "", degreeLevel: "Master's",
    countries: [], mustHaves: [], dealBreakers: [], cv: "",
    age: "", workExperienceYears: "", academicRecord: "",
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
          {step === 1 && "Countries, degree level, and field shape which scholarships and visa routes get scanned. Age, experience, and academic record let us actually check age limits and experience minimums instead of just listing them."}
          {step === 2 && "Used to downrank or exclude opportunities automatically."}
          {step === 3 && "Paste it in. Kits and checklists are only ever built from facts found here."}
        </p>

        {step === 0 && (
          <div style={{ display: "grid", gap: 14 }}>
            <Field label="Full name" value={profile.name} onChange={(v) => update("name", v)} />
            <TagInput label="Field of study / occupation" values={profile.fields} onChange={(v) => update("fields", v)} placeholder="Type one, press Enter — add as many as you're open to" />
            <Field label="Nationality" value={profile.nationality} onChange={(v) => update("nationality", v)} />
            <Field label="Age" type="number" value={profile.age} onChange={(v) => update("age", v)} placeholder="e.g. 27" hint={'Used only to check age limits some scholarships state (e.g. "under 30").'} />
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
            <Field label="Years of relevant work experience" type="number" value={profile.workExperienceYears} onChange={(v) => update("workExperienceYears", v)} placeholder="e.g. 2.5" hint={"Checked against minimums like \"at least 2 years' experience.\""} />
            <Field label="Academic record (GPA, CGPA, or degree class)" value={profile.academicRecord} onChange={(v) => update("academicRecord", v)} placeholder="e.g. 3.6/4.0, 8.5/10, or First Class" hint="Shown for your own reference — grading scales vary too much to auto-check reliably." />
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
            <button onClick={() => onComplete({ ...profile, age: profile.age ? Number(profile.age) : null, workExperienceYears: profile.workExperienceYears ? Number(profile.workExperienceYears) : null })} style={primaryBtn}>Enter Inbox <ChevronRight size={15} /></button>
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

function Field({ label, value, onChange, placeholder, area, tall, type, hint }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {area ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          rows={tall ? 8 : 3} style={{ ...inputStyle, resize: "vertical", fontFamily: "Inter, sans-serif" }} />
      ) : (
        <input type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
      {hint && <p style={{ fontSize: 11, color: THEME.faint, marginTop: 4, marginBottom: 0 }}>{hint}</p>}
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

function Sidebar({ view, setView, profile, guest, mobileOpen, onClose }) {
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
              {guest ? "browsing as guest" : `${profile?.name || "your"} · case file`}
            </div>
          </div>
          <button onClick={onClose} className="mobile-menu-btn" aria-label="Close menu" style={{ border: "none", background: "none", color: THEME.subHeading, cursor: "pointer", padding: 2 }}>
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
        {guest && (
          <button onClick={() => { setView("auth"); onClose?.(); }} style={{
            border: "none", background: "none", marginTop: "auto",
            color: THEME.good, fontSize: 13, fontWeight: 700,
            display: "flex", alignItems: "center", gap: 9, padding: "10px 18px",
            cursor: "pointer", textAlign: "left",
          }}>
            Log in / Sign up
          </button>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------

function Inbox({ opportunities, onOpen, onBulk, onSync, syncing, guest, onRequireAuth, minScoreCutoff }) {
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("score");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);

  const cutoff = minScoreCutoff || 0;
  const hiddenByCutoffCount = useMemo(
    () => opportunities.filter((o) => o.score < cutoff && (o.stage === "saved" || !o.stage)).length,
    [opportunities, cutoff]
  );

  const filtered = useMemo(() => {
    let list = opportunities.filter((o) => tab === "all" || o.type === tab);
    // Only hide untracked ("saved"/default) opportunities below the cutoff —
    // never hide something you've already moved into your pipeline.
    list = list.filter((o) => o.score >= cutoff || (o.stage && o.stage !== "saved"));
    if (query) list = list.filter((o) => (o.title + o.org + o.country).toLowerCase().includes(query.toLowerCase()));
    list = [...list].sort((a, b) => sort === "score" ? b.score - a.score : (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999));
    return list;
  }, [opportunities, tab, query, sort, cutoff]);

  const urgentCount = useMemo(() => {
    return opportunities.filter((o) => {
      const d = daysUntil(o.deadline);
      return d !== null && d <= 7 && o.stage !== "submitted" && o.stage !== "rejected";
    }).length;
  }, [opportunities]);

  const toggle = (id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);

  return (
    <div className="content-page" style={{ padding: "28px 36px", flex: 1, overflow: "auto" }}>
      {guest && (
        <div style={{ background: THEME.warnBg, border: `1px solid ${THEME.warn}55`, color: THEME.ink, fontSize: 12.5, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span>Browsing as a guest — your saves and progress won't be kept.</span>
          <button onClick={onRequireAuth} style={{ border: "none", background: "none", color: THEME.warn, fontWeight: 700, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>Sign up</button>
        </div>
      )}
      {urgentCount > 0 && (
        <div style={{ background: THEME.badBg, border: `1px solid ${THEME.bad}55`, color: THEME.bad, fontSize: 12.5, fontWeight: 600, padding: "10px 14px", marginBottom: 16 }}>
          ⏱ {urgentCount} {urgentCount === 1 ? "deadline is" : "deadlines are"} within a week — sort by Deadline below to see which first.
        </div>
      )}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h1 style={{ fontFamily: "'Source Serif 4', serif", fontSize: 26, margin: 0, color: THEME.heading }}>Inbox</h1>
        <button onClick={onSync} disabled={syncing} style={{ ...lightGhostBtn, opacity: syncing ? 0.6 : 1 }}>
          {syncing ? <Loader2 size={13} /> : <RefreshCw size={13} />} {syncing ? "Syncing..." : "Sync now"}
        </button>
      </div>
      <div style={{ fontSize: 12, color: THEME.subHeading, marginBottom: 4 }}>Live sources: GOV.UK, IRCC Open Data · Curated: {SOURCES.scholarship.join(" · ")}</div>
      <p style={{ fontSize: 13, color: THEME.subHeading, marginTop: 6, marginBottom: 20 }}>Untouched listings auto-archive after 30 days. Nothing here submits itself.</p>
      {cutoff > 0 && hiddenByCutoffCount > 0 && (
        <p style={{ fontSize: 12, color: THEME.subHeading, marginTop: -14, marginBottom: 18 }}>
          {hiddenByCutoffCount} below your {cutoff}-score cutoff are hidden — adjust it in Settings.
        </p>
      )}

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
          <div key={o.id} onClick={() => onOpen(o.id)} className="inbox-row" style={{
            display: "flex", alignItems: "center", gap: 16, padding: "16px 18px",
            borderBottom: `1px solid ${THEME.rowDivider}`, cursor: "pointer",
          }}>
            <input type="checkbox" checked={selected.includes(o.id)} onClick={(e) => e.stopPropagation()}
              onChange={() => toggle(o.id)} className="inbox-row-check" aria-label={`Select ${o.title}`} style={{ width: 15, height: 15 }} />
            <div className="inbox-row-score"><ScoreBadge score={o.score} /></div>
            <div className="inbox-row-content" style={{ flex: 1, minWidth: 0 }}>
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
            <div className="inbox-row-deadline" style={{ textAlign: "right", flexShrink: 0, width: 100 }}>
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

function Detail({ opp, onBack, onStageChange, onDocStatus, guest, onRequireAuth }) {
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
        {opp.criteriaVerifiedAt && (
          <p style={{ fontSize: 11, color: THEME.faint, marginTop: 0, marginBottom: 10 }}>
            Requirements last verified {opp.criteriaVerifiedAt} — scholarship rules can change year to year, so confirm on the official page before relying on this.
          </p>
        )}
        {opp.eligCriteria.map((c) => {
          const missingFieldHint = c.check && (c.pass === null || c.pass === undefined)
            ? c.check.type === "age_max" ? "Add your age in Settings to check this."
              : c.check.type === "experience_min_years" ? "Add your years of work experience in Settings to check this."
              : c.check.type?.startsWith("nationality") ? "Add your nationality in Settings to check this."
              : null
            : null;
          return (
            <div key={c.label} style={{ padding: "7px 0", borderBottom: `1px solid ${THEME.rowDivider}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13.5 }}>
                {c.pass === true ? <Check size={15} color={THEME.good} /> : c.pass === false ? <X size={15} color={THEME.bad} /> : <HelpCircle size={15} color={THEME.faint} />}
                <span style={{ color: c.pass === true ? THEME.ink : c.pass === false ? THEME.bad : THEME.sub }}>{c.label}</span>
              </div>
              {missingFieldHint && <div style={{ fontSize: 11, color: THEME.faint, marginLeft: 24, marginTop: 2 }}>{missingFieldHint}</div>}
            </div>
          );
        })}
      </Section>

      <Section title="Documents">
        {opp.docs.map((d) => (
          <div key={d.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: `1px solid ${THEME.rowDivider}`, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13.5, color: THEME.ink, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
              <FileText size={14} color={THEME.faint} style={{ flexShrink: 0 }} /> {d.name}
            </span>
            {guest ? (
              <span style={{ fontSize: 12, fontWeight: 600, color: docStatusColor[d.status] }}>{d.status}</span>
            ) : (
              <select value={d.status} onChange={(e) => onDocStatus(opp.id, d.name, e.target.value)}
                style={{ fontSize: 12, border: `1px solid ${THEME.panelBorder}`, padding: "4px 8px", color: docStatusColor[d.status], fontWeight: 600 }}>
                <option value="not started">Not started</option>
                <option value="drafting">Drafting</option>
                <option value="ready">Ready</option>
              </select>
            )}
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

      {guest ? (
        <div style={{ background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12.5, color: THEME.sub }}>Sign up to save this to a pipeline and track your progress.</span>
          <button style={primaryBtn} onClick={onRequireAuth}>Sign up</button>
        </div>
      ) : (
        <div style={{ background: THEME.panel, border: `1px solid ${THEME.panelBorder}`, padding: "16px 18px", display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={primaryBtn} onClick={() => onStageChange(opp.id, "preparing")}><Bookmark size={14} /> Save to pipeline</button>
          <button style={secondaryBtn} onClick={() => onStageChange(opp.id, "submitted")}><Send size={14} /> Mark submitted</button>
          <button style={{ ...ghostBtn, color: THEME.bad }} onClick={() => onStageChange(opp.id, "rejected")}><X size={14} /> Reject with reason</button>
        </div>
      )}
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
    <div className="content-page" style={{ padding: "28px 36px", flex: 1, overflow: "auto" }}>
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

function SettingsView({ profile, setProfile, opportunities, onImported, onLogout, onClearBoard }) {
  const [importType, setImportType] = useState("scholarship");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [sponsorQuery, setSponsorQuery] = useState("");
  const [sponsorResults, setSponsorResults] = useState(null);
  const [sponsorSearching, setSponsorSearching] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleClearBoard = async () => {
    if (!window.confirm("Reset your pipeline? This moves every saved/tracked opportunity back to \"saved\" and clears your document progress. The shared opportunity list itself isn't affected.")) return;
    setClearing(true);
    try {
      await onClearBoard();
    } finally {
      setClearing(false);
    }
  };

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
    <div className="content-page" style={{ padding: "28px 36px", flex: 1, overflow: "auto", maxWidth: 560 }}>
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
          <Field label="Age" type="number" value={profile.age ?? ""} onChange={(v) => setProfile((p) => ({ ...p, age: v ? Number(v) : null }))} placeholder="e.g. 27" hint="Used to check age limits some scholarships state." />
          <Field label="Years of relevant work experience" type="number" value={profile.workExperienceYears ?? ""} onChange={(v) => setProfile((p) => ({ ...p, workExperienceYears: v ? Number(v) : null }))} placeholder="e.g. 2.5" hint={"Checked against minimums like \"at least 2 years' experience.\""} />
          <Field label="Academic record (GPA, CGPA, or degree class)" value={profile.academicRecord || ""} onChange={(v) => setProfile((p) => ({ ...p, academicRecord: v }))} placeholder="e.g. 3.6/4.0, 8.5/10, or First Class" hint="For your own reference — grading scales vary too much to auto-check." />
        </div>
      </Section>

      <Section title="Filters">
        <label style={labelStyle}>Minimum score cutoff: {profile.minScoreCutoff ?? 0}</label>
        <input type="range" min={0} max={100} value={profile.minScoreCutoff ?? 0} onChange={(e) => setProfile((p) => ({ ...p, minScoreCutoff: +e.target.value }))} style={{ width: "100%" }} />
        <p style={{ fontSize: 11, color: THEME.faint, marginTop: 4, marginBottom: 0 }}>Hides untracked Inbox listings below this score. Anything already in your pipeline stays visible regardless.</p>
      </Section>

      <Section title="Digest">
        <p style={{ fontSize: 12.5, color: THEME.faint, margin: 0 }}>
          Not available yet — sending a daily email needs an email-sending service connected, which isn't set up. This isn't a working toggle right now, so it's not shown as one.
        </p>
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
          <button style={{ ...secondaryBtn, color: THEME.bad, borderColor: THEME.bad, opacity: clearing ? 0.6 : 1 }} onClick={handleClearBoard} disabled={clearing}><Trash2 size={13} /> {clearing ? "Clearing..." : "Clear board"}</button>
        </div>
      </Section>

      <Section title="Account">
        <button style={{ ...secondaryBtn, color: THEME.bad, borderColor: THEME.bad }} onClick={onLogout}>Log out</button>
      </Section>

      <Section title="Legal">
        <details style={{ marginBottom: 10 }}>
          <summary style={{ fontSize: 13, color: THEME.ink, cursor: "pointer", fontWeight: 600 }}>Privacy Policy</summary>
          <div style={{ fontSize: 12, color: THEME.sub, marginTop: 8, lineHeight: 1.6 }}>
            <p>We store your email, a securely hashed password (never the password itself), and whatever profile details you enter (name, nationality, target fields/countries, must-haves, deal-breakers, and your master CV text).</p>
            <p>Your saved opportunities, pipeline stage, and document checklist status are private to your account and not visible to other users.</p>
            <p>PDFs you import are processed to extract text and are not stored as files after processing.</p>
            <p>We don't sell your data or share it with third parties beyond the external services this app queries on your behalf (e.g. GOV.UK, Adzuna) — those calls don't include your personal profile.</p>
          </div>
        </details>
        <details>
          <summary style={{ fontSize: 13, color: THEME.ink, cursor: "pointer", fontWeight: 600 }}>Terms of Use</summary>
          <div style={{ fontSize: 12, color: THEME.sub, marginTop: 8, lineHeight: 1.6 }}>
            <p>TravelSleek is an independent aggregator. It is not an immigration lawyer, visa agent, or university, and nothing here is legal or immigration advice.</p>
            <p>Eligibility, scores, and "sponsor" information are estimates to help you prioritize — always confirm details on the official application page before relying on them or applying.</p>
            <p>This is a personal project run on a small scale. There's no uptime guarantee, and features may change without notice.</p>
          </div>
        </details>
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

  const guest = !token;

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
      p_age: p.age ?? null,
      p_work_experience_years: p.workExperienceYears ?? null,
      p_academic_record: p.academicRecord || "",
      p_min_score_cutoff: p.minScoreCutoff ?? 0,
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
    setView("inbox");
  };

  const handleLogout = async () => {
    if (token) await supabase.rpc("logout_session", { p_token: token });
    localStorage.removeItem("travelsleek_token");
    setToken(null);
    setProfileState(null);
    setView("inbox");
  };

  const handleClearBoard = async () => {
    if (!token) return;
    await supabase.rpc("clear_my_pipeline", { p_token: token });
    await loadOpportunities();
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

  // Logged-in users get their own stage/doc overlay via get_my_opportunities.
  // Guests see the shared public feed, read-only, always defaulted to "saved".
  const loadOpportunities = async () => {
    if (token) {
      const { data, error } = await supabase.rpc("get_my_opportunities", { p_token: token });
      if (!error && data) setOpportunities(data.map(rowToOpportunity));
      return;
    }
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("score", { ascending: false });
    if (!error && data) {
      setOpportunities(data.map((row) => ({ ...rowToOpportunity(row), stage: "saved" })));
    }
  };

  useEffect(() => {
    loadOpportunities().finally(() => setLoading(false));
  }, [token]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch("/api/sync", { method: "POST" });
      await loadOpportunities();
    } finally {
      setSyncing(false);
    }
  };

  const requireAuth = () => { setView("auth"); };

  const handleBulk = async (ids, stage) => {
    if (guest) return requireAuth();
    setOpportunities((list) => list.map((o) => ids.includes(o.id) ? { ...o, stage } : o));
    await Promise.all(ids.map((id) => supabase.rpc("set_opportunity_stage", { p_token: token, p_external_id: id, p_stage: stage })));
  };
  const handleStageChange = async (id, stage) => {
    if (guest) return requireAuth();
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, stage } : o));
    setOpenId(null);
    await supabase.rpc("set_opportunity_stage", { p_token: token, p_external_id: id, p_stage: stage });
  };
  const handleDocStatus = async (id, docName, status) => {
    if (guest) return requireAuth();
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;
    const newDocs = opp.docs.map((d) => d.name === docName ? { ...d, status } : d);
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, docs: newDocs } : o));
    await supabase.rpc("set_opportunity_docs", { p_token: token, p_external_id: id, p_docs: newDocs });
  };

  const displayOpportunities = useMemo(
    () => guest ? opportunities : opportunities.map((o) => computeEligibility(o, profile)),
    [opportunities, profile, guest]
  );
  const openOpp = displayOpportunities.find((o) => o.id === openId);

  if (!authChecked) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: THEME.bg, color: THEME.subHeading, fontFamily: "Inter, sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (view === "auth") return <AuthScreen onAuthed={handleAuthed} onCancel={guest ? () => setView("inbox") : null} />;

  if (token && !profile) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: THEME.bg, color: THEME.subHeading, fontFamily: "Inter, sans-serif" }}>
        Loading your profile…
      </div>
    );
  }

  if (token && profile && !profile.name) return <Onboarding onComplete={setProfile} />;

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
        aria-label="Open menu"
        style={{
          position: "fixed", top: 14, left: 14, zIndex: 30,
          border: `1px solid ${THEME.darkBorder}`, background: THEME.panel, color: THEME.ink,
          borderRadius: 4, padding: 8, cursor: "pointer",
        }}
      >
        <Menu size={18} />
      </button>
      <Sidebar view={view} setView={(v) => { setView(v); setOpenId(null); }} profile={profile} guest={guest} mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      {view === "inbox" && !openId && <Inbox opportunities={displayOpportunities} onOpen={setOpenId} onBulk={handleBulk} onSync={handleSync} syncing={syncing} guest={guest} onRequireAuth={requireAuth} minScoreCutoff={profile?.minScoreCutoff} />}
      {view === "inbox" && openId && (
        <Detail opp={openOpp} onBack={() => setOpenId(null)} onStageChange={handleStageChange} onDocStatus={handleDocStatus} guest={guest} onRequireAuth={requireAuth} />
      )}
      {view === "pipeline" && !guest && !openId && <Pipeline opportunities={displayOpportunities} onOpen={setOpenId} />}
      {view === "pipeline" && !guest && openId && (
        <Detail opp={openOpp} onBack={() => setOpenId(null)} onStageChange={handleStageChange} onDocStatus={handleDocStatus} guest={guest} onRequireAuth={requireAuth} />
      )}
      {view === "pipeline" && guest && <GuestPrompt message="Sign up to track opportunities through a pipeline — saved, preparing, submitted, decision." onSignUp={requireAuth} />}
      {view === "settings" && !guest && <SettingsView profile={profile} setProfile={setProfile} opportunities={displayOpportunities} onImported={loadOpportunities} onLogout={handleLogout} onClearBoard={handleClearBoard} />}
      {view === "settings" && guest && <GuestPrompt message="Sign up to save your profile, preferences, and import PDFs." onSignUp={requireAuth} />}
    </div>
  );
}
