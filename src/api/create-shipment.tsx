// import type { NextApiRequest, NextApiResponse } from 'next';
// import axios from 'axios';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') return res.status(405).end();

//   const API_TOKEN = process.env.DELHIVERY_TOKEN; 
//   const URL = 'https://track.delhivery.com/api/cmu/create.json';

//   try {
//     // 1. Structure the data exactly as Delhivery requires
//     const shipData = {
//       shipments: [
//         {
//           name: req.body.customerName,
//           add: req.body.address,
//           pin: req.body.pincode,
//           phone: req.body.phone,
//           order: req.body.orderId,
//           payment_mode: req.body.paymentMode || "Prepaid",
//           products_desc: req.body.productName || "E-commerce Item",
//           cod_amount: req.body.codAmount || "0",
//           weight: "500", // Default weight in grams
//         }
//       ],
//       pickup_location: {
//         name: "Primary_Warehouse" // Must match your dashboard exactly
//       }
//     };

//     // 2. Format as a string and use the correct Content-Type
//     const payload = `format=json&data=${JSON.stringify(shipData)}`;

//     const response = await axios.post(URL, payload, {
//       headers: {
//         'Authorization': `Token ${API_TOKEN}`,
//         // CHANGED: This must be urlencoded for the "format=json&data=" structure to work
//         'Content-Type': 'application/x-www-form-urlencoded', 
//       },
//     });

//     // Delhivery often returns 200 even if there's an error inside the data
//     res.status(200).json(response.data);
//   } catch (error: any) {
//     // Improved error logging for debugging
//     console.error("Delhivery Error:", error.response?.data || error.message);
//     res.status(500).json({ error: error.message });
//   }
// }