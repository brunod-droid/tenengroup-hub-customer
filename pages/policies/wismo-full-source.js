
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

export default function WISMOFullSource() {
  return (
    <main style={pageStyle}>
      <div style={shell}>
        <Link href="/policies" style={backButton}>← Back to Policies</Link>

        <div style={{ ...card, borderTop: "8px solid #2563eb" }}>
          <span style={badge}>FULL SOURCE</span>
          <span style={badge}>WISMO / SHIPPING</span>
          <h1 style={{ fontSize: 42, margin: "8px 0 6px", fontWeight: 950 }}>WISMO & Shipping Policies</h1>
          <p style={p}>Use this policy for Where Is My Order, late shipping, lost orders, DNR, RTS, returns, address changes and split shipping cases.</p>
        </div>

        <Section title="1. WISMO — On-Time Orders" color="#2563eb">
          <p style={p}><b>Definition:</b> An order is on time if it is still within the estimated delivery timeframe.</p>
          <BulletList items={["If ETA has not passed, the order is on time.", "Timeframes apply only when the store country matches the delivery country.", "Customers may receive an automated address confirmation request."]} />
        </Section>

        <Section title="2. Late Shipping" color="#f59e0b">
          <h3>Late Supplier Orders</h3>
          <BulletList items={["Orders delayed due to production issues are considered Late Supplier orders.", "Customer may automatically receive a 20% discount or a free shipping upgrade when applicable.", "Do not offer compensation twice.", "If compensation was already provided, only communicate the updated ETA.", "If the order later qualifies as lost, follow the Lost policy."]} />
          <h3 style={{ marginTop: 18 }}>Regular Late Orders</h3>
          <BulletList items={["Customer should receive an updated ETA.", "Offer compensation through the Late link only when ETA has passed.", "If customer requests a shipping refund, the refund replaces any compensation offer."]} />
        </Section>

        <Section title="3. Lost Orders" color="#dc2626">
          <h3>General Rule</h3>
          <BulletList items={["DHL / FedEx: lost when ETA + 5 business days has passed and no tracking movement in the past 3 business days.", "Other non-expedited shipping methods: lost when ETA + 10 business days has passed and no tracking movement in the past 3 business days.", "Offer reorder first.", "If customer is anxious about a special occasion, it is OK to ask for reorder with expedited shipping."]} />
          <h3 style={{ marginTop: 18 }}>Lost Twice</h3>
          <BulletList items={["Gold, diamond, or orders over $200 lost twice must be escalated for fraud review.", "Refunds are normally allowed only within 30 days after ETA.", "If the company caused the delay beyond 30 days, refund may still be issued.", "For international customers lost twice, a local address may be required for replacement."]} />
          <h3 style={{ marginTop: 18 }}>Standard Shipping</h3>
          <BulletList items={["Lost when ETA + 10 business days has passed and tracking has not moved for 3 business days.", "If tracking recently moved, ask customer to continue waiting.", "If confirmed lost: offer reorder first, then store credit, then refund only if both are declined."]} />
          <h3 style={{ marginTop: 18 }}>DHL / FedEx Urgent Shipping</h3>
          <BulletList items={["Lost when ETA + 5 business days has passed and tracking has not moved for 3 business days.", "If tracking recently moved, customer should continue waiting.", "Shipping fee refund may be offered.", "Refund allowed when more than 5 business days late and no movement within 3 business days."]} />
          <h3 style={{ marginTop: 18 }}>Non-Tracked Shipping</h3>
          <BulletList items={["Customer may choose reorder after 5 business days beyond ETA.", "Or wait 10 business days and receive a reordered item with expedited shipping.", "Refund available only after 10 business days beyond ETA.", "Reorders/refunds can only be processed within 100 days after ETA."]} />
        </Section>

        <Section title="4. Delivered but Not Received (DNR)" color="#7c3aed">
          <p style={p}><b>Definition:</b> Tracking shows delivered, but customer says they did not receive the package.</p>
          <BulletList items={["Customer may choose free reorder of the same item.", "Customer may choose full refund.", "Reorders must be identical to the original order.", "No changes, exchanges or inscription modifications.", "Gold Tier customers or orders above $200 with DNR twice must be escalated for fraud review.", "If delivery occurred less than 3 business days ago, customer should wait 3 business days before replacement/refund options are offered."]} />
        </Section>

        <Section title="5. Return to Sender (RTS) — Address Is Correct" color="#0f766e">
          <BulletList items={["USPS: packages are returned to the warehouse and may be reshipped.", "Landmark / Global Post / Mailog: packages are not returned, reorder is required.", "DHL / FedEx: packages may be abandoned or returned to the factory. Final resolution depends on carrier outcome."]} />
        </Section>

        <Section title="6. Customer Returns" color="#64748b">
          <h3>Return Required For</h3>
          <BulletList items={["Damaged premium items.", "Name spelling issues.", "Resizing requiring a remake."]} />
          <h3 style={{ marginTop: 18 }}>Reorder / Refund Eligibility</h3>
          <BulletList items={["US / CA / UK non-premium: reorder/refund may proceed once returned.", "US / CA / UK premium: item must be received before processing.", "Rest of world non-premium: customer must confirm shipment of return.", "Rest of world premium: item must be received before processing."]} />
        </Section>

        <Section title="7. Address Changes After Shipping" color="#b45309">
          <h3>Non-DHL / FedEx</h3>
          <BulletList items={["Address changes are not possible if item is delivered.", "Address changes are not possible if address is incomplete, except missing apartment number.", "Address changes are not possible if shipment is stuck due to incorrect address.", "Compensation: non-premium 25% coupon; premium 15% coupon.", "Missing apartment/house number may qualify for free reorder."]} />
          <h3 style={{ marginTop: 18 }}>DHL / FedEx</h3>
          <BulletList items={["Same city: address changes are usually possible.", "Different city: FedEx not allowed; DHL may be possible with additional shipping charges.", "If change is rejected: non-premium 25% coupon; premium 15% coupon."]} />
        </Section>

        <Section title="8. Split Shipping" color="#111827">
          <BulletList items={["Items may ship separately when produced by different factories.", "Customer may receive one item before the rest of the order.", "Separate tracking numbers may exist for each shipment."]} />
        </Section>
      </div>
    </main>
  );
}
