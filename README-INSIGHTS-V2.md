# Oak & Luna Insights Dashboard V2

Replace/add these files:

1. Add:
pages/api/oak-luna-insights.js

2. Replace:
components/oak-luna/CustomerInsightsPage.js

Do NOT re-upload any data.

What this version does:
- Reads all Oak & Luna orders from Supabase by server-side batches.
- Avoids the 1,000-row Supabase browser limit.
- Reconstructs missing order fields from raw JSON.
- Builds direct-access dashboards:
  - Executive Summary
  - Personas
  - Geography
  - Products
  - Engraving & Gifts
  - Customer Service
  - Reviews
  - Ask AI V2
- Keeps the existing upload/API flow untouched.

Important:
The first load can take time because the API scans ~324k orders server-side.
If Vercel times out, the next step is to add a cached table:
oak_luna_insights_cache
and calculate insights on demand or after upload.
