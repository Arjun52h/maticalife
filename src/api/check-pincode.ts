// import type { NextApiRequest, NextApiResponse } from 'next';
// import axios from 'axios';

// export default async function handler(req: NextApiRequest, res: NextApiResponse) {
//     const { pincode } = req.query;
//     console.log("☎️ API CALLED! Pincode received:", req.query.pincode); // Add this
//     if (!pincode) return res.status(400).json({ error: "Pincode is required" });

//     // 1. Clean the Token: Ensure we only have ONE "Token " prefix
//     const rawToken = process.env.DELHIVERY_TOKEN?.replace('Token ', '').trim() || "";
//     const AUTH_HEADER = `Token ${rawToken}`;

//     // const URL = `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${pincode}`;

//     // Force the pincode to be a string
//     const cleanPincode = String(pincode).trim();
//     const URL = `https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=${cleanPincode}`;
//     try {
//         const response = await axios.get(URL, {
//             headers: {
//                 'Authorization': AUTH_HEADER,
//                 'Content-Type': 'application/json',
//                 'Accept': 'application/json'
//             },
//         });

//         const data = response.data.delivery_codes;

//         // If Delhivery returns [], it's usually a token/warehouse issue
//         if (!data || data.length === 0) {
//             console.log("❌ Delhivery rejection: check if Pickup Location is active in dashboard.");
//             return res.status(200).json({ is_serviceable: false });
//         }

//         // 2. Return valid data to your "Verify" button
//         return res.status(200).json({
//             // is_serviceable: true,
//             district: data[0].postal_code.district,
//             state: data[0].postal_code.state_code
//         });

//     } catch (error: any) {
//         console.error("❌ Connection failed:", error.response?.status);
//         return res.status(500).json({ is_serviceable: false });
//     }
// }