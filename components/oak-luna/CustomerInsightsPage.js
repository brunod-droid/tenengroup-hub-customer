
import { useEffect, useState } from 'react';

const emptyInsights = {
  summary: {},
  geography: { countries: [], states: [], cities: [], topStatesByOrders: [], topStatesByAov: [] },
  products: { bestSellers: [], productPerformance: [] },
  personalization: { engravingThemes: [], topNames: [], topInitials: [] },
  personas: [],
  service: { topReasons: [] },
  reviews: { positiveThemes: [], negativeThemes: [] },
  keyTakeaways: [],
};

function formatNumber(value) { return new Intl.NumberFormat('en-US').format(Math.round(Number(value || 0))); }
function formatMoney(value) {
  const n = Number(value || 0);
  if (Math.abs(n) >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}
function formatPercent(value) { return `${Number(value || 0).toFixed(1)}%`; }
function formatValue(card) {
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
        setStatus(`Insights generated from Supabase. Last refresh: ${new Date(data.generatedAt || Date.now()).toLocaleString()}`);
      })
      .catch((error) => setStatus(`Insights load failed: ${error.message}`));
  }, []);

  const summary = insights.summary || {};
  const cards = insights.executiveCards || [];

  function askSmartAI(customQuestion) {
    const q = String(customQuestion || question || '').toLowerCase();
    if (!q.trim()) return;
    if (q.includes('name') || q.includes('engraving')) {
      const names = insights.personalization?.topNames || [];
      setAnswer(`Popular engraved names in the sample: ${names.map((n) => `${n.name} (${n.count})`).join(', ') || 'not enough extracted names yet'}.`);
      return;
    }
    if (q.includes('initial')) {
      const initials = insights.personalization?.topInitials || [];
      setAnswer(`Top initials in the sample: ${initials.map((n) => `${n.name} (${n.count})`).join(', ') || 'not enough extracted initials yet'}.`);
      return;
    }
    if (q.includes('state') || q.includes('geography') || q.includes('aov')) {
      const states = insights.geography?.states || [];
      setAnswer(`Top states: ${states.slice(0, 5).map((s) => `${s.name}: ${formatMoney(s.revenue)} / ${formatNumber(s.orders)} orders / ${formatMoney(s.aov)} AOV`).join('; ')}.`);
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
        <div className="heroCard"><span>Dataset</span><strong>{formatNumber(summary.orders)}</strong><small>orders analyzed</small></div>
      </header>

      <div className="status">{status}</div>

      <section className="kpis">
        {cards.map((card) => (
          <div className="kpi" key={card.label}><span>{card.label}</span><strong>{formatValue(card)}</strong><small>{card.note}</small></div>
        ))}
      </section>

      <nav className="tabs">
        {[
          ['executive', 'Executive Summary'], ['dna', 'Customer DNA'], ['personas', 'Personas'], ['geography', 'Geography'],
          ['products', 'Products'], ['personalization', 'Engraving & Gifts'], ['service', 'Customer Service'], ['reviews', 'Reviews'], ['ai', 'Ask AI'],
        ].map(([id, label]) => <button key={id} className={activeTab === id ? 'active' : ''} onClick={() => setActiveTab(id)}>{label}</button>)}
      </nav>

      {activeTab === 'executive' && <Panel title="Executive Summary"><div className="takeaways">{(insights.keyTakeaways || []).map((item, i) => <div key={i}>• {item}</div>)}</div></Panel>}

      {activeTab === 'dna' && (
        <Panel title="Customer DNA">
          <div className="dnaGrid">
            <MetricBlock label="Personalized Orders" value={formatPercent(summary.personalizationRate)} note={`${formatNumber(summary.personalizedOrders)} orders`} />
            <MetricBlock label="Non Personalized" value={formatPercent(summary.nonPersonalizedRate)} note="Orders without detected personalization" />
            <MetricBlock label="Repeat Customers" value={formatPercent(summary.repeatCustomerRate)} note={`${formatNumber(summary.repeatCustomers)} customers`} />
            <MetricBlock label="One-time Customers" value={formatPercent(100 - Number(summary.repeatCustomerRate || 0))} note="Customers with one order" />
          </div>
          <div className="threeCols">
            <RankedList title="Most Common Names" items={insights.personalization?.topNames} />
            <RankedList title="Most Common Initials" items={insights.personalization?.topInitials} />
            <RankedList title="Personalization Themes" items={insights.personalization?.engravingThemes} />
          </div>
        </Panel>
      )}

      {activeTab === 'personas' && <Panel title="Customer Personas"><div className="personaGrid">{(insights.personas || []).map((p) => <div className="persona" key={p.name}><h3>{p.name}</h3><p>{p.description}</p><div className="miniStats"><span>Orders <b>{formatNumber(p.orders)}</b></span><span>Customers <b>{formatNumber(p.customers)}</b></span><span>Share <b>{formatPercent(p.share)}</b></span></div></div>)}</div></Panel>}

      {activeTab === 'geography' && (
        <Panel title="Geography">
          <div className="threeCols">
            <StateTable title="Top States by Revenue" items={insights.geography?.states} />
            <StateTable title="Top States by Orders" items={insights.geography?.topStatesByOrders} />
            <StateTable title="Top States by AOV" items={insights.geography?.topStatesByAov} />
          </div>
          <div className="twoCols topGap">
            <RankedList title="Top Countries" items={insights.geography?.countries} />
            <StateTable title="Top Cities" items={insights.geography?.cities} />
          </div>
        </Panel>
      )}

      {activeTab === 'products' && <Panel title="Products"><div className="notice">Product names are not available in the current Orders source file. Product-level intelligence needs an export with SKU or product title.</div><ProductTable title="Product Performance" items={insights.products?.productPerformance} /></Panel>}
      {activeTab === 'personalization' && <Panel title="Engraving & Gift Intelligence"><div className="threeCols"><RankedList title="Engraving Patterns" items={insights.personalization?.engravingThemes} /><RankedList title="Most Common Names" items={insights.personalization?.topNames} /><RankedList title="Most Common Initials" items={insights.personalization?.topInitials} /></div></Panel>}
      {activeTab === 'service' && <Panel title="Customer Service Intelligence"><div className="twoCols"><RankedList title="Top Contact Reasons" items={insights.service?.topReasons} /><div className="narrative"><h3>Service Summary</h3><p>{formatNumber(summary.supportContacts)} Kustomer conversations.</p><p>Current contact rate is {formatPercent(summary.contactRate)}.</p></div></div></Panel>}
      {activeTab === 'reviews' && <Panel title="Review Intelligence"><div className="twoCols"><RankedList title="Positive Themes" items={insights.reviews?.positiveThemes} /><RankedList title="Negative Themes" items={insights.reviews?.negativeThemes} /></div></Panel>}

      {activeTab === 'ai' && (
        <Panel title="Ask AI">
          <p className="muted">V3 answers from dashboard insights. Full OpenAI free-form analysis can be added after the dashboards are finalized.</p>
          <div className="ask"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask anything about Oak & Luna customers..." /><button onClick={() => askSmartAI()}>Ask</button></div>
          <div className="chips">{['Which states generate the most revenue?', 'Which names are most engraved?', 'What initials are most common?', 'What is the customer snapshot?'].map((q) => <button key={q} onClick={() => { setQuestion(q); askSmartAI(q); }}>{q}</button>)}</div>
          {answer && <div className="answer">{answer}</div>}
        </Panel>
      )}

      <style jsx>{`
        .page { min-height: 100vh; padding: 32px; background: #f7f3ef; color: #211a16; font-family: Inter, Arial, sans-serif; }
        .hero { display:flex; justify-content:space-between; gap:24px; align-items:center; padding:34px; border-radius:30px; background:linear-gradient(135deg,#fff,#eaded2); box-shadow:0 20px 45px rgba(60,40,25,.08); }
        .eyebrow { text-transform:uppercase; letter-spacing:.14em; font-size:12px; font-weight:800; color:#8a684f; }
        h1 { margin:8px 0; font-size:46px; line-height:1; }
        .subtitle { color:#6f5b4c; font-size:17px; max-width:760px; }
        .heroCard { min-width:190px; background:#211a16; color:#fff; border-radius:24px; padding:22px; text-align:center; }
        .heroCard span,.heroCard small { display:block; color:#e8d8ca; }
        .heroCard strong { display:block; font-size:34px; margin:8px 0; }
        .status { margin:20px 0; padding:14px 18px; background:#fff8dc; border:1px solid #eadc9c; border-radius:16px; }
        .kpis { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        .kpi,.panel,.persona,.metric,.narrative { background:#fff; border-radius:22px; box-shadow:0 12px 30px rgba(60,40,25,.06); }
        .kpi { padding:18px; }
        .kpi span,.metric span { display:block; color:#7c695a; font-size:13px; margin-bottom:8px; }
        .kpi strong,.metric strong { display:block; font-size:27px; }
        .kpi small,.metric small { display:block; color:#8d7a6b; margin-top:7px; }
        .tabs { display:flex; gap:10px; flex-wrap:wrap; margin:24px 0; }
        .tabs button,.ask button,.chips button { border:0; border-radius:999px; padding:11px 16px; background:#fff; cursor:pointer; font-weight:800; color:#3a2a20; }
        .tabs button.active,.ask button { background:#211a16; color:#fff; }
        .panel { padding:28px; }
        .panelTitle { margin:0 0 18px; font-size:28px; }
        .takeaways { display:grid; gap:10px; }
        .takeaways div,.notice { background:#f7f3ef; padding:14px; border-radius:16px; line-height:1.5; }
        .dnaGrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; margin-bottom:18px; }
        .metric { padding:18px; border:1px solid #f0e6dd; }
        .personaGrid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .persona { padding:20px; border:1px solid #f0e6dd; }
        .miniStats { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .miniStats span { background:#f7f3ef; border-radius:12px; padding:10px; font-size:13px; }
        .miniStats b { display:block; margin-top:4px; font-size:16px; }
        .threeCols { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .twoCols { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        .topGap { margin-top:16px; }
        .list { border:1px solid #eee3d9; border-radius:18px; overflow:hidden; background:#fff; }
        .list h3 { margin:0; padding:16px; background:#fbf8f5; }
        .row { display:grid; grid-template-columns:1fr auto; gap:14px; padding:12px 16px; border-top:1px solid #f0e8df; align-items:center; }
        .stateRow { grid-template-columns:1fr auto auto auto; }
        .row span:first-child { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .productRows { display:grid; gap:8px; padding:14px; }
        .productRow { display:grid; grid-template-columns:1.5fr .7fr .8fr .7fr; gap:8px; padding:12px; background:#f7f3ef; border-radius:14px; align-items:center; }
        .narrative { padding:20px; box-shadow:none; border:1px solid #eee3d9; }
        .muted { color:#6f5b4c; }
        .ask { display:flex; gap:10px; margin:18px 0; }
        .ask input { flex:1; padding:15px 18px; border:1px solid #e1d4c8; border-radius:999px; font-size:15px; }
        .chips { display:flex; gap:10px; flex-wrap:wrap; }
        .chips button { background:#f7f3ef; }
        .answer { margin-top:18px; padding:18px; background:#f7f3ef; border-radius:18px; line-height:1.5; }
        @media(max-width:1000px){ .page{padding:18px;} .hero,.kpis,.dnaGrid,.personaGrid,.threeCols,.twoCols{grid-template-columns:1fr;display:grid;} .stateRow{grid-template-columns:1fr;} h1{font-size:34px;} }
      `}</style>
    </div>
  );
}

