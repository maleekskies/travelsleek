import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tsgbrupkcejntodznspr.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZ2JydXBrY2VqbnRvZHpuc3ByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTc1OTQsImV4cCI6MjEwNDMzMzU5NH0.6QyuO7-4cCy97Yly8sPUTE7omOyBtfu0oFUhoGxJgK0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Maps a Supabase row (snake_case) to the shape the UI components expect.
export function rowToOpportunity(row) {
  return {
    id: row.external_id,
    externalId: row.external_id,
    type: row.type,
    org: row.org,
    title: row.title,
    country: row.country,
    degree: row.degree,
    field: row.field,
    deadline: row.deadline,
    score: row.score,
    reason: row.reason,
    fit: row.fit || [],
    gap: row.gap || [],
    eligibility: row.eligibility,
    eligCriteria: row.elig_criteria || [],
    docs: row.docs || [],
    nextAction: row.next_action,
    nextDate: row.next_date,
    stage: row.stage,
    source: row.source,
    sourceUrl: row.source_url,
    criteriaVerifiedAt: row.criteria_verified_at || null,
    notes: row.notes || "",
  };
}

export function mapDbProfile(json) {
  return {
    name: json?.name || "",
    nationality: json?.nationality || "",
    degreeLevel: json?.degree_level || "Master's",
    fields: json?.fields || [],
    countries: json?.countries || [],
    mustHaves: json?.must_haves || [],
    dealBreakers: json?.deal_breakers || [],
    cv: json?.cv || "",
    age: json?.age ?? null,
    workExperienceYears: json?.work_experience_years ?? null,
    academicRecord: json?.academic_record || "",
    minScoreCutoff: json?.min_score_cutoff ?? 0,
  };
}
