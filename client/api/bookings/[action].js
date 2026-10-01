export default function handler(req, res) {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawAction = req.query?.action || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const action = (Array.isArray(rawAction) ? rawAction[0] : rawAction).toLowerCase();

  try {
    // ------------------------------------------------------------------------
    // POST /api/bookings/create
    // ------------------------------------------------------------------------
    if (action === 'create') {
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

    // ------------------------------------------------------------------------
    // POST /api/bookings/confirm-payment
    // ------------------------------------------------------------------------
    if (action === 'confirm-payment') {
      const transactionId = `TXN-${Date.now()}`;
      return res.status(200).json({
        success: true,
        transactionId,
        status: 'SUCCESS',
        gateway: 'SIMULATED_RAIL_GATEWAY',
        timestamp: new Date().toISOString()
      });
    }

    // ------------------------------------------------------------------------
    // GET /api/bookings/my-bookings
    // ------------------------------------------------------------------------
    if (action === 'my-bookings') {
      return res.status(200).json([]);
    }

    return res.status(404).json({ success: false, error: `Booking endpoint '${action}' not found.` });
  } catch (err) {
    console.error('Bookings error:', err);
    return res.status(500).json({ success: false, error: 'Internal booking server error.' });
  }
}
