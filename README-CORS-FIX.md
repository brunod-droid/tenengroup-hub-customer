# Oak & Luna CORS fix

Replace/add these files:

1. Add:
pages/api/oak-luna-customers.js

2. Replace:
components/oak-luna/CustomerInsightsPage.js

Why:
The browser was calling Supabase directly and failing on CORS preflight redirect.
This fix makes the browser call your own Next.js API:
  /api/oak-luna-customers

Then the API route calls Supabase server-side.

Vercel env variables needed:
NEXT_PUBLIC_SUPABASE_URL=https://qepwacmouislcrkfvfep.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your anon key

Optional, better if available:
SUPABASE_SERVICE_ROLE_KEY=your service role key
