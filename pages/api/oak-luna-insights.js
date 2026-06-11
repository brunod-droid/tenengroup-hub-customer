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

async function readSample(kind, limit = 5000, columns = 'id') {
  const response = await fetch(
    tableUrl(TABLES[kind], `select=${encodeURIComponent(columns)}&order=id.asc&limit=${limit}`),
    { method: 'GET', headers: headers() }
  );

  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!response.ok) throw new Error(`Sample read failed for ${kind}: ${text || response.statusText}`);
  return Array.isArray(data) ? data : [];
}

function safeNumber(value) {
  const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function countBy(rows, key, limit = 15) {
  const map = new Map();
  rows.forEach((row) => {
    const value = String(row[key] || '').trim();
    if (!value) return;
    map.set(value, (map.get(value) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

function getCountryFromAddress(address = '') {
  const text = String(address || '');
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Hong Kong', 'Singapore'];
  return countries.find((c) => new RegExp(c, 'i').test(text)) || 'Unknown';
}

function getStateFromAddress(address = '') {
  const text = String(address || '');
  const states = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','Ontario','Quebec','Alberta','British Columbia','Manitoba','Saskatchewan','Nova Scotia','Newfoundland and Labrador','Queensland','New South Wales','Victoria'
  ];
  return states.find((s) => new RegExp(`\\b${s}\\b`, 'i').test(text)) || 'Unknown';
}

function getCityFromAddress(address = '') {
  const text = String(address || '').replace(/\s+/g, ' ').trim();
  const state = getStateFromAddress(text);
  if (!text || state === 'Unknown') return 'Unknown';
  const beforeState = text.split(new RegExp(`\\b${state}\\b`, 'i'))[0].trim();
  const parts = beforeState.split(/\s+/).filter(Boolean);
  return parts.slice(-2).join(' ') || 'Unknown';
}

function normalizeOrder(row) {
  const address = row.full_address || '';
  return {
    ...row,
    amount: safeNumber(row.amount),
    country: row.country || getCountryFromAddress(address),
    state: row.state || getStateFromAddress(address),
    city: row.city || getCityFromAddress(address),
    personalization: row.personalization || '',
    product: row.product || 'Product not available in source file',
  };
}

function isPersonalized(row) {
  const text = String(row.personalization || row.engraving || '').toLowerCase();
  return Boolean(text && !/no inscription|no initial/.test(text) && /inscription|initial|engraving|charm|chain length|ring size|bracelet/i.test(text));
}

function engravingTheme(row) {
  const text = String(row.personalization || row.engraving || '').toLowerCase();
  if (!text || /no inscription|no initial/.test(text)) return 'No personalization';
  if (/initial/.test(text)) return 'Initials';
  if (/charm|heart|♥|diamond|spade|club/.test(text)) return 'Charms / Symbols';
  if (/inscription/.test(text)) return 'Names / Words';
  if (/ring size/.test(text)) return 'Ring personalization';
  return 'Other personalization';
}

function toTop(map, limit = 10) {
  return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
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
      if (regex.test(text)) { reasons.set(name, (reasons.get(name) || 0) + 1); matched = true; }
    });
    if (!matched && row.reason) reasons.set(String(row.reason).slice(0, 80), (reasons.get(String(row.reason).slice(0, 80)) || 0) + 1);
  });
  return toTop(reasons, 10);
}

function analyzeReviews(rows) {
  let totalRating = 0;
  let ratingCount = 0;
  const positive = new Map();
  const negative = new Map();
  const pos = {
    Quality: /quality|beautiful|perfect|gorgeous|amazing|love/i,
    Personalization: /personal|engraving|name|initial|custom/i,
    Gift: /gift|birthday|anniversary|mother|wife|daughter/i,
    Service: /service|helpful|support|customer service/i,
    Delivery: /delivery|shipping|arrived|fast/i,
  };
  const neg = {
    Shipping: /late|delay|shipping|tracking|delivery/i,
    Quality: /broken|damaged|poor quality|tarnish/i,
    Sizing: /size|resize|too small|too big/i,
    Engraving: /engraving|wrong name|spelling|inscription/i,
    Service: /service|support|response/i,
  };
  rows.forEach((row) => {
    const rating = safeNumber(row.rating);
    if (rating > 0) { totalRating += rating; ratingCount += 1; }
    const text = `${row.title || ''} ${row.review_text || ''} ${JSON.stringify(row.raw || {})}`;
    Object.entries(pos).forEach(([name, regex]) => { if (regex.test(text)) positive.set(name, (positive.get(name) || 0) + 1); });
    if (rating && rating <= 3) Object.entries(neg).forEach(([name, regex]) => { if (regex.test(text)) negative.set(name, (negative.get(name) || 0) + 1); });
  });
  return { averageRating: ratingCount ? totalRating / ratingCount : 0, positiveThemes: toTop(positive, 10), negativeThemes: toTop(negative, 10) };
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) return send(res, 500, { error: 'Supabase env variables are missing.' });
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });

  try {
    const [ordersCount, kustomerCount, trustpilotCount] = await Promise.all([
      getCount('orders'), getCount('kustomer'), getCount('trustpilot')
    ]);

    const [ordersRaw, kustomerSample, trustpilotSample] = await Promise.all([
      readSample('orders', 5000, 'id,order_id,first_name,last_name,email,shipping_method,discount_or_shipping,order_date,ship_date,amount,coupon_code,shipping_fee,full_address,personalization'),
      readSample('kustomer', 1000, 'id,conversation_id,email,subject,reason,status,created_at_text,raw'),
      readSample('trustpilot', 1000, 'id,review_id,email,rating,title,review_text,created_at_text,raw'),
    ]);

    const orders = ordersRaw.map(normalizeOrder);
    const sampleRevenue = orders.reduce((sum, row) => sum + row.amount, 0);
    const sampleAov = orders.length ? sampleRevenue / orders.length : 0;
    const uniqueEmails = new Set(orders.map((row) => row.email).filter(Boolean));
    const personalizedRows = orders.filter(isPersonalized);
    const premiumRows = orders.filter((row) => row.amount >= 200);
    const familyRows = orders.filter((row) => /inscription #2|inscription #3|daughter|son|mom|mama|family/i.test(row.personalization || ''));

    const themeMap = new Map();
    orders.forEach((row) => themeMap.set(engravingTheme(row), (themeMap.get(engravingTheme(row)) || 0) + 1));

    const serviceReasons = analyzeService(kustomerSample);
    const reviews = analyzeReviews(trustpilotSample);

    const summary = {
      customers: uniqueEmails.size,
      orders: ordersCount,
      revenue: sampleAov * ordersCount,
      aov: sampleAov,
      repeatCustomerRate: 0,
      personalizationRate: orders.length ? (personalizedRows.length / orders.length) * 100 : 0,
      giftRate: 0,
      contactRate: ordersCount ? (kustomerCount / ordersCount) * 100 : 0,
      trustpilotScore: reviews.averageRating,
      supportContacts: kustomerCount,
      reviews: trustpilotCount,
    };

    return send(res, 200, {
      generatedAt: new Date().toISOString(),
      mode: 'orders_v2_sample',
      warning: 'Using clean oak_luna_orders_v2. Totals use full counts; detailed metrics use a 5,000-row sample for speed.',
      summary,
      geography: { countries: countBy(orders, 'country'), states: countBy(orders, 'state'), cities: countBy(orders, 'city') },
      products: {
        bestSellers: [{ name: 'Product names are not available in the current Orders source file', count: ordersCount }],
        productPerformance: [{ name: 'Product names not available', orders: ordersCount, revenue: summary.revenue, aov: sampleAov, personalizationRate: summary.personalizationRate }],
      },
      personalization: {
        engravingThemes: toTop(themeMap, 10),
        giftThemes: [{ name: 'Gift notes not available in current Orders source file', count: 0 }],
      },
      personas: [
        { name: 'Personalized Jewelry Lovers', description: 'Orders with inscription, initial, charm, chain or ring personalization.', orders: personalizedRows.length, customers: personalizedRows.length, revenue: personalizedRows.reduce((s, r) => s + r.amount, 0), aov: personalizedRows.length ? personalizedRows.reduce((s, r) => s + r.amount, 0) / personalizedRows.length : 0, share: orders.length ? (personalizedRows.length / orders.length) * 100 : 0 },
        { name: 'Premium Customers', description: 'Orders above $200.', orders: premiumRows.length, customers: premiumRows.length, revenue: premiumRows.reduce((s, r) => s + r.amount, 0), aov: premiumRows.length ? premiumRows.reduce((s, r) => s + r.amount, 0) / premiumRows.length : 0, share: orders.length ? (premiumRows.length / orders.length) * 100 : 0 },
        { name: 'Family Customers', description: 'Orders with multiple inscriptions or family-like personalization.', orders: familyRows.length, customers: familyRows.length, revenue: familyRows.reduce((s, r) => s + r.amount, 0), aov: familyRows.length ? familyRows.reduce((s, r) => s + r.amount, 0) / familyRows.length : 0, share: orders.length ? (familyRows.length / orders.length) * 100 : 0 },
      ],
      service: { total: kustomerCount, topReasons: serviceReasons },
      reviews: { total: trustpilotCount, averageRating: reviews.averageRating, positiveThemes: reviews.positiveThemes, negativeThemes: reviews.negativeThemes },
      keyTakeaways: [
        `Oak & Luna has ${ordersCount.toLocaleString('en-US')} clean orders in oak_luna_orders_v2.`,
        `Sample AOV is ${sampleAov.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}.`,
        `${summary.personalizationRate.toFixed(1)}% of sampled orders show a personalization signal.`,
        `Kustomer has ${kustomerCount.toLocaleString('en-US')} conversations and Trustpilot has ${trustpilotCount.toLocaleString('en-US')} reviews.`,
      ],
    });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Unexpected insights API error.' });
  }
}
