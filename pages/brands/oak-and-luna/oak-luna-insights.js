import dynamic from 'next/dynamic';

const CustomerInsightsPage = dynamic(
  () => import('../../../components/oak-luna/CustomerInsightsPage'),
  { ssr: false }
);

export default function OakLunaInsights() {
  return <CustomerInsightsPage />;
}
