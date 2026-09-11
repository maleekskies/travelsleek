import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tsgbrupkcejntodznspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ2JydXBrY2VqbnRvZHpuc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTc1OTQsImV4cCI6MjEwNDMzMzU5NH0.6QyuO7-4cCy97Yly8sPUTE7omOyBtfu0oFUhoGxJgK0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const config = {
  maxDuration: 60,
};

const PUBLICATION_URL = "https://www.gov.uk/government/publications/register-of-licensed-sponsors-workers";

// Minimal CSV line parser that handles quoted fields containing commas.
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function findColumn(headers, candidates) {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const cand of candidates) {
    const idx = lower.indexOf(cand);
    if (idx !== -1) return idx;
  }
  // fallback: partial match
  for (const cand of candidates) {
    const idx = lower.findIndex((h) => h.includes(cand));
    if (idx !== -1) return idx;
  }
  return -1;
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 1. Find today's CSV asset URL from the GOV.UK publication page (it changes on every update).
    const pageRes = await fetch(PUBLICATION_URL);
    const pageHtml = await pageRes.text();
    const match = pageHtml.match(/https:\/\/assets\.publishing\.service\.gov\.uk\/media\/[^\s")]+\.csv/);
    if (!match) {
      return res.status(502).json({ error: "Could not locate current CSV link on GOV.UK page" });
    }
    const csvUrl = match[0];

    // 2. Download and parse the CSV.
    const csvRes = await fetch(csvUrl);
    const csvText = await csvRes.text();
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return res.status(502).json({ error: "CSV appears empty" });
    }

    const headers = parseCsvLine(lines[0]);
    const nameIdx = findColumn(headers, ["organisation name", "organisation", "name"]);
    const townIdx = findColumn(headers, ["town/city", "town", "city"]);
    const countyIdx = findColumn(headers, ["county"]);
    const typeRatingIdx = findColumn(headers, ["type & rating", "type and rating", "type", "rating"]);
    const routeIdx = findColumn(headers, ["route"]);

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      const name = nameIdx !== -1 ? cols[nameIdx]?.trim() : null;
      if (!name) continue;
      rows.push({
        organisation_name: name,
        town_city: townIdx !== -1 ? cols[townIdx]?.trim() || null : null,
        county: countyIdx !== -1 ? cols[countyIdx]?.trim() || null : null,
        type_rating: typeRatingIdx !== -1 ? cols[typeRatingIdx]?.trim() || null : null,
        route: routeIdx !== -1 ? cols[routeIdx]?.trim() || null : null,
      });
    }

    // 3. Replace the table contents (delete-all then bulk insert in batches).
    await supabase.from("uk_sponsors").delete().gte("id", 0);

    const BATCH_SIZE = 3000;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from("uk_sponsors").insert(batch);
      if (!error) inserted += batch.length;
    }

    await supabase.from("sync_log").insert({
      source: "uk-sponsors-csv",
      new_count: inserted,
      updated_count: 0,
      status: "ok",
      message: `Imported ${inserted} of ${rows.length} parsed rows from ${csvUrl}`,
    });

    return res.status(200).json({ ok: true, totalParsed: rows.length, inserted, csvUrl });
  } catch (e) {
    await supabase.from("sync_log").insert({
      source: "uk-sponsors-csv",
      new_count: 0,
      updated_count: 0,
      status: "error",
      message: String(e?.message || e),
    });
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
