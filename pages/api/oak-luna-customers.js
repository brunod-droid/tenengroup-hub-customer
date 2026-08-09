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

const TABLES = {
  orders: 'oak_luna_orders_v2',
  kustomer: 'oak_luna_kustomer',
  trustpilot: 'oak_luna_trustpilot',
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

function send(res, status, body) {
  res.status(status).json(body);
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
}

function tableUrl(table, query = '') {
  const base = `${supabaseUrl}/rest/v1/${table}`;
  return query ? `${base}?${query}` : base;
}

async function readTable(kind, limit = 5000) {
  const table = TABLES[kind];
  const response = await fetch(tableUrl(table, `select=*&limit=${Number(limit) || 5000}`), {
    method: 'GET',
    headers: supabaseHeaders(),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || response.statusText || `Read failed for ${kind}`);
  return data || [];
}

async function deleteTable(kind) {
  const table = TABLES[kind];
  const response = await fetch(tableUrl(table, 'id=neq.0'), {
    method: 'DELETE',
    headers: supabaseHeaders({ Prefer: 'return=minimal' }),
  });

  if (!response.ok && response.status !== 204) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || response.statusText || `Delete failed for ${kind}`);
  }
}

async function insertRows(kind, rows) {
  if (!rows.length) return [];
  const table = TABLES[kind];

  const response = await fetch(tableUrl(table), {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(rows),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || response.statusText || `Insert failed for ${kind}`);
  return data || [];
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return send(res, 500, {
      error:
        'Supabase env variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.',
    });
  }

  try {
    if (req.method === 'GET') {
      const [orders, kustomer, trustpilot] = await Promise.all([
        readTable('orders'),
        readTable('kustomer'),
        readTable('trustpilot'),
      ]);
      return send(res, 200, { orders, kustomer, trustpilot });
    }

    if (req.method === 'POST') {
      const { kind, records, replace } = req.body || {};

      if (!TABLES[kind]) return send(res, 400, { error: 'Invalid kind. Use orders, kustomer, or trustpilot.' });
      if (!Array.isArray(records)) return send(res, 400, { error: 'records must be an array.' });

      if (replace) await deleteTable(kind);
      await insertRows(kind, records);

      return send(res, 200, { ok: true, kind, inserted: records.length, replaced: Boolean(replace) });
    }

    return send(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Unexpected API error.' });
  }
}
