// import React, { useState } from 'react';

// // This interface allows the component to talk to your index.tsx
// interface PincodeProps {
//   onVerified: (status: boolean, pincode: string) => void;
// }

// const PincodeChecker: React.FC<PincodeProps> = ({ onVerified }) => {
//   const [pincode, setPincode] = useState("");
//   const [status, setStatus] = useState<any>(null);
//   const [loading, setLoading] = useState(false);

//   const checkPincode = async () => {
//     // Only trigger if the pincode is 6 digits
//     if (pincode.length !== 6) {
//       alert("Please enter a valid 6-digit pincode");
//       return;
//     }

//     setLoading(true);
//     setStatus(null); // Clear previous status

//     try {
//       const res = await fetch(`/api/check-pincode?pincode=${pincode}`);
//       const data = await res.json();
//       console.log("🔍 Pincode API Response:", data);
//       setStatus(data);

//       // Notify the parent (index.tsx) if this pincode is serviceable
//       // We pass the boolean status and the pincode string
//       onVerified(data.is_serviceable, pincode);

//     } catch (err) {
//       console.error("Pincode Check Error:", err);
//       onVerified(false, ""); 
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Reset verification if the user starts typing a new pincode
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = e.target.value.replace(/\D/g, ""); // Only allow numbers
//     setPincode(val);
    
//     // Immediately tell index.tsx that the status is no longer verified
//     onVerified(false, ""); 
//     setStatus(null);
//   };

//   return (
//     <div className="space-y-4">
//       <div className="flex gap-2">
//         <input
//           type="text"
//           maxLength={6}
//           value={pincode}
//           onChange={handleChange}
//           placeholder="Enter 6-digit Pincode"
//           className="flex-1 border border-slate-300 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
//         />
//         <button 
//           onClick={checkPincode}
//           className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors"
//           disabled={loading || pincode.length !== 6}
//         >
//           {loading ? 'Checking...' : 'Verify'}
//         </button>
//       </div>

//       {status && (
//         <div className={`p-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-1 ${
//           status.is_serviceable 
//             ? 'bg-green-50 text-green-700 border border-green-100' 
//             : 'bg-red-50 text-red-700 border border-red-100'
//         }`}>
//           {status.is_serviceable 
//             ? `✅ Delivery available for ${status.district}, ${status.state}` 
//             : '❌ Sorry, Delhivery does not serve this location yet.'}
//         </div>
//       )}
//     </div>
//   );
// };

// export default PincodeChecker;