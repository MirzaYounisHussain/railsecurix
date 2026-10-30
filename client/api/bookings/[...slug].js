/**
 * RailSecurix - Bookings Catch-All Serverless Function
 * Handles:
 *  - POST /api/bookings/create
 *  - POST /api/bookings/confirm-payment
 *  - POST /api/bookings/webhook / reconcile-webhook
 *  - GET /api/bookings/my-bookings
 *  - POST /api/bookings/cancel
 *  - GET /api/bookings/pnr/:pnr
 */

import crypto from 'node:crypto';
import {
  getSupabaseClient,
  extractSessionToken,
  resolveUserFromSession,
  calculateAuthoritativeFare,
} from '../_supabase.js';
import { SCHEDULED_TRAINS } from '../_data.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Parse path segments: support req.query.slug (array or string) or fallback to req.url / req.query.action
  const rawSlug = req.query?.slug || req.query?.action || (req.url ? req.url.split('?')[0].replace(/^\/api\/bookings\/?/, '').split('/').filter(Boolean) : []);
  const slug = Array.isArray(rawSlug) ? rawSlug : [String(rawSlug)];

  const firstSeg = (slug[0] || '').toString().toLowerCase();
  const secondSeg = (slug[1] || '').toString().trim();

  const sessionToken = extractSessionToken(req);
  const currentUser = await resolveUserFromSession(sessionToken);
  const supabase = getSupabaseClient();

  try {
    // ========================================================================
    // ROUTE 0: GET /api/bookings/pnr/:pnr
    // ========================================================================
    if (firstSeg === 'pnr' || (req.url && req.url.includes('/pnr/'))) {
      if (req.method !== 'GET') return res.status(405).json({ success: false, error: 'Method not allowed' });
      const rawPnr = secondSeg || req.query?.pnr || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
      const pnr = (Array.isArray(rawPnr) ? rawPnr[0] : rawPnr).toString().trim();

      if (!/^\d{10}$/.test(pnr)) {
        return res.status(400).json({ error: 'Please enter a valid 10-digit PNR number.' });
      }

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

    const action = firstSeg;

    // ------------------------------------------------------------------------
    // 1. POST /api/bookings/create
    // ------------------------------------------------------------------------
    if (action === 'create') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
      if (!currentUser || !sessionToken) {
        return res.status(401).json({ success: false, error: 'Authentication required to create bookings.' });
      }

      const body = req.body || {};
      const trainId = body.trainId || body.train_id;
      const travelClass = (body.travelClass || body.class || '3A').toUpperCase();
      const travelDate = body.travelDate || body.date;
      const quota = (body.quota || 'GN').toUpperCase();
      const passengers = Array.isArray(body.passengers) ? body.passengers : [];
      const clientFare = Number(body.totalFare || body.fare || 0);

      if (!trainId || !travelDate || passengers.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Train ID, travel date, and at least one passenger are required.',
        });
      }

      // Security check: Authoritative server-side fare calculation
      const authCalc = await calculateAuthoritativeFare(trainId, travelClass, quota, passengers.length);
      const totalFare = authCalc.total_fare || authCalc.fare || 1170;

      if (clientFare > 0 && Math.abs(clientFare - totalFare) > 1.0) {
        return res.status(400).json({
          success: false,
          error: `Fare mismatch: client submitted ₹${clientFare}, authoritative fare is ₹${totalFare}.`,
        });
      }

      let trainObj = SCHEDULED_TRAINS.find(t => t.id === String(trainId) || t.train_number === String(trainId));
      if (!trainObj && supabase) {
        const { data: dbTrain } = await supabase
          .from('trains')
          .select('*')
          .or(`id.eq.${trainId},train_number.eq.${trainId}`)
          .maybeSingle();
        if (dbTrain) {
          trainObj = {
            id: String(dbTrain.id),
            train_number: dbTrain.train_number,
            train_name: dbTrain.train_name,
            source_code: dbTrain.source_code,
            dest_code: dbTrain.dest_code,
            source_station: dbTrain.source_station,
            dest_station: dbTrain.dest_station,
            departure_time: dbTrain.departure_time,
            arrival_time: dbTrain.arrival_time,
          };
        }
      }

      const trainNumber = trainObj ? trainObj.train_number : '12951';
      const trainName = trainObj ? trainObj.train_name : 'Express Special';
      const sourceStation = trainObj ? trainObj.source_station : 'NDLS';
      const destStation = trainObj ? trainObj.dest_station : 'BCT';
      const depTime = trainObj ? trainObj.departure_time : '16:30';
      const arrTime = trainObj ? trainObj.arrival_time : '08:35';

      const pnr = `24${Math.floor(10000000 + Math.random() * 90000000)}`;
      const bookingRef = `RSX-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const formattedPassengers = passengers.map((p, idx) => ({
        name: p.name || `Passenger ${idx + 1}`,
        age: Number(p.age) || 30,
        gender: p.gender || 'M',
        berth_choice: p.berth_choice || p.berthChoice || 'NO_PREF',
        seat_allocated: `${travelClass}-${idx + 12}`,
        status: 'HOLD',
      }));

      if (supabase) {
        const rawQuota = (body.quota || 'GN').toUpperCase();
        const quotaMap = { GENERAL: 'GN', GN: 'GN', TATKAL: 'TQ', TQ: 'TQ', PREMIUM_TATKAL: 'PT', PT: 'PT', LADIES: 'LD', LD: 'LD' };
        const normalizedQuota = quotaMap[rawQuota] || 'GN';

        let formattedTravelDate = travelDate;
        try {
          const parsedD = new Date(travelDate);
          if (!isNaN(parsedD.getTime())) {
            formattedTravelDate = parsedD.toISOString().split('T')[0];
          } else {
            formattedTravelDate = new Date().toISOString().split('T')[0];
          }
        } catch {
          formattedTravelDate = new Date().toISOString().split('T')[0];
        }

        const bookingInsert = {
          user_id: currentUser.id,
          train_id: trainObj?.id || String(trainId),
          train_number: trainNumber,
          train_name: trainName,
          source_station: sourceStation,
          dest_station: destStation,
          departure_time: depTime,
          arrival_time: arrTime,
          travel_date: formattedTravelDate,
          travel_class: travelClass,
          quota: normalizedQuota,
          total_fare: totalFare,
          status: 'PAYMENT_PENDING',
          pnr,
          booking_ref: bookingRef,
          session_token: sessionToken,
        };

        let bookingId = Date.now();
        try {
          const { data: newBooking, error: bErr } = await supabase
            .from('bookings')
            .insert(bookingInsert)
            .select('id')
            .single();

          if (bErr) {
            console.warn('Supabase booking insert warning:', bErr.message);
          } else if (newBooking) {
            bookingId = newBooking.id;
            const paxInserts = formattedPassengers.map(p => ({
              booking_id: newBooking.id,
              name: p.name,
              age: p.age,
              gender: p.gender,
              berth_choice: p.berth_choice,
              seat_allocated: p.seat_allocated,
              status: 'HOLD',
            }));
            await supabase.from('passengers').insert(paxInserts);
          }
        } catch (dbErr) {
          console.warn('Supabase bookings insert exception:', dbErr);
        }

        return res.status(201).json({
          success: true,
          pnr,
          bookingId,
          bookingRef,
          totalFare,
          status: 'PAYMENT_PENDING',
          passengers: formattedPassengers,
        });
      }

      // Memory fallback for disconnected development
      return res.status(201).json({
        success: true,
        pnr,
        bookingId: Date.now(),
        bookingRef,
        totalFare,
        status: 'PAYMENT_PENDING',
        passengers: formattedPassengers,
      });
    }

    // ------------------------------------------------------------------------
    // 2. POST /api/bookings/confirm-payment
    // ------------------------------------------------------------------------
    if (action === 'confirm-payment') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
      const body = req.body || {};
      const method = body.method || 'UNVERIFIED';
      const bookingRef = body.bookingRef || body.booking_ref;

      // FIX 1: Only the explicitly designated RailSim iPay demo method or explicitly authorized simulated transactions may receive simulated confirmation.
      // Real gateway payment methods must never be automatically confirmed because PAYMENT_WEBHOOK_SECRET is missing.
      const isExplicitDemoMethod = method === 'RailSim iPay' || method.toLowerCase().includes('railsim ipay');
      const isExplicitSimulated = body.isSimulated === true;
      const isSimulated = isExplicitDemoMethod || isExplicitSimulated;

      if (!isSimulated) {
        return res.status(200).json({
          success: true,
          transactionId: null,
          status: 'PAYMENT_PENDING',
          gateway: method,
          verified: false,
          message: 'Payment verification is pending gateway webhook confirmation. Booking remains in PAYMENT_PENDING status.',
          timestamp: new Date().toISOString(),
        });
      }

      // Local demonstration / simulated payment flow
      const simTxnId = body.transactionId || `SIM-TXN-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      const reqStatus = (body.status || 'SUCCESS').toUpperCase();

      if (reqStatus === 'FAILED') {
        return res.status(200).json({
          success: true,
          status: 'CANCELLED',
          bookingStatus: 'CANCELLED',
          transactionId: simTxnId,
          verified: false,
          isSimulated: true,
          message: 'Simulated payment failed; provisional hold cancelled.',
          timestamp: new Date().toISOString(),
        });
      }

      if (reqStatus === 'PENDING') {
        return res.status(200).json({
          success: true,
          status: 'PAYMENT_PENDING',
          bookingStatus: 'PAYMENT_PENDING',
          transactionId: null,
          verified: false,
          isSimulated: true,
          message: 'Payment is pending gateway settlement.',
          timestamp: new Date().toISOString(),
        });
      }

      // Handle successful simulated confirmation & idempotency
      if (supabase && bookingRef) {
        try {
          const { data: bRow } = await supabase
            .from('bookings')
            .select('id, status, payment_gateway_ref')
            .eq('booking_ref', bookingRef)
            .limit(1)
            .maybeSingle();

          if (bRow && bRow.status === 'CONFIRMED') {
            return res.status(200).json({
              success: true,
              status: 'CONFIRMED',
              bookingStatus: 'CONFIRMED',
              transactionId: bRow.payment_gateway_ref || simTxnId,
              gateway: `${method} (Simulated Demo)`,
              verified: true,
              isSimulated: true,
              alreadyConfirmed: true,
              message: 'Payment already confirmed for this booking.',
              timestamp: new Date().toISOString(),
            });
          }

          if (bRow) {
            await supabase
              .from('bookings')
              .update({ status: 'CONFIRMED', payment_gateway_ref: simTxnId })
              .eq('id', bRow.id);
            await supabase
              .from('passengers')
              .update({ status: 'CNF' })
              .eq('booking_id', bRow.id);
          }
        } catch {
          // ignore error for local dev
        }
      }

      return res.status(200).json({
        success: true,
        status: 'CONFIRMED',
        bookingStatus: 'CONFIRMED',
        transactionId: simTxnId,
        gateway: `${method} (Simulated Demo)`,
        verified: true,
        isSimulated: true,
        message: 'Payment confirmed via RailSim simulated payment demonstration.',
        timestamp: new Date().toISOString(),
      });
    }

    // ------------------------------------------------------------------------
    // 2b. POST /api/bookings/reconcile-webhook or POST /api/bookings/webhook
    // ------------------------------------------------------------------------
    if (action === 'webhook' || action === 'reconcile-webhook') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
      const signature = req.headers['x-gateway-signature'] || req.headers['x-webhook-signature'];
      const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

      // Cryptographic verification check: reject all unverified callers
      if (!webhookSecret || !signature) {
        return res.status(401).json({
          success: false,
          error: 'Cryptographically verified gateway signature required for payment reconciliation.',
        });
      }

      // Resolve raw payload bytes/string for HMAC verification
      let rawPayload = null;
      if (req.rawBody) {
        rawPayload = Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : String(req.rawBody);
      } else if (typeof req.body === 'string') {
        rawPayload = req.body;
      } else if (req.body && Buffer.isBuffer(req.body)) {
        rawPayload = req.body.toString('utf8');
      }

      // Strict Security Guard: Parsed-body re-serialization cannot silently become a production verification fallback.
      if (!rawPayload) {
        return res.status(400).json({
          success: false,
          error: 'Unparsed raw request body is required for cryptographic webhook verification. Gateway provider adapter must capture raw request stream.',
        });
      }

      const sigString = String(signature).trim();
      const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawPayload).digest('hex');
      const sigBuf = Buffer.from(sigString, 'utf8');
      const expBuf = Buffer.from(expectedSignature, 'utf8');
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        return res.status(401).json({ success: false, error: 'Invalid gateway webhook signature.' });
      }

      const body = typeof req.body === 'object' && req.body !== null ? req.body : JSON.parse(rawPayload || '{}');
      const bookingRef = body.bookingRef || body.booking_ref;
      const gatewayTxnId = body.gatewayTxnId || body.gateway_txn_id;
      const paymentStatus = (body.status || body.payment_status || 'SUCCESS').toUpperCase();
      const verifiedAmount = Number(body.amount || body.verified_amount || 0);

      if (supabase) {
        const { data: recData, error: recErr } = await supabase.rpc('reconcile_payment_webhook_atomic', {
          p_booking_ref: bookingRef,
          p_gateway_txn_id: gatewayTxnId,
          p_payment_status: paymentStatus,
          p_verified_amount: verifiedAmount,
          p_is_trusted_gateway_caller: true,
        });

        if (recErr) {
          return res.status(500).json({ success: false, error: recErr.message });
        }
        return res.status(200).json(recData);
      }

      // Never falsely confirm payment when disconnected from database
      return res.status(503).json({
        success: false,
        error: 'Database connection required for payment reconciliation. Booking remains in PAYMENT_PENDING.',
        status: 'PAYMENT_PENDING'
      });
    }

    // ------------------------------------------------------------------------
    // 3. GET /api/bookings/my-bookings
    // ------------------------------------------------------------------------
    if (action === 'my-bookings') {
      if (!currentUser) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }

      if (supabase) {
        const { data: dbBookings } = await supabase
          .from('bookings')
          .select('*, passengers(*)')
          .eq('user_id', currentUser.id)
          .order('id', { ascending: false });

        if (dbBookings) {
          return res.status(200).json(dbBookings);
        }
      }

      return res.status(200).json([]);
    }

    // ------------------------------------------------------------------------
    // 4. POST /api/bookings/cancel
    // ------------------------------------------------------------------------
    if (action === 'cancel') {
      if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });
      if (!currentUser) {
        return res.status(401).json({ success: false, error: 'Authentication required to cancel a booking.' });
      }

      const body = req.body || {};
      const pnr = (body.pnr || '').toString().trim();
      if (!pnr) {
        return res.status(400).json({ success: false, error: 'PNR number required for cancellation.' });
      }

      if (supabase) {
        try {
          const { data: cancelData, error: cancelErr } = await supabase.rpc('cancel_booking_atomic', {
            p_pnr: pnr,
            p_user_id: currentUser.id,
            p_session_token: sessionToken,
            p_is_admin: currentUser.role === 'admin',
          });

          if (!cancelErr && cancelData) {
            if (!cancelData.success) {
              return res.status(400).json(cancelData);
            }
            return res.status(200).json(cancelData);
          }
        } catch {
          // Fallback to table update
        }

        // Direct table fallback
        const { data: bRecord } = await supabase.from('bookings').select('id, user_id, status').eq('pnr', pnr).single();
        if (bRecord) {
          if (currentUser.role !== 'admin' && bRecord.user_id !== currentUser.id) {
            return res.status(403).json({ success: false, error: 'Unauthorized: you do not own this booking.' });
          }
          await supabase.from('bookings').update({ status: 'CANCELLED' }).eq('id', bRecord.id);
          await supabase.from('passengers').update({ status: 'CAN' }).eq('booking_id', bRecord.id);
          await supabase.from('seats').update({ is_booked: false, booking_id: null, locked_until: null, locked_by_session: null }).eq('booking_id', bRecord.id);
          return res.status(200).json({ success: true, pnr, status: 'CANCELLED', message: 'Booking cancelled successfully.' });
        }
      }

      return res.status(200).json({
        success: true,
        pnr,
        status: 'CANCELLED',
        message: 'Booking cancelled successfully.',
      });
    }

    return res.status(404).json({ success: false, error: `Booking action '${action}' not found.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal booking server error.' });
  }
}
