import Link from 'next/link';

export default function WhoCustomersButton() {
  return (
    <Link href="/brands/oak-and-luna/who-are-our-customers" legacyBehavior>
      <a style={styles.card}>
        <div style={styles.icon}>👥</div>
        <div>
          <div style={styles.title}>Who are our customers</div>
          <div style={styles.subtitle}>Customer typology, orders, Kustomer tickets, Trustpilot and Smart AI insights</div>
        </div>
        <div style={styles.arrow}>→</div>
      </a>
    </Link>
  );
}

const styles = {
  card: {
    display: 'flex', alignItems: 'center', gap: 16, padding: 18, borderRadius: 18,
    textDecoration: 'none', color: '#17202A', background: 'linear-gradient(135deg,#fff,#f8f3ee)',
    border: '1px solid #eadfd5', boxShadow: '0 8px 24px rgba(58,43,31,0.08)', marginTop: 14
  },
  icon: { width: 46, height: 46, borderRadius: 14, display: 'grid', placeItems: 'center', background: '#F1E4D8', fontSize: 23 },
  title: { fontWeight: 800, fontSize: 18, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#6B625C', lineHeight: 1.35 },
  arrow: { marginLeft: 'auto', fontSize: 24, fontWeight: 700, color: '#9A6B4F' }
};
