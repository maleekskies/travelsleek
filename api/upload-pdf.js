import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const SUPABASE_URL = "https://tsgbrupkcejntodznspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ2JydXBrY2VqbnRvZHpuc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTc1OTQsImV4cCI6MjEwNDMzMzU5NH0.6QyuO7-4cCy97Yly8sPUTE7omOyBtfu0oFUhoGxJgK0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

// Very light heuristic splitter: breaks extracted PDF text into candidate
// entries on blank-line boundaries. This is best-effort text extraction,
// not structured parsing — every row lands as "review" for the user to
// clean up, in keeping with "never invent, always manual review."
function splitIntoEntries(text) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.replace(/\s+/g, " ").trim())
    .filter((b) => b.length > 25);

  return blocks.slice(0, 25).map((block) => {
    const title = block.slice(0, 100);
    const reason = block.slice(0, 400);
    return { title, reason };
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { filename, dataBase64, type } = req.body || {};
    if (!dataBase64) return res.status(400).json({ error: "Missing dataBase64" });
    const entryType = type === "visa" ? "visa" : "scholarship";

    const pdfParse = (await import("pdf-parse")).default;
    const buffer = Buffer.from(dataBase64, "base64");
    const parsed = await pdfParse(buffer);
    const entries = splitIntoEntries(parsed.text || "");

    let inserted = 0;
    for (const entry of entries) {
      const hash = crypto
        .createHash("sha1")
        .update(`${filename || "upload"}-${entry.title}`)
        .digest("hex")
        .slice(0, 16);
      const external_id = `pdf-${hash}`;

      const { error } = await supabase.from("opportunities").upsert(
        {
          external_id,
          type: entryType,
          org: "PDF import",
          title: entry.title,
          country: null,
          degree: null,
          field: null,
          deadline: null,
          score: 50,
          reason: entry.reason,
          fit: [],
          gap: ["Extracted from PDF — needs manual review"],
          eligibility: "review",
          elig_criteria: [],
          docs: [],
          next_action: "Review and complete details",
          next_date: null,
          stage: "saved",
          source: "pdf-upload",
          source_url: null,
        },
        { onConflict: "external_id", ignoreDuplicates: true }
      );
      if (!error) inserted++;
    }

    await supabase.from("sync_log").insert({
      source: "pdf-upload",
      new_count: inserted,
      updated_count: 0,
      status: "ok",
      message: `Imported from ${filename || "uploaded PDF"}`,
    });

    return res.status(200).json({ ok: true, inserted, totalBlocks: entries.length });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
