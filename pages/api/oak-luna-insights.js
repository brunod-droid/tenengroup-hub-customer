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
  orders: 'oak_luna_orders',
  kustomer: 'oak_luna_kustomer',
  trustpilot: 'oak_luna_trustpilot',
};

export const config = {
  api: {
    bodyParser: { sizeLimit: '1mb' },
    responseLimit: false,
  },
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

function countFromContentRange(value) {
  const match = String(value || '').match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function getCount(kind) {
  const response = await fetch(tableUrl(TABLES[kind], 'select=id&limit=1'), {
    method: 'GET',
    headers: headers({ Prefer: 'count=exact' }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Count failed for ${kind}: ${text || response.statusText}`);
  }

  return countFromContentRange(response.headers.get('content-range'));
}

async function readLightSample(kind, limit = 500, columns = 'id') {
  const response = await fetch(
    tableUrl(TABLES[kind], `select=${encodeURIComponent(columns)}&order=id.asc&limit=${limit}`),
    {
      method: 'GET',
      headers: headers(),
    }
  );

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(`Sample read failed for ${kind}: ${text || response.statusText}`);
  }

  return Array.isArray(data) ? data : [];
}

function safeNumber(value) {
  const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function countBy(rows, key) {
  const map = new Map();
  rows.forEach((row) => {
    const value = String(row[key] || '').trim();
    if (!value) return;
    map.set(value, (map.get(value) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

function analyzeService(rows) {
  const reasons = new Map();
  const patterns = {
    Shipping: /shipping|delivery|tracking|package|late|carrier|fedex|usps|dhl/i,
    Resize: /resize|size|sizing|too small|too big/i,
    Engraving: /engraving|inscription|personalization|wrong name|spelling/i,
    Return: /return|refund|exchange|cancel/i,
    Damaged: /damaged|broken|defect|quality/i,
  };

  rows.forEach((row) => {
    const text = JSON.stringify(row || {});
    let matched = false;

    Object.entries(patterns).forEach(([name, regex]) => {
      if (regex.test(text)) {
        reasons.set(name, (reasons.get(name) || 0) + 1);
        matched = true;
      }
    });

    if (!matched && row.reason) {
      const reason = String(row.reason).slice(0, 80);
      reasons.set(reason, (reasons.get(reason) || 0) + 1);
    }
  });

  return Array.from(reasons.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function analyzeReviews(rows) {
  let totalRating = 0;
  let ratingCount = 0;
  const positive = new Map();
  const negative = new Map();

  const positivePatterns = {
    Quality: /quality|beautiful|perfect|gorgeous|amazing|love/i,
    Personalization: /personal|engraving|name|initial|custom/i,
    Gift: /gift|birthday|anniversary|mother|wife|daughter/i,
    Service: /service|helpful|support|customer service/i,
    Delivery: /delivery|shipping|arrived|fast/i,
  };

  const negativePatterns = {
    Shipping: /late|delay|shipping|tracking|delivery/i,
    Quality: /broken|damaged|poor quality|tarnish/i,
    Sizing: /size|resize|too small|too big/i,
    Engraving: /engraving|wrong name|spelling|inscription/i,
    Service: /service|support|response/i,
  };

  rows.forEach((row) => {
    const rating = safeNumber(row.rating);
    if (rating > 0) {
      totalRating += rating;
      ratingCount += 1;
    }

    const text = `${row.title || ''} ${row.review_text || ''} ${JSON.stringify(row.raw || {})}`;

    Object.entries(positivePatterns).forEach(([name, regex]) => {
      if (regex.test(text)) positive.set(name, (positive.get(name) || 0) + 1);
    });

    if (rating && rating <= 3) {
      Object.entries(negativePatterns).forEach(([name, regex]) => {
        if (regex.test(text)) negative.set(name, (negative.get(name) || 0) + 1);
      });
    }
  });

  const toTop = (map) =>
    Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

  return {
    averageRating: ratingCount ? totalRating / ratingCount : 0,
    positiveThemes: toTop(positive),
    negativeThemes: toTop(negative),
  };
}

async function buildFastInsights() {
  const [ordersCount, kustomerCount, trustpilotCount] = await Promise.all([
    getCount('orders'),
    getCount('kustomer'),
    getCount('trustpilot'),
  ]);

  // Important: do not read raw from orders here. Raw is large and causes Supabase statement timeout.
  const [ordersSample, kustomerSample, trustpilotSample] = await Promise.all([
    readLightSample('orders', 1000, 'id,email,city,state,country,product,engraving,gift_note,amount'),
    readLightSample('kustomer', 1000, 'id,conversation_id,email,subject,reason,status,created_at_text,raw'),
    readLightSample('trustpilot', 1000, 'id,review_id,email,rating,title,review_text,created_at_text,raw'),
  ]);

  const sampleRevenue = ordersSample.reduce((sum, row) => sum + safeNumber(row.amount), 0);
  const sampleAov = ordersSample.length ? sampleRevenue / ordersSample.length : 0;
  const estimatedRevenue = sampleAov * ordersCount;
  const uniqueEmails = new Set(ordersSample.map((row) => row.email).filter(Boolean));
  const personalized = ordersSample.filter((row) => {
    const text = `${row.engraving || ''} ${row.product || ''}`.toLowerCase();
    return text && !/no inscription|no initial/.test(text) && /inscription|initial|engraving|charm|personal/.test(text);
  });
  const giftRows = ordersSample.filter((row) => String(row.gift_note || '').trim());

  const reviews = analyzeReviews(trustpilotSample);
  const serviceTopReasons = analyzeService(kustomerSample);

  const countries = countBy(ordersSample, 'country');
  const states = countBy(ordersSample, 'state');
  const cities = countBy(ordersSample, 'city');
  const bestSellers = countBy(ordersSample, 'product');

  const productPerformance = bestSellers.map((item) => {
    const matching = ordersSample.filter((row) => String(row.product || '') === item.name);
    const revenue = matching.reduce((sum, row) => sum + safeNumber(row.amount), 0);
    const engraved = matching.filter((row) => String(row.engraving || '').trim()).length;
    return {
      name: item.name,
      orders: item.count,
      revenue,
      aov: matching.length ? revenue / matching.length : 0,
      personalizationRate: matching.length ? (engraved / matching.length) * 100 : 0,
    };
  });

  const summary = {
    customers: uniqueEmails.size,
    orders: ordersCount,
    revenue: estimatedRevenue,
    aov: sampleAov,
    repeatCustomerRate: 0,
    personalizationRate: ordersSample.length ? (personalized.length / ordersSample.length) * 100 : 0,
    giftRate: ordersSample.length ? (giftRows.length / ordersSample.length) * 100 : 0,
    contactRate: ordersCount ? (kustomerCount / ordersCount) * 100 : 0,
    trustpilotScore: reviews.averageRating,
    supportContacts: kustomerCount,
    reviews: trustpilotCount,
  };

  return {
    generatedAt: new Date().toISOString(),
    mode: 'fast_sample',
    warning:
      'Fast mode: totals use Supabase counts. Detail dashboards use a light 1,000-order sample because live full-table scans time out in Supabase.',
    summary,
    geography: {
      countries: countries.length ? countries : [{ name: 'Structured country fields are empty in imported orders', count: 0 }],
      states: states.length ? states : [{ name: 'Structured state fields are empty in imported orders', count: 0 }],
      cities: cities.length ? cities : [{ name: 'Structured city fields are empty in imported orders', count: 0 }],
    },
    products: {
      bestSellers: bestSellers.length ? bestSellers : [{ name: 'Structured product fields are empty in imported orders', count: 0 }],
      productPerformance,
    },
    personalization: {
      engravingThemes: [
        { name: 'Personalized sample orders', count: personalized.length },
        { name: 'Non-personalized / unknown sample orders', count: Math.max(0, ordersSample.length - personalized.length) },
      ],
      giftThemes: [
        { name: 'Gift note sample orders', count: giftRows.length },
        { name: 'No gift note / unknown sample orders', count: Math.max(0, ordersSample.length - giftRows.length) },
      ],
    },
    personas: [
      {
        name: 'Personalized Jewelry Lovers',
        description: 'Detected from structured engraving/product fields in the light sample.',
        orders: personalized.length,
        customers: personalized.length,
        revenue: 0,
        aov: 0,
        share: ordersSample.length ? (personalized.length / ordersSample.length) * 100 : 0,
      },
      {
        name: 'Gift Buyers',
        description: 'Detected from gift note fields in the light sample.',
        orders: giftRows.length,
        customers: giftRows.length,
        revenue: 0,
        aov: 0,
        share: ordersSample.length ? (giftRows.length / ordersSample.length) * 100 : 0,
      },
      {
        name: 'Premium Customers',
        description: 'Estimated from sample orders above $200.',
        orders: ordersSample.filter((row) => safeNumber(row.amount) >= 200).length,
        customers: ordersSample.filter((row) => safeNumber(row.amount) >= 200).length,
        revenue: 0,
        aov: 0,
        share: 0,
      },
    ],
    service: {
      total: kustomerCount,
      topReasons: serviceTopReasons,
    },
    reviews: {
      total: trustpilotCount,
      averageRating: reviews.averageRating,
      positiveThemes: reviews.positiveThemes,
      negativeThemes: reviews.negativeThemes,
    },
    keyTakeaways: [
      `Oak & Luna has ${ordersCount.toLocaleString('en-US')} imported orders in Supabase.`,
      `Kustomer has ${kustomerCount.toLocaleString('en-US')} imported conversations.`,
      `Trustpilot has ${trustpilotCount.toLocaleString('en-US')} imported reviews.`,
      'This endpoint is timeout-safe. The next architecture step is a cached insights table for full-dataset product/geography analysis.',
    ],
  };
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) {
    return send(res, 500, {
      error: 'Supabase env variables are missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.',
    });
  }

  if (req.method !== 'GET') {
    return send(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const insights = await buildFastInsights();
    return send(res, 200, insights);
  } catch (error) {
    return send(res, 500, { error: error.message || 'Unexpected insights API error.' });
  }
}
