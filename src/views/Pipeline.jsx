import React, { useState } from "react";
import { STAGES, passesCutoff } from "../lib/opps.js";
import { PageHead, ScoreRing, TypeBadge, DeadlineChip } from "../components/ui.jsx";

export default function Pipeline({ opportunities, cutoff = 0, onOpen, onPeek, onStageChange }) {
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  const drop = (stage) => {
    const o = opportunities.find((x) => x.id === dragId);
    setDragId(null); setOverStage(null);
    if (o && o.stage !== stage) onStageChange(o.id, stage);
  };

  return (
    <div className="page page-wide">
      <PageHead eyebrow="Track" title="Pipeline" />
      <div className="board">
        {STAGES.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage.id && passesCutoff(o, cutoff));
          return (
            <section key={stage.id} className={`col${overStage === stage.id ? " over" : ""}`} aria-label={stage.label}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage.id); }}
              onDragLeave={() => setOverStage((s) => (s === stage.id ? null : s))}
              onDrop={(e) => { e.preventDefault(); drop(stage.id); }}>
              <h2 className="col-h">{stage.label} <span>{items.length}</span></h2>
              <div className="col-body">
                {items.map((o) => (
                  <article key={o.id} className={`pcard${dragId === o.id ? " dragging" : ""}`} draggable
                    onDragStart={() => setDragId(o.id)} onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    onClick={() => onOpen(o.id)}>
                    <div className="pcard-top">
                      <TypeBadge type={o.type} />
                      <ScoreRing score={o.score} size={34} onClick={(e) => { e.stopPropagation(); onPeek(o.id); }} />
                    </div>
                    <h3>{o.title}</h3>
                    <div className="muted small">{o.org}</div>
                    <div className="pcard-foot">
                      <DeadlineChip deadline={o.deadline} />
                      <select aria-label={`Move ${o.title} to another stage`} value={o.stage}
                        onClick={(e) => e.stopPropagation()} onChange={(e) => onStageChange(o.id, e.target.value)}>
                        {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </article>
                ))}
                {items.length === 0 && <div className="col-empty">Drop something here</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
