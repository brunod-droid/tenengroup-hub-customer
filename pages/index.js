
import { useEffect, useMemo, useState } from "react";

const MENU = [
  "Home",
  "Brands",
  "Cases",
  "Policies",
  "WISMO Late Zoom",
  "Agent Tools",
  "Events",
  "CRM",
  "Logistics",
  "Social",
  "Debriefs",
  "Prod Issues",
  "QA Team",
  "OCy",
  "AI Agents",
  "Q&A",
  "Analysis",
  "Training"
];
const QUICK_TOOLS = [
  { name: "Kustomer", url: "https://tenengroup.kustomerapp.com/" },
  { name: "OM / OCS", url: "https://bo.tenengroup.com/" },
  { name: "Notch", url: "https://tenengroup.app.getnotch.com/" },
  { name: "AfterShip", url: "https://www.aftership.com/" },
  { name: "Matrix", url: "http://matrix.tenengroup.com:100/Login.aspx" },
  { name: "17Track", url: "https://www.17track.net/en" }
];

const CHANNELS = [
  ["Webform","webform.jpg"],
  ["Facebook","facebook.jpg"],
  ["Instagram","instagram.jpg"],
  ["TikTok","tiktok.jpg"],
  ["Trustpilot","trustpilot.jpg"],
  ["Other Web","other.jpg"]
];


const COUNTRY_FLAGS = [
  ["il", "Israel"],
  ["it", "Italy"],
  ["hu", "Hungary"],
  ["ua", "Ukraine"],
  ["ph", "Philippines"],
  ["mx", "Mexico"],
  ["th", "Thailand"],
  ["es", "Spain"],
  ["at", "Austria"]
];

const NAPOLEONCAT_SLIDES = Array.from({ length: 14 }, (_, i) => `/social/napoleoncat/slide-${String(i + 1).padStart(2, "0")}.jpg`);
const DEBRIEF_SLIDES = Array.from({ length: 37 }, (_, i) => `/debriefs/customer/slide-${String(i + 1).padStart(2, "0")}.jpg`);

const KPI_DEFINITIONS = [
  ["CSAT", "Customer Satisfaction Score", "Goal: 4.2"],
  ["SLA", "Service Level Agreement", "Goal: 10h"],
  ["NPS", "Net Promoter Score", "Goal: High"],
  ["OC", "Order Cost", "Goal: Low"]
];

const BRANDS = [
  {
    id:"theo-grace",
    name:"Theo Grace",
    logo:"/brand/theograce.jpg",
    color:"#7c3aed",
    accent:"#f3e8ff",
    short:"Premium personalized products, elegant and emotional, with Nicky Hilton as part of the brand story.",
    full:[
      "Theo Grace is a premium personalized product brand.",
      "Nicky Hilton is part of the brand story and should remain visible when relevant.",
      "The tone should feel elegant, stylish, refined, emotional and family-oriented.",
      "The brand connects personalization with family joy, gifting and meaningful relationships."
    ],
    tone:["Elegant","Premium","Emotional","Family-oriented","Stylish","Nicky Hilton association"],
    documents:[{label:"Open brand full source", url:"/docs/theograce-brand.pdf"}, {label:"Open Theograce Weekly Reporting", url:"/theograce/weekly-reporting"}]
  },
  {
    id:"oak-luna",
    name:"Oak & Luna",
    logo:"/brand/oak-luna.jpg",
    color:"#111827",
    accent:"#f3f4f6",
    short:"Modern, refined and fashion-forward personalized jewelry.",
    full:[
      "Oak & Luna speaks to customers looking for modern and refined jewelry.",
      "The tone is less sentimental-first and more fashion-led.",
      "Products should feel polished, trendy, stylish and elevated.",
      "For public criticism, Oak & Luna has a stricter social protocol: approved public wording, then move to DM and hide the negative comment after reply."
    ],
    tone:["Modern","Chic","Polished","Fashion-forward","Refined"],
    documents:[{label:"Open Oak & Luna social source", url:"/docs/oak-luna-social-policy.pdf"}]
  },
  {
    id:"israel-blessing",
    name:"Israel Blessing",
    logo:"/brand/israel-blessing.jpg",
    color:"#0f766e",
    accent:"#ccfbf1",
    short:"Jewish identity-focused personalized products.",
    full:[
      "Israel Blessing focuses on Jewish identity and symbolism.",
      "Typical product universe includes Magen David, Chai, Israel map and Hebrew personalization.",
      "Tone must remain respectful, culturally aware and meaningful.",
      "Customer communication should be warm and sensitive to the symbolic value of the product."
    ],
    tone:["Respectful","Identity-driven","Symbolic","Culturally aware","Meaningful"]
  },
  {
    id:"lime-lou",
    name:"Lime & Lou",
    logo:"/brand/lime-lou.jpg",
    color:"#65a30d",
    accent:"#ecfccb",
    short:"Personalized home and lifestyle products.",
    full:[
      "Lime & Lou focuses on personalized home and lifestyle items.",
      "Examples include blankets, canvas, hoodies and decor-related gifts.",
      "Tone should be warm, modern, cozy, aesthetic and gift-friendly.",
      "Many issues are linked to production quality, personalization, fulfillment and gifting expectations."
    ],
    tone:["Warm","Modern","Home-oriented","Aesthetic","Gift-friendly"]
  },
  {
    id:"myka",
    name:"MYKA",
    logo:"/brand/myka.jpg",
    color:"#db2777",
    accent:"#fce7f3",
    short:"European brand family similar to Theo Grace but without Nicky Hilton.",
    full:[
      "MYKA is the European brand family.",
      "It is close to Theo Grace in assortment style but has no Nicky Hilton association.",
      "The tone should remain elegant, accessible, commercial and localized.",
      "Communication should adapt to local expectations and shipping context."
    ],
    tone:["Elegant","Accessible","European","Localized","No Nicky Hilton association"]
  },
];

const CASES = [
  { id:"presales", name:"Pre-sales", short:"Questions before purchase.", full:["Product questions","Material questions","Personalization possibilities","Maximum characters or special requests","Delivery promise before purchase","Countries served","Warranty and coupon questions"] },
  { id:"change", name:"Change Order", short:"Changes after order placement.", full:["Change product","Change material","Change inscription","Change address","Change shipping method","Check order status before promising a change"] },
  { id:"wismo", name:"WISMO", short:"Where Is My Order.", full:["Tracking unclear or not updating","Late delivery","Late supplier","DNR: Delivered Not Received","Lost parcel","Label created only","Return to sender"] },
  { id:"received", name:"Item Received", short:"Problems after delivery.", full:["Damaged product","Wrong product","Wrong material","Wrong inscription","Production error","Warranty case","Not satisfied","Resizing or fit issue"] },
  { id:"account", name:"Account Issues", short:"Account, login, GDPR and loyalty support.", full:["Login issue","GDPR request","Delete data request","Loyalty points","Account information issue"] },
  { id:"other", name:"Other", short:"Miscellaneous or external requests.", full:["Newsletter unsubscribe","Collaboration request","Supplier or partnership request","Spam or unclassified contact"] }
];

const POLICIES = [
  { id:"late", name:"Late / WISMO", short:"Delay, tracking, DNR, lost parcel and shipping issue handling.", full:["Always check ETA before saying the order is late.","If today is still before ETA, the order is not late.","Under 3 business days late: apologize and provide updated ETA.","Over 3 business days late: compensation may apply depending on scenario.","Check whether it is Late Supplier before using regular late flow.","For DNR, if less than 3 business days since delivery scan, ask the customer to wait.","Always check carrier tracking before replying."], wording:"I'm really sorry for the delay. I've checked your order and here is the latest update: [ETA]. We are closely monitoring it for you.", documents:[{label:"Open WISMO full source", url:"/policies/wismo-full-source"}] },
  { id:"supplier", name:"Late Supplier", short:"Production delay before shipment.", full:["Delayed before shipment due to production or supplier issue.","Do not automatically treat as regular delivery delay.","Check whether proactive communication was already sent.","Escalate if no clear internal update exists."], wording:"Your order is currently experiencing a production delay. Our team is already working on it and we will keep you updated as soon as we have a confirmed shipping timeline." },
  { id:"damaged", name:"Damaged", short:"Defective, broken or damaged product.", full:["Ask for a picture if none was provided.","Confirm damaged vs wrong item vs Not Satisfied.","Reorder is preferred first solution.","Refund is not first option unless policy allows it."], wording:"I'm really sorry about this. Could you please share a picture so I can resolve this for you right away? We will prioritize sending you a replacement.", documents:[{label:"Open Damaged full source", url:"/policies/damaged-full-source"}] },
  { id:"ns", name:"Not Satisfied", short:"Customer does not like a correctly produced item.", full:["Confirm it is not damaged or production error.","Exchange first.","Store credit second.","No refund for personalized items under Not Satisfied policy."], wording:"I understand this is not exactly what you expected. We'd be happy to offer you an exchange or store credit so you can choose something you truly love.", documents:[{label:"Open Not Satisfied full source", url:"/policies/not-satisfied-full-source"}] },
  { id:"vip", name:"VIP / Special Customers", short:"Priority service and enhanced compensation for special customers.", full:["Special customers should feel clearly recognized.","Use priority service.","Offer enhanced compensation when relevant.","Make it clear this is an exception to the standard policy."], wording:"As one of our valued VIP customers, your satisfaction is extremely important to us. While this is not our usual policy, we would like to make an exception and offer enhanced compensation as a special gesture of appreciation.", documents:[{label:"Open VIP full source", url:"/policies/vip-full-source"}] },
  { id:"resize", name:"Resizing", short:"Size and fit-related issue.", full:["Resizing is not a Not Satisfied case.","Ring resizing is usually free within the valid window.","Chains and bracelets follow separate rules.","Confirm the requested size before acting."], wording:"We can definitely help with resizing. Let me guide you through the available options based on your item." }
];

const WISMO_LATE = [
  {
    id: "step-1",
    name: "Step 1 — Is the order really late?",
    short: "Before talking about compensation, confirm whether the order is actually late.",
    full: [
      "Check the promised ETA first.",
      "If today is before the ETA, the order is not late yet.",
      "Check order status in OM / Kustomer.",
      "Check carrier tracking: shipped, label created, in transit, delivered, returned, lost risk.",
      "Check if this is Late Supplier, regular shipping delay, DNR, lost package, carrier issue or event-related delay.",
      "Check whether the customer already received a proactive message."
    ],
    action: "If not late yet: reassure + share ETA. Do not offer compensation.",
    customerWording: "I checked your order and it is still within the estimated delivery window. The current ETA is [ETA]. We’ll continue monitoring it and we’ll update you if anything changes.",
    documents: [{ label: "Open WISMO full source", url: "/docs/wismo-late-policy.pdf" }]
  },
  {
    id: "step-2",
    name: "Step 2 — Less than 3 business days late",
    short: "Small delay: apologize, give ETA, monitor. Usually no compensation.",
    full: [
      "Acknowledge the delay and apologize.",
      "Give the best available ETA / tracking update.",
      "Do not offer coupon, refund or free product by default.",
      "Do not promise a new delivery date unless confirmed.",
      "Tell the customer we are monitoring the order.",
      "Escalate only if there is a sensitive context, VIP case, event case or suspicious tracking."
    ],
    action: "Customer gets empathy + clear update. No standard gesture.",
    customerWording: "I’m really sorry for the delay. I checked your order and the latest update is [tracking / ETA]. It is taking slightly longer than expected, but we are monitoring it closely and will keep you updated.",
    documents: [{ label: "Open WISMO full source", url: "/docs/wismo-late-policy.pdf" }]
  },
  {
    id: "step-3",
    name: "Step 3 — More than 3 business days late",
    short: "Confirmed delay: apology + ownership + review possible gesture.",
    full: [
      "Apologize and take ownership.",
      "Give the latest confirmed status.",
      "Explain the next step clearly: monitor, escalate, contact carrier, check production, or review solution.",
      "A coupon / store credit can be considered when the delay is confirmed and customer impact is meaningful.",
      "Shipping refund can be considered if the customer paid for expedited shipping and the delivery promise was missed.",
      "Partial refund is not the default; use only if policy or escalation supports it.",
      "Free product is not a default solution; use only for retention, severe impact, or manager-approved scenarios."
    ],
    action: "Customer may receive a gesture depending on context. The agent must not offer blindly.",
    customerWording: "I’m very sorry for the delay and I understand how frustrating this is. I checked the latest status and we are following it closely. Since the order is now beyond the expected window, we can review the best gesture according to our policy while we continue monitoring the delivery.",
    documents: [{ label: "Open WISMO full source", url: "/docs/wismo-late-policy.pdf" }]
  },
  {
    id: "step-4",
    name: "Step 4 — No reliable ETA / major delay",
    short: "Escalate and decide between replacement, refund or stronger gesture.",
    full: [
      "Use this when there is no reliable ETA, a major delay, a lost package risk, repeated failed updates, or an event promise failure.",
      "Escalate to the right owner: Shipping, OCy, QA, or manager depending on the root cause.",
      "Replacement can be considered when the original order is unlikely to arrive or is lost.",
      "Refund can be considered when the customer cannot wait, issue is severe, or policy allows it.",
      "Full refund is not automatic. It depends on severity, brand policy, customer history and escalation logic.",
      "If it is event-related, check Red Event / MBL / proactive communication rules before replying."
    ],
    action: "Escalation required. The solution can be replacement, refund, shipping refund, coupon or case-specific gesture.",
    customerWording: "I’m very sorry. At this point, the delay is no longer within the normal window, so I’m escalating this to make sure we choose the right solution. Depending on the final status, we may be able to arrange a replacement or another resolution according to our policy.",
    documents: [{ label: "Open WISMO full source", url: "/docs/wismo-late-policy.pdf" }]
  },
  {
    id: "compensation",
    name: "Compensation logic",
    short: "What can we offer, and when?",
    full: [
      "No compensation by default when the order is still within ETA.",
      "No automatic compensation for delays under 3 business days.",
      "Coupon / store credit: possible for confirmed delay with meaningful customer impact.",
      "Shipping refund: possible if paid expedited shipping missed the promise.",
      "Replacement: possible if the parcel is lost, no reliable ETA exists, or delivery is unlikely.",
      "Partial refund: rare, case-by-case, usually after escalation.",
      "Full refund: severe cases only, not automatic.",
      "Free product: not standard. Use only for retention, special approval or very specific brand logic."
    ],
    action: "Always choose the lowest appropriate gesture that solves the customer issue and protects the brand.",
    customerWording: "I understand this delay is disappointing. Based on the current status, I’ll check what gesture or solution is available for your case and make sure we follow up with the most appropriate option.",
    documents: [{ label: "Open WISMO full source", url: "/docs/wismo-late-policy.pdf" }]
  },
  {
    id: "communication",
    name: "Communication rules",
    short: "How we communicate late orders.",
    full: [
      "Start with empathy.",
      "Show ownership: say you checked the order.",
      "Give the latest verified status.",
      "Give one clear next step.",
      "Avoid defensive wording.",
      "Do not overpromise.",
      "Do not use internal terms such as Red Event, MBL, ETA-1 or Late Supplier unless the customer already knows the concept.",
      "For Theo Grace, keep the tone premium, warm, elegant and reassuring."
    ],
    action: "Every answer should include: empathy + verified update + next step.",
    customerWording: "I completely understand this is disappointing, especially for a personalized order. I’ve checked the latest information and here is what we can do next: [next step].",
    documents: [{ label: "Open WISMO full source", url: "/docs/wismo-late-policy.pdf" }]
  }
];

