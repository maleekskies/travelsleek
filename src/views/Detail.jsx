import React, { useState } from "react";
import { Check, X, ChevronLeft, Bookmark, FileText, Send, ExternalLink, HelpCircle } from "lucide-react";
import { Card, ScoreRing, TypeBadge, EligStamp, DeadlineChip, Tag } from "../components/ui.jsx";

const DOC_TONE = { "not started": "mute", drafting: "warn", ready: "good" };

export default function Detail({ opp, backLabel, onBack, onStageChange, onDocStatus, onNotesChange, onNextActionChange, guest, onRequireAuth }) {
  const [nextAction, setNextAction] = useState(opp?.nextAction || "");
  const [nextDate, setNextDate] = useState(opp?.nextDate || "");
  const [notes, setNotes] = useState(opp?.notes || "");

  if (!opp) return null;

  const saveNextAction = () => {
    if (nextAction === (opp.nextAction || "") && nextDate === (opp.nextDate || "")) return;
    onNextActionChange?.(opp.id, nextAction, nextDate);
  };
  const saveNotes = () => { if (notes !== (opp.notes || "")) onNotesChange?.(opp.id, notes); };

  const handleReject = () => {
    const reason = window.prompt("Optional — why are you rejecting this? (Leave blank to skip)");
    if (reason === null) return; // cancelled the prompt — keep it where it is
    onStageChange(opp.id, "rejected", reason.trim() || undefined);
  };

  return (
    <div className="page page-narrow">
      <button onClick={onBack} className="btn btn-quiet back"><ChevronLeft size={15} /> {backLabel}</button>

      <header className="paper detail-head">
        <div className="detail-top">
          <div>
            <div className="meta">
              <TypeBadge type={opp.type} />
              <EligStamp status={opp.eligibility} />
              <span className="muted small">{opp.org} · {opp.country}</span>
            </div>
            <h1>{opp.title}</h1>
            <div className="meta">
              <DeadlineChip deadline={opp.deadline} long />
              <span className="muted small">{opp.field}{opp.degree !== "N/A" ? ` · ${opp.degree}` : ""}</span>
            </div>
          </div>
          <ScoreRing score={opp.score} size={72} />
        </div>
        <div className="row-actions">
          {opp.sourceUrl ? (
            <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Open official apply page <ExternalLink size={14} />
            </a>
          ) : (
            <span className="muted small italic">No official link on file for this entry yet.</span>
          )}
        </div>
      </header>

      <Card title="Score breakdown">
        <p className="reason">{opp.reason}</p>
        <div className="tags">
          {opp.fit.map((f, i) => <Tag key={`f${i}-${f}`} text={f} good />)}
          {opp.gap.map((f, i) => <Tag key={`g${i}-${f}`} text={f} />)}
        </div>
      </Card>

      <Card title="Eligibility check">
        {opp.criteriaVerifiedAt && (
          <p className="hint first">
            Requirements last verified {opp.criteriaVerifiedAt} — scholarship rules can change year to year, so confirm on the official page before relying on this.
          </p>
        )}
        <ul className="checks">
          {opp.eligCriteria.map((c) => {
            const unknown = c.pass === null || c.pass === undefined;
            const missingFieldHint = c.check && unknown
              ? c.check.type === "age_max" ? "Add your age in Settings to check this."
                : c.check.type === "experience_min_years" ? "Add your years of work experience in Settings to check this."
                : c.check.type?.startsWith("nationality") ? "Add your nationality in Settings to check this."
                : null
              : null;
            return (
              <li key={c.label} className={c.pass === true ? "ok" : c.pass === false ? "no" : "unk"}>
                {c.pass === true ? <Check size={15} /> : c.pass === false ? <X size={15} /> : <HelpCircle size={15} />}
                <span>{c.label}{missingFieldHint && <small>{missingFieldHint}</small>}</span>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card title="Documents">
        {opp.docs.map((d) => (
          <div key={d.name} className="doc-row">
            <span className="doc-name"><FileText size={14} /> {d.name}</span>
            {guest ? (
              <span className={`status tone-${DOC_TONE[d.status] || "mute"}`}>{d.status}</span>
            ) : (
              <select className={`status-select tone-${DOC_TONE[d.status] || "mute"}`} aria-label={`Status of ${d.name}`}
                value={d.status} onChange={(e) => onDocStatus(opp.id, d.name, e.target.value)}>
                <option value="not started">Not started</option>
                <option value="drafting">Drafting</option>
                <option value="ready">Ready</option>
              </select>
            )}
          </div>
        ))}
        <p className="hint">
          Drafts are built only from facts in your master CV — nothing here is invented. Recommendation letters always require the actual recommender.
        </p>
      </Card>

      <Card title="Next action">
        {guest ? (
          <>
            <div>{opp.nextAction}</div>
            <div className="muted small">by {opp.nextDate}</div>
          </>
        ) : (
          <div className="inline-fields">
            <input value={nextAction} onChange={(e) => setNextAction(e.target.value)} onBlur={saveNextAction}
              placeholder="e.g. Draft leadership essay" aria-label="Next action" />
            <input value={nextDate} onChange={(e) => setNextDate(e.target.value)} onBlur={saveNextAction}
              placeholder="by (any date format)" aria-label="Next action date" className="short" />
          </div>
        )}
      </Card>

      {!guest && (
        <Card title="Notes">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={3} aria-label="Notes"
            placeholder="Your own notes on this one — why you're interested, what a recommender said, anything." />
        </Card>
      )}

      <div className="paper actionbar">
        {guest ? (
          <>
            <span className="muted">Sign up to save this to a pipeline and track your progress.</span>
            <button className="btn btn-primary" onClick={onRequireAuth}>Sign up</button>
          </>
        ) : (
          <>
            <button className="btn btn-primary" onClick={() => onStageChange(opp.id, "preparing")}><Bookmark size={14} /> Save to pipeline</button>
            <button className="btn btn-ghost" onClick={() => onStageChange(opp.id, "submitted")}><Send size={14} /> Mark submitted</button>
            <button className="btn btn-danger" onClick={handleReject}><X size={14} /> Reject with reason</button>
          </>
        )}
      </div>
    </div>
  );
}
