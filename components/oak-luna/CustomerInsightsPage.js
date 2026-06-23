import { useEffect, useMemo, useState } from 'react';

const emptyInsights = {
  summary: {},
  geography: { countries: [], states: [], topStatesByOrders: [], topStatesByAov: [] },
  products: { bestSellers: [], topRevenue: [], topPersonalized: [], byRegion: [], willowInitials: [], belleCharacters: [], withGiftNotes: [], withServiceContacts: [], withReviews: [] },
  personalization: { topNames: [], topInitials: [], inscriptionCounts: [] },
  gifts: { occasions: [], recipients: [], emotions: [], lengths: [], personas: [] },
  vip: { candidates: [] },
  service: { topReasons: [], focusReasons: [] },
  reviews: { positiveThemes: [], negativeThemes: [], ratingDistribution: [], companyResponse: {}, positiveExamples: [], negativeExamples: [] },
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
    body: JSON.stringify({
      action: 'update_vip_status',
      customer_key: candidate.customer_key,
      vip_score: candidate.vip_score,
      vip_status: status,
    }),
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
  const [askQuestion, setAskQuestion] = useState('');
  const [askAnswer, setAskAnswer] = useState(null);
  const [askLoading, setAskLoading] = useState(false);

  function refresh() {
    return loadInsights()
      .then((payload) => {
        setData({ ...emptyInsights, ...payload });
        setStatus(`Insights generated from Supabase cache. Last refresh: ${new Date(payload.generatedAt || Date.now()).toLocaleString()}`);
      })
      .catch((error) => setStatus(`Insights load failed: ${error.message}`));
  }

  useEffect(() => { refresh(); }, []);

  const s = data.summary || {};
  const cards = data.executiveCards || [];
  const vipCandidates = data.vip?.candidates || [];

  const filteredVip = useMemo(() => {
    if (vipFilter === 'all') return vipCandidates;
    return vipCandidates.filter((c) => (c.vip_status || 'pending') === vipFilter);
  }, [vipCandidates, vipFilter]);

  function cleanEngravingName(value) {
    return String(value || '')
      .replace(/Chain length:.*/gi, '')
      .replace(/Ring size:.*/gi, '')
      .replace(/Bracelet size:.*/gi, '')
      .replace(/Necklace length:.*/gi, '')
      .replace(/Initials?:/gi, '')
      .replace(/Inscription(?:\s+#\d+)?:/gi, '')
      .replace(/[|•]+/g, ' ')
      .trim();
  }

  function splitEngravingValue(value) {
    const cleaned = cleanEngravingName(value);
    if (!cleaned) return [];

    return cleaned
      .split(/\s*(?:,|&|\+|\/|\band\b|\bor\b|\n|\r)\s*/i)
      .map((x) => x.trim())
      .filter((x) => x && x.length > 1)
      .filter((x) => !/^chain length/i.test(x))
      .filter((x) => !/^ring size/i.test(x))
      .slice(0, 8);
  }

  function extractPersonalizedNames(candidate) {
    const source = String(candidate.engraving_signal || '');
    const matches = [...source.matchAll(/(?:Inscription(?:\s+#\d+)?:|Initial\s+#?\d*:)\s*([^"\r\n]+?)(?=\s+Inscription|\s+Initial|\s+Chain length|\s+Ring size|\s*$)/gi)];

    const extracted = matches.flatMap((match) => splitEngravingValue(match[1]));

    if (extracted.length === 0) {
      return splitEngravingValue(source);
    }

    return [...new Set(extracted)].slice(0, 8);
  }

  function formatNameListForPrompt(names) {
    if (!names || names.length === 0) return '';
    if (names.length === 1) return `"${names[0]}"`;
    if (names.length === 2) return `"${names[0]}" and/or "${names[1]}"`;
    return `${names.slice(0, -1).map((x) => `"${x}"`).join(', ')} and/or "${names[names.length - 1]}"`;
  }

  function vipResearchPrompt(candidate) {
    const names = extractPersonalizedNames(candidate);
    return [
      `Is "${candidate.first_name} ${candidate.last_name}" likely to be a public figure, celebrity, athlete, influencer, founder, or high-profile person?`,
      names.length ? `Check whether these personalized names are publicly connected family/relationship names: ${formatNameListForPrompt(names)}` : '',
      `Only use public information. Give confidence level and short reasoning.`
    ].filter(Boolean).join(' ');
  }

  function googleAiModeUrl(candidate) {
    return `https://www.google.com/search?udm=50&q=${encodeURIComponent(vipResearchPrompt(candidate))}`;
  }

  function googleClassicUrl(candidate) {
    const names = extractPersonalizedNames(candidate);
    const query = [`"${candidate.first_name} ${candidate.last_name}"`, ...names.map((x) => `"${x}"`)].join(' ');
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  async function copyVipPrompt(candidate) {
    try {
      await navigator.clipboard.writeText(vipResearchPrompt(candidate));
      alert('VIP research prompt copied.');
    } catch (error) {
      alert(vipResearchPrompt(candidate));
    }
  }


  async function askAi(questionOverride) {
    const query = questionOverride || askQuestion;
    if (!query) return;

    setAskLoading(true);
    setAskAnswer(null);

    try {
      const response = await fetch('/api/oak-luna-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ask_ai_query', query }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || response.statusText);

      setAskQuestion(query);
      setAskAnswer(data.answer);
    } catch (error) {
      setAskAnswer({ error: error.message });
    } finally {
      setAskLoading(false);
    }
  }

  async function markVip(candidate, nextStatus) {
    try {
      await updateVipStatus(candidate, nextStatus);
      setData((prev) => ({
        ...prev,
        vip: {
          ...prev.vip,
          candidates: (prev.vip?.candidates || []).map((c) =>
            c.customer_key === candidate.customer_key ? { ...c, vip_status: nextStatus } : c
          ),
        },
      }));
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Oak & Luna Customer Intelligence</p>
          <h1>Who Are Our Customers?</h1>
          <p className="subtitle">Executive dashboards from Orders, Products, Inscriptions, Gift Notes, Customer Service and Reviews.</p>
        </div>
        <div className="heroCard"><span>Dataset</span><strong>{n(s.orders)}</strong><small>orders analyzed</small></div>
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
          ['products', 'Products'],
          ['vip', 'VIP Intelligence'],
          ['gifts', 'Gift Intelligence'],
          ['geography', 'Geography'],
          ['service', 'Customer Service'],
          ['reviews', 'Reviews'],
          ['ask', 'Ask AI'],
        ].map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{label}</button>)}
      </nav>

      {tab === 'executive' && (
        <Panel title="Executive Summary">
          <div className="takeaways">{(data.keyTakeaways || []).map((item, i) => <div key={i}>• {item}</div>)}</div>
        </Panel>
      )}

      {tab === 'dna' && (
        <Panel title="Customer DNA">
          <div className="metricGrid">
            <Metric label="Personalized Orders" value={pct(s.personalizationRate)} note={`${n(s.personalizedOrders)} orders`} />
            <Metric label="Multi-Inscription Orders" value={n(s.multiInscriptionOrders)} note={`${pct(s.multiInscriptionRate)} of orders`} />
            <Metric label="Gift Notes" value={n(s.giftNotes)} note={`${pct(s.giftNoteRate)} of orders`} />
            <Metric label="Love Messages" value={n(s.loveMessages)} note={`${pct(s.loveMessageRate)} of gift notes`} />
          </div>
          <div className="threeCols">
            <SimpleTable title="Top Engraved Names" items={data.personalization?.topNames} />
            <SimpleTable title="Top Initials" items={data.personalization?.topInitials} />
            <SimpleTable title="Inscriptions per Order" items={data.personalization?.inscriptionCounts} />
          </div>
        </Panel>
      )}

      {tab === 'products' && (
        <Panel title="Products Intelligence">
          <div className="metricGrid">
            <Metric label="Product Lines" value={n(s.productRows)} note="Rows loaded" />
            <Metric label="Product Orders" value={n(s.productOrders)} note="Distinct orders with products" />
            <Metric label="SKUs" value={n(s.skus)} note="Distinct SKUs" />
            <Metric label="Top Product" value={data.products?.bestSellers?.[0]?.name || '-'} note={`${n(data.products?.bestSellers?.[0]?.units)} units`} />
          </div>
          <div className="threeCols topGap">
            <ProductTable title="Best Sellers by Units" items={data.products?.bestSellers} />
            <ProductTable title="Top Products by Revenue" items={data.products?.topRevenue} />
            <SimpleTable title="Top Personalized Products" items={data.products?.topPersonalized} suffix="%" />
          </div>
          <div className="threeCols topGap">
            <SimpleTable title="Most Popular Product by Region" items={data.products?.byRegion} />
            <SimpleTable title="Willow: Most Requested Letters" items={data.products?.willowInitials} />
            <SimpleTable title="Belle: Character Count Distribution" items={data.products?.belleCharacters} />
          </div>
          <div className="threeCols topGap">
            <SimpleTable title="Products with Gift Notes" items={data.products?.withGiftNotes} />
            <SimpleTable title="Products with Service Contacts" items={data.products?.withServiceContacts} />
            <SimpleTable title="Products with Reviews" items={data.products?.withReviews} />
          </div>
        </Panel>
      )}

      {tab === 'vip' && (
        <Panel title="VIP / Celebrity Intelligence">
          <div className="notice">
            <h3>Scoring logic</h3>
            <p>Score = Name matchability 25 + Personalized engraving signal 30 + Premium location 20 + Order value 15 + Email signal 10. Repeat rate is intentionally not used. Research prompts split engraving names separately, for example "Jake" and/or "Sloane", instead of combining them.</p>
          </div>
          <div className="chips topGap">
            {['pending', 'vip', 'celebrity', 'done', 'all'].map((f) => (
              <button key={f} className={vipFilter === f ? 'active' : ''} onClick={() => setVipFilter(f)}>{f}</button>
            ))}
          </div>
          <div className="vipList topGap">
            {filteredVip.slice(0, 100).map((c) => (
              <div className="vipCard" key={c.customer_key}>
                <div>
                  <strong>{c.first_name} {c.last_name}</strong>
                  <span>{c.state || ''} {c.country || ''} · Max order {money(c.max_order_value)}</span>
                  <small>{String(c.engraving_signal || '').slice(0, 180)}</small>
                  <small>Score detail: name {n(c.name_score)} · personalized names {n(c.personalization_score)} · location {n(c.location_score)} · order {n(c.order_value_score)} · email {n(c.email_score)}</small>
                  <small>Prompt names: {extractPersonalizedNames(c).map((x) => `"${x}"`).join(' · ') || 'No extracted engraving names'}</small>
                </div>
                <div className="vipScore">{n(c.vip_score)}</div>
                <div className="vipActions">
                  <a href={googleAiModeUrl(c)} target="_blank" rel="noreferrer">AI Mode Research</a>
                  <a href={googleClassicUrl(c)} target="_blank" rel="noreferrer">Google Search</a>
                  <button onClick={() => copyVipPrompt(c)}>Copy Prompt</button>
                  <button onClick={() => markVip(c, 'done')}>Done</button>
                  <button onClick={() => markVip(c, 'vip')}>VIP</button>
                  <button onClick={() => markVip(c, 'celebrity')}>Celebrity</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {tab === 'gifts' && (
        <Panel title="Gift Intelligence">
          <div className="metricGrid">
            <Metric label="Gift Notes Captured" value={n(data.gifts?.giftNotes)} note={`${n(data.gifts?.matchedGiftOrders)} matched orders`} />
            <Metric label="Love Messages" value={n(data.gifts?.loveMessages)} note={`${pct(data.gifts?.loveMessageRate)} of gift notes`} />
            <Metric label="Mother Messages" value={n(data.gifts?.motherMessages)} note="Mom / mother / mama" />
            <Metric label="Gift Note Rate" value={pct(data.gifts?.giftNoteRate)} note="Gift notes / all orders" />
          </div>
          <div className="threeCols topGap">
            <SimpleTable title="Top Gift Occasions" items={data.gifts?.occasions} />
            <SimpleTable title="Top Gift Recipients" items={data.gifts?.recipients} />
            <SimpleTable title="Emotional Themes" items={data.gifts?.emotions} />
          </div>
          <div className="threeCols topGap">
            <SimpleTable title="Gift Note Length" items={data.gifts?.lengths} />
            <SimpleTable title="Gift Personas" items={data.gifts?.personas} />
            <InsightBox title="Gift insight" body="Gift notes reveal why customers buy: love, family, mother relationships and milestone occasions. This is stronger motivation data than product mix alone." />
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
          <div className="twoCols topGap"><GeoTable title="Top Countries" items={data.geography?.countries} /></div>
        </Panel>
      )}

      {tab === 'service' && (
        <Panel title="Customer Service">
          <div className="twoCols">
            <SimpleTable title="All Contact Drivers" items={data.service?.topReasons} />
            <SimpleTable title="Focus: Other / Damaged / Resize / Engraving" items={data.service?.focusReasons} />
          </div>
          <div className="twoCols topGap">
            <SimpleTable title="Kustomer Topics" items={data.service?.topics} />
            <SimpleTable title="CSAT Distribution" items={data.service?.csat} />
          </div>
          <div className="fourCols topGap">
            <SimpleTable title="Other Breakdown" items={data.service?.otherDetail} />
            <SimpleTable title="Damaged Breakdown" items={data.service?.damagedDetail} />
            <SimpleTable title="Resize Breakdown" items={data.service?.resizeDetail} />
            <SimpleTable title="Engraving Breakdown" items={data.service?.engravingDetail} />
          </div>
          <ExampleList title="Representative First Messages" items={data.service?.examples} />
          <InsightBox title="Service read" body="Kustomer is now mapped with customer name, email, order number, disposition topics, CSAT and first message. Shipping drives volume, but the most actionable insights are in Other, Damaged, Resize and Engraving." />
        </Panel>
      )}

      {tab === 'reviews' && (
        <Panel title="Reviews">
          <div className="threeCols">
            <SimpleTable title="Rating Distribution" items={data.reviews?.ratingDistribution} />
            <SimpleTable title="Positive Review Themes" items={data.reviews?.positiveThemes} />
            <SimpleTable title="Negative Review Themes" items={data.reviews?.negativeThemes} />
          </div>
          <div className="metricGrid topGap">
            <Metric label="Company Responses" value={n(data.reviews?.companyResponse?.company_responses)} note={`${data.reviews?.companyResponse?.response_rate || 0}% response rate`} />
            <Metric label="Reviews Imported" value={n(data.reviews?.companyResponse?.total_reviews)} note="Trustpilot" />
            <Metric label="Positive Examples" value={n((data.reviews?.positiveExamples || []).length)} note="Representative quotes" />
            <Metric label="Negative Examples" value={n((data.reviews?.negativeExamples || []).length)} note="Representative quotes" />
          </div>
          <div className="twoCols topGap">
            <ExampleList title="Positive Review Examples" items={data.reviews?.positiveExamples} />
            <ExampleList title="Negative Review Examples" items={data.reviews?.negativeExamples} />
          </div>
          <InsightBox title="Review read" body="Reviews should be used as qualitative proof points: what customers love, what causes dissatisfaction, and which gift/personalization themes appear in public feedback." />
        </Panel>
      )}


      {tab === 'ask' && (
        <Panel title="Ask AI">
          <div className="notice">
            <h3>Ask precise questions</h3>
            <p>Use this for product, geography and engraving questions. Examples: “What is the most popular product in New York?”, “For Willow, which letter is most requested?”, “For Belle, character count distribution”, “Top engravings for Name Necklace in California”.</p>
          </div>

          <div className="askBox topGap">
            <input
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder="Ask about products, geography, gift notes, engravings..."
            />
            <button onClick={() => askAi()} disabled={askLoading}>{askLoading ? 'Searching...' : 'Ask'}</button>
          </div>

          <div className="chips topGap">
            {[
              'What is the most popular product in New York?',
              'For Willow, which letter is most requested?',
              'For Belle, character count distribution',
              'Top engravings in California',
              'Product summary for Willow'
            ].map((q) => (
              <button key={q} onClick={() => askAi(q)}>{q}</button>
            ))}
          </div>

          {askAnswer && (
            <div className="answerBox topGap">
              {askAnswer.error && <div className="error">{askAnswer.error}</div>}
              {!askAnswer.error && (
                <>
                  <div className="answerMeta">
                    <strong>Detected product:</strong> {askAnswer.detectedProduct || 'None'}<br />
                    <strong>Detected region:</strong> {askAnswer.detectedRegion || 'None'}
                  </div>

                  {askAnswer.productSummary && (
                    <div className="answerCard">
                      <h3>Product Summary</h3>
                      <p>
                        {askAnswer.productSummary.product}: {n(askAnswer.productSummary.units)} units, {n(askAnswer.productSummary.orders)} orders,
                        {money(askAnswer.productSummary.revenue)} revenue, AOV {money(askAnswer.productSummary.aov)}.
                        Gift notes: {n(askAnswer.productSummary.giftNotes)}.
                      </p>
                    </div>
                  )}

                  {askAnswer.topProductsInRegion && <AskTable title="Top Products in Region" items={askAnswer.topProductsInRegion} />}
                  {askAnswer.initialDemand && <AskTable title="Initial / Letter Demand" items={askAnswer.initialDemand} />}
                  {askAnswer.initialDemandNote && <div className="answerCard"><p>{askAnswer.initialDemandNote}</p></div>}
                  {askAnswer.characterDistribution && <AskTable title="Character Distribution" items={askAnswer.characterDistribution} />}
                  {askAnswer.characterDistributionNote && <div className="answerCard"><p>{askAnswer.characterDistributionNote}</p></div>}
                  {askAnswer.topEngravings && <AskTable title="Top Engravings" items={askAnswer.topEngravings} />}
                </>
              )}
            </div>
          )}
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
        .kpi,.panel,.metric,.tableCard,.notice,.vipCard,.insightBox { background:#fff; border-radius:22px; box-shadow:0 12px 30px rgba(60,40,25,.06); }
        .kpi,.metric,.notice,.insightBox { padding:18px; }
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
        .fourCols { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:16px; }
        .twoCols { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
        .topGap { margin-top:16px; }
        .tableCard { overflow:hidden; border:1px solid #eee3d9; }
        .exampleList { margin-top:16px; padding:18px; }
        .exampleList h3 { margin:0 0 12px; }
        .exampleList div { background:#f7f3ef; border-radius:14px; padding:12px; margin-top:8px; color:#6f5b4c; line-height:1.45; }
        .askBox { display:flex; gap:10px; }
        .askBox input { flex:1; padding:14px 16px; border:1px solid #e2d5ca; border-radius:999px; font-size:15px; }
        .askBox button { border:0; border-radius:999px; padding:14px 18px; background:#211a16; color:#fff; font-weight:900; cursor:pointer; }
        .answerBox { display:grid; gap:14px; }
        .answerMeta,.answerCard { background:#fff; border:1px solid #eee3d9; border-radius:18px; padding:16px; }
        .error { background:#ffe8e8; border:1px solid #f0b0b0; color:#7a1c1c; border-radius:14px; padding:14px; }
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
        .vipCard span,.vipCard small,.notice p,.insightBox p { color:#6f5b4c; line-height:1.4; }
        .vipScore { width:58px; height:58px; border-radius:18px; display:flex; align-items:center; justify-content:center; background:#211a16; color:#fff; font-weight:900; font-size:22px; }
        .vipActions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
        @media(max-width:1000px){ .page{padding:18px;} .hero,.kpis,.metricGrid,.threeCols,.fourCols,.twoCols,.vipCard{grid-template-columns:1fr;display:grid;} h1{font-size:34px;} }
      `}</style>
    </div>
  );
}

function Panel({ title, children }) { return <section className="panel"><h2 className="panelTitle">{title}</h2>{children}</section>; }
function Metric({ label, value, note }) { return <div className="metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function InsightBox({ title, body }) { return <div className="insightBox"><h3>{title}</h3><p>{body}</p></div>; }

function ExampleList({ title, items = [] }) {
  return (
    <div className="exampleList tableCard">
      <h3>{title}</h3>
      {(!items || items.length === 0) && <div>No examples yet</div>}
      {(items || []).slice(0, 8).map((item, index) => (
        <div key={`${title}-${index}`}>
          <strong>{item.name || item.type || 'Example'}</strong><br />
          {item.example || item.review_content || item.first_message || ''}
        </div>
      ))}
    </div>
  );
}

function SimpleTable({ title, items = [], suffix = '' }) {
  return <div className="tableCard"><h3>{title}</h3><table className="dataTable"><thead><tr><th>Name</th><th>Count</th></tr></thead><tbody>{(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td></tr>}{(items || []).slice(0,15).map((item,index)=><tr key={`${title}-${item.name}`}><td><span className="rankBubble">{index+1}</span>{item.name || 'Unknown'}</td><td>{n(item.count || item.orders || 0)}{suffix}</td></tr>)}</tbody></table></div>;
}


function AskTable({ title, items = [] }) {
  return (
    <div className="tableCard">
      <h3>{title}</h3>
      <table className="dataTable">
        <thead>
          <tr>
            {items?.[0] && Object.keys(items[0]).slice(0, 4).map((key) => <th key={key}>{key}</th>)}
          </tr>
        </thead>
        <tbody>
          {(!items || items.length === 0) && <tr><td>No data</td></tr>}
          {(items || []).slice(0, 20).map((item, index) => (
            <tr key={`${title}-${index}`}>
              {Object.keys(item).slice(0, 4).map((key) => (
                <td key={key}>{typeof item[key] === 'number' ? n(item[key]) : item[key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GeoTable({ title, items = [] }) {
  return <div className="tableCard"><h3>{title}</h3><table className="dataTable"><thead><tr><th>Market</th><th>Orders</th><th>Revenue</th><th>AOV</th></tr></thead><tbody>{(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td><td>-</td><td>-</td></tr>}{(items || []).slice(0,15).map((item,index)=><tr key={`${title}-${item.name}`}><td><span className="rankBubble">{index+1}</span>{item.name || 'Unknown'}</td><td>{n(item.orders || item.count || 0)}</td><td>{money(item.revenue || 0)}</td><td>{money(item.aov || 0)}</td></tr>)}</tbody></table></div>;
}

function ProductTable({ title, items = [] }) {
  return <div className="tableCard"><h3>{title}</h3><table className="dataTable"><thead><tr><th>Product</th><th>Units</th><th>Orders</th><th>Revenue</th></tr></thead><tbody>{(!items || items.length === 0) && <tr><td>No data yet</td><td>-</td><td>-</td><td>-</td></tr>}{(items || []).slice(0,15).map((item,index)=><tr key={`${title}-${item.name}`}><td><span className="rankBubble">{index+1}</span>{item.name || 'Unknown'}</td><td>{n(item.units || 0)}</td><td>{n(item.orders || 0)}</td><td>{money(item.revenue || 0)}</td></tr>)}</tbody></table></div>;
}
