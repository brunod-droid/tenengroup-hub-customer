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
    bodyParser: {
      sizeLimit: '4mb',
    },
    responseLimit: false,
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
    Prefer: 'count=exact',
    ...extra,
  };
}

function tableUrl(table, query = '') {
  const base = `${supabaseUrl}/rest/v1/${table}`;
  return query ? `${base}?${query}` : base;
}

function getCountFromContentRange(header) {
  const value = String(header || '');
  const match = value.match(/\/(\d+)$/);
  return match ? Number(match[1]) : 0;
}

async function getExactCount(kind) {
  const response = await fetch(tableUrl(TABLES[kind], 'select=id&limit=1'), {
    method: 'GET',
    headers: supabaseHeaders(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Count failed for ${kind}: ${text || response.statusText}`);
  }

  return getCountFromContentRange(response.headers.get('content-range'));
}

async function readRange(kind, from, to, columns = '*') {
  const response = await fetch(tableUrl(TABLES[kind], `select=${encodeURIComponent(columns)}`), {
    method: 'GET',
    headers: supabaseHeaders({
      Range: `${from}-${to}`,
      Prefer: 'count=exact',
    }),
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok && response.status !== 206) {
    throw new Error(`Read failed for ${kind}: ${text || response.statusText}`);
  }

  return Array.isArray(data) ? data : [];
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function values(raw = {}) {
  return Object.values(raw || {}).map((v) => String(v || '').trim()).filter(Boolean);
}

function extractEmail(order) {
  if (order.email) return String(order.email).toLowerCase().trim();
  return values(order.raw).find(looksLikeEmail)?.toLowerCase() || '';
}

function extractAmount(order) {
  const direct = Number(order.amount || 0);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const candidates = values(order.raw)
    .map((v) => Number(String(v).replace(/[^0-9.-]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 0 && n < 10000);

  return candidates.length ? Math.max(...candidates) : 0;
}

function extractEngraving(order) {
  if (order.engraving) return String(order.engraving);
  return values(order.raw).find((v) => /inscription|initial|engraving|charm|chain length|ring size|bracelet size/i.test(v)) || '';
}

function extractAddress(order) {
  const countryPattern = /(united states|canada|united kingdom|australia|germany|france|hong kong|singapore)/i;
  return values(order.raw).find((v) => countryPattern.test(v) && v.length > 30) || '';
}

function extractCountry(order) {
  if (order.country) return String(order.country);
  const address = extractAddress(order);
  const countries = ['United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Hong Kong', 'Singapore'];
  return countries.find((country) => new RegExp(country, 'i').test(address)) || 'Unknown';
}

function extractState(order) {
  if (order.state) return String(order.state);
  const address = extractAddress(order);
  const states = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii',
    'Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York',
    'North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
    'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
    'Ontario','Quebec','Alberta','British Columbia','Manitoba','Saskatchewan','Nova Scotia','Newfoundland and Labrador',
    'Queensland','New South Wales','Victoria'
  ];
  return states.find((state) => new RegExp(`\\b${state}\\b`, 'i').test(address)) || 'Unknown';
}

function extractCity(order) {
  if (order.city) return String(order.city);
  const address = extractAddress(order).replace(/\s+/g, ' ').trim();
  const state = extractState(order);
  if (!address || state === 'Unknown') return 'Unknown';

  const beforeState = address.split(new RegExp(`\\b${state}\\b`, 'i'))[0].trim();
  const parts = beforeState.split(/\s+/).filter(Boolean);
  const guess = parts.slice(-2).join(' ');
  return guess || 'Unknown';
}

function extractProduct(order) {
  if (order.product) return String(order.product);
  return 'Product details in raw order';
}

function engravingType(text) {
  const v = String(text || '').toLowerCase();
  if (!v || /no inscription|no initial/.test(v)) return 'No personalization';
  if (/initial/.test(v)) return 'Initials';
  if (/\b\d{2,4}\b|date/.test(v)) return 'Dates';
  if (/charm|heart|diamond|spade|club/.test(v)) return 'Charms / Symbols';
  if (/inscription/.test(v)) return 'Names / Words';
  return 'Other personalization';
}

function giftTheme(text) {
  const v = String(text || '').toLowerCase();
  if (!v) return '';
  if (/birthday|bday|born/.test(v)) return 'Birthday';
  if (/anniversary|years|married/.test(v)) return 'Anniversary';
  if (/mother|mom|mama|mum/.test(v)) return "Mother's Day / Mom";
  if (/wedding|bride|groom/.test(v)) return 'Wedding';
  if (/christmas|xmas|holiday/.test(v)) return 'Christmas / Holiday';
  if (/love|miss you|forever/.test(v)) return 'Love';
  return 'Other gift note';
}

function createTopMap() {
  return new Map();
}

function increment(map, key, add = 1) {
  const cleanKey = String(key || '').trim() || 'Unknown';
  map.set(cleanKey, (map.get(cleanKey) || 0) + add);
}

function incrementAgg(map, key, amount = 0, engraved = false) {
  const cleanKey = String(key || '').trim() || 'Unknown';
  const current = map.get(cleanKey) || { name: cleanKey, orders: 0, revenue: 0, engraved: 0 };
  current.orders += 1;
  current.revenue += amount || 0;
  if (engraved) current.engraved += 1;
  map.set(cleanKey, current);
}

function topCount(map, limit = 10) {
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function topAgg(map, limit = 10) {
  return Array.from(map.values())
    .map((item) => ({
      ...item,
      aov: item.orders ? item.revenue / item.orders : 0,
      personalizationRate: item.orders ? (item.engraved / item.orders) * 100 : 0,
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, limit);
}

function analyzeService(conversations = []) {
  const reasons = createTopMap();
  const keywords = {
    Shipping: /shipping|delivery|tracking|package|arrived|late|carrier|fedex|usps|dhl/i,
    Resize: /resize|size|sizing|too small|too big|ring size|bracelet size/i,
    Engraving: /engraving|inscription|personalization|personalisation|wrong name|spelling/i,
    Return: /return|refund|exchange|cancel/i,
    Damaged: /damaged|broken|defect|quality/i,
  };

  conversations.forEach((row) => {
    const text = JSON.stringify(row || '');
    const directReason = row.reason || row.subject || row.status || '';
    let matched = false;

    Object.entries(keywords).forEach(([name, pattern]) => {
      if (pattern.test(text)) {
        increment(reasons, name);
        matched = true;
      }
    });

    if (!matched && directReason) increment(reasons, String(directReason).slice(0, 80));
  });

  return {
    total: conversations.length,
    topReasons: topCount(reasons, 10),
  };
}

function analyzeReviews(reviews = []) {
  const themes = createTopMap();
  const complaints = createTopMap();
  let ratingTotal = 0;
  let ratingCount = 0;

  const positive = {
    Quality: /quality|beautiful|perfect|gorgeous|amazing|love/i,
    Personalization: /personal|engraving|name|initial|custom/i,
    Gift: /gift|birthday|anniversary|mother|wife|daughter/i,
    Service: /service|helpful|support|customer service/i,
    Delivery: /delivery|shipping|arrived|fast/i,
  };

  const negative = {
    Shipping: /late|delay|shipping|tracking|delivery/i,
    Quality: /broken|damaged|poor quality|tarnish/i,
    Sizing: /size|resize|too small|too big/i,
    Engraving: /engraving|wrong name|spelling|inscription/i,
    Service: /service|support|response/i,
  };

  reviews.forEach((review) => {
    const rating = Number(review.rating || 0);
    if (rating > 0) {
      ratingTotal += rating;
      ratingCount += 1;
    }

    const text = `${review.title || ''} ${review.review_text || ''} ${JSON.stringify(review.raw || {})}`;

    Object.entries(positive).forEach(([name, pattern]) => {
      if (pattern.test(text)) increment(themes, name);
    });

    if (rating && rating <= 3) {
      Object.entries(negative).forEach(([name, pattern]) => {
        if (pattern.test(text)) increment(complaints, name);
      });
    }
  });

  return {
    total: reviews.length,
    averageRating: ratingCount ? ratingTotal / ratingCount : 0,
    positiveThemes: topCount(themes, 8),
    negativeThemes: topCount(complaints, 8),
  };
}

async function getAllRows(kind, columns = '*', batchSize = 1000) {
  const total = await getExactCount(kind);
  const rows = [];

  for (let start = 0; start < total; start += batchSize) {
    const end = Math.min(start + batchSize - 1, total - 1);
    const batch = await readRange(kind, start, end, columns);
    rows.push(...batch);
  }

  return { total, rows };
}

function buildPersonas({ totalOrders, totalRevenue, uniqueCustomers, repeatCustomers, personalizedOrders, giftOrders, premiumOrders, familyOrders, coupleOrders }) {
  const safe = (count, revenue = 0) => ({
    orders: count,
    customers: Math.min(count, uniqueCustomers),
    revenue,
    aov: count ? revenue / count : 0,
    share: totalOrders ? (count / totalOrders) * 100 : 0,
  });

  return [
    { name: 'Personalized Jewelry Lovers', description: 'Customers buying engraved, initial, charm or personalized items.', ...safe(personalizedOrders.count, personalizedOrders.revenue) },
    { name: 'Gift Buyers', description: 'Customers with gift notes or gift-like order patterns.', ...safe(giftOrders.count, giftOrders.revenue) },
    { name: 'Premium Customers', description: 'Orders above $200 AOV threshold.', ...safe(premiumOrders.count, premiumOrders.revenue) },
    { name: 'Repeat Customers', description: 'Customers with more than one order.', orders: repeatCustomers.orders, customers: repeatCustomers.customers, revenue: repeatCustomers.revenue, aov: repeatCustomers.orders ? repeatCustomers.revenue / repeatCustomers.orders : 0, share: totalRevenue ? (repeatCustomers.revenue / totalRevenue) * 100 : 0 },
    { name: 'Family Customers', description: 'Orders mentioning multiple names, children or family-style personalization.', ...safe(familyOrders.count, familyOrders.revenue) },
    { name: 'Couples', description: 'Orders using hearts, initials, dates or love-related personalization.', ...safe(coupleOrders.count, coupleOrders.revenue) },
  ];
}

async function buildInsights() {
  const ordersTotal = await getExactCount('orders');

  const geography = {
    countries: createTopMap(),
    states: createTopMap(),
    cities: createTopMap(),
  };
  const products = createTopMap();
  const productAgg = new Map();
  const engravingThemes = createTopMap();
  const giftThemes = createTopMap();
  const customerAgg = new Map();

  let revenue = 0;
  let personalizedCount = 0;
  let personalizedRevenue = 0;
  let giftCount = 0;
  let giftRevenue = 0;
  let premiumCount = 0;
  let premiumRevenue = 0;
  let familyCount = 0;
  let familyRevenue = 0;
  let coupleCount = 0;
  let coupleRevenue = 0;

  const batchSize = 1000;

  for (let start = 0; start < ordersTotal; start += batchSize) {
    const end = Math.min(start + batchSize - 1, ordersTotal - 1);
    const batch = await readRange('orders', start, end, 'id,order_id,email,city,state,country,product,engraving,gift_note,amount,raw');

    batch.forEach((order) => {
      const amount = extractAmount(order);
      const email = extractEmail(order);
      const country = extractCountry(order);
      const state = extractState(order);
      const city = extractCity(order);
      const product = extractProduct(order);
      const engraving = extractEngraving(order);
      const giftNote = String(order.gift_note || '');
      const engraved = Boolean(engraving && !/no inscription|no initial/i.test(engraving));
      const theme = engravingType(engraving);
      const gift = giftTheme(giftNote);

      revenue += amount;

      increment(geography.countries, country);
      increment(geography.states, state);
      increment(geography.cities, city);
      increment(products, product);
      incrementAgg(productAgg, product, amount, engraved);
      increment(engravingThemes, theme);

      if (gift) increment(giftThemes, gift);

      if (engraved) {
        personalizedCount += 1;
        personalizedRevenue += amount;
      }

      if (gift || /gift/i.test(JSON.stringify(order.raw || {}))) {
        giftCount += 1;
        giftRevenue += amount;
      }

      if (amount >= 200) {
        premiumCount += 1;
        premiumRevenue += amount;
      }

      if (/inscription #2|inscription #3|children|kids|daughter|son|mom|mama|family/i.test(engraving)) {
        familyCount += 1;
        familyRevenue += amount;
      }

      if (/♥|heart|love|anniversary|initial #2|initials: 2/i.test(engraving)) {
        coupleCount += 1;
        coupleRevenue += amount;
      }

      if (email) {
        const customer = customerAgg.get(email) || { orders: 0, revenue: 0 };
        customer.orders += 1;
        customer.revenue += amount;
        customerAgg.set(email, customer);
      }
    });
  }

  const customers = customerAgg.size;
  let repeatCustomerCount = 0;
  let repeatCustomerOrders = 0;
  let repeatCustomerRevenue = 0;

  customerAgg.forEach((customer) => {
    if (customer.orders > 1) {
      repeatCustomerCount += 1;
      repeatCustomerOrders += customer.orders;
      repeatCustomerRevenue += customer.revenue;
    }
  });

  const [{ rows: kustomerRows }, { rows: reviewRows }] = await Promise.all([
    getAllRows('kustomer', '*', 1000),
    getAllRows('trustpilot', '*', 1000),
  ]);

  const service = analyzeService(kustomerRows);
  const reviews = analyzeReviews(reviewRows);

  const personas = buildPersonas({
    totalOrders: ordersTotal,
    totalRevenue: revenue,
    uniqueCustomers: customers,
    repeatCustomers: { customers: repeatCustomerCount, orders: repeatCustomerOrders, revenue: repeatCustomerRevenue },
    personalizedOrders: { count: personalizedCount, revenue: personalizedRevenue },
    giftOrders: { count: giftCount, revenue: giftRevenue },
    premiumOrders: { count: premiumCount, revenue: premiumRevenue },
    familyOrders: { count: familyCount, revenue: familyRevenue },
    coupleOrders: { count: coupleCount, revenue: coupleRevenue },
  });

  const summary = {
    customers,
    orders: ordersTotal,
    revenue,
    aov: ordersTotal ? revenue / ordersTotal : 0,
    repeatCustomerRate: customers ? (repeatCustomerCount / customers) * 100 : 0,
    personalizationRate: ordersTotal ? (personalizedCount / ordersTotal) * 100 : 0,
    giftRate: ordersTotal ? (giftCount / ordersTotal) * 100 : 0,
    contactRate: ordersTotal ? (service.total / ordersTotal) * 100 : 0,
    trustpilotScore: reviews.averageRating,
    supportContacts: service.total,
    reviews: reviews.total,
  };

  return {
    generatedAt: new Date().toISOString(),
    summary,
    geography: {
      countries: topCount(geography.countries, 15),
      states: topCount(geography.states, 15),
      cities: topCount(geography.cities, 15),
    },
    products: {
      bestSellers: topCount(products, 15),
      productPerformance: topAgg(productAgg, 15),
    },
    personalization: {
      engravingThemes: topCount(engravingThemes, 10),
      giftThemes: topCount(giftThemes, 10),
    },
    personas,
    service,
    reviews,
    keyTakeaways: [
      `Oak & Luna has ${ordersTotal.toLocaleString('en-US')} imported orders in Supabase.`,
      `${summary.personalizationRate.toFixed(1)}% of orders show a personalization signal.`,
      `${summary.contactRate.toFixed(2)}% support contact rate based on saved Kustomer conversations.`,
      reviews.averageRating ? `Trustpilot average score is ${reviews.averageRating.toFixed(1)} across ${reviews.total.toLocaleString('en-US')} reviews.` : 'Trustpilot reviews are imported and ready for deeper theme analysis.',
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
    const insights = await buildInsights();
    return send(res, 200, insights);
  } catch (error) {
    return send(res, 500, { error: error.message || 'Unexpected insights API error.' });
  }
}
