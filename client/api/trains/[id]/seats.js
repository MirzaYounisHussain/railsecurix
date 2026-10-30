/**
 * RailSecurix - Train Seats Layout Serverless Function
 * Handles GET /api/trains/:id/seats
 */

import { getSupabaseClient, extractSessionToken } from '../../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawId = req.query?.id || (req.url ? req.url.split('?')[0].split('/seats')[0].split('/').filter(Boolean).pop() : '');
  const trainId = Array.isArray(rawId) ? rawId[0] : rawId;
  const travelDate = (req.query?.date || new Date().toISOString().slice(0, 10)).toString();
  const classCode = (req.query?.class || '3A').toString().toUpperCase();
  const sessionToken = extractSessionToken(req) || '';

  const supabase = getSupabaseClient();
  let seats = [];
  let bookedSeats = [];
  let lockedSeats = [];

  if (supabase && trainId) {
    try {
      // 1. Ensure seats are initialized via stored procedure
      await supabase.rpc('ensure_train_seats_initialized', {
        p_train_id: String(trainId),
        p_travel_date: travelDate,
        p_class_code: classCode,
      });

      // 2. Fetch seats from database
      const { data: dbSeats } = await supabase
        .from('seats')
        .select('*')
        .eq('train_id', String(trainId))
        .eq('travel_date', travelDate)
        .eq('class_code', classCode)
        .order('id');

      if (dbSeats && dbSeats.length > 0) {
        const now = new Date();
        seats = dbSeats.map(s => {
          const isBooked = Boolean(s.is_booked || s.booking_id);
          const isLocked = !isBooked && Boolean(s.locked_until && new Date(s.locked_until) > now);
          const isLockedByMe = isLocked && s.locked_by_session === sessionToken;

          if (isBooked) bookedSeats.push(s.seat_number);
          if (isLocked) lockedSeats.push(s.seat_number);

          return {
            id: s.id,
            seatNumber: s.seat_number,
            berthType: s.berth_type || (s.seat_number.includes('Window') ? 'WINDOW' : 'LOWER'),
            isBooked,
            isLocked,
            isLockedByMe,
          };
        });
      }
    } catch {
      // fallback to generated layout
    }
  }

  if (seats.length === 0) {
    // Generate deterministic coach layout
    for (let i = 1; i <= 36; i++) {
      const seatNum = `${classCode}-${i}`;
      const isBooked = (i % 7 === 0 || i % 11 === 0);
      const isLocked = (i === 14 || i === 22);

      if (isBooked) bookedSeats.push(seatNum);
      if (isLocked) lockedSeats.push(seatNum);

      seats.push({
        id: i,
        seatNumber: seatNum,
        berthType: i % 4 === 1 ? 'LOWER' : (i % 4 === 2 ? 'MIDDLE' : (i % 4 === 3 ? 'UPPER' : 'SIDE_LOWER')),
        isBooked,
        isLocked,
        isLockedByMe: false,
      });
    }
  }

  return res.status(200).json({
    trainId: String(trainId),
    travelDate,
    classCode,
    seats,
    bookedSeats,
    lockedSeats,
    totalSeats: seats.length,
  });
}
