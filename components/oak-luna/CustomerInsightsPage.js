import { useEffect, useMemo, useState } from 'react';

const emptyInsights = {
  summary: {},
  geography: { countries: [], states: [], topStatesByOrders: [], topStatesByAov: [] },
  products: { bestSellers: [], topRevenue: [], topPersonalized: [] },
  personalization: { topNames: [], topInitials: [], inscriptionCounts: [] },
  gifts: { occasions: [], recipients: [] },
  vip: { candidates: [] },
  service: { topReasons: [] },
  reviews: { positiveThemes: [], negativeThemes: [] },
  keyTakeaways: [],
};

const nf = new Intl.NumberFormat('en-US');
function n(value) { return nf.format(Math.round(Number(value || 0))); }
function money(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1000000) return `$${(number / 1000000).toFixed(1)}M`;
  if (Math.abs(number) >= 1000) return `$${(number / 1000).toFixed(0)}K`;
  return `$${Math.round(number)}`;
}
function pct(value) { return `${Number(value || 0).toFixed(1)}%`; }
function cardValue(card) {
  if (card.currency) return money(card.value);
  if (card.suffix === '%') return pct(card.value);
  if (card.label === 'Trustpilot') return Number(card.value || 0).toFixed(1);
  return n(card.value);
}
async function loadInsights() {
  const response = await fetch('/api/oak-luna-insights');
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || response.statusText);
  return data;
}
async function updateVipStatus(candidate, status) {
  const response = await fetch('/api/oak-luna-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update_vip_status', customer_key: candidate.customer_key, vip_score: candidate.vip_score, vip_status: status }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || response.statusText);
  return data;
}

