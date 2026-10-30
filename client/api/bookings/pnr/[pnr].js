/**
 * RailSecurix - PNR Status Serverless Function
 * Handles GET /api/bookings/pnr/:pnr
 */

import { getSupabaseClient } from '../../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawPnr = req.query?.pnr || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const pnr = (Array.isArray(rawPnr) ? rawPnr[0] : rawPnr).toString().trim();

  if (!/^\d{10}$/.test(pnr)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit PNR number.' });
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('*, passengers(*)')
      .eq('pnr', pnr)
      .single();

    if (booking) {
      const pList = (booking.passengers || []).map((p, idx) => ({
        passengerNumber: idx + 1,
        name: p.name ? `${p.name.charAt(0)}***` : `Passenger ${idx + 1}`,
        berthChoice: p.berth_choice,
        seatAllocated: p.seat_allocated,
        status: p.status,
      }));
      return res.status(200).json({
        pnr: booking.pnr,
        trainNumber: booking.train_number,
        trainName: `${booking.train_name} (#${booking.train_number})`,
        source: booking.source_station,
        destination: booking.dest_station,
        route: `${booking.source_station} → ${booking.dest_station}`,
        departureTime: booking.departure_time,
        arrivalTime: booking.arrival_time,
        travelDate: booking.travel_date,
        travelClass: booking.travel_class,
        quota: booking.quota,
        totalFare: booking.total_fare,
        status: booking.status || 'PAYMENT_PENDING',
        coach: booking.travel_class || 'C2',
        berth: pList[0]?.seat_allocated || '34 (Window Side)',
        chartStatus: 'Chart Prepared',
        passengers: pList,
        bookingRef: booking.booking_ref,
        createdAt: booking.created_at,
      });
    }
  }

  // Fallback demo response
  return res.status(200).json({
    pnr,
    trainNumber: '22439',
    trainName: 'Vande Bharat Ex (#22439)',
    source: 'NDLS - New Delhi',
    destination: 'JAT - Jammu Tawi',
    route: 'NDLS – New Delhi → JAT – Jammu Tawi',
    coach: 'C2',
    berth: '34 (Window Side)',
    chartStatus: 'Chart Prepared',
    status: 'CNF (Confirmed)',
  });
}
