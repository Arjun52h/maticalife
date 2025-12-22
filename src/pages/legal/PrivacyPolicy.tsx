import StaticPage from '@/components/StaticPage';

export default function PrivacyPolicy() {
  return (
    <StaticPage title="Privacy Policy">
      <p>
        Your privacy matters to us. This policy explains how we collect and use data.
      </p>

      <h3>Information We Collect</h3>
      <ul>
        <li>Name, email, phone number</li>
        <li>Shipping address</li>
        <li>Order and payment metadata</li>
      </ul>

      <h3>How We Use Your Data</h3>
      <p>
        To process orders, provide support, and improve our services.
      </p>

      <h3>Data Protection</h3>
      <p>
        We use industry-standard security practices to safeguard your data.
      </p>
    </StaticPage>
  );
}
