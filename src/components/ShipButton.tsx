import React, { useState } from 'react';

interface ShipButtonProps {
  orderId: string;
  customerName: string;
  pincode: string;
  address: string;
  phone: string;
  productName?: string;
  disabled?: boolean; // Now TypeScript knows this exists
}

const ShipButton: React.FC<ShipButtonProps> = ({ 
  orderId, 
  customerName, 
  pincode, 
  address, 
  phone, 
  productName = "E-commerce Package",
  disabled = false // 1. YOU MUST ADD THIS HERE to "catch" the prop
}) => {
  const [loading, setLoading] = useState(false);
  const [waybill, setWaybill] = useState<string | null>(null);

  const handleShipment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerName,
          address,
          pincode,
          phone,
          productName
        }),
      });

      const data = await response.json();

      if (data.packages && data.packages.length > 0) {
        const wb = data.packages[0].waybill;
        setWaybill(wb);
        alert(`Shipment Created! Waybill: ${wb}`);
      } else {
        alert(`Error from Delhivery: ${data.rmk || "Unknown Error"}`);
      }
    } catch (err) {
      console.error("Connection Error:", err);
      alert("Failed to connect to the shipping server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleShipment}
      // 2. USE THE DISABLED PROP HERE
      // The button will be disabled if: it's loading OR waybill exists OR parent says disabled
      disabled={loading || !!waybill || disabled} 
      className={`w-full px-6 py-3 rounded-xl font-bold text-white transition-all ${
        waybill 
          ? 'bg-green-600' 
          : (disabled || loading) 
            ? 'bg-slate-300 cursor-not-allowed' 
            : 'bg-orange-600 hover:bg-orange-700 active:scale-95'
      }`}
    >
      {loading ? 'Processing...' : waybill ? `Waybill: ${waybill}` : 'Ship with Delhivery'}
    </button>
  );
};

export default ShipButton;