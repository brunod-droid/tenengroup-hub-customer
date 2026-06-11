// Lightweight Supabase REST client for the Hub.
// No @supabase/supabase-js dependency required.
// Also normalizes Supabase URL if someone pasted /rest/v1 by mistake.

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

function normalizeSupabaseUrl(url) {
  return String(url || '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/rest\/v1$/i, '');
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

function missingConfigError() {
  return {
    data: null,
    error: {
      message:
        'Supabase env variables are missing. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.',
    },
  };
}

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

function friendlyNetworkError(error) {
  const urlHint = rawSupabaseUrl.includes('/rest/v1')
    ? ' Your Supabase URL should normally be like https://xxxx.supabase.co, not ending with /rest/v1.'
    : '';
  return {
    data: null,
    error: {
      message: `${error.message || 'Network error while calling Supabase.'}${urlHint}`,
    },
  };
}

function makeQuery(table) {
  return {
    select(columns = '*') {
      return {
        async limit(count = 5000) {
          if (!supabaseUrl || !supabaseAnonKey) return missingConfigError();

          try {
            const res = await fetch(buildUrl(table, `select=${encodeURIComponent(columns)}&limit=${count}`), {
              method: 'GET',
              headers: headers(),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) return { data: null, error: { message: data?.message || res.statusText } };
            return { data, error: null };
          } catch (error) {
            return friendlyNetworkError(error);
          }
        },
      };
    },

    async insert(records) {
      if (!supabaseUrl || !supabaseAnonKey) return missingConfigError();

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
        return friendlyNetworkError(error);
      }
    },

    delete() {
      return {
        async neq(column, value) {
          if (!supabaseUrl || !supabaseAnonKey) return missingConfigError();

          try {
            const query = `${encodeURIComponent(column)}=neq.${encodeURIComponent(value)}`;
            const res = await fetch(buildUrl(table, query), {
              method: 'DELETE',
              headers: headers(),
            });

            if (res.status === 204) return { data: null, error: null };

            const data = await res.json().catch(() => null);
            if (!res.ok) return { data: null, error: { message: data?.message || res.statusText } };
            return { data, error: null };
          } catch (error) {
            return friendlyNetworkError(error);
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
