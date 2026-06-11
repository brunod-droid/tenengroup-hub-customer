import { useMemo, useState } from 'react';
import Link from 'next/link';

const seedMetrics = {
  customers: '326K+', orders: '326,017', reviews: '1,326', tickets: '48,749',
  aov: '—', engravedRate: '—', trustpilot: 'Strong 5★ base', topReason: 'Item Received'
};

const contactReasons = [
  ['Item Received', 27602], ['Change Order', 10683], ['Presale Questions', 7211], ['Cancellation Requests', 3253]
];

const reviewThemes = [
  'Meaningful personalized jewelry', 'Gift emotion and family connection', 'Customer service support',
  'Shipping and delivery expectations', 'Sizing, damage or engraving concerns'
];

const aiExamples = [
  'What do customers from New York order most?',
  'What is the average number of engravings on Willow Tag?',
  'Which products generate the most resize requests?',
  'Why do customers leave 5-star reviews?',
  'Which products have high revenue and low ticket rate?'
];

export default function CustomerInsightsPage() {
  const [tab, setTab] = useState('overview');
  const [question, setQuestion] = useState('');
  const [uploads, setUploads] = useState({ orders: null, kustomer: null, trustpilot: null });
  const [answer, setAnswer] = useState('');

  const uploadCount = useMemo(() => Object.values(uploads).filter(Boolean).length, [uploads]);

  function handleFile(key, file) {
    setUploads(prev => ({ ...prev, [key]: file ? { name: file.name, size: file.size } : null }));
  }

  function askSmartAi(prompt) {
    const q = (prompt || question || '').toLowerCase();
    if (!q.trim()) return;
    let response = 'Smart AI answer will use the uploaded Orders, Kustomer and Trustpilot files. For now, this page is ready to connect the parsing layer and return customer insights from the selected datasets.';
    if (q.includes('new york')) response = 'New York analysis will combine shipping city/state from Orders with product rows and personalization fields to rank top ordered products, revenue, AOV, gift notes and engraving patterns.';
    if (q.includes('willow') || q.includes('engraving')) response = 'Willow Tag engraving analysis will calculate the average number of engraved values per order line, top engraved names/initials and the share of orders with personalization.';
    if (q.includes('resize')) response = 'Resize analysis will match Kustomer reasons/tags with customer/order identifiers, then calculate ticket volume and ticket rate by product.';
    if (q.includes('5-star') || q.includes('trustpilot') || q.includes('reviews')) response = 'Trustpilot analysis will extract positive themes such as quality, emotional gift value, personalization and customer service, then compare them with negative themes like delivery, sizing, damage or engraving expectations.';
    setQuestion(prompt || question);
    setAnswer(response);
  }

  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.breadcrumb}><Link href="/">Home</Link><span>›</span><Link href="/brands">Brands</Link><span>›</span><Link href="/brands/oak-and-luna">Oak & Luna</Link><span>›</span>Who are our customers</div>

        <section style={styles.hero}>
          <div>
            <div style={styles.badge}>Oak & Luna Brand Intelligence</div>
            <h1 style={styles.h1}>Who Are Our Customers?</h1>
            <p style={styles.lead}>Understand Oak & Luna customers through order behavior, personalization, customer service interactions and Trustpilot reviews.</p>
            <div style={styles.heroActions}>
              <button style={styles.primaryButton} onClick={() => setTab('smart-ai')}>Open Smart AI</button>
              <button style={styles.secondaryButton} onClick={() => setTab('overview')}>View analysis</button>
            </div>
          </div>
          <div style={styles.dataCard}>
            <div style={styles.dataTitle}>Data sources</div>
            <UploadRow title="Orders" accept=".xlsx,.csv" file={uploads.orders} onChange={f => handleFile('orders', f)} />
            <UploadRow title="Kustomer" accept=".csv" file={uploads.kustomer} onChange={f => handleFile('kustomer', f)} />
            <UploadRow title="Trustpilot" accept=".csv" file={uploads.trustpilot} onChange={f => handleFile('trustpilot', f)} />
            <div style={styles.sourceStatus}>{uploadCount}/3 sources ready</div>
          </div>
        </section>

        <section style={styles.kpis}>
          <Kpi label="Orders" value={seedMetrics.orders} />
          <Kpi label="Kustomer tickets" value={seedMetrics.tickets} />
          <Kpi label="Trustpilot reviews" value={seedMetrics.reviews} />
          <Kpi label="Top contact reason" value={seedMetrics.topReason} />
        </section>

        <nav style={styles.tabs}>
          {[
            ['overview','Overview'], ['geography','Geography'], ['products','Products'], ['gifts','Gift Analysis'],
            ['service','Customer Service'], ['reviews','Reviews'], ['personas','Personas'], ['smart-ai','Smart AI']
          ].map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={tab === id ? styles.tabActive : styles.tab}>{label}</button>)}
        </nav>

        <main style={styles.panel}>
          {tab === 'overview' && <Overview />}
          {tab === 'geography' && <Geography />}
          {tab === 'products' && <Products />}
          {tab === 'gifts' && <Gifts />}
          {tab === 'service' && <Service />}
          {tab === 'reviews' && <Reviews />}
          {tab === 'personas' && <Personas />}
          {tab === 'smart-ai' && <SmartAi question={question} setQuestion={setQuestion} ask={askSmartAi} answer={answer} />}
        </main>
      </div>
    </div>
  );
}

