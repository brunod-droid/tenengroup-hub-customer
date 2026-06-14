
import { useEffect, useState } from 'react';

const emptyInsights = {
  summary: {},
  geography: { countries: [], states: [], topStatesByOrders: [], topStatesByAov: [] },
  products: { message: '' },
  personalization: { engravingThemes: [], topNames: [], topInitials: [], giftSignals: {}, giftNoteStatus: '' },
  personas: [],
  service: { topReasons: [] },
  reviews: { positiveThemes: [], negativeThemes: [] },
  keyTakeaways: [],
};

const nf = new Intl.NumberFormat('en-US');

function n(value) {
  return nf.format(Math.round(Number(value || 0)));
}

function money(value) {
  const number = Number(value || 0);
  if (Math.abs(number) >= 1000000) return `$${(number / 1000000).toFixed(1)}M`;
  if (Math.abs(number) >= 1000) return `$${(number / 1000).toFixed(0)}K`;
  return `$${Math.round(number)}`;
}

function pct(value) {
  return `${Number(value || 0).toFixed(1)}%`;
}

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

export default function CustomerInsightsPage() {
  const [tab, setTab] = useState('executive');
  const [data, setData] = useState(emptyInsights);
  const [status, setStatus] = useState('Loading Oak & Luna customer insights...');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    loadInsights()
      .then((payload) => {
        setData({ ...emptyInsights, ...payload });
        setStatus(`Insights generated from Supabase cache. Last refresh: ${new Date(payload.generatedAt || Date.now()).toLocaleString()}`);
      })
      .catch((error) => setStatus(`Insights load failed: ${error.message}`));
  }, []);

  const s = data.summary || {};
  const cards = data.executiveCards || [];
  const service = data.service?.topReasons || [];
  const positive = data.reviews?.positiveThemes || [];
  const negative = data.reviews?.negativeThemes || [];
  const gifts = data.personalization?.giftSignals || {};

  function ask(qOverride) {
    const q = String(qOverride || question || '').toLowerCase();
    if (q.includes('gift')) {
      setAnswer(`Gift note text is missing from the current Orders export. Current gift proxies: family signal ${n(gifts.family_signal_orders)}, couple/love signal ${n(gifts.couple_signal_orders)}, birthday signal ${n(gifts.birthday_signal_orders)}.`);
      return;
    }
    if (q.includes('service') || q.includes('contact')) {
      setAnswer(`Contact rate is ${pct(s.contactRate)}. Main drivers: ${service.slice(0, 5).map((x) => `${x.name} (${n(x.count)})`).join(', ')}.`);
      return;
    }
    if (q.includes('name') || q.includes('engraving')) {
      const names = data.personalization?.topNames || [];
      setAnswer(`Most common engraved names: ${names.slice(0, 8).map((x) => `${x.name} (${n(x.count)})`).join(', ')}.`);
      return;
    }
    const states = data.geography?.states || [];
    setAnswer(`Customer snapshot: ${n(s.orders)} orders, ${n(s.customers)} customers, ${money(s.revenue)} revenue, ${pct(s.personalizationRate)} personalized. Top states: ${states.slice(0, 4).map((x) => `${x.name} ${money(x.revenue)}`).join(', ')}.`);
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
          <strong>{n(s.orders)}</strong>
          <small>orders analyzed</small>
        </div>
      </header>

      <div className="status">{status}</div>

      <section className="kpis">
        {cards.map((card) => (
          <div className="kpi" key={card.label}>
            <span>{card.label}</span>
            <strong>{cardValue(card)}</strong>
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
          ['gifts', 'Gift Signals'],
          ['service', 'Customer Service'],
          ['reviews', 'Reviews'],
          ['ai', 'Ask AI'],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === 'executive' && (
        <Panel title="Executive Summary">
          <div className="takeaways">
            {(data.keyTakeaways || []).map((item, index) => <div key={index}>• {item}</div>)}
          </div>
        </Panel>
      )}

      {tab === 'dna' && (
        <Panel title="Customer DNA">
          <div className="metricGrid">
            <Metric label="Personalized Orders" value={pct(s.personalizationRate)} note={`${n(s.personalizedOrders)} orders`} />
            <Metric label="Non Personalized" value={pct(s.nonPersonalizedRate)} note="Orders without detected personalization" />
            <Metric label="Repeat Customers" value={pct(s.repeatCustomerRate)} note={`${n(s.repeatCustomers)} customers`} />
            <Metric label="One-time Customers" value={pct(100 - Number(s.repeatCustomerRate || 0))} note="Customers with one order" />
          </div>
          <div className="threeCols">
            <SimpleTable title="Most Common Names" items={data.personalization?.topNames} />
            <SimpleTable title="Most Common Initials" items={data.personalization?.topInitials} />
            <SimpleTable title="Personalization Themes" items={data.personalization?.engravingThemes} />
          </div>
        </Panel>
      )}

      {tab === 'personas' && (
        <Panel title="Customer Personas">
          <div className="personaGrid">
            {(data.personas || []).map((p) => (
              <div className="persona" key={p.name}>
                <h3>{p.name}</h3>
                <p>{p.description}</p>
                <div className="miniStats">
                  <span>Orders <b>{n(p.orders)}</b></span>
                  <span>Customers <b>{n(p.customers)}</b></span>
                  <span>Share <b>{pct(p.share)}</b></span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'geography' && (
        <Panel title="Geography">
          <div className="threeCols">
            <GeoTable title="Top US States by Revenue" items={data.geography?.states} />
            <GeoTable title="Top US States by Orders" items={data.geography?.topStatesByOrders} />
            <GeoTable title="Top US States by AOV" items={data.geography?.topStatesByAov} />
          </div>
          <div className="twoCols topGap">
            <GeoTable title="Top Countries" items={data.geography?.countries} />
            <InsightBox
              title="City ranking hidden"
              body="The current Orders export contains one free-text address field, not a clean city column. State and country are reliable after cleanup; city extraction is not reliable enough to show."
              bullets={['Upload a clean City column to unlock Top Cities.', 'Current US State and Country views are usable.', 'City ranking is hidden intentionally to avoid misleading insights.']}
            />
          </div>
        </Panel>
      )}

      {tab === 'products' && (
        <Panel title="Products">
          <div className="twoCols">
            <InsightBox
              title="Product data missing"
              body="The current Orders export does not include product title or SKU. Product dashboards would be misleading without this."
              bullets={['Needed: product title or SKU.', 'Then we can calculate best sellers, product AOV and product risk.', 'This is the next export to request.']}
            />
            <InsightBox
              title="Recommended next export"
              body="Ask for an order line export, not only order headers."
              bullets={['Order ID', 'Email', 'Product title / SKU', 'Quantity', 'Line revenue', 'Personalization', 'Gift note']}
            />
          </div>
        </Panel>
      )}

      {tab === 'gifts' && (
        <Panel title="Gift Signals">
          <div className="notice">
            <h3>Gift note status</h3>
            <p>True gift note text is not present in the current Orders export. The dashboard therefore uses proxy signals from personalization and reviews.</p>
          </div>
          <div className="metricGrid topGap">
            <Metric label="Family Signal" value={n(gifts.family_signal_orders)} note="Mom, daughter, son, family..." />
            <Metric label="Couple / Love Signal" value={n(gifts.couple_signal_orders)} note="Love, heart, anniversary..." />
            <Metric label="Birthday Signal" value={n(gifts.birthday_signal_orders)} note="Birthday / bday detected" />
            <Metric label="Personalized Orders" value={pct(s.personalizationRate)} note="Main gifting proxy" />
          </div>
          <div className="twoCols topGap">
            <SimpleTable title="Gift-related Review Themes" items={(positive || []).filter((x) => String(x.name || '').toLowerCase().includes('gift'))} />
            <InsightBox
              title="Gift read"
              body="Oak & Luna appears strongly gift-driven: personalization is high and reviews mention gifting occasions."
              bullets={[`${pct(s.personalizationRate)} of orders are personalized.`, 'Family and couple signals appear in engraving text.', 'Real gift note analysis requires the missing Gift Note column.']}
            />
          </div>
        </Panel>
      )}

      {tab === 'service' && (
        <Panel title="Customer Service Intelligence">
          <div className="metricGrid">
            <Metric label="Kustomer Conversations" value={n(s.supportContacts)} note="Imported support contacts" />
            <Metric label="Contact Rate" value={pct(s.contactRate)} note="Conversations / orders" />
            <Metric label="Main Driver" value={service[0]?.name || '-'} note={`${n(service[0]?.count)} conversations`} />
            <Metric label="Second Driver" value={service[1]?.name || '-'} note={`${n(service[1]?.count)} conversations`} />
          </div>
          <div className="twoCols topGap">
            <SimpleTable title="Detected Contact Drivers" items={service} />
            <InsightBox
              title="Qualitative read"
              body="Support demand is low compared with order volume, but the leading themes indicate where CX friction concentrates."
              bullets={['Shipping / delivery usually drives the highest anxiety.', 'Damage, quality and resize should be linked to products once product data is available.', 'Engraving issues are sensitive because purchases are emotional and gift-oriented.']}
            />
          </div>
        </Panel>
      )}

      {tab === 'reviews' && (
        <Panel title="Review Intelligence">
          <div className="metricGrid">
            <Metric label="Trustpilot Score" value={Number(s.trustpilotScore || 0).toFixed(1)} note={`${n(s.reviews)} reviews`} />
            <Metric label="Positive Mentions" value={n(positive.reduce((a, b) => a + Number(b.count || 0), 0))} note="Detected 4-5 star themes" />
            <Metric label="Negative Mentions" value={n(negative.reduce((a, b) => a + Number(b.count || 0), 0))} note="Detected 1-3 star themes" />
            <Metric label="Review Volume" value={n(s.reviews)} note="Trustpilot reviews imported" />
          </div>
          <div className="threeCols topGap">
            <SimpleTable title="Positive Review Themes" items={positive} />
            <SimpleTable title="Negative Review Themes" items={negative} />
            <InsightBox
              title="Qualitative read"
              body="Reviews are summarized by theme detection. The next improvement is to store representative review quotes for each theme."
              bullets={['Positive themes show what customers value.', 'Negative themes show product/CX risk.', 'Gift and personalization language should be tracked separately.']}
            />
          </div>
        </Panel>
      )}

      {tab === 'ai' && (
        <Panel title="Ask AI">
          <p className="muted">V6 answers from cached full-dataset dashboard insights. Full OpenAI free-form analysis can be added after dashboards are finalized.</p>
          <div className="ask">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask anything about Oak & Luna customers..." />
            <button onClick={() => ask()}>Ask</button>
          </div>
          <div className="chips">
            {['Which states generate the most revenue?', 'Which names are most engraved?', 'What gift signals do we see?', 'Why do customers contact service?'].map((q) => (
              <button key={q} onClick={() => { setQuestion(q); ask(q); }}>{q}</button>
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
        .kpi,.panel,.persona,.metric,.notice,.tableCard,.insightBox { background:#fff; border-radius:22px; box-shadow:0 12px 30px rgba(60,40,25,.06); }
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
        .metric,.notice,.insightBox { padding:18px; border:1px solid #f0e6dd; }
        .notice h3,.insightBox h3 { margin-top:0; }
        .notice p,.insightBox p,.insightBox li { color:#6f5b4c; line-height:1.5; }
        .insightBox ul { padding-left:20px; margin-bottom:0; }
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

function InsightBox({ title, body, bullets = [] }) {
  return (
    <div className="insightBox">
      <h3>{title}</h3>
      <p>{body}</p>
      {bullets.length > 0 && <ul>{bullets.map((b) => <li key={b}>{b}</li>)}</ul>}
    </div>
  );
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
              <td>{n(item.count || item.orders || 0)}</td>
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
              <td>{n(item.orders || item.count || 0)}</td>
              <td>{money(item.revenue || 0)}</td>
              <td>{money(item.aov || 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
