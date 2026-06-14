
import Link from "next/link";

const pageStyle = { minHeight: "100vh", background: "#f3f6fb", padding: 28, fontFamily: "Arial, sans-serif", color: "#071225" };
const shell = { maxWidth: 1180, margin: "0 auto" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 22, boxShadow: "0 10px 30px rgba(15,23,42,0.06)", marginTop: 16 };
const p = { color: "#334155", lineHeight: 1.65, margin: "6px 0" };
const badge = { display: "inline-flex", borderRadius: 999, background: "#eef2ff", color: "#3730a3", padding: "7px 10px", fontWeight: 900, fontSize: 12, marginRight: 8, marginBottom: 8 };
const backButton = { display: "inline-block", background: "#0f172a", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "10px 14px", fontWeight: 900, marginBottom: 18 };
const sourceButton = { display: "inline-block", background: "#111827", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "10px 14px", fontWeight: 900, marginRight: 10, marginTop: 14 };

function BulletList({ items }) {
  return <ul style={{ margin: "8px 0 0 20px", color: "#334155", lineHeight: 1.7 }}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}
function Section({ title, children, color = "#2563eb" }) {
  return <div style={{ ...card, borderTop: `6px solid ${color}` }}><h2 style={{ fontSize: 24, fontWeight: 950, margin: "0 0 10px" }}>{title}</h2>{children}</div>;
}
function Header({ type, title, subtitle, color, sourceHref, sourceLabel }) {
  return (
    <>
      <Link href="/#policies" style={backButton}>← Back to Policies</Link>
      <div style={{ ...card, borderTop: `8px solid ${color}` }}>
        <span style={badge}>FULL SOURCE</span><span style={badge}>{type}</span>
        <h1 style={{ fontSize: 42, margin: "8px 0 6px", fontWeight: 950 }}>{title}</h1>
        <p style={p}>{subtitle}</p>
        {sourceHref && <a href={sourceHref} style={sourceButton} target="_blank" rel="noreferrer">{sourceLabel || "Open original source"}</a>}
      </div>
    </>
  );
}

export default function NotSatisfiedPolicyFullSource() {
  return (
    <main style={pageStyle}><div style={shell}>
      <Header type="ITEM RECEIVED" title="Not Satisfied Policy" color="#f59e0b" sourceHref="/docs/policies/not-satisfied-myka-tg.docx" sourceLabel="Open original Word file" subtitle="Use when the jewelry was produced correctly but the customer is not satisfied with design, font, thickness, quality, or similar preference-based issues." />
      <Section title="Scope" color="#f59e0b"><BulletList items={["Relevant for the first 100 days post ETA.", "Understand why the customer is not satisfied.", "For US, Canada, and UK customers, free returns are offered in all cases with a return label.", "Make sure the case is not our mistake or damage before applying NS policy."]} /></Section>
      <Section title="Policy" color="#2563eb"><BulletList items={["First offer an exchange to another item.", "If customer refuses exchange, offer store credit.", "Personalized items cannot be returned for a refund when the customer is simply not satisfied.", "Non-personalized / stock items may be eligible for refund if within 30 days from delivery/ETA.", "If customer used a coupon, it cannot be reapplied when the new item is more expensive.", "If the new item is cheaper, calculate price difference and coupon on the cheaper item."]} /></Section>
      <Section title="Premium vs Non-Premium Exchange" color="#7c3aed"><BulletList items={["Free exchange of a non-premium item applies only to another non-premium item.", "Premium item exchange applies to premium or non-premium items and covers up to US$20 price difference.", "Non-premium to premium exchange: customer must pay the price difference unless TL approval applies.", "Exchange is 1:1 only. One item cannot be replaced with two or more items."]} /></Section>
      <Section title="General Procedure" color="#0f766e"><BulletList items={["Ask for a picture and the customer’s explanation if not already provided.", "Confirm it is not our mistake or a damaged case.", "Flag Post Shipping in OM using the correct not satisfied dropdown reason.", "Send email and offer product exchange.", "If customer refuses, offer store credit.", "If item is non-personalized or stock, refund may be possible if within 30 days.", "Proceed based on the customer’s selected option."]} /></Section>
      <Section title="Exchange Procedure by Region" color="#b45309"><h3>US / Canada</h3><BulletList items={["Check the link/item ID from the customer or request all details for the new item.", "Escalate to the Shipping Coordinator to send return label and instructions.", "Only once the item is returned, premium and non-premium exchanges can proceed."]} /><h3 style={{ marginTop: 18 }}>UK</h3><BulletList items={["Check the link/item ID or request all details for the new item.", "Send return instructions with return label link.", "Escalate according to customer request.", "Only once the item is returned, exchange can proceed."]} /><h3 style={{ marginTop: 18 }}>Non US / UK Customers</h3><BulletList items={["Customer returns the item at their own expense.", "Request link/item ID or all needed details for the new item.", "No shipping proof is required.", "Once customer informs us the item was returned, proceed according to item type and policy."]} /></Section>
      <Section title="Premium Item Return" color="#991b1b"><BulletList items={["Premium reorder can proceed only when the item is received.", "Create draft order in OCS.", "Make sure Post Shipping flag is updated.", "Downgrade shipping to Standard.", "Send MR for price difference if needed.", "Write clear CSR remarks: after receiving returned item and payment difference if needed, please make reorder of new item.", "Shipping Coordinator processes once premium item is returned."]} /></Section>
    </div></main>
  );
}
