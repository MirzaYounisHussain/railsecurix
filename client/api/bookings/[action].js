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
      const pnr = `24${Math.floor(10000000 + Math.random() * 90000000)}`;
      const bookingId = Math.floor(1000 + Math.random() * 9000);
      const bookingRef = `BK-${Date.now().toString(36).toUpperCase()}`;

      const body = req.body || {};
      const passengersRaw = body.passengers || [{ name: 'Traveler', age: 30, gender: 'M' }];
      const travelClass = body.travelClass || '3A';

      const passengers = passengersRaw.map((p, idx) => ({
        name: p.name || `Passenger ${idx + 1}`,
        age: Number(p.age) || 30,
        gender: p.gender || 'M',
        berth_choice: p.berth || p.preferences || 'NO_PREF',
        seat_allocated: p.seat || `${travelClass}-${14 + idx} (Window Side)`,
        status: 'CNF'
      }));

      const totalFare = body.totalFare || (1250 * passengers.length);

      return res.status(200).json({
        success: true,
        pnr,
        bookingId,
        bookingRef,
        totalFare,
        status: 'CONFIRMED',
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
