export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const pnr = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  const bookingId = Math.floor(1000 + Math.random() * 9000);
  const bookingRef = `BK-${Date.now().toString(36).toUpperCase()}`;

  const body = req.body || {};
  const passengers = body.passengers || [{ name: 'Traveler', age: 30, gender: 'M' }];

  return res.status(200).json({
    success: true,
    pnr,
    bookingId,
    bookingRef,
    totalFare: 1250,
    status: 'PAYMENT_PENDING',
    passengers
  });
}