const EVENTS = [
  { id:"mday", name:"Mother's Day 2026", short:"Main event playbook for jewelry and Lime & Lou.", intro:"Mother's Day is a peak event. The goal is to monitor delivery promises, stop risky automated replies, use proactive communication, and protect customer experience.", sections:[
    { title:"Core concepts", items:["Green Event = last day to order on time.","Red Event = last day to ship on time.","Last Day of Delivery = shipped orders still at risk.","ETA-1 = proactive delay monitoring before ETA."] },
    { title:"Jewelry Red Event logic", items:["At 7:00 AM IL time, Notch stops answering relevant non-shipped WISMO cases.","Messages move to On Hold for manual review.","Orders missing final shipment window can be tagged Late Red Event MDAY2026.","Proactive communication is sent to set expectations."] },
    { title:"Last Chance / MBL", items:["Last Chance means a one-day extra attempt when factory and shipping teams agree.","MBL means May Be Late.","Used for shipped orders still at risk of missing the event."] }
  ], wording:"I'm very sorry that your order may not arrive in time for Mother's Day. We are monitoring it closely and want to be fully transparent about the current delivery outlook.", documents:[{label:"Open Mother's Day full policy", url:"/docs/mothers-day-policy.pdf"}] },
  { id:"vday", name:"Valentine's Day 2026", short:"Same event backbone with strong expectation management.", intro:"Follows Green / Red / MBL event structure.", sections:[{ title:"Main structure", items:["Green Event","Red Event","On Hold routing","Late Red Event tags","MBL handling"] }], wording:"I completely understand how important timing is for this occasion." },
  { id:"xmas", name:"Christmas 2025", short:"Holiday event flow with fallback alternatives.", intro:"Uses event backbone plus holiday-specific fallback logic.", sections:[{ title:"Main structure", items:["Red Event","MBL handling","ETA-1 logic","Last Minute Pack fallback"] }], wording:"We're checking the best available option for your order." }
];

const CRM = [
  { id:"kustomer", name:"Kustomer", short:"Main CRM for Tenengroup conversations and case handling.", full:["Main CRM used for customer conversations.","Handles queues, tags, categories and dispositions.","Operational center for routing, classification and visibility."] },
  { id:"categories", name:"Categories", short:"System-filled classification from source or webform.", full:["Auto-filled by system.","Based on webform or source.","Support routing and reporting.","Not manually chosen by agents."] },
  { id:"dispositions", name:"Dispositions", short:"Manual case typing by agent.", full:["Selected manually by agents.","Define the real business case more precisely than categories.","Central for reporting accuracy and quality analysis."] },
  { id:"tags", name:"Tags", short:"Operational labels.", full:["Z tags are archived.","Tags can be manual, automatic, event-driven or AI-driven.","They should map to actions, owners and Notch behavior."] },
  { id:"notch", name:"Notch", short:"Current automation and AI layer.", full:["Handles part of standard automated flow.","Can answer simple or standard cases.","Paused or redirected during complex event scenarios."] }
];

const LOGISTICS = [
  { id:"factories", name:"Factories and production", short:"Production location and timing affect ETA.", full:["Factories are located in Israel, Thailand and Hungary.","Each product has its own production time.","Production days, factory location and destination determine delivery promise."] },
  { id:"shipping", name:"Shipping logic", short:"ETA depends on product, factory, destination and carrier.", full:["Shipping method can improve transit speed but not production speed.","Carrier checks are needed for trackable shipments.","AfterShip and 17Track support tracking investigation."] }
];


const SOCIAL_POLICY = [
  { id:"comments", name:"Handling comments", short:"Sort, review, like and reply correctly.", full:["Sort comments by Newest.","Reply directly under customer comment.","Keep public responses friendly, polite, professional, short and natural."] },
  { id:"concerns", name:"Customer concerns and criticism", short:"Investigate before answering public criticism.", full:["Find customer in Kustomer or OM.","Check previous replies, shipping and delivery updates.","Public response should acknowledge, show empathy and move to DM."] },
  { id:"oal", name:"Oak & Luna public criticism protocol", short:"Approved public responses only, then hide negative comment.", full:["Public responses must remain neutral and professional.","Move immediately to private messages.","Do not explain the issue publicly.","Use approved responses only.","After approved reply, hide negative comment."] }
];

const QA_TEAM = [
  { id:"qa-role", name:"QA Team Role", short:"Handles item received, quality checks and escalations.", full:["Handles damaged, wrong item, production errors and warranty cases.","Validates damaged vs Not Satisfied vs production error.","Supports complex and unclear cases.","Recommends reorder, exchange, credit or escalation."] },
  { id:"qa-escalation", name:"When to escalate to QA", short:"Escalation rules.", full:["Unclear pictures or unclear issue.","Repeated complaints on same product.","Premium or sensitive cases.","Potential factory issue."] },
  { id:"coupons-file", name:"Coupons File", short:"Codes that cannot be issued by the Coupon Generator.", full:["TGRUS VIP: $35","TGRUS: $50","OAL: $50","LL: 50%","Use the source file below as reference for valid event coupons and exceptions."] }
];

const OCY_TEAM = [
  { id:"role", name:"OCy Role", short:"Order cycle + ShineOn operations.", full:["Manages ShineOn order flows.","Checks product-specific rules before confirmation.","Prevents wrong personalization."] },
  { id:"shineon", name:"ShineOn Product Specifics", short:"Product rules from product name and notes.", full:["Use the product search in OCy.","Notes may include allowed characters, maximum length, automatic capitalization, emoji rules or special limitations.","If no note exists, no special rule has been documented yet."] }
];

const SHINEON_PRODUCTS = [
  { productName:"Luxury Necklace", notes:"Check chain length before confirming order. Not all lengths are adjustable." },
  { productName:"Forever Love Necklace", notes:"High volume product. Double check personalization before production." },
  { productName:"Interlocking Hearts Necklace", notes:"Two names maximum. Special characters may not be supported." },
  { productName:"Engraved Dog Tag", notes:"Font size depends on text length. Long text may be resized." },
  { productName:"Cuban Link Chain", notes:"No resizing possible after production." }
];

const AI_AGENTS = [
  { id:"dispatcher", name:"Manager / Dispatcher Agent", short:"Classifies the case and routes it to the right specialist.", full:["Detects case type: Pre-sales, Change Order, WISMO, Item Received, Account Issues or Other.","Checks urgency, brand, event context and available information.","Routes to Shipping, Factory, Refund, QA, VIP or CRM analysis agent."] },
  { id:"shipping", name:"Shipping Agent", short:"Handles WISMO, tracking, late, DNR, lost and carrier investigation.", full:["Checks OM, tracking, carrier and ETA.","Identifies DNR, lost, label created, RTS or delay.","Prepares carrier escalation when needed."] },
  { id:"qa", name:"QA / Item Received Agent", short:"Handles damaged, wrong item, not satisfied and warranty cases.", full:["Requests pictures where needed.","Identifies damaged vs not satisfied vs production error.","Recommends reorder, exchange, credit or escalation."] }
];

const COUNTRIES = ["Israel","Italy","Hungary","Ukraine","Philippines","Mexico","Thailand","Spain","Austria"];

const QUIZ = [
  ["What does WISMO mean?", "Where Is My Order."],
  ["Who do you go to if you have a question about customers?", "Customer Care team."],
  ["Give 2 KPIs from Customer Service.", "CSAT, SLA, NPS or Order Cost."],
  ["Who handles product-quality escalations?", "QA Team."],
  ["What makes a good Trustpilot reply?", "Empathy, ownership and a clear next step."],
  ["What should you never do with an angry customer?", "Promise something you did not verify."],
  ["Best survival tool in Customer Care?", "A good CRM search, empathy, and coffee."],
  ["When a customer says 'I will post everywhere', what is the first reflex?", "Stay calm, acknowledge, move to private channel, and escalate if needed."]
];

const SUGGESTED_QUESTIONS = [
  "My order is late by 2 days. What should I do?",
  "The item is damaged. What is the process?",
  "Customer is not satisfied with the item.",
  "How does DNR policy work?",
  "What is a Red Event during Mother's Day?",
  "Difference between category and disposition?",
  "Yves Rocher wrong address reship?",
  "Oak & Luna negative public comment?",
  "When should I escalate to QA?",
  "What are the ShineOn product rules?"
];

function normalizeProduct(p, index) {
  const notes = p.notes || "No specific note documented.";
  return { id:"shineon-" + index, name:p.productName || "ShineOn product", short:notes.length > 180 ? notes.slice(0,180) + "..." : notes, full:[notes] };
}

function getText(item) {
  return [item.name, item.title, item.short, item.intro, item.wording, ...(item.full || []), ...(item.tone || []), ...((item.sections || []).flatMap(s => [s.title, ...(s.items || [])]))].filter(Boolean).join(" ");
}

function assistantAnswer(input) {
  const q = input.toLowerCase().trim();
  if (!q) return { title:"Ask the assistant", body:"Ask about late orders, damaged items, DNR, Red Event, Social, QA, OCy, ShineOn, tags or dispositions.", tags:[] };
  if (q.includes("late") || q.includes("delay") || q.includes("coupon") || q.includes("refund")) return { title:"WISMO Late guidance", body:"Use WISMO Late Zoom → Agent decision tool. Verify ETA first. Under 3 business days late: apology + ETA, usually no compensation. Over 3 business days late: review gesture. No ETA / major delay: escalate.", tags:["WISMO","Late"] };
  if (q.includes("training") || q.includes("orientation")) return { title:"Training guidance", body:"Open Training for the 20-minute presentation.", tags:["Training"] };
  if (q.includes("trustpilot") || q.includes("review")) return { title:"Trustpilot guidance", body:"A good public review response should be empathetic, personal and solution-oriented. It should show ownership and provide a clear next step.", tags:["Trustpilot"] };
  if (q.includes("shineon") || q.includes("ocy") || q.includes("product")) return { title:"OCy / ShineOn guidance", body:"Go to OCy and search the ShineOn product. Always check product-specific notes before confirming personalization.", tags:["OCy","ShineOn"] };
  if (q.includes("qa") || q.includes("quality") || q.includes("escalate")) return { title:"QA guidance", body:"Escalate unclear, repeated, sensitive or product-quality cases to QA.", tags:["QA Team"] };
  if (q.includes("social") || q.includes("facebook") || q.includes("instagram")) return { title:"Social guidance", body:"Sort by newest, reply directly under the comment, keep replies short and professional, move concerns to DM.", tags:["Social"] };
  if (q.includes("yves") || q.includes("shopify") || q.includes("gorgias")) return { title:"Yves Rocher guidance", body:"Yves Rocher uses Shopify for orders, Gorgias for tickets and Notch/Taylor for AI.", tags:["Yves Rocher","Shopify","Gorgias"] };
  if (q.includes("dnr")) return { title:"DNR guidance", body:"Tenengroup: wait 3 business days after delivery scan. Yves Rocher: allow 7 business days and ask for Non-Receipt form.", tags:["DNR","WISMO"] };
  if (q.includes("damaged") || q.includes("broken") || q.includes("defect")) return { title:"Damaged item guidance", body:"Ask for picture, confirm issue, apply warranty logic, reorder first.", tags:["Damaged"] };
  if (q.includes("red event") || q.includes("mother") || q.includes("mbl") || q.includes("last chance")) return { title:"Event guidance", body:"Use Green Event, Red Event, On Hold, proactive communication, MBL and Last Chance logic.", tags:["Event"] };
  if (q.includes("tag")) return { title:"Tags guidance", body:"Tags may be manual, automatic, event-driven or AI-driven. They should map to actions, owners and Notch behavior.", tags:["Tags","CRM"] };
  if (q.includes("disposition")) return { title:"Dispositions guidance", body:"Dispositions are selected manually by agents and define the real business case more precisely than categories.", tags:["Dispositions","CRM"] };
  return { title:"General guidance", body:"Identify the case family first, then open the matching section in the hub.", tags:["General"] };
}

function Box({ children, dark }) {
  return <div style={{ background:dark ? "#0f172a" : "#fff", color:dark ? "#fff" : "#111827", border:"1px solid #e5e7eb", borderRadius:22, padding:24, marginBottom:22, boxShadow:"0 8px 24px rgba(15,23,42,0.06)" }}>{children}</div>;
}

function Bullets({ items }) {
  return <ul style={{ lineHeight:1.8, color:"#4b5563", paddingLeft:18 }}>{(items || []).map((item) => <li key={item}>{item}</li>)}</ul>;
}

function Pill({ children }) {
  return <span style={{ display:"inline-block", padding:"8px 12px", borderRadius:999, background:"#eef2ff", color:"#3730a3", fontWeight:700, fontSize:13, marginRight:8, marginBottom:8 }}>{children}</span>;
}

function TagChip({ text }) {
  return <Pill>{text}</Pill>;
}

function DocumentButtons({ documents }) {
  if (!documents || !documents.length) return null;
  return <div style={{ marginTop:16, display:"flex", gap:10, flexWrap:"wrap" }}>
    {documents.map((doc) => <a key={doc.url} href={doc.url} target={doc.url.startsWith("/") ? undefined : "_blank"} rel={doc.url.startsWith("/") ? undefined : "noreferrer"} style={{ display:"inline-block", padding:"10px 14px", borderRadius:12, background:"#111827", color:"#fff", textDecoration:"none", fontWeight:700 }}>{doc.label || "Open full source"}</a>)}
  </div>;
}

function Reveal({ q, a }) {
  const [open, setOpen] = useState(false);
  return <div onClick={() => setOpen(!open)} style={{ border:"1px solid #e5e7eb", borderRadius:16, padding:16, cursor:"pointer", background:"#fff", marginBottom:10 }}>
    <div style={{ fontWeight:800 }}>{q}</div>
    {open && <div style={{ marginTop:10, color:"#2563eb", fontWeight:700 }}>{a}</div>}
  </div>;
}

function SmallCard({ title, text, onClick }) {
  return <div onClick={onClick} style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:18, padding:18, cursor:"pointer" }}>
    <div style={{ fontSize:22, fontWeight:700 }}>{title}</div>
    <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>{text}</div>
  </div>;
}

function ExpandableCard({ title, shortText, bullets, extraTitle, extraItems, wording, documents }) {
  const [open, setOpen] = useState(false);
  return <Box>
    <div style={{ fontSize:28, fontWeight:800 }}>{title}</div>
    <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>{shortText}</div>
    <DocumentButtons documents={documents} />
    <button onClick={() => setOpen(!open)} style={{ marginTop:14, background:"#eef2ff", color:"#3730a3", border:"none", borderRadius:10, padding:"10px 14px", cursor:"pointer", fontWeight:700 }}>{open ? "Hide details" : "Show details"}</button>
    {open && <div style={{ marginTop:18 }}>
      {bullets && <Bullets items={bullets} />}
      {extraItems && <><div style={{ fontWeight:800, marginTop:14 }}>{extraTitle}</div><Bullets items={extraItems} /></>}
      {wording && <><div style={{ fontWeight:800, marginTop:14 }}>Suggested wording</div><div style={{ marginTop:8, fontStyle:"italic", color:"#374151", lineHeight:1.7 }}>{wording}</div><CopyButton text={wording} /></>}
    </div>}
  </Box>;
}




