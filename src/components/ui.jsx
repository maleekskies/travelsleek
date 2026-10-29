import React, { useId, useState } from "react";
import { GraduationCap, Briefcase, Clock, X } from "lucide-react";
import { ELIG, scoreTone } from "../lib/opps.js";
import { deadlineInfo } from "../lib/dates.js";

export function ScoreRing({ score, size = 46, onClick, label }) {
  const tone = scoreTone(score);
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  const body = (
    <>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" fill="none" strokeWidth="3" />
        <circle
          cx={size / 2} cy={size / 2} r={r} className={`ring-fill tone-${tone}`} fill="none" strokeWidth="3"
          strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-num" style={{ fontSize: size * 0.34 }}>{score}</span>
    </>
  );
  if (onClick) {
    return (
      <button type="button" className="ring ring-btn" style={{ width: size, height: size }} onClick={onClick}
        aria-label={label || `Fit score ${score} out of 100 — open quick look`} title="Fit score — click for the breakdown">
        {body}
      </button>
    );
  }
  return (
    <span className="ring" style={{ width: size, height: size }} title="Fit score out of 100 — how closely this matches your profile and its own requirements.">
      {body}
    </span>
  );
}

export function EligStamp({ status }) {
  const s = ELIG[status] || ELIG.review;
  return <span className={`stamp tone-${s.tone}`} title={s.hint}>{s.label}</span>;
}

export function TypeBadge({ type }) {
  const sch = type === "scholarship";
  return (
    <span className={`type ${sch ? "type-sch" : "type-visa"}`}>
      {sch ? <GraduationCap size={13} /> : <Briefcase size={13} />}
      {sch ? "Scholarship" : "Work visa"}
    </span>
  );
}

export function DeadlineChip({ deadline, long }) {
  const d = deadlineInfo(deadline);
  return (
    <span className={`dl dl-${d.tone}`} title={d.date || undefined}>
      {d.kind === "open" || d.kind === "today" ? <Clock size={12} /> : null}
      {long ? d.long : d.short}
    </span>
  );
}

export function Tag({ text, good }) {
  return <span className={`tag ${good ? "tag-good" : "tag-gap"}`}>{text}</span>;
}

export function Card({ title, aside, children, className = "" }) {
  return (
    <section className={`card ${className}`}>
      {(title || aside) && (
        <header className="card-h">
          <h3>{title}</h3>
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({ label, value, onChange, placeholder, area, tall, type, hint, onBlur }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {area ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} rows={tall ? 8 : 3} />
      ) : (
        <input id={id} type={type || "text"} value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} placeholder={placeholder} />
      )}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function TagInput({ label, hint, values, onChange, placeholder, suggestions = [] }) {
  const [text, setText] = useState("");
  const id = useId();

  const add = (raw) => {
    const v = (raw ?? text).trim();
    if (!v) return;
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    setText("");
  };
  const remove = (t) => onChange(values.filter((x) => x !== t));
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    else if (e.key === "Backspace" && text === "" && values.length > 0) remove(values[values.length - 1]);
  };
  const open = suggestions.filter((s) => !values.some((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 6);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="tagbox" onClick={(e) => e.currentTarget.querySelector("input")?.focus()}>
        {values.map((v) => (
          <span key={v} className="chip">
            {v}
            <button type="button" aria-label={`Remove ${v}`} onClick={(e) => { e.stopPropagation(); remove(v); }}><X size={12} /></button>
          </span>
        ))}
        <input id={id} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={onKey} onBlur={() => add()}
          placeholder={values.length === 0 ? placeholder : ""} />
      </div>
      {open.length > 0 && (
        <div className="suggest" aria-label="Suggestions">
          {open.map((s) => (
            <button type="button" key={s} onMouseDown={(e) => e.preventDefault()} onClick={() => add(s)}>+ {s}</button>
          ))}
        </div>
      )}
      <p className="hint">{hint || "Press Enter to add — as many as you like."}</p>
    </div>
  );
}

export function PageHead({ eyebrow, title, children }) {
  return (
    <header className="pagehead">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      {children && <div className="pagehead-actions">{children}</div>}
    </header>
  );
}

// Slider + live histogram of how the cutoff splits the visible opportunities.
export function CutoffControl({ value, onChange, opportunities, compact }) {
  const bins = Array.from({ length: 10 }, () => 0);
  opportunities.forEach((o) => { bins[Math.min(9, Math.floor(o.score / 10))] += 1; });
  const max = Math.max(1, ...bins);
  const hidden = opportunities.filter((o) => o.score < value && (!o.stage || o.stage === "saved")).length;
  return (
    <div className={`cutoff${compact ? " cutoff-compact" : ""}`}>
      <div className="cutoff-top">
        <label htmlFor="cutoff-range">Minimum score</label>
        <output>{value}</output>
      </div>
      <div className="hist" aria-hidden="true">
        {bins.map((n, i) => (
          <span key={i} className={i * 10 >= value ? "on" : ""} style={{ height: `${Math.max(6, (n / max) * 100)}%` }} />
        ))}
      </div>
      <input id="cutoff-range" type="range" min={0} max={100} step={5} value={value} onChange={(e) => onChange(+e.target.value)} />
      <p className="hint">
        {value === 0 ? "Showing everything." : `${hidden} untracked ${hidden === 1 ? "listing is" : "listings are"} hidden below ${value}.`} Anything already in your pipeline always stays visible.
      </p>
    </div>
  );
}
