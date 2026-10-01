export default function handler(req, res) {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawAction = req.query?.action || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const action = (Array.isArray(rawAction) ? rawAction[0] : rawAction).toLowerCase();

  try {
    if (action === 'lock') {
      const body = req.body || {};
      const seats = body.seats || [];
      return res.status(200).json({
        success: true,
        lockedSeats: seats,
        message: `${seats.length} seat(s) held for 5 minutes.`,
        expiresIn: 300
      });
    }

    if (action === 'unlock') {
      return res.status(200).json({ success: true, message: 'Seats released' });
    }

    return res.status(404).json({ success: false, error: `Seats endpoint '${action}' not found.` });
  } catch (err) {
    console.error('Seats error:', err);
    return res.status(500).json({ success: false, error: 'Internal seats server error.' });
  }
}
