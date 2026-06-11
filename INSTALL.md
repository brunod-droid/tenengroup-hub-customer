# Oak & Luna Customers Supabase V1

## 1. Supabase
Run this SQL file once in Supabase SQL Editor:

supabase/oak_luna_customers_tables.sql

## 2. Install dependency
If missing, install Supabase JS:

npm install @supabase/supabase-js

## 3. Vercel env variables
Make sure these exist:

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY

## 4. Add files
Copy these files into the repo:

pages/brands/oak-and-luna/who-are-our-customers.js
components/oak-luna/CustomerInsightsPage.js
components/oak-luna/csvHelpers.js
lib/supabaseClient.js

## 5. Upload files on the page
Go to:

/brands/oak-and-luna/who-are-our-customers

Upload:
- Orders CSV
- Kustomer CSV
- Trustpilot CSV

The data is saved permanently in Supabase and remains available for the team.
Each new upload replaces the previous dataset for that source.
