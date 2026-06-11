// Lightweight Supabase REST client for the Hub.
// No @supabase/supabase-js dependency required.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

function headers(extra = {}) {
  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

function buildUrl(table, query = '') {
  const base = `${supabaseUrl}/rest/v1/${table}`;
  return query ? `${base}?${query}` : base;
}

function makeQuery(table) {
  return {
    select(columns = '*') {
      return {
        async limit(count = 5000) {
          if (!supabaseUrl || !supabaseAnonKey) {
            return { data: null, error: { message: 'Supabase env variables are missing.' } };
          }

          try {
            const res = await fetch(buildUrl(table, `select=${encodeURIComponent(columns)}&limit=${count}`), {
              method: 'GET',
              headers: headers(),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) return { data: null, error: { message: data?.message || res.statusText } };
            return { data, error: null };
          } catch (error) {
            return { data: null, error: { message: error.message } };
          }
        },
      };
    },

    async insert(records) {
      if (!supabaseUrl || !supabaseAnonKey) {
        return { data: null, error: { message: 'Supabase env variables are missing.' } };
      }

      try {
        const res = await fetch(buildUrl(table), {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify(records),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) return { data: null, error: { message: data?.message || res.statusText } };
        return { data, error: null };
      } catch (error) {
        return { data: null, error: { message: error.message } };
      }
    },

    delete() {
      return {
        async neq(column, value) {
          if (!supabaseUrl || !supabaseAnonKey) {
            return { data: null, error: { message: 'Supabase env variables are missing.' } };
          }

          try {
            const query = `${encodeURIComponent(column)}=neq.${encodeURIComponent(value)}`;
            const res = await fetch(buildUrl(table, query), {
              method: 'DELETE',
              headers: headers(),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) return { data: null, error: { message: data?.message || res.statusText } };
            return { data, error: null };
          } catch (error) {
            return { data: null, error: { message: error.message } };
          }
        },
      };
    },
  };
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? {
        from(table) {
          return makeQuery(table);
        },
      }
    : null;
