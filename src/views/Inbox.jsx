import React, { useEffect, useMemo, useState } from "react";
import { Search, Archive, Bookmark, ArrowUpDown, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { daysUntil, formatRelativeTime } from "../lib/dates.js";
import { SOURCES, SETTLED, passesCutoff, byDeadline } from "../lib/opps.js";
import { PageHead, ScoreRing, TypeBadge, EligStamp, DeadlineChip, Tag, CutoffControl } from "../components/ui.jsx";

export default function Inbox({ opportunities, onOpen, onPeek, onBulk, onSync, syncing, guest, onRequireAuth, cutoff, setCutoff }) {
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState("score");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [lastSynced, setLastSynced] = useState(null);
  const [showCutoff, setShowCutoff] = useState(false);

  useEffect(() => {
    supabase.from("sync_log").select("ran_at").order("ran_at", { ascending: false }).limit(1).maybeSingle()
      .then(({ data }) => { if (data?.ran_at) setLastSynced(data.ran_at); });
  }, [syncing]);

  const hidden = useMemo(
    () => opportunities.filter((o) => !passesCutoff(o, cutoff)).length,
    [opportunities, cutoff]
  );

  const filtered = useMemo(() => {
    let list = opportunities.filter((o) => tab === "all" || o.type === tab);
    list = list.filter((o) => passesCutoff(o, cutoff));
    if (query) list = list.filter((o) => (o.title + o.org + o.country).toLowerCase().includes(query.toLowerCase()));
    return [...list].sort((a, b) => (sort === "score" ? b.score - a.score : byDeadline(a, b)));
  }, [opportunities, tab, query, sort, cutoff]);

  const urgentCount = useMemo(
    () => opportunities.filter((o) => {
      const d = daysUntil(o.deadline);
      return d !== null && d >= 0 && d <= 7 && !SETTLED.includes(o.stage);
    }).length,
    [opportunities]
  );

  // Drop selections that are no longer visible (filtered out, or bulk-moved).
  const visibleSelected = selected.filter((id) => filtered.some((o) => o.id === id));
  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="page">
      {guest && (
        <div className="banner banner-warn">
          <span>Browsing as a guest — your saves and progress won't be kept.</span>
          <button onClick={onRequireAuth} className="link">Sign up</button>
        </div>
      )}
      {urgentCount > 0 && (
        <div className="banner banner-bad">
          {urgentCount} {urgentCount === 1 ? "deadline is" : "deadlines are"} within a week — sort by Deadline to see which first.
        </div>
      )}

      <PageHead eyebrow="Matches" title="Inbox">
        {lastSynced && <span className="muted small">Last synced {formatRelativeTime(lastSynced)}</span>}
        <button onClick={onSync} disabled={syncing} className="btn btn-ghost">
          {syncing ? <Loader2 size={14} className="spin" /> : <RefreshCw size={14} />} {syncing ? "Syncing..." : "Sync now"}
        </button>
      </PageHead>

      <p className="muted small sources">Live sources: GOV.UK, IRCC Open Data · Curated: {SOURCES.scholarship.join(" · ")}</p>
      <p className="muted small">Untouched job listings and PDF imports are removed after 30 days — scholarship and visa-route entries don't expire. Nothing here submits itself.</p>

      <div className="toolbar">
        <div className="tabs" role="tablist">
          {[["all", "All"], ["scholarship", "Scholarships"], ["visa", "Work visas"]].map(([id, label]) => (
            <button key={id} role="tab" aria-selected={tab === id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>
        <div className="search">
          <Search size={14} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search opportunities" aria-label="Search opportunities" />
        </div>
        <button onClick={() => setSort(sort === "score" ? "deadline" : "score")} className="btn btn-ghost">
          <ArrowUpDown size={14} /> Sort: {sort === "score" ? "Score" : "Deadline"}
        </button>
        <button className={`btn btn-ghost${cutoff > 0 ? " active" : ""}`} aria-expanded={showCutoff} onClick={() => setShowCutoff((v) => !v)}>
          Min score{cutoff > 0 ? `: ${cutoff}` : ""}
        </button>
      </div>

      {showCutoff && (
        <div className="paper cutoff-pop">
          <CutoffControl compact value={cutoff} onChange={setCutoff} opportunities={opportunities} />
        </div>
      )}

      {hidden > 0 && !showCutoff && (
        <p className="muted small">{hidden} below your {cutoff}-score cutoff {hidden === 1 ? "is" : "are"} hidden. <button className="link" onClick={() => setShowCutoff(true)}>Adjust</button></p>
      )}

      {visibleSelected.length > 0 && (
        <div className="bulkbar" role="region" aria-label="Bulk actions">
          <span>{visibleSelected.length} selected</span>
          <button className="btn btn-soft" onClick={() => { onBulk(visibleSelected, "saved"); setSelected([]); }}><Bookmark size={14} /> Save</button>
          <button className="btn btn-soft" onClick={() => { onBulk(visibleSelected, "archived"); setSelected([]); }}><Archive size={14} /> Archive</button>
          <button className="btn btn-quiet" onClick={() => setSelected([])}>Clear</button>
        </div>
      )}

      <div className="list">
        {filtered.map((o) => (
          <article key={o.id} className="row" onClick={() => onOpen(o.id)}>
            <input type="checkbox" checked={selected.includes(o.id)} onClick={(e) => e.stopPropagation()}
              onChange={() => toggle(o.id)} aria-label={`Select ${o.title}`} />
            <div className="row-score" onClick={(e) => e.stopPropagation()}><ScoreRing score={o.score} onClick={() => onPeek(o.id)} /></div>
            <div className="row-main">
              <div className="meta">
                <TypeBadge type={o.type} />
                <EligStamp status={o.eligibility} />
                <span className="muted small">{o.org} · {o.country}</span>
              </div>
              <h3><button className="row-title" onClick={(e) => { e.stopPropagation(); onOpen(o.id); }}>{o.title}</button></h3>
              <p className="reason">{o.reason}</p>
              <div className="tags">
                {o.fit.map((f, i) => <Tag key={`f${i}-${f}`} text={f} good />)}
                {o.gap.map((f, i) => <Tag key={`g${i}-${f}`} text={f} />)}
              </div>
            </div>
            <div className="row-dl"><DeadlineChip deadline={o.deadline} /></div>
          </article>
        ))}
        {filtered.length === 0 && <div className="empty">Nothing matches. Try a different search or tab{cutoff > 0 ? ", or lower your minimum score" : ""}.</div>}
      </div>
    </div>
  );
}
