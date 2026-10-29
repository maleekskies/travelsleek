import { daysUntil } from "./dates.js";

export const SOURCES = {
  scholarship: ["DAAD", "Chevening", "Fulbright", "Erasmus Mundus", "Commonwealth", "Gates Cambridge"],
  visa: ["UK Skilled Worker", "Canada Express Entry", "Australia Skilled 189/190", "Germany Job Seeker", "Ireland Critical Skills"],
};

export const STAGES = [
  { id: "saved", label: "Saved" },
  { id: "preparing", label: "Preparing" },
  { id: "submitted", label: "Submitted" },
  { id: "interview", label: "Interview / Decision" },
];

// Stages where the opportunity is "done" from a deadline-pressure point of view.
export const SETTLED = ["submitted", "rejected", "archived", "interview"];

export const ELIG = {
  eligible: { label: "Eligible", tone: "good", hint: "You meet every stated eligibility line we could check automatically." },
  review: { label: "Review", tone: "warn", hint: "At least one requirement is unconfirmed or unmet — check the details before applying." },
  "not eligible": { label: "Not eligible", tone: "bad", hint: "You don't currently meet a stated requirement for this one." },
};

export const scoreTone = (score) => (score >= 80 ? "good" : score >= 60 ? "warn" : "bad");

// Untracked items below the cutoff are hidden; anything already in the
// pipeline stays visible no matter what.
export const isTracked = (o) => !!o.stage && o.stage !== "saved";
export const passesCutoff = (o, cutoff) => o.score >= cutoff || isTracked(o);
export const isLive = (o) => {
  const d = daysUntil(o.deadline);
  return d === null || d >= 0;
};

export const byDeadline = (a, b) => (daysUntil(a.deadline) ?? 9999) - (daysUntil(b.deadline) ?? 9999);
