# Lagoon UI port — notes

New structure (all data logic unchanged: same Supabase RPCs, eligibility engine, API routes):

- `src/lib/` — `supabase.js`, `dates.js` (timezone-safe deadline maths), `eligibility.js` (moved verbatim), `opps.js`, `useCutoff.js`
- `src/components/` — shared UI, Sidebar, AuthScreen, Onboarding, ScoreDrawer, Contours
- `src/views/` — Overview (new), Inbox, Detail, Pipeline, Settings
- `src/index.css` — the whole Lagoon theme; fonts (Young Serif + Albert Sans) load from `index.html`

Small behaviour changes: deadlines count from today's real date (was hard-coded 2026-09-06); closed deadlines show "Closed"; profile saves are debounced (600 ms) with a "Saving / Saved" indicator and roll back on failure; clearing the name field in Settings no longer re-opens onboarding; cancelling the "reject" prompt no longer rejects; Pipeline's Saved column respects the score cutoff.
