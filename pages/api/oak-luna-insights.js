const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

function normalizeSupabaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' }, responseLimit: false },
};

function send(res, status, body) {
  res.status(status).json(body);
}

function headers(extra = {}) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

function tableUrl(table, query = '') {
  const base = `${supabaseUrl}/rest/v1/${table}`;
  return query ? `${base}?${query}` : base;
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return send(res, 500, { error: 'Supabase env variables are missing.' });
  }

  if (req.method !== 'GET') {
    return send(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const response = await fetch(
      tableUrl('oak_luna_insights_cache', 'select=payload,generated_at&id=eq.latest&limit=1'),
      { method: 'GET', headers: headers() }
    );

    const text = await response.text();
    const rows = text ? JSON.parse(text) : [];

    if (!response.ok) {
      return send(res, 500, { error: `Cache read failed: ${text || response.statusText}` });
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return send(res, 404, {
        error: 'No Oak & Luna insights cache found. Run supabase/oak_luna_refresh_insights_cache.sql in Supabase first.',
      });
    }

    return send(res, 200, rows[0].payload);
  } catch (error) {
    return send(res, 500, { error: error.message || 'Unexpected insights API error.' });
  }
}
