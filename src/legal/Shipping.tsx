import StaticPage from '@/components/StaticPage';

export default function Shipping() {
  return (
    <StaticPage title="Shipping Information">
      <p>
        We currently ship across India. International shipping will be introduced soon.
      </p>

      <h3>Shipping Timelines</h3>
      <ul>
        <li>Processing time: 1–3 business days</li>
        <li>Delivery time: 5–10 business days</li>
      </ul>

      <h3>Shipping Charges</h3>
      <p>
        Shipping charges are calculated at checkout based on location and order size.
      </p>

      <h3>Delays</h3>
      <p>
        Delays may occur due to weather, holidays, or unforeseen logistics issues.
      </p>
    </StaticPage>
  );
}