function CopyButton({ text, label = "Copy answer" }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      setCopied(false);
    }
  };
  return (
    <button
      onClick={copy}
      style={{ marginTop: 12, background:"#2563eb", color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", cursor:"pointer", fontWeight:800 }}
    >
      {copied ? "Copied ✓" : "📋 " + label}
    </button>
  );
}


function AgentDecisionTool() {
  const [isLate, setIsLate] = useState("");
  const [delay, setDelay] = useState("");

  let result = null;

  if (isLate === "no") {
    result = {
      title: "Not late yet",
      action: "Reassure the customer and share the current ETA. No compensation.",
      gesture: "No coupon / refund / free product.",
      wording: "I checked your order and it is still within the estimated delivery window. The current ETA is [ETA]. We’ll continue monitoring it and update you if anything changes."
    };
  }

  if (isLate === "yes" && delay === "under3") {
    result = {
      title: "Less than 3 business days late",
      action: "Apologize, share latest tracking/ETA, monitor.",
      gesture: "Usually no compensation.",
      wording: "I’m really sorry for the delay. I checked your order and the latest update is [tracking / ETA]. It is taking slightly longer than expected, but we are monitoring it closely and will keep you updated."
    };
  }

  if (isLate === "yes" && delay === "over3") {
    result = {
      title: "More than 3 business days late",
      action: "Apologize, take ownership, review gesture if impact is meaningful.",
      gesture: "Coupon/store credit possible. Shipping refund possible if expedited shipping promise was missed. Partial refund/free product only by policy or escalation.",
      wording: "I’m very sorry for the delay and I understand how frustrating this is. I checked the latest status and we are following it closely. Since the order is now beyond the expected window, we can review the best gesture according to our policy while we continue monitoring the delivery."
    };
  }

  if (isLate === "yes" && delay === "noeta") {
    result = {
      title: "No reliable ETA / major delay",
      action: "Escalate to the right owner and decide between replacement, refund or stronger gesture.",
      gesture: "Replacement or refund may apply depending on root cause, severity and policy.",
      wording: "I’m very sorry. At this point, the delay is no longer within the normal window, so I’m escalating this to make sure we choose the right solution. Depending on the final status, we may be able to arrange a replacement or another resolution according to our policy."
    };
  }

  const Button = ({ active, onClick, children }) => (
    <button onClick={onClick} style={{
      background: active ? "#2563eb" : "#eef2ff",
      color: active ? "#fff" : "#3730a3",
      border:"none",
      borderRadius:14,
      padding:"12px 16px",
      cursor:"pointer",
      fontWeight:900,
      marginRight:10,
      marginBottom:10
    }}>
      {children}
    </button>
  );

  return (
    <Box>
      <div style={{ fontSize:28, fontWeight:900 }}>⚡ Agent decision tool</div>
      <div style={{ marginTop:8, color:"#4b5563", lineHeight:1.7 }}>
        Answer 2 questions and get the recommended action + copy-ready wording.
      </div>

      <div style={{ marginTop:20 }}>
        <div style={{ fontWeight:900, marginBottom:10 }}>1. Is the order late compared to ETA?</div>
        <Button active={isLate === "yes"} onClick={() => { setIsLate("yes"); setDelay(""); }}>Yes</Button>
        <Button active={isLate === "no"} onClick={() => { setIsLate("no"); setDelay(""); }}>No</Button>
      </div>

      {isLate === "yes" && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontWeight:900, marginBottom:10 }}>2. How late?</div>
          <Button active={delay === "under3"} onClick={() => setDelay("under3")}>Less than 3 business days</Button>
          <Button active={delay === "over3"} onClick={() => setDelay("over3")}>More than 3 business days</Button>
          <Button active={delay === "noeta"} onClick={() => setDelay("noeta")}>No reliable ETA / major delay</Button>
        </div>
      )}

      {result && (
        <div style={{ marginTop:22, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <div style={{ background:"#f8fafc", borderRadius:18, padding:18 }}>
            <div style={{ fontSize:22, fontWeight:900 }}>{result.title}</div>
            <div style={{ marginTop:12, fontWeight:900 }}>Agent action</div>
            <div style={{ marginTop:6, color:"#374151", lineHeight:1.7 }}>{result.action}</div>
            <div style={{ marginTop:12, fontWeight:900 }}>Gesture / compensation</div>
            <div style={{ marginTop:6, color:"#374151", lineHeight:1.7 }}>{result.gesture}</div>
          </div>
          <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:18, padding:18 }}>
            <div style={{ fontWeight:900 }}>Customer wording</div>
            <div style={{ marginTop:8, color:"#374151", lineHeight:1.7, fontStyle:"italic" }}>{result.wording}</div>
            <CopyButton text={result.wording} />
          </div>
        </div>
      )}
    </Box>
  );
}

function WismoDecisionCard({ item }) {
  const [open, setOpen] = useState(true);
  return <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:24, overflow:"hidden", marginBottom:22, boxShadow:"0 8px 24px rgba(15,23,42,0.06)" }}>
    <div style={{ padding:24, borderLeft:"10px solid #2563eb" }}>
      <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start" }}>
        <div>
          <div style={{ fontSize:28, fontWeight:900 }}>{item.name}</div>
          <div style={{ marginTop:8, color:"#4b5563", lineHeight:1.7, fontSize:17 }}>{item.short}</div>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background:"#eef2ff", color:"#3730a3", border:"none", borderRadius:12, padding:"10px 14px", cursor:"pointer", fontWeight:800 }}>{open ? "Hide" : "Show"}</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginTop:18 }}>
        <div style={{ background:"#f8fafc", borderRadius:18, padding:18 }}>
          <div style={{ fontWeight:900, marginBottom:8 }}>Agent action</div>
          <div style={{ color:"#374151", lineHeight:1.7 }}>{item.action}</div>
        </div>
        <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:18, padding:18 }}>
          <div style={{ fontWeight:900, marginBottom:8 }}>Customer wording</div>
          <div style={{ color:"#374151", lineHeight:1.7, fontStyle:"italic" }}>{item.customerWording}</div><CopyButton text={item.customerWording} />
        </div>
      </div>
      <DocumentButtons documents={item.documents} />
      {open && <div style={{ marginTop:18 }}>
        <div style={{ fontWeight:900, marginBottom:8 }}>Checklist</div>
        <Bullets items={item.full} />
      </div>}
    </div>
  </div>;
}

