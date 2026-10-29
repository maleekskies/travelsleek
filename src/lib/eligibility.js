// Eligibility engine — actually evaluates what we can check (degree level,
// field, deal-breakers, must-haves) against the profile, instead of leaving
// every criterion permanently unconfirmed. Anything we genuinely can't
// verify (nationality lists, work-experience years, etc.) stays pass: null
// rather than being guessed at.
//
// Moved verbatim from the original App.jsx — behaviour is unchanged.

const FIELD_WILDCARDS = ["any", "various", "varies by program", "any eligible occupation", "any recognized degree"];
const COUNTRY_WILDCARDS = ["multiple", "multiple (eu)"];
const NEGATION_WORDS = ["no ", "not ", "without ", "non-", "never ", "isn't ", "doesn't ", "won't ", "excludes ", "excluding ", "no need for "];

// Finds a phrase in text and reports whether it's negated ("no bond", "not required")
// right before it — a plain substring match can't tell "has a bond" from "no bond."
function affirmativeMatch(haystack, phrase) {
  const p = phrase.toLowerCase();
  const idx = haystack.indexOf(p);
  if (idx === -1) return { found: false, negated: false };
  const preceding = haystack.slice(Math.max(0, idx - 25), idx);
  const negated = NEGATION_WORDS.some((w) => preceding.endsWith(w));
  return { found: true, negated };
}

// A few common country-name variants so "UK" / "South Korea" / "USA" etc. match
// the canonical names stored in each scholarship's nationality rules.
const NATIONALITY_ALIASES = {
  "uk": "united kingdom", "britain": "united kingdom", "great britain": "united kingdom",
  "england": "united kingdom", "scotland": "united kingdom", "wales": "united kingdom",
  "usa": "united states", "us": "united states", "america": "united states",
  "korea": "south korea", "republic of korea": "south korea",
  "uae": "united arab emirates",
};
function normalizeNationality(n) {
  const lower = (n || "").trim().toLowerCase();
  return NATIONALITY_ALIASES[lower] || lower;
}

export function computeEligibility(opp, profile) {
  if (!profile) return opp;

  const computedCriteria = [];
  let hardFail = false;
  let softReview = false;

  // Degree level — a hard requirement when the opportunity states one.
  if (opp.degree && opp.degree !== "N/A") {
    const wantsVisaOnly = profile.degreeLevel === "N/A — visa route only";
    const degreeOk = !wantsVisaOnly && opp.degree.includes(profile.degreeLevel);
    computedCriteria.push({ label: `Degree level matches your profile (${profile.degreeLevel})`, pass: degreeOk });
    if (!degreeOk) hardFail = true;
  }

  // Field of study/occupation — soft signal, since categorization is fuzzy.
  const fieldIsWildcard = opp.field && FIELD_WILDCARDS.includes(opp.field.toLowerCase());
  if (profile.fields?.length > 0 && !fieldIsWildcard && opp.field) {
    const fieldOk = profile.fields.some((f) =>
      opp.field.toLowerCase().includes(f.toLowerCase()) || f.toLowerCase().includes(opp.field.toLowerCase())
    );
    computedCriteria.push({ label: `Field matches one you listed (${profile.fields.join(", ")})`, pass: fieldOk });
    if (!fieldOk) softReview = true;
  }

  const haystack = `${opp.title} ${opp.reason} ${(opp.fit || []).join(" ")} ${(opp.gap || []).join(" ")} ${opp.field || ""} ${opp.degree || ""}`.toLowerCase();

  // Deal-breakers — an affirmed (non-negated) match is a hard stop.
  // A negated match ("no bond required") is actually reassuring, not a fail.
  (profile.dealBreakers || []).forEach((db) => {
    const { found, negated } = affirmativeMatch(haystack, db.toLowerCase());
    if (found && !negated) {
      computedCriteria.push({ label: `Deal-breaker mentioned: "${db}"`, pass: false });
      hardFail = true;
    } else if (found && negated) {
      computedCriteria.push({ label: `Explicitly rules out "${db}"`, pass: true });
    }
  });

  // Must-haves — an affirmed match satisfies it; a negated match clearly fails it;
  // no mention at all is unconfirmed, not assumed missing.
  (profile.mustHaves || []).forEach((mh) => {
    const { found, negated } = affirmativeMatch(haystack, mh.toLowerCase());
    const pass = !found ? null : negated ? false : true;
    computedCriteria.push({ label: `Must-have mentioned: "${mh}"`, pass });
    if (pass !== true) softReview = true;
  });

  // Resolve any stored criteria that carry a structured, checkable rule
  // (age limits, work experience, nationality) against the profile's actual data.
  // GPA/CGPA, degree class, and anything else without a "check" stays exactly
  // as stored — grading scales don't compare reliably enough to automate.
  const myNationality = normalizeNationality(profile.nationality);
  const resolvedStoredCriteria = (opp.eligCriteria || []).map((c) => {
    if (!c.check) return c;
    if (c.check.type === "age_max") {
      if (profile.age == null) return c;
      const pass = profile.age <= c.check.value;
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "experience_min_years") {
      if (profile.workExperienceYears == null) return c;
      const pass = profile.workExperienceYears >= c.check.value;
      if (!pass) softReview = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "nationality_exclude") {
      if (!myNationality) return c;
      const pass = myNationality !== normalizeNationality(c.check.value);
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "nationality_include_list") {
      if (!myNationality) return c;
      const pass = c.check.value.some((v) => normalizeNationality(v) === myNationality);
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    if (c.check.type === "nationality_exclude_list") {
      if (!myNationality) return c;
      const pass = !c.check.value.some((v) => normalizeNationality(v) === myNationality);
      if (!pass) hardFail = true;
      return { label: c.label, pass };
    }
    return c;
  });

  const mergedCriteria = [...computedCriteria, ...resolvedStoredCriteria];
  const anyUnconfirmed = mergedCriteria.some((c) => c.pass === null || c.pass === undefined);

  let eligibility;
  if (hardFail) eligibility = "not eligible";
  else if (softReview || anyUnconfirmed) eligibility = "review";
  else eligibility = "eligible";

  // Country targeting is a preference, not an eligibility rule — surface it as a tag instead.
  const extraFit = [...(opp.fit || [])];
  const extraGap = [...(opp.gap || [])];
  const countryIsWildcard = opp.country && COUNTRY_WILDCARDS.includes(opp.country.toLowerCase());
  if (profile.countries?.length > 0 && opp.country && !countryIsWildcard) {
    const inTargets = profile.countries.some((c) => c.toLowerCase() === opp.country.toLowerCase());
    if (inTargets) extraFit.push("Matches a target country");
    else extraGap.push("Outside your target countries");
  }

  return { ...opp, eligCriteria: mergedCriteria, eligibility, fit: extraFit, gap: extraGap };
}