function UploadRow({ title, accept, file, onChange }) {
  return <label style={styles.uploadRow}><span>{title}</span><input type="file" accept={accept} style={{ display: 'none' }} onChange={e => onChange(e.target.files?.[0])} /><strong>{file ? file.name : 'Upload'}</strong></label>;
}
function Kpi({ label, value }) { return <div style={styles.kpi}><div style={styles.kpiLabel}>{label}</div><div style={styles.kpiValue}>{value}</div></div>; }
function SectionTitle({ title, subtitle }) { return <><h2 style={styles.h2}>{title}</h2>{subtitle && <p style={styles.sub}>{subtitle}</p>}</>; }
function SimpleTable({ rows, headers }) { return <table style={styles.table}><thead><tr>{headers.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i) => <tr key={i}>{r.map((c,j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table>; }

function Overview() { return <><SectionTitle title="Executive Summary" subtitle="A customer intelligence layer for Oak & Luna teams." /><div style={styles.grid2}><Insight title="Customer behavior" text="Customers buy personalized jewelry with strong gift intent. Orders, engravings and gift notes should be classified into occasions, recipients and product families." /><Insight title="Voice of customer" text="Kustomer and Trustpilot help explain the full journey: what customers buy, why they contact us, and what creates satisfaction or friction." /></div></>; }
function Geography() { return <><SectionTitle title="Geographic Insights" subtitle="Analyze customers by country, state and city once the order file is loaded." /><SimpleTable headers={['Area','Orders','Revenue','AOV']} rows={[['United States','To calculate','To calculate','To calculate'],['New York','Smart AI ready','Smart AI ready','Smart AI ready'],['California','Smart AI ready','Smart AI ready','Smart AI ready']]} /></>; }
function Products() { return <><SectionTitle title="Product & Personalization Insights" subtitle="Best sellers, revenue, engraving depth and product health." /><div style={styles.grid2}><Insight title="Most engraved products" text="Average engraving count, personalization rate, top names, initials, dates and birthstones." /><Insight title="Product performance" text="Orders, revenue, AOV, support ticket rate and Trustpilot themes by product." /></div></>; }
function Gifts() { return <><SectionTitle title="Gift Analysis" subtitle="Classify intent from gift notes and personalized content." /><div style={styles.tags}>{['Birthday','Mother’s Day','Anniversary','Wedding','Christmas','Valentine’s Day','New Baby','Self purchase'].map(t => <span key={t}>{t}</span>)}</div></>; }
function Service() { return <><SectionTitle title="Customer Service Insights" subtitle="Based on Kustomer data." /><SimpleTable headers={['Contact reason','Volume']} rows={contactReasons.map(([a,b]) => [a, b.toLocaleString()])} /></>; }
function Reviews() { return <><SectionTitle title="Trustpilot Insights" subtitle="Themes extracted from customer reviews." /><div style={styles.tags}>{reviewThemes.map(t => <span key={t}>{t}</span>)}</div></>; }
function Personas() { return <><SectionTitle title="AI Customer Personas" subtitle="Generated from order, review and support patterns." /><div style={styles.grid2}>{['The Gift Giver','The Young Mom','The Self-Purchaser','The Loyal Customer'].map((p,i) => <Insight key={p} title={p} text={['Buys personalized jewelry for meaningful occasions and often includes gift notes.','Buys family and children-name jewelry with high personalization usage.','Buys for herself, usually with stronger repeat potential and higher AOV.','Multiple orders, positive review history and lower support friction.'][i]} />)}</div></>; }
function SmartAi({ question, setQuestion, ask, answer }) { return <><SectionTitle title="Smart AI Mode" subtitle="Ask natural-language questions about Oak & Luna customers." /><div style={styles.aiBox}><textarea value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask anything about customers, locations, products, engravings, reviews or tickets..." style={styles.textarea} /><button style={styles.primaryButton} onClick={() => ask()}>Ask Smart AI</button></div><div style={styles.examples}>{aiExamples.map(x => <button key={x} onClick={() => ask(x)}>{x}</button>)}</div>{answer && <div style={styles.answer}>{answer}</div>}</>; }
function Insight({ title, text }) { return <div style={styles.insight}><h3>{title}</h3><p>{text}</p></div>; }

const styles = {
  page: { minHeight: '100vh', background: '#F7F3EF', color: '#202020', fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif' },
  shell: { maxWidth: 1180, margin: '0 auto', padding: '28px 18px 60px' },
  breadcrumb: { display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#756A62', marginBottom: 18 },
  hero: { display: 'grid', gridTemplateColumns: '1.5fr .9fr', gap: 22, alignItems: 'stretch' },
  badge: { display: 'inline-block', padding: '7px 11px', borderRadius: 999, background: '#E8D9CC', color: '#7B563C', fontWeight: 800, fontSize: 12, marginBottom: 12 },
  h1: { fontSize: 46, lineHeight: 1.02, margin: '0 0 12px', letterSpacing: '-1.5px' },
  lead: { fontSize: 18, color: '#5E5650', maxWidth: 680, lineHeight: 1.55, marginBottom: 22 },
  heroActions: { display: 'flex', gap: 12, flexWrap: 'wrap' },
  primaryButton: { border: 0, borderRadius: 12, padding: '12px 18px', background: '#8B5E42', color: 'white', fontWeight: 800, cursor: 'pointer' },
  secondaryButton: { border: '1px solid #D8C7B8', borderRadius: 12, padding: '12px 18px', background: 'white', color: '#533D2F', fontWeight: 800, cursor: 'pointer' },
  dataCard: { background: 'white', border: '1px solid #E6DAD0', borderRadius: 22, padding: 18, boxShadow: '0 12px 32px rgba(64,45,31,.08)' },
  dataTitle: { fontSize: 16, fontWeight: 900, marginBottom: 12 },
  uploadRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: '1px dashed #D8C7B8', borderRadius: 14, padding: 12, marginBottom: 10, cursor: 'pointer', fontSize: 13 },
  sourceStatus: { fontSize: 12, color: '#756A62', marginTop: 10 },
  kpis: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, margin: '24px 0' },
  kpi: { background: 'white', border: '1px solid #E6DAD0', borderRadius: 18, padding: 18 },
  kpiLabel: { fontSize: 12, color: '#756A62', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em' },
  kpiValue: { fontSize: 26, fontWeight: 900, marginTop: 8 },
  tabs: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  tab: { border: '1px solid #E1D4C8', background: 'white', color: '#67584D', padding: '10px 13px', borderRadius: 999, cursor: 'pointer', fontWeight: 800 },
  tabActive: { border: '1px solid #8B5E42', background: '#8B5E42', color: 'white', padding: '10px 13px', borderRadius: 999, cursor: 'pointer', fontWeight: 800 },
  panel: { background: 'white', border: '1px solid #E6DAD0', borderRadius: 24, padding: 24, boxShadow: '0 12px 32px rgba(64,45,31,.06)' },
  h2: { fontSize: 28, margin: '0 0 6px' }, sub: { color: '#695F58', marginTop: 0 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 14, marginTop: 16 },
  insight: { background: '#FBF8F5', border: '1px solid #EFE5DC', borderRadius: 18, padding: 18 },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: 16 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 },
  aiBox: { display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 16 },
  textarea: { flex: 1, minHeight: 90, border: '1px solid #D8C7B8', borderRadius: 14, padding: 14, fontSize: 15 },
  examples: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 },
  answer: { marginTop: 18, padding: 16, borderRadius: 16, background: '#F7F3EF', border: '1px solid #E6DAD0', lineHeight: 1.5 }
};
