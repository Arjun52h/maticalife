// import type { NextApiRequest, NextApiResponse } from 'next';
// import axios from 'axios';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//   if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

//   const API_TOKEN = process.env.DELHIVERY_TOKEN;
//   const URL = 'https://track.delhivery.com/fm/request/new/';

//   try {
//     const pickupPayload = {
//       pickup_date: req.body.pickupDate, // Format: YYYY-MM-DD
//       pickup_time: req.body.pickupTime, // Format: HH:MM:SS
//       pickup_location: "Primary_Warehouse", // Must match your dashboard
//       expected_package_count: req.body.packageCount || 1,
//     };

//     const response = await axios.post(URL, pickupPayload, {
//       headers: {
//         'Authorization': `Token ${API_TOKEN}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     res.status(200).json(response.data);
//   } catch (error: any) {
//     console.error("Pickup Request Error:", error.response?.data || error.message);
//     res.status(500).json({ error: "Failed to schedule pickup" });
//   }
// }