function BrandCard({ brand }) {
  const [open, setOpen] = useState(false);
  return <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:24, overflow:"hidden", marginBottom:22, boxShadow:"0 8px 24px rgba(15,23,42,0.06)" }}>
    <div style={{ height:10, background:brand.color }} />
    <div style={{ padding:24 }}>
      <div style={{ display:"grid", gridTemplateColumns:"110px 1fr", gap:20, alignItems:"center" }}>
        <div style={{ width:100, height:100, borderRadius:22, background:brand.accent, display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", border:"1px solid #e5e7eb" }}>
          <img src={brand.logo} alt={brand.name} onError={(e) => { e.currentTarget.style.display = "none"; }} style={{ maxWidth:"92%", maxHeight:"92%", objectFit:"contain" }} />
        </div>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ fontSize:30, fontWeight:900 }}>{brand.name}</div>
            <span style={{ width:16, height:16, borderRadius:"50%", background:brand.color, display:"inline-block" }} />
          </div>
          <div style={{ marginTop:8, color:"#4b5563", lineHeight:1.7 }}>{brand.short}</div>
          <DocumentButtons documents={brand.documents} />
        </div>
      </div>
      <div style={{ marginTop:18 }}>
        {(brand.tone || []).map((x) => <span key={x} style={{ display:"inline-block", padding:"8px 12px", borderRadius:999, background:brand.accent, color:brand.color, fontWeight:800, fontSize:13, marginRight:8, marginBottom:8 }}>{x}</span>)}
      </div>
      <button onClick={() => setOpen(!open)} style={{ marginTop:12, background:brand.color, color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", cursor:"pointer", fontWeight:800 }}>{open ? "Hide full details" : "Show full details"}</button>
      {open && <div style={{ marginTop:16 }}><Bullets items={brand.full} /></div>}
    </div>
  </div>;
}


function TeamBadge({ label }) {
  const colors = {
    CS: ["#dbeafe", "#1d4ed8"],
    AI: ["#ede9fe", "#7c3aed"],
    OCy: ["#dcfce7", "#15803d"],
    QA: ["#ffedd5", "#c2410c"]
  };
  const [bg, fg] = colors[label] || ["#f3f4f6", "#374151"];
  return <span style={{ display:"inline-block", padding:"7px 10px", borderRadius:999, background:bg, color:fg, fontWeight:900, fontSize:12, marginRight:6, marginBottom:6 }}>{label}</span>;
}

function CaseDecisionTool({ type }) {
  const [step, setStep] = useState("");
  const tools = {
    damaged: {
      title: "Damaged decision tool",
      q: "Did the customer provide a photo?",
      yes: {
        title: "Photo received",
        action: "Validate the damage, classify the case, and prioritize replacement. Refund is not the first option unless policy/escalation supports it.",
        wording: "I’m really sorry your item arrived damaged. Thank you for sharing the picture. I’ll review this right away and prioritize the best solution, usually a replacement, according to our policy."
      },
      no: {
        title: "Photo missing",
        action: "Ask for a clear picture before deciding. Do not promise refund/replacement before evidence.",
        wording: "I’m really sorry about this. Could you please send us a clear picture of the issue so we can resolve it as quickly as possible?"
      }
    },
    notSatisfied: {
      title: "Not Satisfied decision tool",
      q: "Is the item correctly produced?",
      yes: {
        title: "Correctly produced",
        action: "Treat as Not Satisfied. Offer exchange or store credit first. Refund is not the default for personalized items.",
        wording: "I understand this is not exactly what you expected. Since the item was produced as ordered, we can offer an exchange or store credit so you can choose something you truly love."
      },
      no: {
        title: "Possible production issue",
        action: "Move to damaged / production error flow. Ask for pictures if needed and consider replacement.",
        wording: "I’m sorry this doesn’t look right. Could you please share a picture so we can check whether this is a production issue and help with the right solution?"
      }
    },
    dnr: {
      title: "DNR decision tool",
      q: "Does tracking show delivered?",
      yes: {
        title: "Delivered scan exists",
        action: "Ask customer to check around, wait the policy window, then investigate / reorder / refund depending on policy.",
        wording: "I understand you haven’t received it although tracking shows delivered. Please check around your address and with neighbors. We’ll monitor this and review the next step according to our delivery policy."
      },
      no: {
        title: "No delivered scan",
        action: "This is WISMO, not DNR. Check ETA, carrier tracking, delay and root cause.",
        wording: "I checked the tracking and it does not show delivered yet. I’ll review the latest status and ETA for you now."
      }
    },
    changeOrder: {
      title: "Change Order decision tool",
      q: "Is the order already in production or shipped?",
      yes: {
        title: "Too late to guarantee change",
        action: "Do not promise the change. Check if exception is possible, otherwise explain clearly.",
        wording: "I’ll check what is still possible, but personalized orders move quickly into production, so I can’t guarantee this change until I verify the current status."
      },
      no: {
        title: "Change may be possible",
        action: "Confirm requested change, update order if allowed, and document the action.",
        wording: "Thanks for the update. I’ll check the order status and, if it is still possible, update the order with your requested change."
      }
    }
  };
  const t = tools[type] || tools.damaged;
  const result = step === "yes" ? t.yes : step === "no" ? t.no : null;

  return <Box>
    <div style={{ fontSize:28, fontWeight:900 }}>⚡ {t.title}</div>
    <div style={{ marginTop:14, fontWeight:900 }}>{t.q}</div>
    <div style={{ marginTop:12 }}>
      <button onClick={() => setStep("yes")} style={{ background:step==="yes" ? "#2563eb" : "#eef2ff", color:step==="yes" ? "#fff" : "#3730a3", border:"none", borderRadius:14, padding:"12px 16px", fontWeight:900, marginRight:10, cursor:"pointer" }}>Yes</button>
      <button onClick={() => setStep("no")} style={{ background:step==="no" ? "#2563eb" : "#eef2ff", color:step==="no" ? "#fff" : "#3730a3", border:"none", borderRadius:14, padding:"12px 16px", fontWeight:900, cursor:"pointer" }}>No</button>
    </div>
    {result && <div style={{ marginTop:20, display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
      <div style={{ background:"#f8fafc", borderRadius:18, padding:18 }}>
        <div style={{ fontSize:22, fontWeight:900 }}>{result.title}</div>
        <div style={{ marginTop:10, color:"#374151", lineHeight:1.7 }}>{result.action}</div>
      </div>
      <div style={{ background:"#fefce8", border:"1px solid #fde68a", borderRadius:18, padding:18 }}>
        <div style={{ fontWeight:900 }}>Customer wording</div>
        <div style={{ marginTop:8, color:"#374151", lineHeight:1.7, fontStyle:"italic" }}>{result.wording}</div>
        <CopyButton text={result.wording} />
      </div>
    </div>}
  </Box>;
}


function SafeTeamImage({ src, alt }) {
  const [ok, setOk] = useState(true);
  if (!ok) {
    return (
      <div style={{ width:"100%", height:230, borderRadius:22, background:"#f8fafc", border:"2px dashed #cbd5e1", display:"flex", alignItems:"center", justifyContent:"center", color:"#64748b", fontWeight:900, textAlign:"center", padding:20 }}>
        Missing image<br />{src}
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setOk(false)} style={{ width:"100%", height:230, objectFit:"cover", borderRadius:22 }} />;
}

function TrainingSlides() {
  const [countryReveal, setCountryReveal] = useState("");
  const [kpiReveal, setKpiReveal] = useState("");
  const [finalCaseReveal, setFinalCaseReveal] = useState(false);
  const [selectedTpReview, setSelectedTpReview] = useState(null);
  const slides = ["intro","bruno","org","mission","wheel","cart","trustpilot","final","quiz"];
  const scrollToSlide = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior:"smooth" });
  };

  return <div style={{ scrollBehavior:"smooth" }}>
    <div style={{ position:"fixed", right:24, top:"45%", zIndex:20, display:"flex", flexDirection:"column", gap:10 }}>
      {slides.map((id, i) => <button key={id} onClick={() => scrollToSlide(id)} style={{ width:44, height:44, borderRadius:"50%", border:"none", background:"#0f172a", color:"#fff", fontWeight:900, cursor:"pointer" }}>{i + 1}</button>)}
    </div>

    <section id="intro" style={{ minHeight:"100vh", padding:70, display:"flex", alignItems:"center" }}>
      <div>
        <div style={{ fontSize:20, color:"#2563eb", fontWeight:800 }}>TG ORIENTATION WEEK</div>
        <div style={{ fontSize:78, fontWeight:900, marginTop:10 }}>Customer Care</div>
        <div style={{ fontSize:42, marginTop:8 }}>20-minute overview</div>
        <div style={{ marginTop:30, fontSize:24, maxWidth:900, lineHeight:1.6, color:"#374151" }}>A friendly introduction to the Customer Care team: who we are, what we do, where customers reach us, and how we contribute to customer experience, retention and company insights.</div>
        <div style={{ marginTop:34 }}><Pill>Team</Pill><Pill>Missions</Pill><Pill>Channels</Pill><Pill>KPIs</Pill><Pill>Customer Journey</Pill><Pill>Trustpilot</Pill></div>
      </div>
    </section>

    <section id="bruno" style={{ minHeight:"100vh", padding:70, display:"flex", alignItems:"center", background:"linear-gradient(135deg,#f8fafc,#eef2ff)" }}>
      <div style={{ display:"grid", gridTemplateColumns:"390px 1fr", gap:60, alignItems:"center", width:"100%" }}>
        <div style={{ background:"#fff", borderRadius:32, padding:22, boxShadow:"0 18px 45px rgba(15,23,42,0.14)" }}>
          <img src="/team/bruno.jpg" style={{ width:"100%", height:520, objectFit:"contain", borderRadius:24, background:"#f8fafc" }} alt="Bruno Dreyfus" />
        </div>
        <div>
          <div style={{ fontSize:58, fontWeight:950, letterSpacing:"-1px" }}>Bruno DREYFUS</div>
          <div style={{ fontSize:26, color:"#2563eb", fontWeight:900, marginTop:8 }}>Customer Service Director</div>
          <div style={{ marginTop:26, fontSize:22, lineHeight:1.8, color:"#374151" }}>
            47 years old · Married · 3 kids · Lives in Raanana · From France<br/>
            Previously CRM Consultant and worked in French ecommerce: lifestyle, jewelry, underwear and home.<br/>
            4.5 years at Tenengroup.<br/><br/>
            <b>Hobbies & Goal</b><br/>
            Football, friends, family — and becoming a barbecue pro 🔥
          </div>
          <div style={{ marginTop:36, fontSize:30, fontWeight:900 }}>My objectives at Tenengroup</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:16, marginTop:18 }}>
            {[["🎉","Have fun"],["⚡","Efficiency matters"],["🚀","Innovate"],["💪","Do your best"]].map(([icon, text]) => <div key={text} style={{ background:"#fff", border:"1px solid #dbeafe", borderRadius:22, padding:22, fontSize:22, fontWeight:900, boxShadow:"0 10px 22px rgba(37,99,235,0.08)" }}><span style={{ marginRight:10 }}>{icon}</span>{text}</div>)}
          </div>
        </div>
      </div>
    </section>

    <section id="org" style={{ minHeight:"100vh", padding:70, background:"linear-gradient(rgba(2,6,23,.82), rgba(15,23,42,.88)), url('/team/world-map.jpg') center/cover no-repeat", color:"#fff" }}>
      <div style={{ fontSize:56, fontWeight:900 }}>Organization</div>
      <div style={{ fontSize:24, color:"#cbd5e1", marginTop:12 }}>Customer organization: clear ownership by team, with Shani Brown leading the Customer scope.</div>

      <div style={{ marginTop:32 }}>
        <div style={{ background:"rgba(255,255,255,.14)", borderRadius:24, padding:22, border:"1px solid rgba(255,255,255,.22)", textAlign:"center", maxWidth:520, margin:"0 auto" }}>
          <div style={{ fontSize:30, fontWeight:950 }}>Shani Brown</div>
          <div style={{ color:"#93c5fd", fontWeight:900, marginTop:4 }}>VP Customer</div>
        </div>

        <div style={{ textAlign:"center", fontSize:34, margin:"12px 0" }}>↓</div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:16 }}>
          <div style={{ background:"rgba(255,255,255,.12)", borderRadius:22, padding:20, border:"1px solid rgba(255,255,255,.16)" }}>
            <div style={{ fontSize:22, fontWeight:950 }}>Customer Service</div>
            <div style={{ marginTop:12, color:"#93c5fd", fontWeight:900 }}>Bruno DREYFUS</div>
            <div style={{ marginTop:14, lineHeight:1.85, color:"#e5e7eb" }}>
              <b>Team Leads</b><br/>
              Adi<br/>
              Tace<br/>
              Neva<br/>
              <br/>
              <b>Agents</b>
            </div>
          </div>

          <div style={{ background:"rgba(255,255,255,.12)", borderRadius:22, padding:20, border:"1px solid rgba(255,255,255,.16)" }}>
            <div style={{ fontSize:22, fontWeight:950 }}>Order Cycle (OCy)</div>
            <div style={{ marginTop:12, color:"#93c5fd", fontWeight:900 }}>Orly</div>
            <div style={{ marginTop:14, lineHeight:1.85, color:"#e5e7eb" }}>OCy Agents</div>
          </div>

          <div style={{ background:"rgba(255,255,255,.12)", borderRadius:22, padding:20, border:"1px solid rgba(255,255,255,.16)" }}>
            <div style={{ fontSize:22, fontWeight:950 }}>QA</div>
            <div style={{ marginTop:12, color:"#93c5fd", fontWeight:900 }}>Laurence</div>
            <div style={{ marginTop:14, lineHeight:1.85, color:"#e5e7eb" }}>QA Agents</div>
          </div>

          <div style={{ background:"rgba(255,255,255,.12)", borderRadius:22, padding:20, border:"1px solid rgba(255,255,255,.16)" }}>
            <div style={{ fontSize:22, fontWeight:950 }}>Project Manager</div>
            <div style={{ marginTop:12, color:"#93c5fd", fontWeight:900 }}>Marianna</div>
          </div>

          <div style={{ background:"rgba(255,255,255,.12)", borderRadius:22, padding:20, border:"1px solid rgba(255,255,255,.16)" }}>
            <div style={{ fontSize:22, fontWeight:950 }}>Cart Optimization</div>
            <div style={{ marginTop:12, color:"#93c5fd", fontWeight:900 }}>Maayan</div>
            <div style={{ marginTop:8, color:"#93c5fd", fontWeight:900 }}>Dominique</div>
          </div>
        </div>
      </div>

      <div style={{ marginTop:24, background:"rgba(255,255,255,.12)", borderRadius:24, padding:24, border:"1px solid rgba(255,255,255,.16)" }}>
        <div style={{ fontSize:30, fontWeight:900 }}>Global team flag quiz</div>
        <div style={{ marginTop:8, color:"#cbd5e1" }}>Click a flag to reveal the country.</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(9, 1fr)", gap:10, marginTop:18 }}>
          {COUNTRY_FLAGS.map(([code,country]) => (
            <button
              key={country}
              onClick={() => setCountryReveal(country)}
              style={{ background:"#fff", border:"1px solid rgba(255,255,255,.28)", borderRadius:16, padding:"10px 8px", cursor:"pointer", color:"#111827", transition:"transform .18s ease" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <img
                src={"/flags/" + code + ".png"}
                alt={country}
                style={{ width:46, height:32, objectFit:"cover", borderRadius:5, boxShadow:"0 2px 8px rgba(0,0,0,.20)" }}
              />
            </button>
          ))}
        </div>
        <div style={{ marginTop:16, minHeight:52, background:"rgba(255,255,255,.14)", borderRadius:16, padding:14, fontSize:24, fontWeight:900 }}>
          {countryReveal ? countryReveal : "Click a flag 👆"}
        </div>
      </div>
    </section>

    <section id="mission" style={{ minHeight:"100vh", padding:70 }}>
      <div style={{ fontSize:56, fontWeight:900 }}>Missions, Channels & KPIs</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28, marginTop:36 }}>
        <Box><div style={{ fontSize:32, fontWeight:900 }}>Missions</div><Bullets items={["Optimize customer experience through tone of voice, policies and service quality.","Maximize lifetime value and reduce customer churn.","Identify and implement new channels to enhance satisfaction.","Coordinate and bring insights to Shipping, Factory and Brands."]} /></Box>
        <Box><div style={{ fontSize:32, fontWeight:900 }}>Where customers reach us</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginTop:18 }}>
            {CHANNELS.map(([name,img]) => <div key={name} style={{ textAlign:"center", background:"#f8fafc", borderRadius:16, padding:14 }}><img src={"/team/" + img} style={{ height:44, objectFit:"contain" }} alt={name} /><div style={{ marginTop:8, fontWeight:800 }}>{name}</div></div>)}
          </div>
        </Box>
      </div>
      <Box>
        <div style={{ fontSize:32, fontWeight:900 }}>KPI quiz — click to reveal</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginTop:20 }}>
          {KPI_DEFINITIONS.map(([code, meaning, goal]) => <div key={code} onClick={() => setKpiReveal(kpiReveal === code ? "" : code)} style={{ background:"#f8fafc", borderRadius:18, padding:20, cursor:"pointer", border:kpiReveal === code ? "2px solid #2563eb" : "1px solid #e5e7eb" }}>
            <div style={{ fontSize:30, fontWeight:950, color:"#2563eb" }}>{code}</div>
            <div style={{ marginTop:8, fontWeight:900 }}>{goal}</div>
            <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.6 }}>{kpiReveal === code ? meaning : "Click to reveal meaning"}</div>
          </div>)}
        </div>
      </Box>
    </section>

    <section id="wheel" style={{ minHeight:"100vh", padding:70 }}>
      <div style={{ fontSize:56, fontWeight:900 }}>Customer Service Wheel</div>
      <div style={{ fontSize:24, color:"#4b5563", marginTop:12 }}>Customer questions come throughout the journey, then are handled by CS, AI, OCy and QA depending on the case.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:14, marginTop:36 }}>
        {[
          ["1","Pre-sales","Products, shipping, warranty, special requests, payment, technical issues, coupons.",["CS","AI"]],
          ["2","Change Order","Address, item, inscription, shipping method.",["CS"]],
          ["3","WISMO","Late supplier, late, on time, lost, DNR, returned to sender.",["CS","AI","OCy"]],
          ["4","Item Received","Damaged, not satisfied, production mistake, customer mistake.",["CS","QA"]],
          ["5","Other","Account issues, collaboration, spam.",["CS"]]
        ].map(([num,title,text,teams]) => <div key={title} style={{ border:"1px solid #e5e7eb", borderRadius:22, padding:20, background:"#fff" }}>
          <div style={{ width:40, height:40, borderRadius:"50%", background:"#2563eb", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900 }}>{num}</div>
          <div style={{ fontSize:22, fontWeight:900, marginTop:14 }}>{title}</div>
          <div style={{ color:"#4b5563", lineHeight:1.6, marginTop:10 }}>{text}</div>
          <div style={{ marginTop:14 }}>{teams.map((t) => <TeamBadge key={t} label={t} />)}</div>
        </div>)}
      </div>
      <Box><div style={{ fontSize:30, fontWeight:900 }}>Proactive communication</div><Bullets items={["OOS and potential mistakes: proactive alerts before the customer complains.","Payment issues: monitoring and customer follow-up.","Late supplier, upgrade, shipping issue and ETA-1: automatic or semi-automatic campaigns."]} /></Box>
    </section>

    <section id="cart" style={{ minHeight:"100vh", padding:70 }}>
      <div style={{ fontSize:56, fontWeight:900 }}>Cart Optimization</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:36, alignItems:"center", marginTop:36 }}>
        <img src="/team/cart-optimization.jpg" style={{ width:"100%", maxHeight:520, objectFit:"contain", borderRadius:24, background:"#fff" }} alt="Cart Optimization" />
        <div><div style={{ fontSize:30, fontWeight:900 }}>Why it matters</div><Bullets items={["Cart Optimization focuses on improving conversion and order quality.","The team helps reduce friction before the order becomes a customer-care issue.","Better cart experience means fewer mistakes, fewer contacts, and higher satisfaction.","It connects customer behavior, checkout experience and operational outcomes."]} /></div>
      </div>
    </section>

    <section id="trustpilot" style={{ minHeight:"100vh", padding:70 }}>
      <div style={{ fontSize:56, fontWeight:900 }}>Trustpilot reviews</div>
      <div style={{ fontSize:24, color:"#4b5563", marginTop:12 }}>Click a review to display it large, full screen.</div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:18, marginTop:34 }}>
        {["tp1.jpg","tp2.jpg","tp3.jpg","tp4.jpg","tp5.jpg","tp6.jpg"].map((img, index) => (
          <button
            key={img}
            onClick={() => setSelectedTpReview(img)}
            style={{
              background:"#fff",
              border:"1px solid #e5e7eb",
              borderRadius:22,
              padding:28,
              cursor:"pointer",
              textAlign:"left",
              boxShadow:"0 10px 24px rgba(15,23,42,0.08)"
            }}
          >
            <div style={{ fontSize:28, fontWeight:900 }}>Avis TrustPilot {index + 1}</div>
            <div style={{ marginTop:10, color:"#64748b", lineHeight:1.6 }}>Click to enlarge</div>
          </button>
        ))}
      </div>

      {selectedTpReview && (
        <div
          onClick={() => setSelectedTpReview(null)}
          style={{
            position:"fixed",
            inset:0,
            background:"rgba(15,23,42,0.92)",
            zIndex:9999,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            padding:40,
            cursor:"zoom-out"
          }}
        >
          <button
            onClick={() => setSelectedTpReview(null)}
            style={{
              position:"absolute",
              top:24,
              right:28,
              background:"#fff",
              color:"#111827",
              border:"none",
              borderRadius:999,
              width:46,
              height:46,
              fontSize:24,
              fontWeight:900,
              cursor:"pointer"
            }}
          >
            ×
          </button>
          <img
            src={"/team/" + selectedTpReview}
            alt={selectedTpReview}
            style={{
              maxWidth:"92vw",
              maxHeight:"88vh",
              objectFit:"contain",
              borderRadius:22,
              background:"#fff",
              boxShadow:"0 25px 60px rgba(0,0,0,0.35)"
            }}
          />
        </div>
      )}

      <Box><div style={{ fontSize:28, fontWeight:900 }}>What a good reply should show</div><Pill>Empathy</Pill><Pill>Ownership</Pill><Pill>Clear next step</Pill><Pill>No defensive tone</Pill></Box>
    </section>

    <section id="final" style={{ minHeight:"100vh", padding:70 }}>
      <div style={{ fontSize:56, fontWeight:900 }}>Final note</div>
      <div style={{ fontSize:28, lineHeight:1.6, marginTop:24, maxWidth:1000 }}>The cooperation between our departments is a big part of our success in giving a high-quality and personal service to our customers.</div>
      <div style={{ fontSize:24, color:"#4b5563", lineHeight:1.6, marginTop:24 }}>Everything you should know about Customer Care is available in our Customer Care Hub.</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:18, marginTop:40 }}>
        <SafeTeamImage src="/team/team1.jpg" alt="Team 1" />
        <SafeTeamImage src="/team/team2.jpg" alt="Team 2" />
        <SafeTeamImage src="/team/team3.jpg" alt="Team 3" />
        <SafeTeamImage src="/team/team4.jpg" alt="Team 4" />
        <SafeTeamImage src="/team/team5.jpg" alt="Team 5" />
      </div>
    </section>

    <section id="quiz" style={{ minHeight:"100vh", padding:70 }}>
      <div style={{ fontSize:56, fontWeight:900 }}>Quick quiz</div>
      <div style={{ fontSize:24, color:"#4b5563", marginTop:12 }}>Click each question to reveal the answer.</div>
      <div style={{ marginTop:34, maxWidth:900 }}>{QUIZ.map(([q, a]) => <Reveal key={q} q={q} a={a} />)}</div>

      <Box>
        <div style={{ fontSize:28, fontWeight:900 }}>Final case — customer escalation 😬</div>
        <div style={{ marginTop:12, color:"#64748b", fontWeight:800 }}>Read the email, discuss as a group, then reveal the expected handling.</div>

        <div style={{
          marginTop:18,
          background:"#f8fafc",
          border:"1px solid #cbd5e1",
          borderRadius:18,
          overflow:"hidden",
          boxShadow:"0 12px 28px rgba(15,23,42,0.08)"
        }}>
          <div style={{ background:"#0f172a", color:"#fff", padding:"12px 18px", display:"flex", gap:10, alignItems:"center" }}>
            <span style={{ width:12, height:12, borderRadius:"50%", background:"#ef4444", display:"inline-block" }} />
            <span style={{ width:12, height:12, borderRadius:"50%", background:"#f59e0b", display:"inline-block" }} />
            <span style={{ width:12, height:12, borderRadius:"50%", background:"#22c55e", display:"inline-block" }} />
            <span style={{ marginLeft:12, fontWeight:900 }}>Customer email</span>
          </div>

          <div style={{ padding:22, background:"#fff" }}>
            <div style={{ display:"grid", gridTemplateColumns:"90px 1fr", gap:8, color:"#475569", marginBottom:8 }}>
              <b>From:</b><span>angry.customer@email.com</span>
              <b>To:</b><span>Yves Rocher Customer Service</span>
              <b>Subject:</b><span style={{ color:"#b91c1c", fontWeight:900 }}>Extremely disappointed with my order</span>
            </div>

            <div style={{ borderTop:"1px solid #e5e7eb", marginTop:16, paddingTop:16, lineHeight:1.8, color:"#111827", fontSize:18 }}>
              Hi,<br/><br/>
              My order is already late, and now it finally arrived completely broken.<br/><br/>
              This was supposed to be a gift, and now I have nothing to give. I am really angry and disappointed.<br/><br/>
              If I do not get a serious solution quickly, I will post everywhere — Instagram, Facebook and Trustpilot.<br/><br/>
              I expect someone to take this seriously.
            </div>
          </div>
        </div>

        <div style={{ marginTop:20, fontSize:24, fontWeight:900 }}>Question: how should we handle this case?</div>

        <button
          onClick={() => setFinalCaseReveal(!finalCaseReveal)}
          style={{ marginTop:14, background:"#2563eb", color:"#fff", border:"none", borderRadius:14, padding:"12px 16px", fontWeight:900, cursor:"pointer" }}
        >
          {finalCaseReveal ? "Hide answer" : "Show expected answer"}
        </button>

        {finalCaseReveal && (
          <div style={{ marginTop:18 }}>
            <Bullets items={[
              "Stay calm and start with strong empathy.",
              "Acknowledge both issues clearly: the order is late and the item arrived damaged.",
              "Take ownership and explain that we will handle it as a priority.",
              "Move the social/public part to private message while keeping the public tone polite.",
              "Ask for or review photos and order details.",
              "Escalate because this is a high-risk case: delay + damage + public threat.",
              "Offer the right solution according to policy: replacement or refund, and consider a gesture if delay and damage are confirmed."
            ]} />
          </div>
        )}
      </Box>
    </section>
  </div>;
}





