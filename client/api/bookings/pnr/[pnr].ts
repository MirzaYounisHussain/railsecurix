export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pnr } = req.query || {};

  return res.status(200).json({
    pnr: pnr || '2849102934',
    trainNumber: '12951',
    trainName: 'Tejas Rajdhani Express',
    source: 'NDLS - New Delhi',
    destination: 'BCT - Mumbai Central',
    travelDate: new Date().toISOString().slice(0, 10),
    travelClass: '3A',
    quota: 'General',
    status: 'CONFIRMED',
    chartStatus: 'CHART NOT PREPARED',
    passengers: [
      { name: 'Traveler 1', age: 32, gender: 'M', currentStatus: 'CNF', berth: 'B1-23' }
    ]
  });
}
