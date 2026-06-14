
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

export default function VIPPolicyFullSource() {
  const categories = [
    { name: "Expensive Order", who: "Customer with an order of $500 or above.", tag: "expensive order", items: ["Priority service", "10% refund on current order", "$35 compensation gift card", "5-year warranty only if it is one item"] },
    { name: "Retained Customer", who: "3+ paid orders within the same brand. Do not include reorders.", tag: "retained", items: ["Priority service", "10% refund", "$35 gift card coupon", "5-year warranty only if it is one item"] },
    { name: "Diamond Tier", who: "Customer in the highest loyalty tier.", tag: "diamond tier", items: ["Priority service", "10% refund", "$35 gift card", "Customer already has 5-year warranty; remind them of it"] },
    { name: "VIP", who: "Special customer requiring attention: influencer, customer with multiple issues, late order, etc.", tag: "VIP", items: ["Priority service", "10% refund on current order", "$35 compensation gift card", "5-year warranty applied to all items"] },
    { name: "Voice Interview", who: "Customers who had a voice interview.", tag: "voice interview", items: ["Priority service", "10% refund on current order", "$35 compensation gift card", "5-year warranty applied to all items"] },
    { name: "Celebrity", who: "Famous people / celebrity customers.", tag: "celebrity", items: ["Priority customer service", "Higher compensation gift card", "$35 gift card", "Manual tagging"] }
  ];

  return (
    <main style={pageStyle}>
      <div style={shell}>
        <Link href="/policies" style={backButton}>← Back to Policies</Link>
        <div style={{ ...card, borderTop: "8px solid #a855f7" }}>
          <span style={badge}>FULL SOURCE</span><span style={badge}>VIP / SPECIAL CUSTOMERS</span>
          <h1 style={{ fontSize: 42, margin: "8px 0 6px", fontWeight: 950 }}>Special Customer / VIP Policy</h1>
          <p style={p}>Special customers should receive priority service and enhanced compensation when the standard policy is not enough.</p>
        </div>

        <Section title="Core Principle" color="#a855f7">
          <p style={p}>Make the customer feel recognized. The reply should clearly say they are a VIP/special customer and that we are offering better compensation as an exception.</p>
          <BulletList items={["Give priority service.", "Offer higher compensation straight away when relevant.", "Use the special policy when the customer is upset about the normal policy.", "Emphasize that this level of compensation is not usually offered."]} />
        </Section>

        <Section title="Categories & Compensation" color="#7c3aed">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
            {categories.map((cat) => (
              <div key={cat.name} style={{ ...card, marginTop: 0 }}>
                <h3>{cat.name}</h3>
                <p style={p}><b>Who:</b> {cat.who}</p>
                <p style={p}><b>Tag:</b> {cat.tag}</p>
                <BulletList items={cat.items} />
              </div>
            ))}
          </div>
        </Section>

        <Section title="Messaging Guidance" color="#ec4899">
          <p style={p}>Create a special feel. Explain that we usually do not give this compensation, but we want to do more because this is a VIP/special customer.</p>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, marginTop: 12 }}>
            <p style={p}><b>Example tone:</b></p>
            <p style={p}>“As one of our valued VIP customers, your satisfaction is extremely important to us. While this is not our usual policy, we would like to make an exception and offer enhanced compensation as a special gesture of appreciation.”</p>
          </div>
        </Section>

        <Section title="Additional Policy Note" color="#0f766e">
          <p style={p}>Shipping refund can still be given as compensation, especially if the shipping fee is higher than the 10% refund.</p>
        </Section>
      </div>
    </main>
  );
}
