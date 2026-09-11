import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tsgbrupkcejntodznspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ2JydXBrY2VqbnRvZHpuc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTc1OTQsImV4cCI6MjEwNDMzMzU5NH0.6QyuO7-4cCy97Yly8sPUTE7omOyBtfu0oFUhoGxJgK0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const config = {
  maxDuration: 30,
};

// GOV.UK Content API pages we treat as live UK visa sources.
const GOVUK_PAGES = [
  { slug: "skilled-worker-visa", external_id: "govuk-skilled-worker-visa", title: "Skilled Worker visa", org: "UK Skilled Worker Route" },
  { slug: "global-talent", external_id: "govuk-global-talent-visa", title: "Global Talent visa", org: "UK Global Talent Route" },
];

const IRCC_PACKAGE_ID = "593e9165-c6ce-4f9b-b519-03d315f92cd4"; // Express Entry invited candidates dataset

const ADZUNA_APP_ID = "5830ec57";
const ADZUNA_APP_KEY = "ce9bfda20fc2b88c6499bcfd48675598";
const ADZUNA_COUNTRIES = {
  gb: "United Kingdom",
  us: "United States",
  au: "Australia",
  ca: "Canada",
  de: "Germany",
};

async function syncGovUk() {
  let newCount = 0, updatedCount = 0;
  for (const page of GOVUK_PAGES) {
    try {
      const res = await fetch(`https://www.gov.uk/api/content/${page.slug}`);
      if (!res.ok) continue;
      const data = await res.json();
      const description = (data.description || "").slice(0, 300);
      const updatedAt = data.updated_at || data.public_updated_at || null;

      const { data: existing } = await supabase
        .from("opportunities")
        .select("id")
        .eq("external_id", page.external_id)
        .maybeSingle();

      const row = {
        external_id: page.external_id,
        type: "visa",
        org: page.org,
        title: page.title,
        country: "United Kingdom",
        degree: "N/A",
        field: "Any eligible occupation",
        deadline: "Rolling",
        score: 60,
        reason: description || "Official UK government route — see GOV.UK for current requirements.",
        fit: ["Official GOV.UK source"],
        gap: [],
        eligibility: "review",
        elig_criteria: [{ label: "Check current criteria on GOV.UK", pass: null }],
        docs: [],
        next_action: "Review current requirements on GOV.UK",
        next_date: null,
        stage: "saved",
        source: "govuk-content-api",
        source_url: `https://www.gov.uk/${page.slug}`,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        await supabase.from("opportunities").update(row).eq("id", existing.id);
        updatedCount++;
      } else {
        await supabase.from("opportunities").insert(row);
        newCount++;
      }
    } catch (e) {
      // Skip this source on failure, continue with others.
    }
  }
  return { newCount, updatedCount };
}

async function syncIrcc() {
  let updatedCount = 0;
  try {
    const res = await fetch(`https://open.canada.ca/data/api/3/action/package_show?id=${IRCC_PACKAGE_ID}`);
    if (!res.ok) return { updatedCount };
    const data = await res.json();
    const modified = data?.result?.metadata_modified || null;

    const { data: existing } = await supabase
      .from("opportunities")
      .select("id, reason")
      .eq("external_id", "curated-canada-express-entry")
      .maybeSingle();

    if (existing) {
      await supabase
        .from("opportunities")
        .update({
          reason: `Points-based Canadian permanent residence route. IRCC Express Entry dataset last updated ${modified ? modified.slice(0, 10) : "recently"}.`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      updatedCount = 1;
    }
  } catch (e) {
    // Skip on failure.
  }
  return { updatedCount };
}

async function syncAdzuna() {
  let newCount = 0;
  for (const [code, countryName] of Object.entries(ADZUNA_COUNTRIES)) {
    try {
      const url = `https://api.adzuna.com/v1/api/jobs/${code}/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=10&what_phrase=visa%20sponsorship&content-type=application/json`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const results = data?.results || [];

      for (const job of results) {
        if (!job.id || !job.title) continue;
        const external_id = `adzuna-${job.id}`;
        const row = {
          external_id,
          type: "visa",
          org: job.company?.display_name || "Unknown employer",
          title: job.title,
          country: countryName,
          degree: "N/A",
          field: job.category?.label || "Various",
          deadline: "Rolling",
          score: 55,
          reason: "Live job listing matched \"visa sponsorship\" via Adzuna — verify sponsorship is actually offered before applying.",
          fit: ["Live Adzuna listing"],
          gap: ["Sponsorship not independently confirmed — check listing"],
          eligibility: "review",
          elig_criteria: [{ label: "Employer confirms visa sponsorship in listing or on contact", pass: null }],
          docs: [],
          next_action: "Review job posting and apply directly",
          next_date: null,
          stage: "saved",
          source: "adzuna",
          source_url: job.redirect_url || null,
        };

        const { error } = await supabase.from("opportunities").upsert(row, { onConflict: "external_id", ignoreDuplicates: true });
        if (!error) newCount++;
      }
    } catch (e) {
      // Skip this country on failure, continue with others.
    }
  }
  return { newCount };
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const triggeredBy = req.headers["x-vercel-cron-schedule"] ? "cron" : "manual";

  const govuk = await syncGovUk();
  const ircc = await syncIrcc();
  const adzuna = await syncAdzuna();

  const newCount = govuk.newCount + adzuna.newCount;
  const updatedCount = govuk.updatedCount + ircc.updatedCount;

  await supabase.from("sync_log").insert({
    source: triggeredBy,
    new_count: newCount,
    updated_count: updatedCount,
    status: "ok",
    message: `GOV.UK + IRCC sync via ${triggeredBy}`,
  });

  return res.status(200).json({
    ok: true,
    triggeredBy,
    newCount,
    updatedCount,
    ranAt: new Date().toISOString(),
  });
}
