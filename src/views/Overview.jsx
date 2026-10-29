import React, { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { PageHead, ScoreRing, TypeBadge, DeadlineChip } from "../components/ui.jsx";
import Contours from "../components/Contours.jsx";
import { daysUntil, dayFromToday, formatDay, deadlineInfo, greeting } from "../lib/dates.js";
import { SETTLED, passesCutoff, isLive, byDeadline } from "../lib/opps.js";

const HORIZON = 90;
const W = 680, H = 172, PAD = 22, AXIS = 134;

function Timeline({ items, onPeek }) {
  const x = (d) => PAD + (d / HORIZON) * (W - PAD * 2);
  const ticks = [0, 30, 60, 90];
  const pts = items.map((o, i) => {
    const d = daysUntil(o.deadline);
    return { o, d, cx: x(d), cy: AXIS - 26 - (i % 4) * 28 };
  });
  return (
    <svg className="timeline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Deadlines over the next 90 days">
      <line x1={PAD} x2={W - PAD} y1={AXIS} y2={AXIS} className="tl-axis" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={AXIS} y2={AXIS + 6} className="tl-axis" />
          <text x={x(t)} y={AXIS + 22} textAnchor={t === 0 ? "start" : t === HORIZON ? "end" : "middle"} className="tl-label">
            {t === 0 ? "Today" : formatDay(dayFromToday(t))}
          </text>
        </g>
      ))}
      {pts.map(({ o, d, cx, cy }, i) => {
        const tone = deadlineInfo(o.deadline).tone;
        return (
          <g key={o.id} className={`tl-pt tl-${tone}`} tabIndex={0} role="button" aria-label={`${o.title}, ${d} days left`}
            onClick={() => onPeek(o.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onPeek(o.id))}>
            <line x1={cx} x2={cx} y1={cy} y2={AXIS} className="tl-stem" />
            <circle cx={cx} cy={cy} r="7" />
            {i < 4 && (
              <text x={cx > W - 190 ? cx - 12 : cx + 12} y={cy + 4} textAnchor={cx > W - 190 ? "end" : "start"} className="tl-name">
                {o.title.length > 24 ? `${o.title.slice(0, 23)}…` : o.title}
              </text>
            )}
            <title>{`${o.title} — ${deadlineInfo(o.deadline).long}`}</title>
          </g>
        );
      })}
    </svg>
  );
}

export default function Overview({ opportunities, profile, guest, cutoff, onPeek, onOpen, setView }) {
  const data = useMemo(() => {
    const active = opportunities.filter((o) => !SETTLED.includes(o.stage) && isLive(o) && passesCutoff(o, cutoff));
    const dated = active.filter((o) => daysUntil(o.deadline) !== null).sort(byDeadline);
    const inWindow = dated.filter((o) => daysUntil(o.deadline) <= HORIZON);
    const closing = dated.filter((o) => daysUntil(o.deadline) <= 21);
    const tracked = opportunities.filter((o) => ["preparing", "submitted", "interview"].includes(o.stage));
    const eligible = active.filter((o) => o.eligibility === "eligible");
    const actions = opportunities
      .filter((o) => ["preparing", "submitted", "interview"].includes(o.stage) && o.nextAction)
      .sort(byDeadline).slice(0, 4);
    const best = [...active].sort((a, b) => b.score - a.score).slice(0, 3);
    return { active, dated, inWindow, closing, tracked, eligible, actions, best, beyond: dated.length - inWindow.length };
  }, [opportunities, cutoff]);

  const first = (profile?.name || "").split(" ")[0];

  return (
    <div className="page">
      <section className="hero">
        <Contours className="contours-bg" seed={1} rings={11} />
        <div className="hero-in">
          <div className="eyebrow">{guest ? "Browsing as a guest" : "Your case file"}</div>
          <h1>{greeting()}{first ? `, ${first}` : ""}.</h1>
          <p>
            {data.closing.length > 0
              ? <><strong>{data.closing.length}</strong> {data.closing.length === 1 ? "deadline closes" : "deadlines close"} in the next three weeks.</>
              : "Nothing closes in the next three weeks."}{" "}
            {data.eligible.length > 0 && <><strong>{data.eligible.length}</strong> {data.eligible.length === 1 ? "match is" : "matches are"} fully eligible.</>}
          </p>
        </div>
        <dl className="stats">
          <div><dt>Open matches</dt><dd>{data.active.length}</dd></div>
          <div><dt>Closing ≤ 21 days</dt><dd className={data.closing.length ? "hot" : ""}>{data.closing.length}</dd></div>
          <div><dt>In your pipeline</dt><dd>{guest ? "—" : data.tracked.length}</dd></div>
        </dl>
      </section>

      <section className="paper panel">
        <header className="panel-h">
          <h2>Next 90 days</h2>
          <div className="legend"><i className="hot" /> ≤ 21 days <i className="warm" /> ≤ 45 <i className="cool" /> later</div>
        </header>
        {data.inWindow.length === 0 ? (
          <p className="empty">No dated deadlines in the next 90 days{data.active.length ? " — the rest are rolling." : "."}</p>
        ) : (
          <Timeline items={data.inWindow} onPeek={onPeek} />
        )}
        {data.beyond > 0 && <p className="hint">+ {data.beyond} more closing after 90 days.</p>}
      </section>

      <div className="two">
        <section className="paper panel">
          <header className="panel-h">
            <h2>Closing soonest</h2>
            <button className="btn btn-quiet" onClick={() => setView("inbox")}>All in Inbox <ChevronRight size={14} /></button>
          </header>
          {data.dated.slice(0, 5).map((o) => (
            <button key={o.id} className="mini-row" onClick={() => onPeek(o.id)}>
              <ScoreRing score={o.score} size={38} />
              <span className="mini-main"><strong>{o.title}</strong><small>{o.org} · {o.country}</small></span>
              <DeadlineChip deadline={o.deadline} />
            </button>
          ))}
          {data.dated.length === 0 && <p className="empty">Nothing dated to show.</p>}
        </section>

        <section className="paper panel">
          <header className="panel-h">
            <h2>{guest ? "Highest fit" : "Your next actions"}</h2>
            {!guest && <button className="btn btn-quiet" onClick={() => setView("pipeline")}>Pipeline <ChevronRight size={14} /></button>}
          </header>
          {guest || data.actions.length === 0 ? (
            <>
              {guest ? null : <p className="empty">No next actions yet — move something into Preparing and add one.</p>}
              {data.best.map((o) => (
                <button key={o.id} className="mini-row" onClick={() => onPeek(o.id)}>
                  <ScoreRing score={o.score} size={38} />
                  <span className="mini-main"><strong>{o.title}</strong><small><TypeBadge type={o.type} /></small></span>
                  <DeadlineChip deadline={o.deadline} />
                </button>
              ))}
            </>
          ) : (
            data.actions.map((o) => (
              <button key={o.id} className="mini-row" onClick={() => onOpen(o.id)}>
                <span className="mini-main"><strong>{o.nextAction}</strong><small>{o.title}{o.nextDate ? ` · by ${o.nextDate}` : ""}</small></span>
                <ChevronRight size={16} />
              </button>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
