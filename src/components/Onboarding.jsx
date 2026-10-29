import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Field, TagInput } from "./ui.jsx";
import Contours from "./Contours.jsx";

const STEPS = ["Profile", "Targets", "Filters", "Master CV"];
const FIELD_IDEAS = ["Computer Science", "Engineering", "Public Health", "Data Science", "Economics", "Nursing"];
const COUNTRY_IDEAS = ["Germany", "United Kingdom", "Canada", "Australia", "Ireland", "Netherlands"];

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState({
    name: "", fields: [], nationality: "", degreeLevel: "Master's",
    countries: [], mustHaves: [], dealBreakers: [], cv: "",
    age: "", workExperienceYears: "", academicRecord: "",
  });
  const update = (k, v) => setProfile((p) => ({ ...p, [k]: v }));

  return (
    <div className="stage-screen">
      <Contours className="contours-bg" seed={3} rings={12} />
      <div className="paper onboard">
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>
              <span className="bar" />
              <span className="lbl">{s}</span>
            </li>
          ))}
        </ol>

        <h2>
          {step === 0 && "Who's applying?"}
          {step === 1 && "Where are you headed?"}
          {step === 2 && "Must-haves and deal-breakers"}
          {step === 3 && "Your master CV"}
        </h2>
        <p className="lede">
          {step === 0 && "This grounds every eligibility check — nothing is invented beyond what you enter here."}
          {step === 1 && "Countries, degree level, and field shape which scholarships and visa routes get scanned. Age, experience, and academic record let us actually check age limits and experience minimums instead of just listing them."}
          {step === 2 && "Used to downrank or exclude opportunities automatically."}
          {step === 3 && "Paste it in. Kits and checklists are only ever built from facts found here."}
        </p>

        {step === 0 && (
          <div className="stack">
            <Field label="Full name" value={profile.name} onChange={(v) => update("name", v)} />
            <TagInput label="Field of study / occupation" values={profile.fields} onChange={(v) => update("fields", v)} suggestions={FIELD_IDEAS}
              placeholder="Type one, press Enter — add as many as you're open to" />
            <Field label="Nationality" value={profile.nationality} onChange={(v) => update("nationality", v)} />
            <Field label="Age" type="number" value={profile.age} onChange={(v) => update("age", v)} placeholder="e.g. 27"
              hint={'Used only to check age limits some scholarships state (e.g. "under 30").'} />
          </div>
        )}
        {step === 1 && (
          <div className="stack">
            <div className="field">
              <label htmlFor="ob-degree">Degree level (for scholarships)</label>
              <select id="ob-degree" value={profile.degreeLevel} onChange={(e) => update("degreeLevel", e.target.value)}>
                <option>Bachelor's</option><option>Master's</option><option>PhD</option><option>N/A — visa route only</option>
              </select>
            </div>
            <TagInput label="Target countries" values={profile.countries} onChange={(v) => update("countries", v)} suggestions={COUNTRY_IDEAS}
              placeholder="Type one, press Enter — leave empty for anywhere" hint="Press Enter to add. Leave blank to see opportunities from any country." />
            <Field label="Years of relevant work experience" type="number" value={profile.workExperienceYears} onChange={(v) => update("workExperienceYears", v)}
              placeholder="e.g. 2.5" hint={"Checked against minimums like \"at least 2 years' experience.\""} />
            <Field label="Academic record (GPA, CGPA, or degree class)" value={profile.academicRecord} onChange={(v) => update("academicRecord", v)}
              placeholder="e.g. 3.6/4.0, 8.5/10, or First Class" hint="Shown for your own reference — grading scales vary too much to auto-check reliably." />
          </div>
        )}
        {step === 2 && (
          <div className="stack">
            <TagInput label="Must-haves" values={profile.mustHaves} onChange={(v) => update("mustHaves", v)} placeholder="e.g. fully funded only — press Enter" />
            <TagInput label="Deal-breakers" values={profile.dealBreakers} onChange={(v) => update("dealBreakers", v)} placeholder="e.g. requires spousal sponsorship — press Enter" />
          </div>
        )}
        {step === 3 && (
          <Field label="Paste your CV / background" value={profile.cv} onChange={(v) => update("cv", v)} area tall
            placeholder="Education, work history, publications, test scores…" />
        )}

        <div className="onboard-nav">
          <button className="btn btn-quiet" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft size={15} /> Back
          </button>
          {step < 3 ? (
            <button className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>Continue <ChevronRight size={15} /></button>
          ) : (
            <button className="btn btn-primary" onClick={() => onComplete({
              ...profile,
              age: profile.age ? Number(profile.age) : null,
              workExperienceYears: profile.workExperienceYears ? Number(profile.workExperienceYears) : null,
            })}>Enter Inbox <ChevronRight size={15} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
