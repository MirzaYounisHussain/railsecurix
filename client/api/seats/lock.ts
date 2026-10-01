export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const seats = body.seats || [];

  return res.status(200).json({
    success: true,
    lockedSeats: seats,
    message: `${seats.length} seat(s) held for 5 minutes.`,
    expiresIn: 300
  });
}
