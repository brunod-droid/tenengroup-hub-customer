# Oak & Luna latest reset patch

Use this ZIP to recover from old patches.

Replace/add exactly these files:

1. pages/brands/oak-and-luna/who-are-our-customers.js
2. pages/api/oak-luna-customers.js
3. components/oak-luna/CustomerInsightsPage.js
4. components/oak-luna/csvHelpers.js

This version includes:
- Correct page route.
- API proxy to avoid Supabase CORS.
- Excel/CSV upload support.
- Batch upload to avoid 413 Payload Too Large.
- Compact raw data to keep payloads smaller.
- Progress status during upload.

After deploy, Network should show calls to:
/api/oak-luna-customers

not direct calls to:
supabase.co/rest/v1/...
