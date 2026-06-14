
import Link from "next/link";

const pageStyle = { minHeight: "100vh", background: "#f3f6fb", padding: 28, fontFamily: "Arial, sans-serif", color: "#071225" };
const shell = { maxWidth: 1180, margin: "0 auto" };
const card = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 22, boxShadow: "0 10px 30px rgba(15,23,42,0.06)", marginTop: 16 };
const p = { color: "#334155", lineHeight: 1.65, margin: "6px 0" };
const badge = { display: "inline-flex", borderRadius: 999, background: "#eef2ff", color: "#3730a3", padding: "7px 10px", fontWeight: 900, fontSize: 12, marginRight: 8, marginBottom: 8 };
const backButton = { display: "inline-block", background: "#0f172a", color: "#fff", textDecoration: "none", borderRadius: 12, padding: "10px 14px", fontWeight: 900, marginBottom: 18 };

function BulletList({ items }) {
  return <ul style={{ margin: "8px 0 0 20px", color: "#334155", lineHeight: 1.7 }}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}
function Section({ title, children, color = "#2563eb" }) {
  return <div style={{ ...card, borderTop: `6px solid ${color}` }}><h2 style={{ fontSize: 24, fontWeight: 950, margin: "0 0 10px" }}>{title}</h2>{children}</div>;
}

export default function DamagedPolicyFullSource() {
  return (
    <main style={pageStyle}>
      <div style={shell}>
        <Link href="/policies" style={backButton}>← Back to Policies</Link>
        <div style={{ ...card, borderTop: "8px solid #dc2626" }}>
          <span style={badge}>FULL SOURCE</span><span style={badge}>ITEM RECEIVED</span>
          <h1 style={{ fontSize: 42, margin: "8px 0 6px", fontWeight: 950 }}>Damaged Policy</h1>
          <p style={p}>Use for factory defects, inscription errors, tarnishing, breakage, tangled/broken chains, and other confirmed damage cases.</p>
        </div>

        <Section title="Warranty Coverage" color="#dc2626"><BulletList items={["All orders are covered by a 2-year warranty from the ETA.", "Covered issues include factory defects, inscription errors, tarnishing, breakage, and tangled/broken chains.", "Always request a picture if the customer has not provided one."]} /></Section>
        <Section title="General Flow" color="#ea580c"><BulletList items={["Request a picture if no photo was sent.", "Once damage is confirmed, flag the issue in OM using the correct dropdown reason.", "Always offer reorder of the same item.", "Offer exchange if relevant; customer pays or receives store credit for price difference.", "Only if refund is requested: offer store credit first.", "Refund is allowed only within 30 days of ETA and only if the customer refuses other options."]} /></Section>
        <Section title="Replacement Options" color="#2563eb">
          <h3>DIY Chain / Bracelet</h3><BulletList items={["Customer can replace the part themselves.", "Order only the damaged part.", "Link the order."]} />
          <h3 style={{ marginTop: 18 }}>Not DIY / Full Item Needed</h3><p style={p}>Includes broken non-detachable chains, pendants, earrings, rings, fallen stones.</p><BulletList items={["Create draft order in OCS.", "Escalate reorder in Kustomer with form and remarks.", "0–2 weeks after ETA: use same shipping method as original.", "2+ weeks after ETA: downgrade to Standard."]} />
        </Section>
        <Section title="Premium Items" color="#7c3aed"><BulletList items={["Gold, diamond, and gemstone items must be returned first.", "Request a photo.", "Send return label and instructions.", "After receiving the return, or in some cases proof of return, the Shipping Coordinator will process the reorder."]} /></Section>
        <Section title="Repeat Damage / Second Issue" color="#b45309"><BulletList items={["If the item was already reordered under warranty, offer another reorder.", "Reapply original coupon if it is an exchange; no refund on coupons.", "If damaged twice, offer reorder.", "If customer refuses reorder, refund is allowed only if original order is less than 6 months old."]} /></Section>
        <Section title="Out of Warranty" color="#64748b"><BulletList items={["25–36 months from ETA: offer 20% off a new order.", "36+ months: full payment required.", "No need to ask for pictures."]} /></Section>
        <Section title="Lost Due to Damage" color="#0f766e"><BulletList items={["Non-premium item: reorder possible under warranty.", "Premium gold/diamond item: cannot be reordered if lost."]} /></Section>
        <Section title="Refund Reminder" color="#991b1b"><p style={p}><b>Never start by offering a refund.</b></p><BulletList items={["Offer reorder first.", "Then offer store credit.", "Refunds are only within 30 days of ETA and only if customer refuses other options."]} /></Section>
      </div>
    </main>
  );
}