function Panel({ title, children }) { return <section className="panel"><h2 className="panelTitle">{title}</h2>{children}</section>; }
function MetricBlock({ label, value, note }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function RankedList({ title, items = [] }) {
  return <div className="list"><h3>{title}</h3>{(!items || items.length === 0) && <div className="row"><span>No data yet</span><b>-</b></div>}{(items || []).slice(0,15).map((item) => <div className="row" key={`${title}-${item.name}`}><span>{item.name || 'Unknown'}</span><b>{formatNumber(item.count)}</b></div>)}</div>;
}
function StateTable({ title, items = [] }) {
  return <div className="list"><h3>{title}</h3>{(!items || items.length === 0) && <div className="row"><span>No data yet</span><b>-</b></div>}{(items || []).slice(0,15).map((item) => <div className="row stateRow" key={`${title}-${item.name}`}><span>{item.name || 'Unknown'}</span><b>{formatNumber(item.orders || item.count)}</b><b>{formatMoney(item.revenue || 0)}</b><b>{formatMoney(item.aov || 0)}</b></div>)}</div>;
}
function ProductTable({ title, items = [] }) {
  return <div className="list"><h3>{title}</h3><div className="productRows">{(items || []).slice(0,15).map((item) => <div className="productRow" key={item.name}><strong>{item.name}</strong><span>{formatNumber(item.orders)} orders</span><span>{formatMoney(item.revenue)}</span><span>{formatPercent(item.personalizationRate)}</span></div>)}{(!items || items.length === 0) && <div className="row"><span>No data yet</span><b>-</b></div>}</div></div>;
}
