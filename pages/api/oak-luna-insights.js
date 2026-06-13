
const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const TRUE_CUSTOMERS = 273260;
const TRUE_REPEAT_CUSTOMERS = 38873;
const TRUE_PERSONALIZED_ORDERS = 249937;

function normalizeSupabaseUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1$/i, '');
}

const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);

const TABLES = {
  orders: 'oak_luna_orders_v2',
  kustomer: 'oak_luna_kustomer',
  trustpilot: 'oak_luna_trustpilot',
};

export const config = { api: { bodyParser: { sizeLimit: '1mb' }, responseLimit: false } };

function send(res, status, body) { res.status(status).json(body); }
function headers(extra = {}) {
  return { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}`, 'Content-Type': 'application/json', ...extra };
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
  if (!response.ok) throw new Error(`Count failed for ${kind}: ${await response.text()}`);
  return countFromContentRange(response.headers.get('content-range'));
}
async function readSample(kind, limit, columns) {
  const response = await fetch(tableUrl(TABLES[kind], `select=${encodeURIComponent(columns)}&order=id.asc&limit=${limit}`), {
    method: 'GET',
    headers: headers(),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : [];
  if (!response.ok) throw new Error(`Sample read failed for ${kind}: ${text || response.statusText}`);
  return Array.isArray(data) ? data : [];
}
function safeNumber(value) {
  const n = Number(String(value || '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function topFromMap(map, limit = 10) {
  return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}
function normalizeStateName(value = '') {
  const clean = String(value || '').trim();
  return ({ York: 'New York', Jersey: 'New Jersey', Carolina: 'North Carolina', Dakota: 'North Dakota' }[clean]) || clean || 'Unknown';
}
function getCountryFromAddress(address = '') {
  const text = String(address || '');
  return ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Hong Kong', 'Singapore']
    .find((c) => new RegExp(c, 'i').test(text)) || 'Unknown';
}
function getStateFromAddress(address = '') {
  const text = String(address || '');
  const states = ['North Carolina','South Carolina','North Dakota','South Dakota','New York','New Jersey','New Mexico','New Hampshire','West Virginia','Rhode Island','Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','Ohio','Oklahoma','Oregon','Pennsylvania','Tennessee','Texas','Utah','Vermont','Virginia','Washington','Wisconsin','Wyoming','Ontario','Quebec','Alberta','British Columbia','Queensland','New South Wales','Victoria'];
  return states.find((s) => new RegExp(`\\b${s}\\b`, 'i').test(text)) || 'Unknown';
}
function getCityFromAddress(address = '') {
  const text = String(address || '').replace(/\s+/g, ' ').trim();
  const state = getStateFromAddress(text);
  if (!text || state === 'Unknown') return 'Unknown';
  const beforeState = text.split(new RegExp(`\\b${state}\\b`, 'i'))[0].trim();
  return beforeState.split(/\s+/).filter(Boolean).slice(-2).join(' ') || 'Unknown';
}
function normalizeOrder(row) {
  const address = row.full_address || '';
  return {
    ...row,
    amount: safeNumber(row.amount),
    country: row.country || getCountryFromAddress(address),
    state: normalizeStateName(row.state || getStateFromAddress(address)),
    city: row.city || getCityFromAddress(address),
    personalization: row.personalization || '',
  };
}
function countBy(rows, key, limit = 15) {
  const map = new Map();
  rows.forEach((row) => {
    const value = String(row[key] || '').trim();
    if (!value || value === 'Unknown') return;
    map.set(value, (map.get(value) || 0) + 1);
  });
  return topFromMap(map, limit);
}
function aggBy(rows, key, limit = 15) {
  const map = new Map();
  rows.forEach((row) => {
    const name = String(row[key] || '').trim();
    if (!name || name === 'Unknown') return;
    const current = map.get(name) || { name, orders: 0, revenue: 0 };
    current.orders += 1;
    current.revenue += safeNumber(row.amount);
    map.set(name, current);
  });
  return Array.from(map.values()).map((x) => ({ ...x, aov: x.orders ? x.revenue / x.orders : 0 })).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}
function isPersonalized(row) {
  const text = String(row.personalization || '').toLowerCase();
  return Boolean(text && !/no inscription|no initial/.test(text));
}
function engravingTheme(row) {
  const text = String(row.personalization || '').toLowerCase();
  if (!text || /no inscription|no initial/.test(text)) return 'No personalization';
  if (/initial/.test(text)) return 'Initials';
  if (/charm|heart|♥|diamond|spade|club/.test(text)) return 'Charms / Symbols';
  if (/inscription #2|inscription #3|3 inscriptions|4 inscriptions/.test(text)) return 'Multi-name / Family';
  if (/inscription/.test(text)) return 'Names / Words';
  return 'Other personalization';
}
function extractNames(personalization = '') {
  return [...String(personalization || '').matchAll(/Inscription(?:\s+#\d+)?:\s*([^"\n\r]+?)(?=\s+Inscription|\s+Chain length|\s+Ring size|\s*$)/gi)]
    .map((m) => String(m[1] || '').trim())
    .filter((name) => name && !/^\d{3,}$/.test(name) && name.length <= 30);
}
function extractInitials(personalization = '') {
  return [...String(personalization || '').matchAll(/Initial\s+#?\d*:\s*([A-Za-z])/gi)].map((m) => String(m[1] || '').toUpperCase());
}
function analyzeDNA(orders) {
  const names = new Map(), initials = new Map(), themes = new Map();
  let familyOrders = 0, multiInscriptionOrders = 0;
  orders.forEach((order) => {
    const p = order.personalization || '';
    const theme = engravingTheme(order);
    themes.set(theme, (themes.get(theme) || 0) + 1);
    extractNames(p).forEach((name) => names.set(name, (names.get(name) || 0) + 1));
    extractInitials(p).forEach((i) => initials.set(i, (initials.get(i) || 0) + 1));
    if (/inscription #2|inscription #3|3 inscriptions|4 inscriptions/i.test(p)) multiInscriptionOrders += 1;
    if (/mom|mama|mother|dad|daughter|son|family|grandma|grandpa/i.test(p)) familyOrders += 1;
  });
  return { topNames: topFromMap(names, 15), topInitials: topFromMap(initials, 15), themes: topFromMap(themes, 10), familyOrders, multiInscriptionOrders };
}
function analyzeService(rows) {
  const reasons = new Map();
  const patterns = { Shipping: /shipping|delivery|tracking|package|late|carrier|fedex|usps|dhl/i, Resize: /resize|size|sizing|too small|too big/i, Engraving: /engraving|inscription|personalization|wrong name|spelling/i, Return: /return|refund|exchange|cancel/i, Damaged: /damaged|broken|defect|quality/i };
  rows.forEach((row) => {
    const text = JSON.stringify(row || {});
    let matched = false;
    Object.entries(patterns).forEach(([name, regex]) => {
      if (regex.test(text)) { reasons.set(name, (reasons.get(name) || 0) + 1); matched = true; }
    });
    if (!matched && row.reason) reasons.set(String(row.reason).slice(0, 80), (reasons.get(String(row.reason).slice(0, 80)) || 0) + 1);
  });
  return topFromMap(reasons, 10);
}
function analyzeReviews(rows) {
  let total = 0, count = 0;
  const positive = new Map(), negative = new Map();
  const pos = { Quality: /quality|beautiful|perfect|gorgeous|amazing|love|bonne qualité|qualité/i, Personalization: /personal|engraving|name|initial|custom|collier/i, Gift: /gift|birthday|anniversary|mother|wife|daughter|cadeau|mère/i, Service: /service|helpful|support|customer service/i, Delivery: /delivery|shipping|arrived|fast|livraison/i };
  const neg = { Shipping: /late|delay|shipping|tracking|delivery|livraison/i, Quality: /broken|damaged|poor quality|tarnish/i, Sizing: /size|resize|too small|too big/i, Engraving: /engraving|wrong name|spelling|inscription/i, Service: /service|support|response/i };
  rows.forEach((row) => {
    const rating = safeNumber(row.rating);
    if (rating > 0) { total += rating; count += 1; }
    const text = `${row.title || ''} ${row.review_text || ''} ${JSON.stringify(row.raw || {})}`;
    Object.entries(pos).forEach(([name, regex]) => { if (regex.test(text)) positive.set(name, (positive.get(name) || 0) + 1); });
    if (rating && rating <= 3) Object.entries(neg).forEach(([name, regex]) => { if (regex.test(text)) negative.set(name, (negative.get(name) || 0) + 1); });
  });
  return { averageRating: count ? total / count : 0, positiveThemes: topFromMap(positive, 10), negativeThemes: topFromMap(negative, 10) };
}

export default async function handler(req, res) {
  if (!supabaseUrl || !supabaseKey) return send(res, 500, { error: 'Supabase env variables are missing.' });
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
  try {
    const [ordersCount, kustomerCount, trustpilotCount] = await Promise.all([getCount('orders'), getCount('kustomer'), getCount('trustpilot')]);
    const [ordersRaw, kustomerSample, trustpilotSample] = await Promise.all([
      readSample('orders', 5000, 'id,order_id,first_name,last_name,email,amount,full_address,personalization,country,state,city'),
      readSample('kustomer', 1000, 'id,conversation_id,email,subject,reason,status,created_at_text,raw'),
      readSample('trustpilot', 1000, 'id,review_id,email,rating,title,review_text,created_at_text,raw'),
    ]);
    const orders = ordersRaw.map(normalizeOrder);
    const sampleRevenue = orders.reduce((sum, row) => sum + row.amount, 0);
    const sampleAov = orders.length ? sampleRevenue / orders.length : 0;
    const repeatRate = TRUE_CUSTOMERS ? (TRUE_REPEAT_CUSTOMERS / TRUE_CUSTOMERS) * 100 : 0;
    const personalizationRate = ordersCount ? (TRUE_PERSONALIZED_ORDERS / ordersCount) * 100 : 0;
    const dna = analyzeDNA(orders);
    const stateAgg = aggBy(orders, 'state', 15);
    const cityAgg = aggBy(orders, 'city', 15);
    const reviews = analyzeReviews(trustpilotSample);
    const summary = {
      customers: TRUE_CUSTOMERS,
      orders: ordersCount,
      revenue: sampleAov * ordersCount,
      aov: sampleAov,
      repeatCustomerRate: repeatRate,
      personalizationRate,
      contactRate: ordersCount ? (kustomerCount / ordersCount) * 100 : 0,
      trustpilotScore: reviews.averageRating,
      supportContacts: kustomerCount,
      reviews: trustpilotCount,
      repeatCustomers: TRUE_REPEAT_CUSTOMERS,
      personalizedOrders: TRUE_PERSONALIZED_ORDERS,
      nonPersonalizedRate: 100 - personalizationRate,
    };
    return send(res, 200, {
      generatedAt: new Date().toISOString(),
      mode: 'dashboard_v3',
      summary,
      executiveCards: [
        { label: 'Customers', value: TRUE_CUSTOMERS, note: 'Unique emails' },
        { label: 'Orders', value: ordersCount, note: 'Clean orders loaded' },
        { label: 'Revenue', value: summary.revenue, currency: true, note: 'Estimated from orders' },
        { label: 'AOV', value: sampleAov, currency: true, note: 'Average order value' },
        { label: 'Repeat Customers', value: repeatRate, suffix: '%', note: `${TRUE_REPEAT_CUSTOMERS.toLocaleString('en-US')} customers` },
        { label: 'Personalized', value: personalizationRate, suffix: '%', note: `${TRUE_PERSONALIZED_ORDERS.toLocaleString('en-US')} orders` },
        { label: 'Contact Rate', value: summary.contactRate, suffix: '%', note: `${kustomerCount.toLocaleString('en-US')} conversations` },
        { label: 'Trustpilot', value: reviews.averageRating, note: `${trustpilotCount.toLocaleString('en-US')} reviews` },
      ],
      geography: { countries: countBy(orders, 'country'), states: stateAgg, cities: cityAgg, topStatesByOrders: [...stateAgg].sort((a,b)=>b.orders-a.orders), topStatesByAov: [...stateAgg].sort((a,b)=>b.aov-a.aov) },
      products: { bestSellers: [{ name: 'Product names are not available in the current Orders source file', count: ordersCount }], productPerformance: [{ name: 'Product names not available', orders: ordersCount, revenue: summary.revenue, aov: sampleAov, personalizationRate }] },
      personalization: { engravingThemes: dna.themes, topNames: dna.topNames, topInitials: dna.topInitials, sampleFamilyOrders: dna.familyOrders, sampleMultiInscriptionOrders: dna.multiInscriptionOrders },
      personas: [
        { name: 'Personalized Jewelry Lovers', description: 'Customers buying engraved, initial, charm, chain or ring personalization.', orders: TRUE_PERSONALIZED_ORDERS, customers: TRUE_PERSONALIZED_ORDERS, share: personalizationRate },
        { name: 'Repeat Customers', description: 'Customers with at least 2 Oak & Luna orders.', orders: TRUE_REPEAT_CUSTOMERS, customers: TRUE_REPEAT_CUSTOMERS, share: repeatRate },
      ],
      service: { total: kustomerCount, topReasons: analyzeService(kustomerSample) },
      reviews: { total: trustpilotCount, averageRating: reviews.averageRating, positiveThemes: reviews.positiveThemes, negativeThemes: reviews.negativeThemes },
      keyTakeaways: [
        `Oak & Luna generated about $${((sampleAov * ordersCount) / 1000000).toFixed(1)}M from ${ordersCount.toLocaleString('en-US')} clean orders.`,
        `${TRUE_CUSTOMERS.toLocaleString('en-US')} unique customers purchased during the period.`,
        `${repeatRate.toFixed(1)}% of customers are repeat buyers.`,
        `${personalizationRate.toFixed(1)}% of orders include personalization.`,
        `Trustpilot score is ${reviews.averageRating.toFixed(1)} across ${trustpilotCount.toLocaleString('en-US')} reviews.`,
        `Customer contact rate is ${summary.contactRate.toFixed(1)}%, based on ${kustomerCount.toLocaleString('en-US')} Kustomer conversations.`,
      ],
    });
  } catch (error) {
    return send(res, 500, { error: error.message || 'Unexpected insights API error.' });
  }
}
