export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const stations = [
    { id: "1", stationCode: "NDLS", stationName: "New Delhi", city: "New Delhi", state: "Delhi" },
    { id: "2", stationCode: "BCT", stationName: "Mumbai Central", city: "Mumbai", state: "Maharashtra" },
    { id: "3", stationCode: "HWH", stationName: "Howrah Junction", city: "Kolkata", state: "West Bengal" },
    { id: "4", stationCode: "MAS", stationName: "Chennai Central", city: "Chennai", state: "Tamil Nadu" },
    { id: "5", stationCode: "SBC", stationName: "KSR Bengaluru", city: "Bengaluru", state: "Karnataka" },
    { id: "6", stationCode: "PNBE", stationName: "Patna Junction", city: "Patna", state: "Bihar" },
    { id: "7", stationCode: "JAT", stationName: "Jammu Tawi", city: "Jammu", state: "Jammu and Kashmir" }
  ];

  return res.status(200).json(stations);
}

