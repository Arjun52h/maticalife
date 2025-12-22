import StaticPage from '@/components/StaticPage';

export default function FAQ() {
  return (
    <StaticPage title="Frequently Asked Questions">
      <h3>What is Matica.life?</h3>
      <p>
        Matica.life is a curated marketplace for premium handcrafted and artisan-made
        products sourced directly from skilled creators across India.
      </p>

      <h3>How do I place an order?</h3>
      <p>
        Browse products, add them to your cart, and proceed to checkout. You’ll receive
        order confirmation once payment is completed.
      </p>

      <h3>What payment methods do you accept?</h3>
      <p>
        We accept UPI, cards, net banking, and wallets via secure payment gateways.
      </p>

      <h3>Can I modify or cancel my order?</h3>
      <p>
        Orders can only be modified or cancelled before they are shipped. Contact support
        immediately for assistance.
      </p>

      <h3>How can I track my order?</h3>
      <p>
        Visit the <strong>My Orders</strong> section after logging in to track order status.
      </p>
    </StaticPage>
  );
}
