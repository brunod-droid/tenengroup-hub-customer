import { useEffect, useState } from 'react';

const emptyInsights = {
  summary: {},
  geography: { countries: [], states: [], topStatesByOrders: [], topStatesByAov: [], cityNote: '' },
  products: { message: '' },
  personalization: { engravingThemes: [], topNames: [], topInitials: [], giftSignals: {}, giftNoteStatus: '' },
  personas: [],
  service: { topReasons: [] },
  reviews: { positiveThemes: [], negativeThemes: [] },
  keyTakeaways: [],
};

function formatNumber(value) {
  return new Intl.NumberFormat('en-US').format(Math.round(Number(value || 0)));
}

function formatMoney(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

function formatCardValue(card) {
  if (card.currency) return formatMoney(card.value);
  if (card.suffix === '%') return formatPercent(card.value);
  if (card.label === 'Trustpilot') return Number(card.value || 0).toFixed(1);
  return formatNumber(card.value);
}

async function fetchInsights() {
  const response = await fetch('/api/oak-luna-insights');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || response.statusText);
  return data;
}

export default function CustomerInsightsPage() {
  const [activeTab, setActiveTab] = useState('executive');
  const [insights, setInsights] = useState(emptyInsights);
  const [status, setStatus] = useState('Loading Oak & Luna customer insights...');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    fetchInsights()
      .then((data) => {
        setInsights({ ...emptyInsights, ...data });
        setStatus(`Insights generated from Supabase cache. Last refresh: ${new Date(data.generatedAt || Date.now()).toLocaleString()}`);
      })
      .catch((error) => setStatus(`Insights load failed: ${error.message}`));
  }, []);

  const summary = insights.summary || {};
  const cards = insights.executiveCards || [];

  function askSmartAI(customQuestion) {
    const q = String(customQuestion || question || '').toLowerCase();

    if (q.includes('state') || q.includes('geography') || q.includes('aov')) {
      const states = insights.geography?.states || [];
      setAnswer(`Top revenue states: ${states.slice(0, 5).map((s) => `${s.name}: ${formatMoney(s.revenue)}, ${formatNumber(s.orders)} orders, ${formatMoney(s.aov)} AOV`).join('; ')}.`);
      return;
    }

    if (q.includes('name') || q.includes('engraving')) {
      const names = insights.personalization?.topNames || [];
      setAnswer(`Most common engraved names: ${names.slice(0, 8).map((n) => `${n.name} (${formatNumber(n.count)})`).join(', ')}.`);
      return;
    }

    if (q.includes('gift')) {
      const g = insights.personalization?.giftSignals || {};
      setAnswer(`Gift notes are not available in the current source file. Signals detected from personalization: family-related ${formatNumber(g.family_signal_orders)}, couple/love-related ${formatNumber(g.couple_signal_orders)}, birthday-related ${formatNumber(g.birthday_signal_orders)}.`);
      return;
    }

    if (q.includes('service') || q.includes('contact')) {
      const reasons = insights.service?.topReasons || [];
      setAnswer(`Support contact rate is ${formatPercent(summary.contactRate)}. Top reasons: ${reasons.slice(0, 5).map((r) => `${r.name} (${formatNumber(r.count)})`).join(', ')}.`);
      return;
    }

    setAnswer(`${formatNumber(summary.orders)} orders, ${formatNumber(summary.customers)} customers, ${formatMoney(summary.revenue)} revenue, ${formatPercent(summary.personalizationRate)} personalized, ${formatPercent(summary.repeatCustomerRate)} repeat customers, Trustpilot ${Number(summary.trustpilotScore || 0).toFixed(1)}.`);
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Oak & Luna Customer Intelligence</p>
          <h1>Who Are Our Customers?</h1>
          <p className="subtitle">Executive dashboards built from Orders, Kustomer conversations and Trustpilot reviews.</p>
        </div>
        <div className="heroCard">
          <span>Dataset</span>
          <strong>{formatNumber(summary.orders)}</strong>
          <small>orders analyzed</small>
        </div>
      </header>

      <div className="status">{status}</div>

      <section className="kpis">
        {cards.map((card) => (
          <div className="kpi" key={card.label}>
            <span>{card.label}</span>
            <strong>{formatCardValue(card)}</strong>
            <small>{card.note}</small>
          </div>
        ))}
      </section>

      <nav className="tabs">
        {[
          ['executive', 'Executive Summary'],
          ['dna', 'Customer DNA'],
          ['personas', 'Personas'],
          ['geography', 'Geography'],
          ['products', 'Products'],
          ['gifts', 'Gifts & Personalization'],
          ['service', 'Customer Service'],
          ['reviews', 'Reviews'],
          ['ai', 'Ask AI'],
        ].map(([id, label]) => (
          <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}</button>
        ))}
      </nav>

      {activeTab === 'executive' && (
        <Panel title="Executive Summary">
          <div className="takeaways">
            {(insights.keyTakeaways || []).map((item, i) => <div key={i}>• {item}</div>)}
          </div>
        </Panel>
      )}

      {activeTab === 'dna' && (
        <Panel title="Customer DNA">
          <div className="metricGrid">
            <Metric label="Personalized Orders" value={formatPercent(summary.personalizationRate)} note={`${formatNumber(summary.personalizedOrders)} orders`} />
            <Metric label="Non Personalized" value={formatPercent(summary.nonPersonalizedRate)} note="Orders without detected personalization" />
            <Metric label="Repeat Customers" value={formatPercent(summary.repeatCustomerRate)} note={`${formatNumber(summary.repeatCustomers)} customers`} />
            <Metric label="One-time Customers" value={formatPercent(100 - Number(summary.repeatCustomerRate || 0))} note="Customers with one order" />
          </div>
          <div className="threeCols">
            <SimpleTable title="Most Common Names" items={insights.personalization?.topNames} />
            <SimpleTable title="Most Common Initials" items={insights.personalization?.topInitials} />
            <SimpleTable title="Personalization Themes" items={insights.personalization?.engravingThemes} />
          </div>
        </Panel>
      )}

      {activeTab === 'personas' && (
        <Panel title="Customer Personas">
          <div className="personaGrid">
            {(insights.personas || []).map((p) => (
              <div className="persona" key={p.name}>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <div className="miniStats">
                  <span>Orders <b>{formatNumber(p.orders)}</b></span>
                  <span>Customers <b>{formatNumber(p.customers)}</b></span>
                  <span>Share <b>{formatPercent(p.share)}</b></span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {activeTab === 'geography' && (
        <Panel title="Geography">
          <div className="threeCols">
            <GeoTable title="Top US States by Revenue" items={insights.geography?.states} />
            <GeoTable title="Top US States by Orders" items={insights.geography?.topStatesByOrders} />
            <GeoTable title="Top US States by AOV" items={insights.geography?.topStatesByAov} />
          </div>
          <div className="twoCols topGap">
            <GeoTable title="Top Countries" items={insights.geography?.countries} />
            <div className="notice">
              <h3>City Ranking</h3>
              <p>{insights.geography?.cityNote || 'City ranking is hidden because city extraction is not reliable from the current address-only export.'}</p>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === 'products' && (
        <Panel title="Products">
          <div className="notice">
            <h3>Product data missing</h3>
            <p>{insights.products?.message || 'Product names/SKUs are not available in the current Orders source file.'}</p>
            <p>To unlock Best Sellers, Revenue by Product, Product Risk and Product-level AI, upload an Orders export containing product title or SKU.</p>
          </div>
        </Panel>
      )}

      {activeTab === 'gifts' && (
        <Panel title="Gifts & Personalization">
          <div className="notice">
            <h3>Gift notes status</h3>
            <p>{insights.personalization?.giftNoteStatus}</p>
          </div>
          <div className="metricGrid topGap">
            <Metric label="Family Signal" value={formatNumber(insights.personalization?.giftSignals?.family_signal_orders)} note="Mom, daughter, son, family..." />
            <Metric label="Couple / Love Signal" value={formatNumber(insights.personalization?.giftSignals?.couple_signal_orders)} note="Love, heart, anniversary..." />
            <Metric label="Birthday Signal" value={formatNumber(insights.personalization?.giftSignals?.birthday_signal_orders)} note="Birthday / bday detected" />
            <Metric label="Personalized Orders" value={formatPercent(summary.personalizationRate)} note="Main gifting proxy" />
          </div>
          <div className="threeCols topGap">
            <SimpleTable title="Engraving Patterns" items={insights.personalization?.engravingThemes} />
            <SimpleTable title="Common Names" items={insights.personalization?.topNames} />
            <SimpleTable title="Common Initials" items={insights.personalization?.topInitials} />
          </div>
        </Panel>
      )}

      {activeTab === 'service' && (
        <Panel title="Customer Service Intelligence">
          <div className="twoCols">
            <SimpleTable title="Top Contact Reasons" items={insights.service?.topReasons} />
            <div className="notice">
              <h3>Service Summary</h3>
              <p>{formatNumber(summary.supportContacts)} Kustomer conversations.</p>
              <p>Contact rate: {formatPercent(summary.contactRate)}.</p>
              <p>Next improvement: connect contact reasons to product/SKU once product data is available.</p>
            </div>
          </div>
        </Panel>
      )}

      {activeTab === 'reviews' && (
        <Panel title="Review Intelligence">
          <div className="metricGrid">
            <Metric label="Trustpilot Score" value={Number(summary.trustpilotScore || 0).toFixed(1)} note={`${formatNumber(summary.reviews)} reviews`} />
            <Metric label="Positive Themes" value={formatNumber((insights.reviews?.positiveThemes || []).reduce((a, b) => a + Number(b.count || 0), 0))} note="Detected 4-5 star themes" />
            <Metric label="Negative Themes" value={formatNumber((insights.reviews?.negativeThemes || []).reduce((a, b) => a + Number(b.count || 0), 0))} note="Detected 1-3 star themes" />
            <Metric label="Contact Rate" value={formatPercent(summary.contactRate)} note="Service contacts / orders" />
          </div>
          <div className="twoCols topGap">
            <SimpleTable title="Positive Review Themes" items={insights.reviews?.positiveThemes} />
            <SimpleTable title="Negative Review Themes" items={insights.reviews?.negativeThemes} />
          </div>
        </Panel>
      )}

      {activeTab === 'ai' && (
        <Panel title="Ask AI">
          <p className="muted">V5 answers from cached full-dataset dashboard insights. Full OpenAI free-form analysis can be added after the dashboards are finalized.</p>
          <div className="ask">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask anything about Oak & Luna customers..." />
            <button onClick={() => askSmartAI()}>Ask</button>
          </div>
          <div className="chips">
            {['Which states generate the most revenue?', 'Which names are most engraved?', 'What gift signals do we see?', 'Why do customers contact service?'].map((q) => (
              <button key={q} onClick={() => { setQuestion(q); askSmartAI(q); }}>{q}</button>
            ))}
          </div>
          {answer && <div className="answer">{answer}</div>}
        </Panel>
      )}

      <style jsx>{`
        .page { min-height:100vh; padding:32px; background:#f7f3ef; color:#211a16; font-family:Inter,Arial,sans-serif; }
        .hero { display:flex; justify-content:space-between; gap:24px; align-items:center; padding:34px; border-radius:30px; background:linear-gradient(135deg,#fff,#eaded2); box-shadow:0 20px 45px rgba(60,40,25,.08); }
        .eyebrow { text-transform:uppercase; letter-spacing:.14em; font-size:12px; font-weight:800; color:#8a684f; }
        h1 { margin:8px 0; font-size:46px; line-height:1; }
        .subtitle { color:#6f5b4c; font-size:17px; max-width:760px; }
        .heroCard { min-width:190px; background:#211a16; color:#fff; border-radius:24px; padding:22px; text-align:center; }
        .heroCard span,.heroCard small { display:block; color:#e8d8ca; }
        .heroCard strong { display:block; font-size:34px; margin:8px 0; }
        .status { margin:20px 0; padding:14px 18px; background:#fff8dc; border:1px solid #eadc9c; border-radius:16px; }
        .kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        .kpi,.panel,.persona,.metric,.notice,.tableCard { background:#fff; border-radius:22px; box-shadow:0 12px 30px rgba(60,40,25,.06); }
        .kpi { padding:18px; }
        .kpi span,.metric span { display:block; color:#7c695a; font-size:13px; margin-bottom:8px; }
        .kpi strong,.metric strong { display:block; font-size:28px; }
        .kpi small,.metric small { display:block; color:#8d7a6b; margin-top:7px; }
        .tabs { display:flex; gap:10px; flex-wrap:wrap; margin:24px 0; }
        .tabs button,.ask button,.chips button { border:0; border-radius:999px; padding:11px 16px; background:#fff; cursor:pointer; font-weight:800; color:#3a2a20; }
        .tabs button.active,.ask button { background:#211a16; color:#fff; }
        .panel { padding:28px; }
        .panelTitle { margin:0 0 18px; font-size:28px; }
        .takeaways { display:grid; gap:10px; }
        .takeaways div { background:#f7f3ef; padding:14px; border-radius:16px; line-height:1.5; }
        .metricGrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        .metric,.notice { padding:18px; border:1px solid #f0e6dd; }
        .notice h3 { margin-top:0; }
        .notice p { color:#6f5b4c; line-height:1.5; }
        .threeCols { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .twoCols { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        .topGap { margin-top:16px; }
        .personaGrid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .persona { padding:20px; border:1px solid #f0e6dd; }
        .miniStats { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .miniStats span { background:#f7f3ef; border-radius:12px; padding:10px; font-size:13px; }
        .miniStats b { display:block; margin-top:4px; font-size:16px; }
        .tableCard { overflow:hidden; border:1px solid #eee3d9; }
        .tableCard h3 { margin:0; padding:16px 18px; background:#fbf8f5; border-bottom:1px solid #efe5dc; font-size:18px; }
        .dataTable { width:100%; border-collapse:collapse; table-layout:fixed; }
        .dataTable th { padding:10px 12px; color:#8d7a6b; font-size:11px; text-transform:uppercase; letter-spacing:.04em; text-align:right; background:#fffaf6; border-bottom:1px solid #f0e8df; white-space:nowrap; }
        .dataTable th:first-child { text-align:left; width:44%; }
        .dataTable td { padding:11px 12px; border-bottom:1px solid #f0e8df; text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
        .dataTable td:first-child { text-align:left; white-space:normal; font-weight:800; }
        .dataTable tr:last-child td { border-bottom:0; }
        .rankBubble { width:24px; height:24px; border-radius:999px; background:#f0e6dd; color:#6f5b4c; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; margin-right:8px; }
        .simpleTable th:first-child { width:70%; }
        .muted { color:#6f5b4c; }
        .ask { display:flex; gap:10px; margin:18px 0; }
        .ask input { flex:1; padding:15px 18px; border:1px solid #e1d4c8; border-radius:999px; font-size:15px; }
        .chips { display:flex; gap:10px; flex-wrap:wrap; }
        .chips button { background:#f7f3ef; }
        .answer { margin-top:18px; padding:18px; background:#f7f3ef; border-radius:18px; line-height:1.5; }
        @media(max-width:1000px){ .page{padding:18px;} .hero,.kpis,.metricGrid,.personaGrid,.threeCols,.twoCols{grid-template-columns:1fr;display:grid;} h1{font-size:34px;} .dataTable{table-layout:auto;} }
      `}</style>
    </div>
  );
}

function Panel({ title, children }) {
  return <section className="panel"><h2 className="panelTitle">{title}</h2>{children}</section>;
}

function Metric({ label, value, note }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;
}

function SimpleTable({ title, items = [] }) {
  return (
    <div className="tableCard">
      <h3>{title}</h3>
      <table className="dataTable simpleTable">
        <thead><tr><th>Name</th><th>Count</th></tr></thead>
        <tbody>
          {(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td></tr>}
          {(items || []).slice(0, 15).map((item, index) => (
            <tr key={`${title}-${item.name}`}>
              <td><span className="rankBubble">{index + 1}</span>{item.name || 'Unknown'}</td>
              <td>{formatNumber(item.count || item.orders || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GeoTable({ title, items = [] }) {
  return (
    <div className="tableCard">
      <h3>{title}</h3>
      <table className="dataTable">
        <thead><tr><th>Market</th><th>Orders</th><th>Revenue</th><th>AOV</th></tr></thead>
        <tbody>
          {(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td><td>-</td><td>-</td></tr>}
          {(items || []).slice(0, 15).map((item, index) => (
            <tr key={`${title}-${item.name}`}>
              <td><span className="rankBubble">{index + 1}</span>{item.name || 'Unknown'}</td>
              <td>{formatNumber(item.orders || item.count || 0)}</td>
              <td>{formatMoney(item.revenue || 0)}</td>
              <td>{formatMoney(item.aov || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