function SlideDeck({ title, subtitle, slides, sourceUrl }) {
  const [current, setCurrent] = useState(0);
  const slide = slides[current];

  return (
    <Box>
      <div style={{ display:"flex", justifyContent:"space-between", gap:18, alignItems:"flex-start", flexWrap:"wrap" }}>
        <div>
          <h2 style={{ fontSize:30, margin:"0 0 6px" }}>{title}</h2>
          <div style={{ color:"#4b5563", lineHeight:1.7 }}>{subtitle}</div>
        </div>
        {sourceUrl && <a href={sourceUrl} target="_blank" rel="noreferrer" style={{ background:"#0f172a", color:"#fff", padding:"10px 14px", borderRadius:12, textDecoration:"none", fontWeight:900 }}>Open PPTX</a>}
      </div>

      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:18 }}>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            style={{
              border:"none",
              borderRadius:999,
              padding:"8px 12px",
              cursor:"pointer",
              fontWeight:900,
              background: index === current ? "#1d4ed8" : "#e5e7eb",
              color: index === current ? "#fff" : "#111827"
            }}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <div style={{ marginTop:22, background:"#111827", borderRadius:20, padding:14 }}>
        <img src={slide} alt={`${title} slide ${current + 1}`} style={{ width:"100%", borderRadius:14, display:"block", background:"#fff" }} />
      </div>

      <div style={{ display:"flex", justifyContent:"space-between", gap:12, marginTop:16 }}>
        <button onClick={() => setCurrent(Math.max(0, current - 1))} style={{ padding:"10px 14px", borderRadius:12, border:"none", background:"#e5e7eb", fontWeight:900, cursor:"pointer" }}>Previous</button>
        <div style={{ fontWeight:900, color:"#4b5563", alignSelf:"center" }}>Slide {current + 1} / {slides.length}</div>
        <button onClick={() => setCurrent(Math.min(slides.length - 1, current + 1))} style={{ padding:"10px 14px", borderRadius:12, border:"none", background:"#1d4ed8", color:"#fff", fontWeight:900, cursor:"pointer" }}>Next</button>
      </div>
    </Box>
  );
}

function SocialPage() {
  return (
    <>
      <h1 style={{ fontSize:40 }}>Social</h1>
      <Box>
        <div style={{ fontSize:28, fontWeight:900 }}>Social training & customer debrief</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
          NapoleonCat is for public comments only. DMs and private case handling remain in Kustomer.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(260px, 1fr))", gap:18, marginTop:22 }}>
          <button onClick={() => document.getElementById("napoleoncat-training")?.scrollIntoView({ behavior:"smooth" })} style={{ background:"#0f766e", color:"#fff", border:"none", borderRadius:20, padding:24, textAlign:"left", cursor:"pointer", fontWeight:900 }}>
            <div style={{ fontSize:24 }}>NapoleonCat Training</div>
            <div style={{ marginTop:8, opacity:.9 }}>Public comments management</div>
          </button>
          <button onClick={() => setTimeout(() => window.dispatchEvent(new CustomEvent("openDebriefFromSocial")), 0)} style={{ background:"#7c3aed", color:"#fff", border:"none", borderRadius:20, padding:24, textAlign:"left", cursor:"pointer", fontWeight:900 }}>
            <div style={{ fontSize:24 }}>Debrief from Customer Service</div>
            <div style={{ marginTop:8, opacity:.9 }}>Open Debriefs menu</div>
          </button>
        </div>
      </Box>
      <div id="napoleoncat-training">
        <SlideDeck title="NapoleonCat Training" subtitle="Public comments management for Theograce, Oak & Luna, MYKA, Lime & Lou" slides={NAPOLEONCAT_SLIDES} sourceUrl="/docs/NapoleonCat_Training_Public_Comments_EN_Updated.pptx" />
      </div>
    </>
  );
}

function DebriefsPage() {
  const [deck, setDeck] = useState("customer");
  useEffect(() => {
    const handler = () => setDeck("customer");
    window.addEventListener("openDebriefFromSocial", handler);
    return () => window.removeEventListener("openDebriefFromSocial", handler);
  }, []);

  const decks = [
    { id:"customer", name:"Debriefs Customer", slides:DEBRIEF_SLIDES, sourceUrl:null, subtitle:"Event-by-event Customer Service debrief slides since 2024." }
  ];
  const selected = decks.find((item) => item.id === deck) || decks[0];

  return (
    <>
      <h1 style={{ fontSize:40 }}>Debriefs</h1>
      <Box>
        <div style={{ fontSize:28, fontWeight:900 }}>Event debrief library</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
          Keep all debrief decks in one place. Use the menu to switch between events/decks.
        </div>
        <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginTop:18 }}>
          {decks.map((item) => (
            <button key={item.id} onClick={() => setDeck(item.id)} style={{ background:selected.id === item.id ? "#1d4ed8" : "#e5e7eb", color:selected.id === item.id ? "#fff" : "#111827", border:"none", borderRadius:999, padding:"10px 14px", fontWeight:900, cursor:"pointer" }}>
              {item.name}
            </button>
          ))}
        </div>
      </Box>
      <SlideDeck title={selected.name} subtitle={selected.subtitle} slides={selected.slides} sourceUrl={selected.sourceUrl} />
    </>
  );
}

function ProdIssuesPage() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const ADMIN_PASSWORD = "YRFinance";

  const [issues, setIssues] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [author, setAuthor] = useState("");
  const [creatorKey, setCreatorKey] = useState("");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [adminInput, setAdminInput] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ issue_date:"", author:"", title:"", description:"" });

  useEffect(() => {
    const savedAuthor = typeof window !== "undefined" ? localStorage.getItem("prod_issues_author") || "" : "";
    let savedCreatorKey = typeof window !== "undefined" ? localStorage.getItem("prod_issues_creator_key") || "" : "";

    if (!savedCreatorKey && typeof window !== "undefined") {
      savedCreatorKey = "creator-" + Date.now() + "-" + Math.random().toString(36).slice(2);
      localStorage.setItem("prod_issues_creator_key", savedCreatorKey);
    }

    setAuthor(savedAuthor);
    setCreatorKey(savedCreatorKey);
    loadIssues();
  }, []);

  async function supabaseRequest(path, options = {}) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Missing Vercel env vars NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...(options.headers || {})
      }
    });

    if (!res.ok) throw new Error(await res.text());
    if (res.status === 204) return null;
    return res.json();
  }

  async function loadIssues() {
    try {
      setStatus("Loading shared issues...");
      const rows = await supabaseRequest("prod_issues?select=*&order=issue_date.desc,created_at.desc");
      setIssues(Array.isArray(rows) ? rows : []);
      setStatus("");
    } catch (error) {
      setStatus("Load failed: " + error.message);
    }
  }

  async function uploadAttachment(file) {
    if (!file) return null;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}-${safeName}`;

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/prod-issues/${path}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false"
      },
      body: file
    });

    if (!res.ok) throw new Error(await res.text());
    return { attachment_name: file.name, attachment_path: path };
  }

  function attachmentUrl(path) {
    if (!path || !SUPABASE_URL) return "";
    return `${SUPABASE_URL}/storage/v1/object/public/prod-issues/${path}`;
  }

  function canEdit(issue) {
    return isAdmin || (issue.creator_key && creatorKey && issue.creator_key === creatorKey);
  }

  async function submitIssue() {
    if (!date || !text.trim()) {
      setStatus("Date and problem description are required.");
      return;
    }

    try {
      setStatus("Saving shared issue...");
      if (typeof window !== "undefined") localStorage.setItem("prod_issues_author", author || "");

      const uploaded = await uploadAttachment(attachment);

      await supabaseRequest("prod_issues", {
        method: "POST",
        body: JSON.stringify({
          issue_date: date,
          author: author || "Unknown",
          creator_key: creatorKey,
          title: title || "",
          description: text.trim(),
          attachment_name: uploaded?.attachment_name || null,
          attachment_path: uploaded?.attachment_path || null
        })
      });

      setTitle("");
      setText("");
      setAttachment(null);
      setStatus("Issue saved and shared with everyone.");
      await loadIssues();
    } catch (error) {
      setStatus("Save failed: " + error.message);
    }
  }

  function startEdit(issue) {
    if (!canEdit(issue)) return;
    setEditingId(issue.id);
    setEditForm({
      issue_date: issue.issue_date || "",
      author: issue.author || "",
      title: issue.title || "",
      description: issue.description || ""
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({ issue_date:"", author:"", title:"", description:"" });
  }

  async function saveEdit(issue) {
    if (!canEdit(issue)) return;

    if (!editForm.issue_date || !editForm.description.trim()) {
      setStatus("Date and problem description are required.");
      return;
    }

    try {
      setStatus("Updating issue...");

      await supabaseRequest(`prod_issues?id=eq.${issue.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          issue_date: editForm.issue_date,
          author: editForm.author || "Unknown",
          title: editForm.title || "",
          description: editForm.description.trim(),
          updated_at: new Date().toISOString()
        })
      });

      setStatus("Issue updated.");
      cancelEdit();
      await loadIssues();
    } catch (error) {
      setStatus("Update failed: " + error.message);
    }
  }

  async function deleteIssue(id) {
    if (!isAdmin) return;
    if (!window.confirm("Delete this issue?")) return;

    try {
      setStatus("Deleting issue...");
      await supabaseRequest(`prod_issues?id=eq.${id}`, { method: "DELETE" });
      setIssues((prev) => prev.filter((issue) => issue.id !== id));
      setStatus("Issue deleted.");
    } catch (error) {
      setStatus("Delete failed: " + error.message);
    }
  }

  function loginAdmin() {
    if (adminInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAdminInput("");
      setStatus("Admin mode enabled.");
    } else {
      setStatus("Wrong admin password.");
    }
  }

  const filtered = issues.filter((issue) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return [issue.issue_date, issue.author, issue.title, issue.description, issue.attachment_name].some((value) => String(value || "").toLowerCase().includes(q));
  });

  return (
    <>
      <h1 style={{ fontSize:40 }}>Prod Issues</h1>

      <Box>
        <div style={{ fontSize:28, fontWeight:900 }}>Add production issue</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
          Shared production memory. Everyone sees the same issues because data is stored in Supabase.
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:14, marginTop:18 }}>
          <div>
            <div style={{ fontWeight:900, marginBottom:8 }}>Date</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width:"100%", padding:12, borderRadius:12, border:"1px solid #cbd5e1" }} />
          </div>
          <div>
            <div style={{ fontWeight:900, marginBottom:8 }}>Your name</div>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Example: Bruno" style={{ width:"100%", padding:12, borderRadius:12, border:"1px solid #cbd5e1", boxSizing:"border-box" }} />
          </div>
        </div>

        <div style={{ marginTop:14 }}>
          <div style={{ fontWeight:900, marginBottom:8 }}>Short title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Example: wrong ETA on PDP" style={{ width:"100%", padding:12, borderRadius:12, border:"1px solid #cbd5e1", boxSizing:"border-box" }} />
        </div>

        <div style={{ marginTop:14 }}>
          <div style={{ fontWeight:900, marginBottom:8 }}>Problem description</div>
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Describe the production issue, impact, brand, supplier, workaround, customer impact, etc." style={{ width:"100%", minHeight:190, padding:14, borderRadius:12, border:"1px solid #cbd5e1", boxSizing:"border-box", lineHeight:1.6 }} />
        </div>

        <div style={{ marginTop:14 }}>
          <div style={{ fontWeight:900, marginBottom:8 }}>Attachment</div>
          <input type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} style={{ width:"100%", padding:12, borderRadius:12, border:"1px solid #cbd5e1", boxSizing:"border-box", background:"#f8fafc" }} />
          <div style={{ marginTop:6, color:"#64748b", fontSize:13 }}>Attachments can be added on creation. To replace an attachment later, create a new issue or ask admin.</div>
        </div>

        <button onClick={submitIssue} style={{ marginTop:16, background:"#15803d", color:"#fff", border:"none", borderRadius:12, padding:"12px 18px", fontWeight:900, cursor:"pointer" }}>
          Submit issue
        </button>

        {status && <div style={{ marginTop:14, color:status.includes("failed") || status.includes("Wrong") ? "#b91c1c" : "#15803d", fontWeight:900 }}>{status}</div>}
      </Box>

      <Box>
        <div style={{ display:"flex", justifyContent:"space-between", gap:14, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ fontSize:28, fontWeight:900 }}>Search issues</div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {isAdmin ? (
              <div style={{ color:"#15803d", fontWeight:900 }}>Admin mode</div>
            ) : (
              <>
                <input type="password" value={adminInput} onChange={(e) => setAdminInput(e.target.value)} placeholder="Admin password" style={{ padding:10, borderRadius:10, border:"1px solid #cbd5e1" }} />
                <button onClick={loginAdmin} style={{ background:"#0f172a", color:"#fff", border:"none", borderRadius:10, padding:"10px 12px", fontWeight:900, cursor:"pointer" }}>Admin</button>
              </>
            )}
          </div>
        </div>

        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by keyword, brand, supplier, date..." style={{ marginTop:14, width:"100%", padding:14, borderRadius:12, border:"1px solid #cbd5e1", boxSizing:"border-box" }} />
        <div style={{ marginTop:14, color:"#4b5563", fontWeight:900 }}>{filtered.length} result(s)</div>

        <div style={{ marginTop:12 }}>
          {filtered.map((issue) => {
            const editing = editingId === issue.id;
            const editable = canEdit(issue);

            return (
              <div key={issue.id} style={{ border:"1px solid #e5e7eb", borderRadius:16, padding:16, marginTop:12, background:"#fff" }}>
                {editing ? (
                  <>
                    <div style={{ display:"grid", gridTemplateColumns:"220px 1fr", gap:12 }}>
                      <div>
                        <div style={{ fontWeight:900, marginBottom:6 }}>Date</div>
                        <input type="date" value={editForm.issue_date} onChange={(e) => setEditForm({ ...editForm, issue_date:e.target.value })} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #cbd5e1" }} />
                      </div>
                      <div>
                        <div style={{ fontWeight:900, marginBottom:6 }}>Author</div>
                        <input value={editForm.author} onChange={(e) => setEditForm({ ...editForm, author:e.target.value })} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #cbd5e1", boxSizing:"border-box" }} />
                      </div>
                    </div>

                    <div style={{ marginTop:12 }}>
                      <div style={{ fontWeight:900, marginBottom:6 }}>Title</div>
                      <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title:e.target.value })} style={{ width:"100%", padding:10, borderRadius:10, border:"1px solid #cbd5e1", boxSizing:"border-box" }} />
                    </div>

                    <div style={{ marginTop:12 }}>
                      <div style={{ fontWeight:900, marginBottom:6 }}>Description</div>
                      <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description:e.target.value })} style={{ width:"100%", minHeight:150, padding:12, borderRadius:10, border:"1px solid #cbd5e1", boxSizing:"border-box", lineHeight:1.6 }} />
                    </div>

                    <div style={{ display:"flex", gap:10, marginTop:12 }}>
                      <button onClick={() => saveEdit(issue)} style={{ border:"none", background:"#15803d", color:"#fff", borderRadius:10, padding:"8px 12px", fontWeight:900, cursor:"pointer" }}>Save update</button>
                      <button onClick={cancelEdit} style={{ border:"none", background:"#e5e7eb", color:"#111827", borderRadius:10, padding:"8px 12px", fontWeight:900, cursor:"pointer" }}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
                      <div>
                        <div style={{ fontWeight:900, color:"#1d4ed8" }}>{issue.issue_date} · {issue.author || "Unknown"}</div>
                        <div style={{ marginTop:6, fontSize:22, fontWeight:900 }}>{issue.title || "Untitled issue"}</div>
                        {issue.updated_at && <div style={{ marginTop:5, color:"#64748b", fontSize:12, fontWeight:800 }}>Updated</div>}
                      </div>

                      <div style={{ display:"flex", gap:8, height:"fit-content" }}>
                        {editable && (
                          <button onClick={() => startEdit(issue)} style={{ border:"none", background:"#dbeafe", color:"#1d4ed8", borderRadius:10, padding:"6px 10px", fontWeight:900, cursor:"pointer" }}>
                            Update
                          </button>
                        )}

                        {isAdmin && (
                          <button onClick={() => deleteIssue(issue.id)} style={{ border:"none", background:"#fee2e2", color:"#991b1b", borderRadius:10, padding:"6px 10px", fontWeight:900, cursor:"pointer" }}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop:10, whiteSpace:"pre-wrap", lineHeight:1.7 }}>{issue.description}</div>

                    {issue.attachment_path && (
                      <a href={attachmentUrl(issue.attachment_path)} target="_blank" rel="noreferrer" style={{ display:"inline-block", marginTop:12, color:"#2563eb", fontWeight:900 }}>
                        Open attachment: {issue.attachment_name || "file"}
                      </a>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {!filtered.length && <div style={{ marginTop:16, color:"#6b7280" }}>No issue found.</div>}
        </div>
      </Box>
    </>
  );
}


