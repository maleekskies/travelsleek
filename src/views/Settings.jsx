import React, { useState } from "react";
import { Search, Download, Trash2, Upload, Check, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { Card, Field, TagInput, PageHead, CutoffControl } from "../components/ui.jsx";

const FIELD_IDEAS = ["Computer Science", "Engineering", "Public Health", "Data Science", "Economics", "Nursing"];
const COUNTRY_IDEAS = ["Germany", "United Kingdom", "Canada", "Australia", "Ireland", "Netherlands"];

export default function SettingsView({ profile, setProfile, saveState, cutoff, setCutoff, opportunities, onImported, onLogout, onClearBoard }) {
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
    try { await onClearBoard(); } finally { setClearing(false); }
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

  const set = (k) => (v) => setProfile((p) => ({ ...p, [k]: v }));

  return (
    <div className="page">
      <PageHead eyebrow="Account" title="Settings">
        <span className={`savestate ${saveState}`} role="status" aria-live="polite">
          {saveState === "saving" && <><Loader2 size={13} className="spin" /> Saving…</>}
          {saveState === "saved" && <><Check size={13} /> All changes saved</>}
          {saveState === "error" && <>Couldn't save — see the message above</>}
        </span>
      </PageHead>

      <div className="settings-grid">
        <div className="col-stack">
          <Card title="Profile">
            <div className="stack">
              <Field label="Full name" value={profile.name} onChange={set("name")} />
              <Field label="Nationality" value={profile.nationality || ""} onChange={set("nationality")} hint="Used to check nationality-based eligibility lines." />
              <div className="two-f">
                <Field label="Age" type="number" value={profile.age ?? ""} onChange={(v) => setProfile((p) => ({ ...p, age: v ? Number(v) : null }))} placeholder="e.g. 27" hint="Checks stated age limits." />
                <Field label="Years of experience" type="number" value={profile.workExperienceYears ?? ""} onChange={(v) => setProfile((p) => ({ ...p, workExperienceYears: v ? Number(v) : null }))} placeholder="e.g. 2.5" hint="Checks experience minimums." />
              </div>
              <Field label="Academic record (GPA, CGPA, or degree class)" value={profile.academicRecord || ""} onChange={set("academicRecord")}
                placeholder="e.g. 3.6/4.0, 8.5/10, or First Class" hint="For your own reference — grading scales vary too much to auto-check." />
            </div>
          </Card>

          <Card title="Preferences">
            <p className="hint first">Open to a wide range? Add as many as you like — leave a list empty to mean "anywhere" / "anything."</p>
            <div className="stack">
              <TagInput label="Field of study / occupation" values={profile.fields || []} onChange={set("fields")} suggestions={FIELD_IDEAS} placeholder="Type one, press Enter" />
              <TagInput label="Target countries" values={profile.countries || []} onChange={set("countries")} suggestions={COUNTRY_IDEAS} placeholder="Type one, press Enter"
                hint="Press Enter to add. Leave blank to see opportunities from any country." />
              <TagInput label="Must-haves" values={profile.mustHaves || []} onChange={set("mustHaves")} placeholder="e.g. fully funded only" />
              <TagInput label="Deal-breakers" values={profile.dealBreakers || []} onChange={set("dealBreakers")} placeholder="e.g. requires spousal sponsorship" />
            </div>
          </Card>

          <Card title="Filters">
            <CutoffControl value={cutoff} onChange={setCutoff} opportunities={opportunities} />
          </Card>
        </div>

        <div className="col-stack">
          <Card title="Digest">
            <p className="hint first">
              Not available yet — sending a daily email needs an email-sending service connected, which isn't set up. This isn't a working toggle right now, so it's not shown as one.
            </p>
          </Card>

          <Card title="Import a PDF compilation">
            <p className="hint first">
              Drop in a PDF (e.g. a Grok compilation of listings). Text is extracted and split into candidate entries,
              landing in your Inbox tagged "review" — nothing is invented, and nothing auto-applies.
            </p>
            <div className="inline-fields">
              <select value={importType} onChange={(e) => setImportType(e.target.value)} aria-label="Import type" className="auto">
                <option value="scholarship">Scholarships</option>
                <option value="visa">Work visas</option>
              </select>
              <label className={`btn btn-ghost${importing ? " disabled" : ""}`}>
                <Upload size={14} /> {importing ? "Importing..." : "Choose PDF"}
                <input type="file" accept="application/pdf" onChange={handlePdfUpload} disabled={importing} hidden />
              </label>
            </div>
            {importMsg && <p className="small msg">{importMsg}</p>}
          </Card>

          <Card title="Check UK sponsor register">
            <p className="hint first">
              Live lookup against the official Home Office register of licensed Skilled Worker sponsors — synced daily, straight from GOV.UK.
            </p>
            <div className="inline-fields">
              <input value={sponsorQuery} onChange={(e) => setSponsorQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && checkSponsor()}
                placeholder="Employer name, e.g. Amazon" aria-label="Employer name" />
              <button onClick={checkSponsor} disabled={sponsorSearching} className="btn btn-ghost">
                <Search size={14} /> {sponsorSearching ? "Checking..." : "Check"}
              </button>
            </div>
            {sponsorResults !== null && (
              <div className="sponsors">
                {sponsorResults.length === 0 ? (
                  <p className="muted small">No licensed sponsor matched that name.</p>
                ) : (
                  sponsorResults.map((s, i) => (
                    <div key={i} className="sponsor">
                      <strong>{s.organisation_name}</strong>
                      <small>{[s.town_city, s.county].filter(Boolean).join(", ")}{s.type_rating ? ` · ${s.type_rating}` : ""}{s.route ? ` · ${s.route}` : ""}</small>
                    </div>
                  ))
                )}
              </div>
            )}
          </Card>

          <Card title="Maintenance & account">
            <div className="row-actions">
              <button className="btn btn-ghost" onClick={exportData}><Download size={14} /> Export data as JSON</button>
              <button className="btn btn-danger" onClick={handleClearBoard} disabled={clearing}><Trash2 size={14} /> {clearing ? "Clearing..." : "Clear board"}</button>
              <button className="btn btn-danger" onClick={onLogout}>Log out</button>
            </div>
          </Card>

          <Card title="Legal">
            <details>
              <summary>Privacy Policy</summary>
              <div className="legal">
                <p>We store your email, a securely hashed password (never the password itself), and whatever profile details you enter (name, nationality, target fields/countries, must-haves, deal-breakers, and your master CV text).</p>
                <p>Your saved opportunities, pipeline stage, and document checklist status are private to your account and not visible to other users.</p>
                <p>PDFs you import are processed to extract text and are not stored as files after processing.</p>
                <p>We don't sell your data or share it with third parties beyond the external services this app queries on your behalf (e.g. GOV.UK, Adzuna) — those calls don't include your personal profile.</p>
              </div>
            </details>
            <details>
              <summary>Terms of Use</summary>
              <div className="legal">
                <p>TravelSleek is an independent aggregator. It is not an immigration lawyer, visa agent, or university, and nothing here is legal or immigration advice.</p>
                <p>Eligibility, scores, and "sponsor" information are estimates to help you prioritize — always confirm details on the official application page before relying on them or applying.</p>
                <p>This is a personal project run on a small scale. There's no uptime guarantee, and features may change without notice.</p>
              </div>
            </details>
          </Card>
        </div>
      </div>
    </div>
  );
}
