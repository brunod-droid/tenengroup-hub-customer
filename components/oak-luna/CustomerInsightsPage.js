import { useEffect, useMemo, useState } from 'react';
import { chunkArray, compactRaw, parseCsv, pick, rowsToObjects, safeNumber } from './csvHelpers';

const sampleQuestions = [
  'What do customers from New York order most?',
  'What is the average number of engravings on Willow Tag?',
  'Which products generate the most resize requests?',
  'Why do customers leave 5-star reviews?',
  'Which cities have the highest AOV?',
];

function rawValues(row) {
  return Object.values(row?.raw || {}).map((v) => String(v || '').trim()).filter(Boolean);
}

function firstEmail(row) {
  if (row?.email) return row.email;
  const found = rawValues(row).find((v) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(v));
  const match = found?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
}

function firstAmount(row) {
  if (Number(row?.amount || 0) > 0) return Number(row.amount);
  const nums = rawValues(row)
    .map((v) => Number(String(v).replace(/[^0-9.-]/g, '')))
    .filter((n) => Number.isFinite(n) && n > 20 && n < 5000);
  return nums.length ? Math.max(...nums) : 0;
}

function parseAddressText(row) {
  const values = rawValues(row);
  const address = values.find((v) =>
    /(united states|canada|united kingdom|australia|germany|france|hong kong|singapore)/i.test(v) &&
    /[0-9]/.test(v)
  ) || '';

  const countryMatch = address.match(/\b(United States|Canada|United Kingdom|Australia|Germany|France|Hong Kong|Singapore)\b/i);
  const country = countryMatch ? countryMatch[1] : row?.country || '';

  const stateMatch = address.match(/\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Florida|Georgia|Hawaii|Illinois|Kansas|Kentucky|Massachusetts|Michigan|Minnesota|Mississippi|Nevada|New Jersey|New York|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|South Carolina|Tennessee|Texas|Virginia|Washington|Wisconsin|Wyoming|Ontario|Alberta|Quebec|British Columbia|Florida|California|Texas|New York)\b/i);
  const state = row?.state || (stateMatch ? stateMatch[1] : '');

  let city = row?.city || '';
  if (!city && state) {
    const beforeState = address.split(new RegExp(state, 'i'))[0].trim();
    const parts = beforeState.split(/\s+/);
    city = parts.slice(-3).join(' ').replace(/^[0-9#.,-]+/, '').trim();
  }

  return { address, city, state, country };
}

function firstProductOrEngraving(row) {
  const values = rawValues(row);
  const engraving = row?.engraving || values.find((v) => /(inscription|initial|engraving|charm|chain length|ring size)/i.test(v)) || '';
  const product = row?.product || values.find((v) => /(necklace|bracelet|ring|tag|charm|willow|name|initial)/i.test(v) && !/@/.test(v)) || '';
  return { product, engraving };
}

function enrichOrder(row) {
  const geo = parseAddressText(row);
  const productInfo = firstProductOrEngraving(row);

  return {
    ...row,
    email: firstEmail(row),
    amount: firstAmount(row),
    city: row.city || geo.city,
    state: row.state || geo.state,
    country: row.country || geo.country,
    product: row.product || productInfo.product,
    engraving: row.engraving || productInfo.engraving,
  };
}

function loadSheetJs() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser only'));
  if (window.XLSX) return Promise.resolve(window.XLSX);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-sheetjs="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.XLSX));
      existing.addEventListener('error', () => reject(new Error('Failed to load Excel parser.')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.async = true;
    script.dataset.sheetjs = 'true';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('Failed to load Excel parser. Check internet/CSP.'));
    document.head.appendChild(script);
  });
}

async function fileToObjects(file) {
  const name = String(file?.name || '').toLowerCase();

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const XLSX = await loadSheetJs();
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheet = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheet];

    const json = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
    if (json.length > 0) return json;

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    return rowsToObjects(rows);
  }

  const text = await file.text();
  return rowsToObjects(parseCsv(text));
}