export default function CustomerInsightsPage() {
  const [tab, setTab] = useState('executive');
  const [data, setData] = useState(emptyInsights);
  const [status, setStatus] = useState('Loading Oak & Luna customer insights...');
  const [vipFilter, setVipFilter] = useState('pending');

  function refresh() {
    return loadInsights().then((payload) => {
      setData({ ...emptyInsights, ...payload });
      setStatus(`Insights generated from Supabase cache. Last refresh: ${new Date(payload.generatedAt || Date.now()).toLocaleString()}`);
    }).catch((error) => setStatus(`Insights load failed: ${error.message}`));
  }
  useEffect(() => { refresh(); }, []);

  const s = data.summary || {};
  const cards = data.executiveCards || [];
  const vipCandidates = data.vip?.candidates || [];
  const filteredVip = useMemo(() => {
    if (vipFilter === 'all') return vipCandidates;
    return vipCandidates.filter((c) => (c.vip_status || 'pending') === vipFilter);
  }, [vipCandidates, vipFilter]);

  function googleUrl(c) {
    const engravingWords = String(c.engraving_signal || '').replace(/Inscription #?\d*:/gi, ' ').replace(/Chain length:.*/gi, ' ').split(/\s+/).filter((x) => x && x.length > 2).slice(0, 4).join(' ');
    return `https://www.google.com/search?q=${encodeURIComponent(`"${c.first_name} ${c.last_name}" ${engravingWords}`)}`;
  }
  async function markVip(c, nextStatus) {
    await updateVipStatus(c, nextStatus);
    setData((prev) => ({ ...prev, vip: { ...prev.vip, candidates: (prev.vip?.candidates || []).map((x) => x.customer_key === c.customer_key ? { ...x, vip_status: nextStatus } : x) }}));
  }

  return (
    <div className="page">
      <header className="hero">
        <div><p className="eyebrow">Oak & Luna Customer Intelligence</p><h1>Who Are Our Customers?</h1><p className="subtitle">Executive dashboards from Orders, Products, Inscriptions, Gift Notes, Kustomer and Trustpilot.</p></div>
        <div className="heroCard"><span>Dataset</span><strong>{n(s.orders)}</strong><small>orders analyzed</small></div>
      </header>

      <div className="status">{status}</div>
      <section className="kpis">{cards.map((card) => <div className="kpi" key={card.label}><span>{card.label}</span><strong>{cardValue(card)}</strong><small>{card.note}</small></div>)}</section>

      <nav className="tabs">{[
        ['executive', 'Executive Summary'], ['dna', 'Customer DNA'], ['products', 'Products'], ['vip', 'VIP Intelligence'], ['gifts', 'Gift Intelligence'], ['geography', 'Geography'], ['service', 'Customer Service'], ['reviews', 'Reviews']
      ].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}</nav>

      {tab === 'executive' && <Panel title="Executive Summary"><div className="takeaways">{(data.keyTakeaways || []).map((item, i) => <div key={i}>• {item}</div>)}</div></Panel>}

      {tab === 'dna' && <Panel title="Customer DNA"><div className="metricGrid"><Metric label="Personalized Orders" value={pct(s.personalizationRate)} note={`${n(s.personalizedOrders)} orders`} /><Metric label="Multi-Inscription Orders" value={n(s.multiInscriptionOrders)} note={`${pct(s.multiInscriptionRate)} of orders`} /><Metric label="Gift Notes" value={n(s.giftNotes)} note={`${pct(s.giftNoteRate)} of orders`} /><Metric label="Repeat Customers" value={pct(s.repeatCustomerRate)} note={`${n(s.repeatCustomers)} customers`} /></div><div className="threeCols"><SimpleTable title="Top Engraved Names" items={data.personalization?.topNames} /><SimpleTable title="Top Initials" items={data.personalization?.topInitials} /><SimpleTable title="Inscriptions per Order" items={data.personalization?.inscriptionCounts} /></div></Panel>}

      {tab === 'products' && <Panel title="Products Intelligence"><div className="metricGrid"><Metric label="Product Lines" value={n(s.productRows)} note="Rows loaded" /><Metric label="Product Orders" value={n(s.productOrders)} note="Distinct orders with products" /><Metric label="SKUs" value={n(s.skus)} note="Distinct SKUs" /><Metric label="Top Product" value={data.products?.bestSellers?.[0]?.name || '-'} note={`${n(data.products?.bestSellers?.[0]?.units)} units`} /></div><div className="threeCols topGap"><ProductTable title="Best Sellers by Units" items={data.products?.bestSellers} /><ProductTable title="Top Products by Revenue" items={data.products?.topRevenue} /><SimpleTable title="Top Personalized Products" items={(data.products?.topPersonalized || []).map((x) => ({ name: x.name, count: x.personalization_rate }))} suffix="%" /></div></Panel>}

      {tab === 'vip' && <Panel title="VIP / Celebrity Intelligence"><div className="notice"><h3>Workflow</h3><p>Shortlist candidates, open web research manually, then mark each one Done, VIP or Celebrity so you do not review the same person twice.</p></div><div className="chips topGap">{['pending', 'vip', 'celebrity', 'done', 'all'].map((f) => <button key={f} className={vipFilter === f ? 'active' : ''} onClick={() => setVipFilter(f)}>{f}</button>)}</div><div className="vipList topGap">{filteredVip.slice(0, 80).map((c) => <div className="vipCard" key={c.customer_key}><div><strong>{c.first_name} {c.last_name}</strong><span>{c.state || ''} {c.country || ''} · Max order {money(c.max_order_value)}</span><small>{String(c.engraving_signal || '').slice(0, 160)}</small></div><div className="vipScore">{n(c.vip_score)}</div><div className="vipActions"><a href={googleUrl(c)} target="_blank" rel="noreferrer">Research</a><button onClick={() => markVip(c, 'done')}>Done</button><button onClick={() => markVip(c, 'vip')}>VIP</button><button onClick={() => markVip(c, 'celebrity')}>Celebrity</button></div></div>)}</div></Panel>}

      {tab === 'gifts' && <Panel title="Gift Intelligence"><div className="metricGrid"><Metric label="Gift Notes Captured" value={n(data.gifts?.giftNotes)} note={`${n(data.gifts?.matchedGiftOrders)} matched orders`} /><Metric label="Love Messages" value={n(data.gifts?.loveMessages)} note={`${pct(data.gifts?.loveMessageRate)} of gift notes`} /><Metric label="Mother Messages" value={n(data.gifts?.motherMessages)} note="Mom / mother / mama" /><Metric label="Gift Note Rate" value={pct(data.gifts?.giftNoteRate)} note="Gift notes / all orders" /></div><div className="threeCols topGap"><SimpleTable title="Top Gift Occasions" items={data.gifts?.occasions} /><SimpleTable title="Top Gift Recipients" items={data.gifts?.recipients} /></div></Panel>}

      {tab === 'geography' && <Panel title="Geography"><div className="threeCols"><GeoTable title="Top US States by Revenue" items={data.geography?.states} /><GeoTable title="Top US States by Orders" items={data.geography?.topStatesByOrders} /><GeoTable title="Top US States by AOV" items={data.geography?.topStatesByAov} /></div><div className="twoCols topGap"><GeoTable title="Top Countries" items={data.geography?.countries} /></div></Panel>}
      {tab === 'service' && <Panel title="Customer Service"><SimpleTable title="Detected Contact Drivers" items={data.service?.topReasons} /></Panel>}
      {tab === 'reviews' && <Panel title="Reviews"><div className="twoCols"><SimpleTable title="Positive Review Themes" items={data.reviews?.positiveThemes} /><SimpleTable title="Negative Review Themes" items={data.reviews?.negativeThemes} /></div></Panel>}

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
        .kpi,.panel,.metric,.tableCard,.notice,.vipCard { background:#fff; border-radius:22px; box-shadow:0 12px 30px rgba(60,40,25,.06); }
        .kpi,.metric,.notice { padding:18px; }
        .kpi span,.metric span { display:block; color:#7c695a; font-size:13px; margin-bottom:8px; }
        .kpi strong,.metric strong { display:block; font-size:28px; line-height:1.1; word-break:break-word; }
        .kpi small,.metric small { display:block; color:#8d7a6b; margin-top:7px; }
        .tabs,.chips { display:flex; gap:10px; flex-wrap:wrap; margin:24px 0; }
        .tabs button,.chips button,.vipActions button,.vipActions a { border:0; border-radius:999px; padding:10px 14px; background:#fff; cursor:pointer; font-weight:800; color:#3a2a20; text-decoration:none; }
        .tabs button.active,.chips button.active { background:#211a16; color:#fff; }
        .panel { padding:28px; }
        .panelTitle { margin:0 0 18px; font-size:28px; }
        .takeaways { display:grid; gap:10px; }
        .takeaways div { background:#f7f3ef; padding:14px; border-radius:16px; line-height:1.5; }
        .metricGrid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:14px; }
        .threeCols { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
        .twoCols { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        .topGap { margin-top:16px; }
        .tableCard { overflow:hidden; border:1px solid #eee3d9; }
        .tableCard h3 { margin:0; padding:16px 18px; background:#fbf8f5; border-bottom:1px solid #efe5dc; font-size:18px; }
        .dataTable { width:100%; border-collapse:collapse; table-layout:fixed; }
        .dataTable th { padding:10px 12px; color:#8d7a6b; font-size:11px; text-transform:uppercase; text-align:right; background:#fffaf6; border-bottom:1px solid #f0e8df; white-space:nowrap; }
        .dataTable th:first-child { text-align:left; width:48%; }
        .dataTable td { padding:11px 12px; border-bottom:1px solid #f0e8df; text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
        .dataTable td:first-child { text-align:left; white-space:normal; font-weight:800; }
        .rankBubble { width:24px; height:24px; border-radius:999px; background:#f0e6dd; color:#6f5b4c; display:inline-flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; margin-right:8px; }
        .vipList { display:grid; gap:12px; }
        .vipCard { display:grid; grid-template-columns:1fr 70px auto; gap:14px; align-items:center; padding:16px; border:1px solid #eee3d9; }
        .vipCard strong,.vipCard span,.vipCard small { display:block; }
        .vipCard span,.vipCard small,.notice p { color:#6f5b4c; line-height:1.4; }
        .vipScore { width:58px; height:58px; border-radius:18px; display:flex; align-items:center; justify-content:center; background:#211a16; color:#fff; font-weight:900; font-size:22px; }
        .vipActions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
        @media(max-width:1000px){ .page{padding:18px;} .hero,.kpis,.metricGrid,.threeCols,.twoCols,.vipCard{grid-template-columns:1fr;display:grid;} h1{font-size:34px;} }
      `}</style>
    </div>
  );
}

function Panel({ title, children }) { return <section className="panel"><h2 className="panelTitle">{title}</h2>{children}</section>; }
function Metric({ label, value, note }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function SimpleTable({ title, items = [], suffix = '' }) {
  return <div className="tableCard"><h3>{title}</h3><table className="dataTable"><thead><tr><th>Name</th><th>Count</th></tr></thead><tbody>{(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td></tr>}{(items || []).slice(0,15).map((item,index)=><tr key={`${title}-${item.name}`}><td><span className="rankBubble">{index+1}</span>{item.name || 'Unknown'}</td><td>{n(item.count || item.orders || 0)}{suffix}</td></tr>)}</tbody></table></div>;
}
function GeoTable({ title, items = [] }) {
  return <div className="tableCard"><h3>{title}</h3><table className="dataTable"><thead><tr><th>Market</th><th>Orders</th><th>Revenue</th><th>AOV</th></tr></thead><tbody>{(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td><td>-</td><td>-</td></tr>}{(items || []).slice(0,15).map((item,index)=><tr key={`${title}-${item.name}`}><td><span className="rankBubble">{index+1}</span>{item.name || 'Unknown'}</td><td>{n(item.orders || item.count || 0)}</td><td>{money(item.revenue || 0)}</td><td>{money(item.aov || 0)}</td></tr>)}</tbody></table></div>;
}
function ProductTable({ title, items = [] }) {
  return <div className="tableCard"><h3>{title}</h3><table className="dataTable"><thead><tr><th>Product</th><th>Units</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td><td>-</td><td>-</td></tr>}{(items || []).slice(0,15).map((item,index)=><tr key={`${title}-${item.name}`}><td><span className="rankBubble">{index+1}</span>{item.name || 'Unknown'}</td><td>{n(item.units || 0)}</td><td>{n(item.orders || 0)}</td><td>{money(item.revenue || 0)}</td></tr>)}</tbody></table></div>;
}