function TrainingMenu() {
  return (
    <>
      <h1 style={{ fontSize:40 }}>Training</h1>

      <Box>
        <div style={{ fontSize:30, fontWeight:900 }}>Choose a training</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
          Open one of the available training presentations.
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, minmax(260px, 1fr))", gap:18, marginTop:24 }}>
          <button
            onClick={() => {
              const el = document.getElementById("training-orientation-deck");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              background:"#7c3aed",
              color:"#fff",
              border:"none",
              borderRadius:22,
              padding:28,
              textAlign:"left",
              cursor:"pointer",
              boxShadow:"0 14px 30px rgba(124,58,237,.25)"
            }}
          >
            <div style={{ fontSize:28, fontWeight:950 }}>TG ORIENTATION WEEK</div>
            <div style={{ marginTop:10, opacity:.9, lineHeight:1.6 }}>
              Customer Care 20-minute overview
            </div>
          </button>

          <button
            onClick={() => {
              window.location.href = "/training/ai-customer-service";
            }}
            style={{
              background:"#0f766e",
              color:"#fff",
              border:"none",
              borderRadius:22,
              padding:28,
              textAlign:"left",
              cursor:"pointer",
              boxShadow:"0 14px 30px rgba(15,118,110,.25)"
            }}
          >
            <div style={{ fontSize:28, fontWeight:950 }}>Prez AI in Customer Service</div>
            <div style={{ marginTop:10, opacity:.9, lineHeight:1.6 }}>
              AI at Work · Customer Service · Operations
            </div>
          </button>
        </div>
      </Box>

      <div id="training-orientation-deck" style={{ marginTop:30 }}>
        <TrainingSlides />
      </div>
    </>
  );
}


function QAIntroCoupons() {
  const couponDocs = [
    { label: "Open 2026 EVENTS coupons source", url: "/docs/2026-events-coupons-valid-01012027.xlsx" }
  ];

  return (
    <>
      <Box>
        <div style={{ fontSize:28, fontWeight:900 }}>QA Organization</div>
        <div style={{ marginTop:12, display:"grid", gridTemplateColumns:"260px 1fr", gap:14, alignItems:"stretch" }}>
          <div style={{ padding:18, borderRadius:16, background:"#eef2ff", border:"1px solid #c7d2fe" }}>
            <div style={{ fontSize:13, color:"#4338ca", fontWeight:900 }}>Lead</div>
            <div style={{ fontSize:26, fontWeight:950, marginTop:6 }}>Laurence</div>
            <div style={{ color:"#4b5563", marginTop:8, lineHeight:1.6 }}>Quality · Products · Factory · Insight</div>
          </div>
          <div style={{ padding:18, borderRadius:16, background:"#f0fdf4", border:"1px solid #bbf7d0" }}>
            <div style={{ fontSize:13, color:"#15803d", fontWeight:900 }}>Agents</div>
            <div style={{ fontSize:26, fontWeight:950, marginTop:6 }}>QA</div>
            <div style={{ color:"#4b5563", marginTop:8, lineHeight:1.6 }}>Handles QA cases, product checks, factory feedback and customer issue validation.</div>
          </div>
        </div>
      </Box>

      <Box>
        <div style={{ fontSize:28, fontWeight:900 }}>Coupons File</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>Codes that cannot be issued by the Coupon Generator.</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:12, marginTop:16 }}>
          {[
            ["TGRUS VIP", "$35"],
            ["TGRUS", "$50"],
            ["OAL", "$50"],
            ["LL", "50%"]
          ].map(([code, value]) => (
            <div key={code} style={{ padding:16, borderRadius:16, background:"#fff7ed", border:"1px solid #fed7aa" }}>
              <div style={{ color:"#9a3412", fontWeight:900, fontSize:13 }}>{code}</div>
              <div style={{ fontSize:30, fontWeight:950, marginTop:6 }}>{value}</div>
            </div>
          ))}
        </div>
        <DocumentButtons documents={couponDocs} />
      </Box>
    </>
  );
}