function toOrderRecord(row, index) {
  const raw = compactRaw(row);
  const email = String(pick(row, ['email', 'customer_email', 'billing_email', 'shipping_email', 'e_mail']) || '').toLowerCase().trim();
  const product = String(pick(row, ['product', 'product_name', 'item_name', 'sku_name', 'title', 'lineitem_name', 'name']) || '');
  const city = String(pick(row, ['city', 'shipping_city', 'billing_city']) || '');
  const state = String(pick(row, ['state', 'shipping_state', 'province', 'region']) || '');
  const country = String(pick(row, ['country', 'shipping_country', 'billing_country']) || '');
  const engraving = String(pick(row, ['engraving', 'personalization', 'personalisation', 'inscription', 'engraved_text']) || '');
  const giftNote = String(pick(row, ['gift_note', 'gift_message', 'message', 'note']) || '');
  const orderId = String(pick(row, ['order_id', 'order_number', 'id', 'name']) || `row-${index + 1}`);
  const amount = safeNumber(pick(row, ['amount', 'total', 'order_total', 'revenue', 'subtotal', 'price']));
  const orderDate = String(pick(row, ['order_date', 'created_at', 'date', 'created']) || '');

  return {
    order_id: orderId,
    email,
    first_name: String(pick(row, ['first_name', 'firstname', 'customer_first_name']) || ''),
    last_name: String(pick(row, ['last_name', 'lastname', 'customer_last_name']) || ''),
    city,
    state,
    country,
    product,
    engraving,
    gift_note: giftNote,
    amount,
    order_date: orderDate || null,
    raw,
  };
}

function toKustomerRecord(row, index) {
  const raw = compactRaw(row);
  const email = String(pick(row, ['email', 'customer_email', 'contact_email']) || '').toLowerCase().trim();
  return {
    conversation_id: String(pick(row, ['conversation_id', 'id', 'ticket_id']) || `row-${index + 1}`),
    email,
    subject: String(pick(row, ['subject', 'title']) || ''),
    reason: String(pick(row, ['reason', 'contact_reason', 'category', 'type', 'tags']) || ''),
    status: String(pick(row, ['status', 'conversation_status']) || ''),
    created_at_text: String(pick(row, ['created_at', 'created', 'date']) || ''),
    raw,
  };
}

function toTrustpilotRecord(row, index) {
  const raw = compactRaw(row);
  const email = String(pick(row, ['email', 'customer_email', 'consumer_email']) || '').toLowerCase().trim();
  return {
    review_id: String(pick(row, ['review_id', 'id']) || `row-${index + 1}`),
    email,
    rating: safeNumber(pick(row, ['rating', 'stars', 'score'])),
    title: String(pick(row, ['title', 'review_title']) || ''),
    review_text: String(pick(row, ['review', 'text', 'content', 'body', 'review_text']) || ''),
    created_at_text: String(pick(row, ['created_at', 'date', 'review_date']) || ''),
    raw,
  };
}

