import React, { useState, useMemo, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { supabase, rowToOpportunity, mapDbProfile } from "./lib/supabase.js";
import { computeEligibility } from "./lib/eligibility.js";
import { useCutoff } from "./lib/useCutoff.js";
import { isTracked } from "./lib/opps.js";
import Sidebar from "./components/Sidebar.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import Onboarding from "./components/Onboarding.jsx";
import GuestPrompt from "./components/GuestPrompt.jsx";
import ScoreDrawer from "./components/ScoreDrawer.jsx";
import Overview from "./views/Overview.jsx";
import Inbox from "./views/Inbox.jsx";
import Detail from "./views/Detail.jsx";
import Pipeline from "./views/Pipeline.jsx";
import SettingsView from "./views/Settings.jsx";

const BACK_LABEL = { overview: "Back to overview", inbox: "Back to inbox", pipeline: "Back to pipeline" };

function Splash({ children }) {
  return <div className="splash"><span className="brand-dot" aria-hidden="true" /> {children}</div>;
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("travelsleek_token"));
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfileState] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [view, setView] = useState("overview");
  const [openId, setOpenId] = useState(null);
  const [peekId, setPeekId] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveState, setSaveState] = useState("saved"); // "saved" | "saving" | "error"

  const guest = !token;

  // --- profile persistence -------------------------------------------------
  // Edits apply instantly; the save RPC is debounced so typing in Settings
  // doesn't fire one request per keystroke. If a save fails we roll back to
  // the last version the server confirmed.
  const tokenRef = useRef(token);
  const profileRef = useRef(null);
  const lastSaved = useRef(null);
  const timer = useRef(null);
  const dirty = useRef(false);

  const persist = async () => {
    clearTimeout(timer.current);
    if (!dirty.current || !tokenRef.current || !profileRef.current) return;
    dirty.current = false;
    const p = profileRef.current;
    const { error } = await supabase.rpc("save_profile", {
      p_token: tokenRef.current,
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
    if (error) {
      setSaveError(`Couldn't save your profile change: ${error.message}. Please try again.`);
      setSaveState("error");
      if (lastSaved.current && !dirty.current) {
        profileRef.current = lastSaved.current;
        setProfileState(lastSaved.current);
      }
      return;
    }
    lastSaved.current = p;
    if (!dirty.current) setSaveState("saved");
  };

  const setProfile = (updater, opts) => {
    const prev = profileRef.current;
    const next = typeof updater === "function" ? updater(prev) : updater;
    profileRef.current = next;
    setProfileState(next);
    if (!tokenRef.current) return;
    dirty.current = true;
    setSaveState("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(persist, opts?.now ? 0 : 600);
  };

  // Flush a pending save if the tab is being hidden/closed.
  useEffect(() => {
    const flush = () => { if (document.visibilityState === "hidden") persist(); };
    document.addEventListener("visibilitychange", flush);
    return () => document.removeEventListener("visibilitychange", flush);
  }, []);

  const loadProfile = (json) => {
    const p = mapDbProfile(json);
    profileRef.current = p;
    lastSaved.current = p;
    dirty.current = false;
    setProfileState(p);
    setNeedsOnboarding(!p.name);
  };

  const handleAuthed = async (newToken) => {
    localStorage.setItem("travelsleek_token", newToken);
    tokenRef.current = newToken;
    setToken(newToken);
    const { data } = await supabase.rpc("get_profile_by_token", { p_token: newToken });
    loadProfile(data);
    setView("overview");
  };

  const handleLogout = async () => {
    await persist();
    if (token) await supabase.rpc("logout_session", { p_token: token });
    localStorage.removeItem("travelsleek_token");
    tokenRef.current = null;
    profileRef.current = null;
    setToken(null);
    setProfileState(null);
    setNeedsOnboarding(false);
    setOpenId(null);
    setView("overview");
  };

  const handleClearBoard = async () => {
    if (!token) return;
    const { error } = await supabase.rpc("clear_my_pipeline", { p_token: token });
    if (error) {
      setSaveError(`Couldn't clear your board: ${error.message}. Please try again.`);
      return;
    }
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
        tokenRef.current = null;
        setToken(null);
      } else {
        loadProfile(data);
      }
      setAuthChecked(true);
    })();
  }, []);

  // Logged-in users get their own stage/doc overlay via get_my_opportunities.
  // Guests see the shared public feed, read-only, always defaulted to "saved".
  const loadOpportunities = async () => {
    if (token) {
      const { data, error } = await supabase.rpc("get_my_opportunities", { p_token: token });
      if (error) { setSaveError(`Couldn't load your opportunities: ${error.message}.`); return; }
      if (data) setOpportunities(data.map(rowToOpportunity));
      return;
    }
    const { data, error } = await supabase
      .from("opportunities")
      .select("*")
      .order("score", { ascending: false });
    if (error) { setSaveError(`Couldn't load opportunities: ${error.message}.`); return; }
    if (data) {
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
    const prev = opportunities;
    setOpportunities((list) => list.map((o) => ids.includes(o.id) ? { ...o, stage } : o));
    const results = await Promise.all(ids.map((id) => supabase.rpc("set_opportunity_stage", { p_token: token, p_external_id: id, p_stage: stage })));
    const failed = results.some((r) => r.error);
    if (failed) {
      setSaveError("Couldn't save one or more of those changes. Please try again.");
      setOpportunities(prev);
    }
  };
  const handleStageChange = async (id, stage, reason) => {
    if (guest) return requireAuth();
    const prev = opportunities;
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, stage } : o));
    setOpenId(null);
    const { error } = await supabase.rpc("set_opportunity_stage", { p_token: token, p_external_id: id, p_stage: stage });
    if (error) {
      setSaveError(`Couldn't save that change: ${error.message}. Please try again.`);
      setOpportunities(prev);
      return;
    }
    if (reason) {
      const opp = opportunities.find((o) => o.id === id);
      const newNotes = opp?.notes ? `${opp.notes}\n\nRejected: ${reason}` : `Rejected: ${reason}`;
      setOpportunities((list) => list.map((o) => o.id === id ? { ...o, notes: newNotes } : o));
      const { error: notesError } = await supabase.rpc("set_opportunity_notes", { p_token: token, p_external_id: id, p_notes: newNotes });
      if (notesError) setSaveError(`Marked as rejected, but couldn't save the reason: ${notesError.message}`);
    }
  };
  const handleDocStatus = async (id, docName, status) => {
    if (guest) return requireAuth();
    const opp = opportunities.find((o) => o.id === id);
    if (!opp) return;
    const prevDocs = opp.docs;
    const newDocs = opp.docs.map((d) => d.name === docName ? { ...d, status } : d);
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, docs: newDocs } : o));
    const { error } = await supabase.rpc("set_opportunity_docs", { p_token: token, p_external_id: id, p_docs: newDocs });
    if (error) {
      setSaveError(`Couldn't save that document status: ${error.message}. Please try again.`);
      setOpportunities((list) => list.map((o) => o.id === id ? { ...o, docs: prevDocs } : o));
    }
  };
  const handleNotesChange = async (id, notes) => {
    if (guest) return requireAuth();
    const opp = opportunities.find((o) => o.id === id);
    const prevNotes = opp?.notes;
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, notes } : o));
    const { error } = await supabase.rpc("set_opportunity_notes", { p_token: token, p_external_id: id, p_notes: notes });
    if (error) {
      setSaveError(`Couldn't save your notes: ${error.message}. Please try again.`);
      setOpportunities((list) => list.map((o) => o.id === id ? { ...o, notes: prevNotes } : o));
    }
  };
  const handleNextActionChange = async (id, nextAction, nextDate) => {
    if (guest) return requireAuth();
    const opp = opportunities.find((o) => o.id === id);
    const prevAction = opp?.nextAction, prevDate = opp?.nextDate;
    setOpportunities((list) => list.map((o) => o.id === id ? { ...o, nextAction, nextDate } : o));
    const { error } = await supabase.rpc("set_opportunity_next_action", { p_token: token, p_external_id: id, p_next_action: nextAction, p_next_date: nextDate });
    if (error) {
      setSaveError(`Couldn't save that next action: ${error.message}. Please try again.`);
      setOpportunities((list) => list.map((o) => o.id === id ? { ...o, nextAction: prevAction, nextDate: prevDate } : o));
    }
  };

  const displayOpportunities = useMemo(
    () => guest || !profile ? opportunities : opportunities.map((o) => computeEligibility(o, profile)),
    [opportunities, profile, guest]
  );
  const openOpp = displayOpportunities.find((o) => o.id === openId);
  const peekOpp = displayOpportunities.find((o) => o.id === peekId) || null;
  const [cutoff, setCutoff] = useCutoff(profile, setProfile, guest);
  const pipelineCount = useMemo(
    () => displayOpportunities.filter((o) => isTracked(o) && !["archived", "rejected"].includes(o.stage)).length,
    [displayOpportunities]
  );

  if (!authChecked) return <Splash>Loading…</Splash>;

  if (view === "auth") return <AuthScreen onAuthed={handleAuthed} onCancel={guest ? () => setView("overview") : null} />;

  if (token && !profile) return <Splash>Loading your profile…</Splash>;

  if (token && profile && needsOnboarding) {
    return <Onboarding onComplete={(p) => { setProfile(p, { now: true }); setNeedsOnboarding(false); setView("overview"); }} />;
  }

  if (loading) return <Splash>Loading opportunities…</Splash>;

  const detail = openId && (
    <Detail key={openOpp?.id} opp={openOpp} backLabel={BACK_LABEL[view] || "Back"} onBack={() => setOpenId(null)}
      onStageChange={handleStageChange} onDocStatus={handleDocStatus} onNotesChange={handleNotesChange}
      onNextActionChange={handleNextActionChange} guest={guest} onRequireAuth={requireAuth} />
  );

  return (
    <div className="app">
      {saveError && (
        <div role="alert" className="toast-error">
          <span>{saveError}</span>
          <button onClick={() => setSaveError(null)} aria-label="Dismiss error" className="icon-btn"><X size={16} /></button>
        </div>
      )}
      <header className="mobile-bar">
        <button onClick={() => setMobileNavOpen(true)} className="mobile-menu-btn icon-btn" aria-label="Open menu"><Menu size={20} /></button>
        <span className="brand-mark"><span className="brand-dot" aria-hidden="true" />TravelSleek</span>
      </header>
      <Sidebar view={view} setView={(v) => { setView(v); setOpenId(null); }} profile={profile} guest={guest}
        mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} counts={{ pipeline: guest ? 0 : pipelineCount }} />
      <main className="main">
        {view === "overview" && (openId ? detail : (
          <Overview opportunities={displayOpportunities} profile={profile} guest={guest} cutoff={cutoff}
            onPeek={setPeekId} onOpen={setOpenId} setView={(v) => { setView(v); setOpenId(null); }} />
        ))}
        {view === "inbox" && (openId ? detail : (
          <Inbox opportunities={displayOpportunities} onOpen={setOpenId} onPeek={setPeekId} onBulk={handleBulk}
            onSync={handleSync} syncing={syncing} guest={guest} onRequireAuth={requireAuth} cutoff={cutoff} setCutoff={setCutoff} />
        ))}
        {view === "pipeline" && !guest && (openId ? detail : (
          <Pipeline opportunities={displayOpportunities} cutoff={cutoff} onOpen={setOpenId} onPeek={setPeekId} onStageChange={handleStageChange} />
        ))}
        {view === "pipeline" && guest && <GuestPrompt message="Sign up to track opportunities through a pipeline — saved, preparing, submitted, decision." onSignUp={requireAuth} />}
        {view === "settings" && !guest && (
          <SettingsView profile={profile} setProfile={setProfile} saveState={saveState} cutoff={cutoff} setCutoff={setCutoff}
            opportunities={displayOpportunities} onImported={loadOpportunities} onLogout={handleLogout} onClearBoard={handleClearBoard} />
        )}
        {view === "settings" && guest && <GuestPrompt message="Sign up to save your profile, preferences, and import PDFs." onSignUp={requireAuth} />}
      </main>
      <ScoreDrawer opp={peekOpp} onClose={() => setPeekId(null)} onOpen={(id) => { setOpenId(id); }} />
    </div>
  );
}
