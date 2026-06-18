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

async function fetchVipReviews() {
  const response = await fetch(tableUrl('oak_luna_vip_reviews', 'select=customer_key,vip_status,notes,reviewed_at'), {
    method: 'GET',
    headers: headers(),
  });

  const text = await response.text();
  if (!response.ok) return {};

  const rows = text ? JSON.parse(text) : [];
  return Object.fromEntries(rows.map((row) => [row.customer_key, row]));
}

function mergeVipStatuses(payload, reviewMap) {
  const candidates = payload?.vip?.candidates || [];
  return {
    ...payload,
    vip: {
      ...(payload.vip || {}),
      candidates: candidates.map((candidate) => {
        const review = reviewMap[candidate.customer_key];
        return review
          ? {
              ...candidate,
              vip_status: review.vip_status || candidate.vip_status || 'pending',
              notes: review.notes || candidate.notes || null,
              reviewed_at: review.reviewed_at || candidate.reviewed_at || null,
            }
          : candidate;
      }),
    },
  };
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return send(res, 500, { error: 'Supabase env variables are missing.' });
  }

  try {
    if (req.method === 'POST') {
      const body = req.body || {};

      if (body.action === 'update_vip_status') {
        const payload = {
          customer_key: body.customer_key,
          vip_status: body.vip_status,
          vip_score: body.vip_score || null,
          notes: body.notes || null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: 'dashboard',
        };

        const response = await fetch(tableUrl('oak_luna_vip_reviews', 'on_conflict=customer_key'), {
          method: 'POST',
          headers: headers({ Prefer: 'resolution=merge-duplicates,return=representation' }),
          body: JSON.stringify(payload),
        });

        const text = await response.text();
        if (!response.ok) return send(res, 500, { error: `VIP update failed: ${text}` });

        return send(res, 200, { ok: true });
      }

      return send(res, 400, { error: 'Unknown action.' });
    }

    if (req.method !== 'GET') {
      return send(res, 405, { error: 'Method not allowed.' });
    }

    const response = await fetch(
      tableUrl('oak_luna_insights_cache', 'select=payload,generated_at&id=eq.latest&limit=1'),
      { method: 'GET', headers: headers() }
    );

    const text = await response.text();
    const rows = text ? JSON.parse(text) : [];

    if (!response.ok) return send(res, 500, { error: `Cache read failed: ${text || response.statusText}` });
    if (!Array.isArray(rows) || rows.length === 0) {
      return send(res, 404, { error: 'No Oak & Luna insights cache found. Run supabase/oak_luna_refresh_insights_cache.sql first.' });
    }

    const reviewMap = await fetchVipReviews();
    const payload = mergeVipStatuses(rows[0].payload, reviewMap);

    return send(res, 200, payload);
  } catch (error) {
    return send(res, 500, { error: error.message || 'Unexpected insights API error.' });
  }
}
