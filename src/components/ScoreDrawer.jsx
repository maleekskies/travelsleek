import React, { useEffect } from "react";
import { Check, X, HelpCircle, ExternalLink } from "lucide-react";
import { ScoreRing, EligStamp, Tag, TypeBadge, DeadlineChip } from "./ui.jsx";

// Quick-look panel opened from the score ring — the "why this score" answer
// without leaving the list.
export default function ScoreDrawer({ opp, onClose, onOpen }) {
  useEffect(() => {
    if (!opp) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opp, onClose]);

  if (!opp) return null;
  const crit = opp.eligCriteria || [];
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Score breakdown for ${opp.title}`}>
        <button className="icon-btn drawer-x" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <div className="drawer-head">
          <ScoreRing score={opp.score} size={72} />
          <div>
            <div className="meta"><TypeBadge type={opp.type} /><EligStamp status={opp.eligibility} /></div>
            <h2>{opp.title}</h2>
            <div className="sub">{opp.org} · {opp.country}</div>
          </div>
        </div>
        <p className="reason">{opp.reason}</p>
        <div className="tags">
          {opp.fit.map((f, i) => <Tag key={`f${i}-${f}`} text={f} good />)}
          {opp.gap.map((f, i) => <Tag key={`g${i}-${f}`} text={f} />)}
        </div>
        <h4>What we checked</h4>
        <ul className="checks">
          {crit.length === 0 && <li className="unk"><HelpCircle size={15} /> No structured criteria on file yet.</li>}
          {crit.map((c) => (
            <li key={c.label} className={c.pass === true ? "ok" : c.pass === false ? "no" : "unk"}>
              {c.pass === true ? <Check size={15} /> : c.pass === false ? <X size={15} /> : <HelpCircle size={15} />}
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
        <div className="drawer-foot">
          <DeadlineChip deadline={opp.deadline} long />
          <div className="row">
            {opp.sourceUrl && (
              <a className="btn btn-ghost" href={opp.sourceUrl} target="_blank" rel="noopener noreferrer">Official page <ExternalLink size={14} /></a>
            )}
            <button className="btn btn-primary" onClick={() => { onOpen(opp.id); onClose(); }}>Open full details</button>
          </div>
        </div>
      </aside>
    </>
  );
}
