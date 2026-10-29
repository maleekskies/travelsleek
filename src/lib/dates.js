// Deadline helpers. All day arithmetic is done on calendar days in the viewer's
// local time zone, so "days left" never flips because of a UTC/local mismatch.

const MS_DAY = 86400000;

const calendarDay = (y, m, d) => Date.UTC(y, m, d);

function todayDay() {
  const n = new Date();
  return calendarDay(n.getFullYear(), n.getMonth(), n.getDate());
}

// Returns the deadline as a calendar-day number, or null for "Rolling",
// missing, or unparseable values.
export function parseDeadline(value) {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();
  if (!s || /rolling/i.test(s)) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) return calendarDay(+iso[1], +iso[2] - 1, +iso[3]);
  const t = Date.parse(s);
  if (Number.isNaN(t)) return null;
  const d = new Date(t);
  return calendarDay(d.getFullYear(), d.getMonth(), d.getDate());
}

// Whole days from today until the deadline (negative once it has passed),
// or null when there is no fixed date.
export function daysUntil(value) {
  const day = parseDeadline(value);
  if (day === null) return null;
  return Math.round((day - todayDay()) / MS_DAY);
}

// "6 Dec" (adds the year when it isn't the current one).
export function formatDay(day) {
  const d = new Date(day);
  const sameYear = d.getUTCFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  });
}

// Today plus n days, as a calendar-day number (for building timelines).
export const dayFromToday = (n) => todayDay() + n * MS_DAY;

// One place that turns a raw deadline string into everything the UI needs.
export function deadlineInfo(value) {
  const days = daysUntil(value);
  if (days === null) {
    const rolling = typeof value === "string" && /rolling/i.test(value);
    return {
      kind: rolling ? "rolling" : "none",
      days: null,
      tone: "mute",
      date: null,
      short: rolling ? "Rolling" : "No deadline",
      long: rolling ? "Rolling deadline" : "No deadline listed",
    };
  }
  const date = formatDay(parseDeadline(value));
  if (days < 0) return { kind: "closed", days, tone: "mute", date, short: "Closed", long: `Closed ${date}` };
  if (days === 0) return { kind: "today", days, tone: "hot", date, short: "Closes today", long: `${date} · closes today` };
  const unit = days === 1 ? "day" : "days";
  return {
    kind: "open",
    days,
    tone: days <= 21 ? "hot" : days <= 45 ? "warm" : "cool",
    date,
    short: `${days} ${unit} left`,
    long: `${date} · ${days} ${unit} left`,
  };
}

export function formatRelativeTime(isoString) {
  if (!isoString) return null;
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