function countBy(items, keyGetter) {
  const map = new Map();
  items.forEach((item) => {
    const key = String(keyGetter(item) || '').trim();
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

function avg(items, key) {
  const nums = items.map((item) => Number(item[key] || 0)).filter((n) => Number.isFinite(n) && n > 0);
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function formatNumber(n) {
  return new Intl.NumberFormat('en-US').format(Math.round(n || 0));
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

async function apiGetData() {
  const res = await fetch('/api/oak-luna-customers');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

async function apiUpload(kind, records, replace = false) {
  const res = await fetch('/api/oak-luna-customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, records, replace }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export default function CustomerInsightsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [status, setStatus] = useState('');
  const [orders, setOrders] = useState([]);
  const [kustomer, setKustomer] = useState([]);
  const [trustpilot, setTrustpilot] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  async function loadData() {
    try {
      setStatus('Loading Oak & Luna customer data...');
      const data = await apiGetData();
      setOrders((data.orders || []).map(enrichOrder));
      setKustomer(data.kustomer || []);
      setTrustpilot(data.trustpilot || []);
      setStatus('Data loaded from Supabase.');
    } catch (error) {
      setStatus(`Load failed: ${error.message}`);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function uploadFile(kind, file) {
    if (!file) return;
    setStatus(`Reading ${file.name}...`);

    let objects = [];
    try {
      objects = await fileToObjects(file);
    } catch (error) {
      setStatus(`Read ${kind} failed: ${error.message}`);
      return;
    }

    const mapper = {
      orders: toOrderRecord,
      kustomer: toKustomerRecord,
      trustpilot: toTrustpilotRecord,
    }[kind];

    const records = objects.map(mapper).filter(Boolean);
    const batchSize = kind === 'orders' ? 150 : 300;
    const batches = chunkArray(records, batchSize);

    try {
      for (let i = 0; i < batches.length; i += 1) {
        const doneBefore = i * batchSize;
        setStatus(`Uploading ${kind}: ${formatNumber(Math.min(doneBefore + batches[i].length, records.length))} / ${formatNumber(records.length)} rows...`);
        await apiUpload(kind, batches[i], i === 0);
      }

      setStatus(`${kind} uploaded and saved permanently in Supabase: ${formatNumber(records.length)} rows.`);
      await loadData();
    } catch (error) {
      setStatus(`Upload ${kind} failed: ${error.message}`);
    }
  }

  const insights = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
    const uniqueEmails = new Set(orders.map((o) => o.email).filter(Boolean));
    const engravedOrders = orders.filter((o) => String(o.engraving || '').trim() !== '' && !/no inscription/i.test(String(o.engraving || '')));
    const giftOrders = orders.filter((o) => String(o.gift_note || '').trim() !== '');
    const topProducts = countBy(orders, (o) => o.product).slice(0, 10);
    const topCities = countBy(orders, (o) => o.city).slice(0, 10);
    const topCountries = countBy(orders, (o) => o.country).slice(0, 10);
    const topReasons = countBy(kustomer, (t) => t.reason).slice(0, 10);
    const rating = avg(trustpilot, 'rating');

    return {
      customers: uniqueEmails.size,
      orders: orders.length,
      revenue: totalRevenue,
      aov: orders.length ? totalRevenue / orders.length : 0,
      engravedRate: orders.length ? (engravedOrders.length / orders.length) * 100 : 0,
      giftRate: orders.length ? (giftOrders.length / orders.length) * 100 : 0,
      ticketRate: orders.length ? (kustomer.length / orders.length) * 100 : 0,
      rating,
      topProducts,
      topCities,
      topCountries,
      topReasons,
    };
  }, [orders, kustomer, trustpilot]);

  function runSmartAnswer(customQuestion) {
    const q = String(customQuestion || question || '').toLowerCase();
    if (!q.trim()) return;

    if (q.includes('new york')) {
      const ny = orders.filter((o) => String(o.city || '').toLowerCase().includes('new york') || String(o.state || '').toLowerCase() === 'new york' || String(o.state || '').toLowerCase() === 'ny');
      const products = countBy(ny, (o) => o.product).slice(0, 5);
      setAnswer(`Customers from New York have ${formatNumber(ny.length)} orders in the saved dataset. Top products/personalization patterns: ${products.map((p) => `${p.name} (${p.count})`).join(', ') || 'not enough product data yet'}.`);
      return;
    }

    if (q.includes('engraving') || q.includes('engrav')) {
      const productName = q.includes('willow') ? 'willow' : '';
      const filtered = productName ? orders.filter((o) => String(o.product || o.engraving || '').toLowerCase().includes(productName)) : orders;
      const engraved = filtered.filter((o) => String(o.engraving || '').trim() !== '' && !/no inscription/i.test(String(o.engraving || '')));
      const rate = filtered.length ? (engraved.length / filtered.length) * 100 : 0;
      setAnswer(`${productName ? 'Willow-related products' : 'All products'}: ${formatNumber(filtered.length)} orders, ${formatNumber(engraved.length)} with engraving, engraving rate ${rate.toFixed(1)}%.`);
      return;
    }

    if (q.includes('resize')) {
      const resizeTickets = kustomer.filter((t) => JSON.stringify(t.raw || t).toLowerCase().includes('resize'));
      setAnswer(`I found ${formatNumber(resizeTickets.length)} resize-related Kustomer conversations in the saved dataset.`);
      return;
    }

    if (q.includes('5-star') || q.includes('five star') || q.includes('5 star')) {
      const five = trustpilot.filter((r) => Number(r.rating) === 5);
      setAnswer(`${formatNumber(five.length)} Trustpilot reviews are 5-star. Common positive themes to review manually: quality, meaningful gift, personalization, delivery, and customer service.`);
      return;
    }

    setAnswer(`Based on saved data: ${formatNumber(orders.length)} orders, ${formatNumber(kustomer.length)} Kustomer conversations, and ${formatNumber(trustpilot.length)} Trustpilot reviews are currently available.`);
  }

  const tabs = [
    ['overview', 'Overview'],
    ['geography', 'Geography'],
    ['products', 'Products'],
    ['service', 'Customer Service'],
    ['reviews', 'Reviews'],
    ['smart-ai', 'Smart AI'],
  ];

  return (
    <div className="oakPage">
      <div className="hero">
        <div>
          <p className="eyebrow">Oak & Luna Customer Intelligence</p>
          <h1>Who Are Our Customers?</h1>
          <p className="heroText">
            Analyze Oak & Luna customers using saved order data, Kustomer conversations, and Trustpilot reviews.
          </p>
        </div>
        <div className="heroBadge">Supabase persistent V1.1</div>
      </div>

      <div className="uploadBox">
        <div>
          <h2>Upload data once</h2>
          <p>Each upload replaces the previous dataset for that source and stays saved in Supabase.</p>
        </div>
        <label>Orders Excel/CSV<input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => uploadFile('orders', e.target.files?.[0])} /></label>
        <label>Kustomer CSV<input type="file" accept=".csv" onChange={(e) => uploadFile('kustomer', e.target.files?.[0])} /></label>
        <label>Trustpilot CSV<input type="file" accept=".csv" onChange={(e) => uploadFile('trustpilot', e.target.files?.[0])} /></label>
      </div>

      {status && <div className="status">{status}</div>}

      <div className="kpis">
        <div><span>Total customers</span><strong>{formatNumber(insights.customers)}</strong></div>
        <div><span>Total orders</span><strong>{formatNumber(insights.orders)}</strong></div>
        <div><span>Revenue</span><strong>{formatMoney(insights.revenue)}</strong></div>
        <div><span>AOV</span><strong>{formatMoney(insights.aov)}</strong></div>
        <div><span>Engraved orders</span><strong>{insights.engravedRate.toFixed(1)}%</strong></div>
        <div><span>Gift note orders</span><strong>{insights.giftRate.toFixed(1)}%</strong></div>
        <div><span>Ticket rate</span><strong>{insights.ticketRate.toFixed(1)}%</strong></div>
        <div><span>Trustpilot avg.</span><strong>{insights.rating.toFixed(1)}</strong></div>
      </div>

      <div className="tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      <section className="panel">
        {activeTab === 'overview' && (
          <>
            <h2>Customer Summary</h2>
            <p>
              Oak & Luna customers are analyzed across orders, product personalization, support contacts, and reviews.
            </p>
            <div className="grid2">
              <List title="Top Countries" items={insights.topCountries} />
              <List title="Top Contact Reasons" items={insights.topReasons} />
            </div>
          </>
        )}

        {activeTab === 'geography' && (
          <div className="grid2">
            <List title="Top Cities" items={insights.topCities} />
            <List title="Top Countries" items={insights.topCountries} />
          </div>
        )}

        {activeTab === 'products' && <List title="Best Selling Products / Personalization Patterns" items={insights.topProducts} />}

        {activeTab === 'service' && <List title="Kustomer Contact Reasons" items={insights.topReasons} />}

        {activeTab === 'reviews' && (
          <>
            <h2>Trustpilot Reviews</h2>
            <p>Average rating: {insights.rating.toFixed(1)} based on {formatNumber(trustpilot.length)} saved reviews.</p>
          </>
        )}

        {activeTab === 'smart-ai' && (
          <>
            <h2>Smart AI Mode</h2>
            <p>V1.1 uses deterministic answers from saved Supabase data.</p>
            <div className="askBox">
              <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask anything about Oak & Luna customers..." />
              <button onClick={() => runSmartAnswer()}>Ask</button>
            </div>
            <div className="chips">
              {sampleQuestions.map((q) => (
                <button key={q} onClick={() => { setQuestion(q); runSmartAnswer(q); }}>{q}</button>
              ))}
            </div>
            {answer && <div className="answer">{answer}</div>}
          </>
        )}
      </section>

      <style jsx>{`
        .oakPage { min-height: 100vh; padding: 32px; background: #f7f3ef; color: #211a16; font-family: Inter, Arial, sans-serif; }
        .hero { display: flex; justify-content: space-between; gap: 24px; align-items: center; padding: 32px; border-radius: 28px; background: linear-gradient(135deg, #fff, #eaded2); box-shadow: 0 20px 45px rgba(60, 40, 25, 0.08); }
        .eyebrow { text-transform: uppercase; letter-spacing: .14em; font-size: 12px; font-weight: 700; color: #8a684f; }
        h1 { margin: 8px 0; font-size: 44px; line-height: 1; }
        h2 { margin: 0 0 10px; }
        .heroText { max-width: 720px; color: #6f5b4c; font-size: 17px; }
        .heroBadge { background: #211a16; color: #fff; padding: 12px 16px; border-radius: 999px; font-weight: 700; white-space: nowrap; }
        .uploadBox { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 16px; margin: 22px 0; padding: 22px; background: #fff; border-radius: 22px; box-shadow: 0 12px 30px rgba(60, 40, 25, 0.06); align-items: center; }
        .uploadBox p { margin: 0; color: #6f5b4c; }
        label { display: grid; gap: 8px; font-weight: 700; font-size: 14px; }
        input[type=file] { font-size: 13px; }
        .status { padding: 14px 18px; border-radius: 14px; background: #fff8dc; border: 1px solid #eadc9c; margin-bottom: 18px; }
        .kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 20px 0; }
        .kpis div { background: #fff; padding: 18px; border-radius: 18px; box-shadow: 0 10px 22px rgba(60, 40, 25, 0.05); }
        .kpis span { display: block; color: #7c695a; font-size: 13px; margin-bottom: 8px; }
        .kpis strong { font-size: 26px; }
        .tabs { display: flex; gap: 10px; flex-wrap: wrap; margin: 24px 0; }
        .tabs button, .askBox button, .chips button { border: 0; border-radius: 999px; padding: 11px 16px; background: #fff; cursor: pointer; font-weight: 700; color: #3a2a20; }
        .tabs button.active { background: #211a16; color: #fff; }
        .panel { background: #fff; border-radius: 24px; padding: 28px; box-shadow: 0 18px 42px rgba(60, 40, 25, 0.08); }
        .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
        .list { border: 1px solid #eee3d9; border-radius: 18px; overflow: hidden; }
        .list h3 { margin: 0; padding: 16px; background: #fbf8f5; }
        .row { display: flex; justify-content: space-between; gap: 16px; padding: 12px 16px; border-top: 1px solid #f0e8df; }
        .row span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .askBox { display: flex; gap: 10px; margin: 18px 0; }
        .askBox input { flex: 1; padding: 15px 18px; border: 1px solid #e1d4c8; border-radius: 999px; font-size: 15px; }
        .askBox button { background: #211a16; color: #fff; padding-inline: 24px; }
        .chips { display: flex; gap: 10px; flex-wrap: wrap; }
        .chips button { background: #f7f3ef; }
        .answer { margin-top: 18px; padding: 18px; background: #f7f3ef; border-radius: 18px; line-height: 1.5; }
        @media (max-width: 900px) {
          .oakPage { padding: 18px; }
          .hero, .uploadBox, .grid2 { grid-template-columns: 1fr; display: grid; }
          .kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          h1 { font-size: 34px; }
        }
      `}</style>
    </div>
  );
}

function List({ title, items }) {
  return (
    <div className="list">
      <h3>{title}</h3>
      {(items || []).length === 0 && <div className="row"><span>No data yet</span><strong>-</strong></div>}
      {(items || []).slice(0, 10).map((item) => (
        <div className="row" key={item.name}>
          <span>{item.name || 'Unknown'}</span>
          <strong>{formatNumber(item.count)}</strong>
        </div>
      ))}
    </div>
  );
}