function SupplierInfo() {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  useEffect(() => {
    fetch("/data/suppliers.json")
      .then((res) => res.json())
      .then((data) => setSuppliers(Array.isArray(data) ? data : []))
      .catch(() => setSuppliers([]));
  }, []);

  const filteredSuppliers = suppliers.filter((supplier) => {
    const q = supplierSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(supplier.ID || "").toLowerCase().includes(q) ||
      String(supplier.SupName || "").toLowerCase().includes(q);

    const activeValue = Number(supplier.Active || 0);
    const matchesActive = !activeOnly || activeValue === 1;

    return matchesSearch && matchesActive;
  });

  const badge = (value, positiveLabel = "Yes", negativeLabel = "No") => {
    const isOn = Number(value || 0) === 1;
    return (
      <span style={{
        display: "inline-block",
        padding: "6px 10px",
        borderRadius: 999,
        background: isOn ? "#dcfce7" : "#fee2e2",
        color: isOn ? "#166534" : "#991b1b",
        fontWeight: 900,
        fontSize: 12
      }}>
        {isOn ? positiveLabel : negativeLabel}
      </span>
    );
  };

  return (
    <>
      <h1 style={{ fontSize: 40 }}>Supplier Info</h1>

      <Box>
        <div style={{ fontSize: 24, fontWeight: 900 }}>QA supplier reference</div>
        <div style={{ marginTop: 10, color: "#4b5563", lineHeight: 1.7 }}>
          Search suppliers by ID or name. This list comes from <b>/public/data/suppliers.json</b>.
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 18, alignItems: "center", flexWrap: "wrap" }}>
          <input
            value={supplierSearch}
            onChange={(e) => setSupplierSearch(e.target.value)}
            placeholder="Search supplier ID or name..."
            style={{ flex: 1, minWidth: 260, padding: 14, borderRadius: 12, border: "1px solid #d1d5db" }}
          />

          <button
            onClick={() => setActiveOnly(!activeOnly)}
            style={{
              background: activeOnly ? "#15803d" : "#eef2ff",
              color: activeOnly ? "#fff" : "#3730a3",
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              fontWeight: 900,
              cursor: "pointer"
            }}
          >
            {activeOnly ? "Showing active only" : "Show active only"}
          </button>
        </div>
      </Box>

      <Box>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900 }}>Suppliers</div>
          <div style={{ color: "#64748b", fontWeight: 800 }}>{filteredSuppliers.length} results</div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 18 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#64748b", borderBottom: "1px solid #e5e7eb" }}>
                <th style={{ padding: 12 }}>ID</th>
                <th style={{ padding: 12 }}>Supplier name</th>
                <th style={{ padding: 12 }}>Transfer</th>
                <th style={{ padding: 12 }}>Master</th>
                <th style={{ padding: 12 }}>Active</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier, index) => (
                <tr key={`${supplier.ID}-${supplier.SupName}-${index}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 12, fontWeight: 900 }}>{supplier.ID}</td>
                  <td style={{ padding: 12 }}>{supplier.SupName}</td>
                  <td style={{ padding: 12 }}>{badge(supplier.EnableTransfer)}</td>
                  <td style={{ padding: 12 }}>{badge(supplier.Master)}</td>
                  <td style={{ padding: 12 }}>{badge(supplier.Active, "Active", "Inactive")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Box>
    </>
  );
}


const AI_PROVIDER_COLORS = {
  openai: { name:"OpenAI", tool:"ChatGPT", icon:"◎", bg:"#ecfdf5", border:"#10A37F", text:"#065f46", dark:"#10A37F" },
  gemini: { name:"Google", tool:"Gemini", icon:"G✦", bg:"#eff6ff", border:"#4285F4", text:"#1d4ed8", dark:"#4285F4" },
  claude: { name:"Anthropic", tool:"Claude", icon:"C", bg:"#fff7ed", border:"#D97706", text:"#92400e", dark:"#D97706" },
  copilot: { name:"Microsoft", tool:"Copilot", icon:"M", bg:"#eff6ff", border:"#0078D4", text:"#075985", dark:"#0078D4" }
};

const AI_PLATFORM_ROWS = [
  ["Business Offer", "ChatGPT Business", "Gemini Business", "Claude Team", "Microsoft 365 Copilot"],
  ["Enterprise Offer", "ChatGPT Enterprise", "Gemini Enterprise", "Claude Enterprise", "Microsoft 365 Copilot / Copilot Studio"],
  ["Business Price", "~$25/user/month", "~$20-21/user/month*", "~$20-30/user/month", "~$30/user/month*"],
  ["Enterprise Price", "Custom quote", "~$45/user/month or custom*", "Custom quote", "Custom quote / Microsoft agreement"],
  ["Approx. Cost (100 users/year)", "~$30,000", "~$24,000-$25,200*", "~$24,000-$36,000", "~$36,000*"],
  ["Enterprise vs Business", "SSO, SCIM, audit logs, advanced security, higher limits and enterprise support", "Higher limits, governance controls, advanced security and Workspace administration", "Higher limits, governance, advanced administration and enterprise support", "Deep Microsoft 365 governance, Teams/Outlook/Excel integration and Copilot Studio agents"],
  ["GDPR Compliance", "Yes", "Yes", "Yes", "Yes"],
  ["Shared Company Data Used For Training", "No", "No", "No", "No"],
  ["Typical Negotiation Point", "Usually from ~100+ users", "Often through existing Google Workspace agreement", "Usually from ~100+ users", "Usually through Microsoft 365 enterprise agreement"],
  ["Best Fit", "Best all-rounder", "Best Google ecosystem", "Best for long documents", "Best Microsoft 365 ecosystem"],
  ["Main Strength", "Analysis, reporting, coding and content creation", "Native Gmail, Docs, Sheets, Drive and Meet integration", "Legal, HR, policies and long-document review", "Excel, PowerPoint, Outlook, Teams and enterprise workflows"]
];

const AI_DEPARTMENT_COMPARISON = [
  { department:"Customer Service", openai:"OpenAI ChatGPT", gemini:"OpenAI ChatGPT", copilot:"Microsoft Copilot", decision:"OpenAI ChatGPT", provider:"openai", why:"Best for conversational fluency, ticket analysis, SOP creation and fast response drafting." },
  { department:"Marketing", openai:"OpenAI ChatGPT", gemini:"OpenAI ChatGPT", copilot:"OpenAI ChatGPT", decision:"OpenAI ChatGPT", provider:"openai", why:"Strongest for campaign ideas, punchy copy, research summaries and image generation workflows." },
  { department:"Creative", openai:"OpenAI ChatGPT", gemini:"Anthropic Claude", copilot:"OpenAI ChatGPT", decision:"Anthropic Claude", provider:"claude", why:"Best for nuanced, natural writing; use ChatGPT as a complement when image generation is required." },
  { department:"Brand", openai:"Anthropic Claude", gemini:"Google Gemini", copilot:"Microsoft Copilot", decision:"Google Gemini", provider:"gemini", why:"Best when brand teams need Google Search context, Docs/Drive access and market visibility." },
  { department:"Legal & HR", openai:"Anthropic Claude", gemini:"Anthropic Claude", copilot:"Microsoft Copilot", decision:"Anthropic Claude", provider:"claude", why:"Strongest for long policies, contracts, HR documents and careful text review." },
  { department:"Finance", openai:"OpenAI ChatGPT", gemini:"OpenAI ChatGPT", copilot:"Microsoft Copilot", decision:"Microsoft Copilot", provider:"copilot", why:"Best for finance teams working heavily in Excel, PowerPoint, Outlook and Microsoft 365." },
  { department:"Operations / Factory", openai:"Google Gemini", gemini:"Google Gemini", copilot:"Microsoft Copilot", decision:"Google Gemini", provider:"gemini", why:"Best fit for Google Sheets, operational documents, visual schemas and large process logs." },
  { department:"Supply Chain", openai:"Google Gemini", gemini:"Google Gemini", copilot:"Microsoft Copilot", decision:"Google Gemini", provider:"gemini", why:"Best for collaborative planning and logistics workflows inside Google Workspace." },
  { department:"IT / Engineering", openai:"OpenAI ChatGPT", gemini:"Anthropic Claude", copilot:"Microsoft Copilot", decision:"Anthropic Claude", provider:"claude", why:"Strong for complex coding, debugging and technical reasoning; ChatGPT remains a strong all-round alternative." },
  { department:"Leadership", openai:"OpenAI ChatGPT", gemini:"OpenAI ChatGPT", copilot:"Microsoft Copilot", decision:"OpenAI ChatGPT", provider:"openai", why:"Best overall for decision support, executive summaries, analysis and market research workflows." }
];

const AI_CAPABILITIES_ROWS = [
  ["Chat", "✅ Excellent", "✅ Excellent", "✅ Excellent", "✅ Excellent"],
  ["Projects / Workspaces", "⭐ Mature Projects", "⚠️ Basic Workspace", "✅ Projects", "⚠️ Limited"],
  ["Custom AI Assistants", "⭐ GPTs", "⭐ Gems", "⚠️ Limited", "⚠️ Copilot Agents"],
  ["AI Agents", "⭐ Mature", "✅ Emerging", "⚠️ Basic", "⭐ Strong"],
  ["Knowledge Base", "⭐ Upload files & instructions", "⭐ Google Drive integration", "⭐ Large document context", "⭐ Microsoft 365 integration"],
  ["Web Research", "⭐ Deep Research", "⭐ Deep Research", "⚠️ Standard", "✅ Research Skills"],
  ["Document Analysis", "⭐ Excellent", "⭐ Excellent", "⭐ Best-in-class", "⭐ Excellent"],
  ["Image Generation", "⭐ Native", "⭐ Native", "❌ Not native", "⚠️ Via Designer"],
  ["Coding & Automation", "⭐ Excellent", "✅ Strong", "⭐ Excellent", "✅ Strong"],
  ["Excel / Sheets Analysis", "⭐ Excellent", "⭐ Excellent", "⚠️ Good", "⭐ Best"],
  ["PowerPoint Creation", "⚠️ Manual", "⚠️ Manual", "❌", "⭐ Best"],
  ["Google Workspace Integration", "⚠️ Limited", "⭐ Native", "❌", "❌"],
  ["Microsoft 365 Integration", "⚠️ Limited", "❌", "❌", "⭐ Native"]
];

const AI_CAPABILITY_EXPLAINERS = [
  {
    provider:"openai",
    title:"OpenAI – GPTs & Agents",
    items:["Chat: classic conversations", "Projects: workspace with files, instructions and memory", "GPTs: specialized assistants such as Customer Service GPT, HR GPT or Finance GPT", "Agents: execute actions, research and multi-step workflows"]
  },
  {
    provider:"gemini",
    title:"Google – Gems & Workspace",
    items:["Chat: Gemini Chat", "Workspace: Gmail, Docs, Sheets and Drive", "Gems: personalized assistants", "Agents: progressively deployed inside the Google ecosystem"]
  },
  {
    provider:"claude",
    title:"Anthropic – Claude Projects",
    items:["Chat: Claude Chat", "Projects: collaborative workspaces", "Custom Assistants: more limited than GPTs or Gems", "Agents: less developed today for standard business users"]
  },
  {
    provider:"copilot",
    title:"Microsoft – Copilot",
    items:["Chat: Copilot Chat", "Microsoft 365 Copilot: Outlook, Excel, Word, PowerPoint and Teams", "Copilot Agents: business workflow automation", "Agents: very strong inside the Microsoft ecosystem"]
  }
];

function ProviderBadge({ provider, label }) {
  const p = AI_PROVIDER_COLORS[provider] || AI_PROVIDER_COLORS.openai;
  return <span style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"7px 11px", borderRadius:999, background:p.bg, color:p.text, border:`1px solid ${p.border}`, fontWeight:950, whiteSpace:"nowrap" }}>
    <span style={{ width:22, height:22, borderRadius:"50%", background:p.dark, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:950 }}>{p.icon}</span>
    {label || `${p.name} ${p.tool}`}
  </span>;
}

function ProviderCard({ provider, title, children }) {
  const p = AI_PROVIDER_COLORS[provider] || AI_PROVIDER_COLORS.openai;
  return <div style={{ background:p.bg, border:`1px solid ${p.border}`, borderRadius:18, padding:18 }}>
    <ProviderBadge provider={provider} label={title} />
    <div style={{ marginTop:10, color:"#374151", lineHeight:1.65 }}>{children}</div>
  </div>;
}

function DepartmentDecisionTable({ rows }) {
  return (
    <div style={{ overflowX:"auto", marginTop:18 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff" }}>
        <thead>
          <tr style={{ textAlign:"left", color:"#475569", borderBottom:"1px solid #e5e7eb" }}>
            {["Department", "OpenAI view", "Gemini analysis", "Copilot angle", "Final decision", "Why"].map((h) => <th key={h} style={{ padding:"14px 12px", fontSize:14 }}>{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const p = AI_PROVIDER_COLORS[row.provider] || AI_PROVIDER_COLORS.openai;
            return (
              <tr key={row.department} style={{ borderBottom:"1px solid #f1f5f9" }}>
                <td style={{ padding:"14px 12px", fontWeight:950, color:"#111827" }}>{row.department}</td>
                <td style={{ padding:"14px 12px", color:"#374151", fontWeight:700 }}>{row.openai}</td>
                <td style={{ padding:"14px 12px", color:"#374151", fontWeight:700 }}>{row.gemini}</td>
                <td style={{ padding:"14px 12px", color:"#374151", fontWeight:700 }}>{row.copilot}</td>
                <td style={{ padding:"14px 12px", background:p.bg, borderLeft:`6px solid ${p.border}` }}><ProviderBadge provider={row.provider} label={row.decision} /></td>
                <td style={{ padding:"14px 12px", color:"#374151", lineHeight:1.5 }}>{row.why}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FeatureComparisonTable({ rows }) {
  const providers = ["openai", "gemini", "claude", "copilot"];
  return (
    <div style={{ overflowX:"auto", marginTop:18 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff" }}>
        <thead>
          <tr style={{ textAlign:"left", color:"#475569", borderBottom:"1px solid #e5e7eb" }}>
            <th style={{ padding:"14px 12px", fontSize:14 }}>Capability</th>
            {providers.map((provider) => {
              const p = AI_PROVIDER_COLORS[provider];
              return <th key={provider} style={{ padding:"14px 12px", fontSize:14, color:p.text, borderTop:`4px solid ${p.border}` }}>{p.name} ({p.tool})</th>;
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[0]} style={{ borderBottom:"1px solid #f1f5f9" }}>
              <td style={{ padding:"14px 12px", fontWeight:950, color:"#111827" }}>{row[0]}</td>
              {providers.map((provider, index) => {
                const p = AI_PROVIDER_COLORS[provider];
                return <td key={provider} style={{ padding:"14px 12px", color:"#374151", lineHeight:1.55, background:p.bg, borderLeft:`4px solid ${p.border}`, fontWeight:800 }}>{row[index + 1]}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SimpleTable({ headers, rows }) {
  return (
    <div style={{ overflowX:"auto", marginTop:18 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", background:"#fff" }}>
        <thead>
          <tr style={{ textAlign:"left", color:"#475569", borderBottom:"1px solid #e5e7eb" }}>
            {headers.map((header) => <th key={header} style={{ padding:"14px 12px", fontSize:14 }}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} style={{ borderBottom:"1px solid #f1f5f9" }}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} style={{ padding:"14px 12px", fontWeight:cellIndex === 0 ? 900 : 700, color:cellIndex === 0 ? "#111827" : "#374151", lineHeight:1.5 }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AnalysisPage({ setPage }) {
  return (
    <>
      <h1 style={{ fontSize:40 }}>Analysis</h1>
      <Box>
        <div style={{ fontSize:30, fontWeight:900 }}>Business Analysis Library</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
          Short, clear and decision-ready benchmarks for managers and teams.
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3, minmax(240px, 1fr))", gap:16, marginTop:22 }}>
          <SmallCard title="AI Comparison" text="Price, GDPR, plans and best AI by department" onClick={() => { window.location.hash = "analysis-ai-comparison"; setPage("AI Comparison"); }} />
        </div>
      </Box>
    </>
  );
}

function AIComparisonPage({ setPage }) {
  const directUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}#analysis-ai-comparison` : "";

  return (
    <>
      <button onClick={() => { window.location.hash = "analysis"; setPage("Analysis"); }} style={{ background:"#e5e7eb", color:"#111827", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:900, cursor:"pointer", marginBottom:14 }}>
        ← Back to Analysis
      </button>

      <h1 style={{ fontSize:40 }}>AI Comparison</h1>

      <Box>
        <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start", flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:30, fontWeight:900 }}>Price, GDPR & Comparison</div>
            <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
              Quick executive view of ChatGPT, Gemini, Claude and Microsoft Copilot: exact offer names, pricing idea, GDPR status, shared company data and key strengths.
            </div>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <Pill>GDPR ready</Pill>
            <Pill>Google accounts available</Pill>
            <Pill>Business benchmark</Pill>
            <button onClick={() => navigator.clipboard.writeText(directUrl)} style={{ background:"#111827", color:"#fff", border:"none", borderRadius:999, padding:"8px 12px", cursor:"pointer", fontWeight:800, fontSize:13 }}>Copy direct URL</button>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginTop:18 }}>
          <ProviderCard provider="openai" title="OpenAI · ChatGPT">
            Best all-rounder for analysis, reporting, content, coding, custom GPTs and business support.
          </ProviderCard>
          <ProviderCard provider="gemini" title="Google · Gemini">
            Best value when employees already work daily in Gmail, Docs, Drive, Sheets, Slides and Meet.
          </ProviderCard>
          <ProviderCard provider="claude" title="Anthropic · Claude">
            Best specialist for long documents, legal, HR, policies, nuanced writing and complex reasoning.
          </ProviderCard>
          <ProviderCard provider="copilot" title="Microsoft · Copilot">
            Best specialist for Microsoft 365 users: Outlook, Teams, Excel, PowerPoint and Copilot Agents.
          </ProviderCard>
        </div>

        <SimpleTable headers={["Criteria", "OpenAI ChatGPT", "Google Gemini", "Anthropic Claude", "Microsoft Copilot"]} rows={AI_PLATFORM_ROWS} />

        <div style={{ marginTop:14, color:"#64748b", lineHeight:1.7, fontSize:14 }}>
          <b>Shared company data = No</b> means company prompts, files, spreadsheets and documents are not used to train public AI models when using Business or Enterprise plans.
          <br /><br />
          <b>Enterprise vs Business:</b> Enterprise plans mainly add security, governance, SSO, SCIM, audit logs, compliance features, higher usage limits and dedicated enterprise support. For most employees, the AI capabilities themselves are very similar.
          <br /><br />
          <b>Volume discounts:</b> available for all vendors but negotiated individually and not publicly disclosed. Gemini pricing depends on the Google Workspace agreement already in place.
        </div>
      </Box>

      <Box>
        <div style={{ fontSize:30, fontWeight:900 }}>Best AI by Department</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
          Comparison between the OpenAI view, Gemini analysis and Copilot angle, with a color-coded final decision for each department.
        </div>
        <DepartmentDecisionTable rows={AI_DEPARTMENT_COMPARISON} />
      </Box>

      <Box>
        <div style={{ fontSize:30, fontWeight:900 }}>AI Capabilities Comparison</div>
        <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>
          Quick comparison of the main usage modes: Chat, Projects / Workspaces, GPTs / Gems / Copilot Agents and AI Agents.
        </div>
        <FeatureComparisonTable rows={AI_CAPABILITIES_ROWS} />
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginTop:18 }}>
          {AI_CAPABILITY_EXPLAINERS.map((item) => {
            const p = AI_PROVIDER_COLORS[item.provider];
            return (
              <div key={item.title} style={{ background:p.bg, border:`1px solid ${p.border}`, borderRadius:18, padding:18 }}>
                <ProviderBadge provider={item.provider} label={item.title} />
                <ul style={{ marginTop:12, paddingLeft:18, color:"#374151", lineHeight:1.7 }}>
                  {item.items.map((x) => <li key={x}>{x}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      </Box>

      <Box>
        <div style={{ fontSize:28, fontWeight:900 }}>Recommended approach</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:14, marginTop:16 }}>
          <div style={{ background:AI_PROVIDER_COLORS.openai.bg, border:`1px solid ${AI_PROVIDER_COLORS.openai.border}`, borderRadius:18, padding:18 }}>
            <ProviderBadge provider="openai" label="OpenAI recommended approach" />
            <div style={{ marginTop:12, color:"#374151", lineHeight:1.8 }}>
              Use <b>ChatGPT Business</b> as the default platform for managers, analysts, marketing, customer service and leadership. Move to <b>ChatGPT Enterprise</b> when IT requires SSO, SCIM, audit logs, higher limits or enterprise governance.
            </div>
          </div>
          <div style={{ background:AI_PROVIDER_COLORS.gemini.bg, border:`1px solid ${AI_PROVIDER_COLORS.gemini.border}`, borderRadius:18, padding:18 }}>
            <ProviderBadge provider="gemini" label="Google Gemini recommended approach" />
            <div style={{ marginTop:12, color:"#374151", lineHeight:1.8 }}>
              Use <b>Gemini Business</b> broadly if employees already work in Google Workspace. It is the easiest rollout for Gmail, Docs, Drive, Sheets and Meet users. Upgrade to <b>Gemini Enterprise</b> when governance, Workspace administration and higher usage limits become critical.
            </div>
          </div>
          <div style={{ background:AI_PROVIDER_COLORS.claude.bg, border:`1px solid ${AI_PROVIDER_COLORS.claude.border}`, borderRadius:18, padding:18 }}>
            <ProviderBadge provider="claude" label="Anthropic Claude recommended approach" />
            <div style={{ marginTop:12, color:"#374151", lineHeight:1.8 }}>
              Use <b>Claude Team</b> for Legal, HR, Brand and long-document review. Move to <b>Claude Enterprise</b> when advanced governance, higher limits and enterprise support are required.
            </div>
          </div>
          <div style={{ background:AI_PROVIDER_COLORS.copilot.bg, border:`1px solid ${AI_PROVIDER_COLORS.copilot.border}`, borderRadius:18, padding:18 }}>
            <ProviderBadge provider="copilot" label="Microsoft Copilot recommended approach" />
            <div style={{ marginTop:12, color:"#374151", lineHeight:1.8 }}>
              Use <b>Microsoft 365 Copilot</b> for finance, Excel power users, PowerPoint creation, Outlook, Teams and Microsoft-heavy departments. Add <b>Copilot Studio</b> for business agents and workflow automation.
            </div>
          </div>
        </div>
        <div style={{ marginTop:16, color:"#374151", lineHeight:1.8 }}>
          <b>Best-of-breed company setup:</b> Gemini for broad Google Workspace adoption, ChatGPT for power users and business execution, Claude for Legal / HR / Brand document review, and Copilot for Finance and Microsoft 365 power users.
        </div>
      </Box>
    </>
  );
}


export default function Home() {
  const [page, setPage] = useState("Home");
  const [question, setQuestion] = useState("");
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [logoOk, setLogoOk] = useState(true);

  useEffect(() => {
    const applyHashRoute = () => {
      if (typeof window === "undefined") return;
      const hash = window.location.hash.replace("#", "");
      if (hash === "analysis-ai-comparison") setPage("AI Comparison");
      if (hash === "analysis") setPage("Analysis");
      if (hash === "policies") setPage("Policies");
    };
    applyHashRoute();
    window.addEventListener("hashchange", applyHashRoute);
    return () => window.removeEventListener("hashchange", applyHashRoute);
  }, []);

  const answer = useMemo(() => assistantAnswer(question), [question]);
  const shineonItems = useMemo(() => SHINEON_PRODUCTS.map(normalizeProduct), []);

  const pageData = {
    Cases: CASES,
    Policies: POLICIES,
    CRM,
    Logistics: LOGISTICS,
    "QA Team": QA_TEAM,
    "AI Agents": AI_AGENTS
  };

  const searchableItems = useMemo(() => {
    const brandItems = BRANDS.map((x) => ({ type:"Brands", title:x.name, text:getText(x), openPage:"Brands" }));
    const eventItems = EVENTS.map((e) => ({ type:"Event", title:e.name, text:getText(e), openPage:"Events" }));
    const wismoLateSearch = WISMO_LATE.map((x) => ({ type:"WISMO Late Zoom", title:x.name, text:getText(x), openPage:"WISMO Late Zoom" }));
    const generic = Object.keys(pageData).flatMap((key) => pageData[key].map((x) => ({ type:key, title:x.name || x.title, text:getText(x), openPage:key })));
    const shineonSearch = shineonItems.map((x) => ({ type:"ShineOn Product", title:x.name, text:getText(x), openPage:"OCy" }));
    return brandItems.concat(generic).concat(eventItems).concat(wismoLateSearch).concat(shineonSearch);
  }, [shineonItems]);

  const filteredResults = useMemo(() => {
    if (!search.trim()) return searchableItems.slice(0, 10);
    const q = search.toLowerCase();
    return searchableItems.filter((item) => item.title.toLowerCase().includes(q) || item.text.toLowerCase().includes(q) || item.type.toLowerCase().includes(q));
  }, [search, searchableItems]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return shineonItems;
    const q = productSearch.toLowerCase();
    return shineonItems.filter((item) => item.name.toLowerCase().includes(q) || item.short.toLowerCase().includes(q) || (item.full || []).join(" ").toLowerCase().includes(q));
  }, [productSearch, shineonItems]);

  return <div style={{ display:"flex", minHeight:"100vh", background:"#f5f7fb", fontFamily:"Arial, sans-serif" }}>
    <aside style={{ width:250, background:"#0f172a", color:"#fff", padding:20, overflowY:"auto" }}>
      <div style={{ width:64, height:64, borderRadius:14, background:"#111827", display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800, marginBottom:12 }}>TG</div>
      <div style={{ fontSize:22, fontWeight:800 }}>Tenengroup</div>
      <div style={{ marginTop:6, opacity:0.75 }}>Customer Care Hub</div>
      <div style={{ marginTop:28 }}>{MENU.map((m) => {
          const special = m === "Training";
          const active = page === m;
          const bg = m === "Training"
            ? "#7c3aed"
            : active
              ? "#1d4ed8"
              : "transparent";
          const inactiveSpecialBg = m === "Yves Rocher Reporting"
            ? "rgba(21,128,61,.22)"
            : m === "Training"
              ? "rgba(124,58,237,.22)"
              : "transparent";
          return (
            <div
              key={m}
              onClick={() => {
                if (m === "Analysis") window.location.hash = "analysis";
                if (m === "Policies") window.location.hash = "policies";
                setPage(m);
              }}
              style={{
                padding:"12px 14px",
                borderRadius:10,
                cursor:"pointer",
                background: special ? bg : bg,
                marginBottom:8,
                fontWeight: special ? 900 : 600,
                border: special ? "1px solid rgba(255,255,255,.18)" : "none",
                boxShadow: active || special ? "0 8px 18px rgba(0,0,0,.16)" : "none"
              }}
            >
              {m}
            </div>
          );
        })}</div>
      <div style={{ marginTop:26, borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:16 }}>
        <div style={{ fontSize:12, opacity:0.7, marginBottom:10 }}>QUICK TOOLS</div>
        {QUICK_TOOLS.map((tool) => <div key={tool.name} style={{ marginBottom:10 }}><a href={tool.url} target="_blank" rel="noreferrer" style={{ color:"#dbeafe", textDecoration:"none" }}>{tool.name}</a></div>)}
      </div>
    </aside>

    <main style={{ flex:1, padding:24 }}>
      {page === "Home" && <>
        <div style={{ background:"#fff", border:"1px solid #e5e7eb", borderRadius:26, overflow:"hidden", display:"grid", gridTemplateColumns:"1.15fr 1fr", marginBottom:22 }}>
          <div style={{ background:"linear-gradient(135deg, #0f172a 0%, #111827 100%)", minHeight:340, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
            {logoOk ? <img src="/logo-hub.png" alt="Tenengroup hub logo" onError={() => setLogoOk(false)} style={{ maxWidth:"100%", maxHeight:280, objectFit:"contain", borderRadius:18 }} /> : <div style={{ color:"#fff", fontSize:26, fontWeight:800 }}>Tenengroup Customer Care Hub</div>}
          </div>
          <div style={{ padding:34, display:"flex", flexDirection:"column", justifyContent:"center" }}>
            <div style={{ color:"#2563eb", fontWeight:700, fontSize:18 }}>Welcome to</div>
            <div style={{ fontSize:54, fontWeight:900, marginTop:6 }}>TENENGROUP</div>
            <div style={{ fontSize:32, color:"#2563eb", marginTop:6 }}>Customer Care Hub</div>
            <div style={{ marginTop:18, lineHeight:1.7, fontSize:18, color:"#374151" }}>Policies, event playbooks, CRM definitions, brand tone of voice, logistics, social handling, QA, OCy / ShineOn, TheoGrace projects and new employee orientation.</div>
          </div>
        </div>


        <Box>
          <div style={{ fontSize:24, fontWeight:900 }}>⚡ Agent quick actions</div>
          <div style={{ marginTop:14, display:"flex", gap:10, flexWrap:"wrap" }}>
            <button onClick={() => setPage("WISMO Late Zoom")} style={{ background:"#2563eb", color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:800, cursor:"pointer" }}>WISMO Late</button>
            <button onClick={() => { setPage("Policies"); setSearch("damaged"); }} style={{ background:"#eef2ff", color:"#3730a3", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:800, cursor:"pointer" }}>Damaged</button>
            <button onClick={() => { setPage("Policies"); setSearch("not satisfied"); }} style={{ background:"#eef2ff", color:"#3730a3", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:800, cursor:"pointer" }}>Not Satisfied</button>
            <button onClick={() => { setPage("Policies"); setSearch("DNR"); }} style={{ background:"#eef2ff", color:"#3730a3", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:800, cursor:"pointer" }}>DNR</button>
            <button onClick={() => setPage("Social Policy")} style={{ background:"#eef2ff", color:"#3730a3", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:800, cursor:"pointer" }}>Social</button>
            <button onClick={() => setPage("Agent Tools")} style={{ background:"#111827", color:"#fff", border:"none", borderRadius:12, padding:"10px 14px", fontWeight:800, cursor:"pointer" }}>All Agent Tools</button>
          </div>
        </Box>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:16, marginBottom:22 }}>
          <SmallCard title="Training" text="20-minute CS overview" onClick={() => setPage("Training")} />
          <SmallCard title="Analysis" text="Business benchmarks and strategic studies" onClick={() => { window.location.hash = "analysis"; setPage("Analysis"); }} />
<SmallCard title="Brands" text="Logos, colors, tone of voice and brand reporting" onClick={() => setPage("Brands")} />
          <SmallCard
            title="TheoGrace Design Lab"
            text="Product page redesign concepts and Brand Theme mockups"
            onClick={() => {
              window.location.href = "/theograce-design-lab";
            }}
          />
          <SmallCard title="Social" text="NapoleonCat training and public comments" onClick={() => setPage("Social")} />
          <SmallCard title="Debriefs" text="Customer Service debrief decks" onClick={() => setPage("Debriefs")} />
          <SmallCard title="Prod Issues" text="Log production issues and search history" onClick={() => setPage("Prod Issues")} />

<SmallCard
  title="Theograce Weekly Reporting"
  text="CSAT, SLA, Conversations and YOY"
  onClick={() => {
    window.location.href = "/theograce/weekly-reporting";
  }}
/>

<SmallCard title="WISMO Late Zoom" text="Late policy and compensation logic" onClick={() => setPage("WISMO Late Zoom")} />
          <SmallCard title="QA Team" text="Escalations and quality checks" onClick={() => setPage("QA Team")} />
          <SmallCard title="OCy" text="Order Cycle and ShineOn rules" onClick={() => setPage("OCy")} />
          <SmallCard title="Social Policy" text="Facebook / Instagram" onClick={() => setPage("Social Policy")} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:18 }}>
          <Box>
            <div style={{ fontSize:26, fontWeight:800, marginBottom:14 }}>Global search</div>
            <input placeholder="Search everything..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width:"100%", padding:14, borderRadius:10, border:"1px solid #d1d5db", boxSizing:"border-box" }} />
            <div style={{ marginTop:18, display:"grid", gap:12 }}>{filteredResults.map((item) => <div key={item.type + item.title} onClick={() => setPage(item.openPage)} style={{ padding:14, border:"1px solid #e5e7eb", borderRadius:12, cursor:"pointer", background:"#fafafa" }}><div style={{ fontSize:12, color:"#4f46e5", fontWeight:700 }}>{item.type}</div><div style={{ fontSize:20, fontWeight:800, marginTop:4 }}>{item.title}</div><div style={{ color:"#4b5563", lineHeight:1.6, marginTop:6 }}>{item.text.slice(0,190)}...</div></div>)}</div>
          </Box>

          <Box>
            <div style={{ fontSize:26, fontWeight:800, marginBottom:14 }}>Assistant</div>
            <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Ask a question..." style={{ width:"100%", padding:14, borderRadius:10, border:"1px solid #d1d5db", boxSizing:"border-box" }} />
            <div style={{ marginTop:16, fontSize:22, fontWeight:800 }}>{answer.title}</div>
            <div style={{ marginTop:10, lineHeight:1.7, color:"#374151" }}>{answer.body}</div>
            <div style={{ marginTop:14 }}>{answer.tags.map((tag) => <TagChip key={tag} text={tag} />)}</div>
            <div style={{ marginTop:24, fontWeight:800 }}>Suggested questions</div>
            <div style={{ marginTop:12 }}>{SUGGESTED_QUESTIONS.map((q) => <div key={q} onClick={() => setQuestion(q)} style={{ padding:12, border:"1px solid #e5e7eb", borderRadius:12, marginBottom:10, cursor:"pointer", background:"#fff" }}>{q}</div>)}</div>
          </Box>
        </div>
      </>}

      {page === "Social" && <SocialPage />}
      {page === "Debriefs" && <DebriefsPage />}
      {page === "Prod Issues" && <ProdIssuesPage />}
      {page === "Training" && <TrainingMenu />}
      {page === "Analysis" && <AnalysisPage setPage={setPage} />}
      {page === "AI Comparison" && <AIComparisonPage setPage={setPage} />}




      {page === "Brands" && <>
        <h1 style={{ fontSize:40 }}>Brands</h1>
        <Box>
          <div style={{ fontSize:24, fontWeight:900 }}>Brand tone, colors and customer expectations</div>
          <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>Each brand has its own positioning, tone of voice and service expectations. Use this page before replying in sensitive or brand-specific cases.</div>
        </Box>
        {BRANDS.map((brand) => <BrandCard key={brand.id} brand={brand} />)}
      </>}

      {page === "WISMO Late Zoom" && <>
        <h1 style={{ fontSize:40 }}>WISMO Late Zoom — What do we do when an order is late?</h1>
        <AgentDecisionTool />

        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:16, marginBottom:22 }}>
          <Box><div style={{ fontSize:22, fontWeight:900 }}>1. Verify</div><div style={{ marginTop:8, color:"#4b5563" }}>ETA, order status, tracking, root cause.</div></Box>
          <Box><div style={{ fontSize:22, fontWeight:900 }}>2. Classify</div><div style={{ marginTop:8, color:"#4b5563" }}>Within ETA, under 3 days, over 3 days, major delay.</div></Box>
          <Box><div style={{ fontSize:22, fontWeight:900 }}>3. Decide</div><div style={{ marginTop:8, color:"#4b5563" }}>No gesture, coupon, shipping refund, replacement, refund.</div></Box>
          <Box><div style={{ fontSize:22, fontWeight:900 }}>4. Communicate</div><div style={{ marginTop:8, color:"#4b5563" }}>Empathy, ownership, verified update, next step.</div></Box>
        </div>

        <Box>
          <div style={{ fontSize:26, fontWeight:800 }}>Decision logic</div>
          <Bullets items={[
            "A late order is not automatically a compensation case.",
            "First identify whether the order is actually late compared to ETA.",
            "Then classify the delay and choose the appropriate action.",
            "The customer should always receive a clear update and a next step.",
            "The old 'Open Policies source folder' link was removed because it pointed to a folder and caused a 404."
          ]} />
          <DocumentButtons documents={[{ label: "Open WISMO full source", url: "/policies/wismo-full-source" }]} />
        </Box>

        {WISMO_LATE.map((x) => <WismoDecisionCard key={x.id} item={x} />)}
      </>}

      {Object.keys(pageData).includes(page) && <>
        <h1 style={{ fontSize:40 }}>{page}</h1>
        {page === "QA Team" && <QAIntroCoupons />}
        {pageData[page].map((x) => <ExpandableCard key={x.id} title={x.name || x.title} shortText={x.short} bullets={x.full} extraTitle={x.tone ? "Tone of voice" : null} extraItems={x.tone || null} wording={x.wording || null} documents={x.documents || null} />)}
        {page === "QA Team" && <SupplierInfo />}
      </>}
      {page === "OCy" && <>
        <h1 style={{ fontSize:40 }}>OCy / Order Cycle</h1>
        {OCY_TEAM.map((x) => <ExpandableCard key={x.id} title={x.name || x.title} shortText={x.short} bullets={x.full} />)}
        <Box>
          <div style={{ fontSize:28, fontWeight:800 }}>ShineOn Product Specifics</div>
          <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>Search product rules extracted from Product Name and Notes.</div>
          <input placeholder="Search product name or note..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} style={{ width:"100%", padding:14, borderRadius:10, border:"1px solid #d1d5db", boxSizing:"border-box", marginTop:14 }} />
        </Box>
        {filteredProducts.map((x) => <ExpandableCard key={x.id} title={x.name} shortText={x.short} bullets={x.full} />)}
      </>}


      {page === "Agent Tools" && <>
        <h1 style={{ fontSize:40 }}>Agent Tools — Case Resolution Engine</h1>
        <Box>
          <div style={{ fontSize:24, fontWeight:900 }}>Fast decision tools</div>
          <div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>Use these when you need an immediate action, compensation direction and copy-ready customer wording.</div>
        </Box>
        <AgentDecisionTool />
        <CaseDecisionTool type="damaged" />
        <CaseDecisionTool type="notSatisfied" />
        <CaseDecisionTool type="dnr" />
        <CaseDecisionTool type="changeOrder" />
      </>}

      {page === "Events" && <>
        <h1 style={{ fontSize:40 }}>Event prompts</h1>
        {EVENTS.map((e) => <Box key={e.id}><div style={{ fontSize:28, fontWeight:800 }}>{e.name}</div><div style={{ marginTop:10, color:"#4b5563", lineHeight:1.7 }}>{e.short}</div><DocumentButtons documents={e.documents} /><div style={{ marginTop:12, color:"#374151", lineHeight:1.7 }}>{e.intro}</div>{e.sections.map((section) => <div key={section.title} style={{ marginTop:20 }}><div style={{ fontWeight:800, marginBottom:8 }}>{section.title}</div><Bullets items={section.items} /></div>)}<div style={{ marginTop:18, fontWeight:800 }}>Suggested wording</div><div style={{ marginTop:8, fontStyle:"italic", color:"#374151", lineHeight:1.7 }}>{e.wording}</div></Box>)}
      </>}

      {page === "Q&A" && <>
        <h1 style={{ fontSize:40 }}>Q&A</h1>
        <Box>
          <div style={{ fontSize:24, fontWeight:800, marginBottom:12 }}>Ask the assistant</div>
          <input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Example: my order is late by 2 days" style={{ width:"100%", padding:14, borderRadius:10, border:"1px solid #ccc", boxSizing:"border-box" }} />
          <div style={{ marginTop:18 }}><div style={{ fontWeight:800, fontSize:24 }}>{answer.title}</div><div style={{ marginTop:12, lineHeight:1.7 }}>{answer.body}</div><div style={{ marginTop:12 }}>{answer.tags.map((tag) => <TagChip key={tag} text={tag} />)}</div></div>
        </Box>
      </>}
    </main>
  </div>;
}