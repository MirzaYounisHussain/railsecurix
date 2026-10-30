/**
 * RailSecurix - Seat Locking Serverless Function
 * Handles POST /api/seats/lock and POST /api/seats/unlock
 */

import crypto from 'node:crypto';
import { getSupabaseClient, extractSessionToken, setSessionCookie } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const rawAction = req.query?.action || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const action = (Array.isArray(rawAction) ? rawAction[0] : rawAction).toLowerCase();

  const body = req.body || {};
  const trainId = body.trainId || body.train_id;
  const travelDate = body.date || body.travel_date;
  const classCode = (body.class || body.class_code || body.travelClass || '3A').toUpperCase();
  const seats = body.seats || body.seat_numbers || [];

  let sessionToken = extractSessionToken(req);
  let isNewSession = false;

  if (!sessionToken) {
    sessionToken = 'sess_' + crypto.randomUUID();
    isNewSession = true;
  }

  const supabase = getSupabaseClient();

  try {
    if (action === 'lock') {
      if (!trainId || !travelDate || !Array.isArray(seats) || seats.length === 0) {
        return res.status(400).json({ success: false, error: 'Missing required fields: trainId, date, and seats.' });
      }

      if (isNewSession) {
        setSessionCookie(res, sessionToken);
      }

      if (supabase) {
        const { data, error } = await supabase.rpc('lock_seats_atomic', {
          p_train_id: String(trainId),
          p_travel_date: travelDate,
          p_class_code: classCode,
          p_seat_numbers: seats,
          p_session_token: sessionToken,
          p_lock_duration_seconds: 300,
        });

        if (error) {
          return res.status(409).json({
            success: false,
            error: error.message || 'Seat lock acquisition failed.',
            lockedSeats: [],
            expiresIn: 0,
          });
        }

        if (data && data.success) {
          return res.status(200).json({
            success: true,
            lockedSeats: data.locked_seats || seats,
            message: data.message || `${seats.length} seat(s) held for 5 minutes.`,
            expiresIn: data.expires_in || 300,
          });
        }

        return res.status(409).json({
          success: false,
          error: data?.message || 'One or more selected seats are unavailable.',
          lockedSeats: [],
          expiresIn: 0,
        });
      }

      // Fallback response for unconfigured local environment
      return res.status(200).json({
        success: true,
        lockedSeats: seats,
        message: `${seats.length} seat(s) held for 5 minutes.`,
        expiresIn: 300,
      });
    }

    if (action === 'unlock') {
      const explicitToken = extractSessionToken(req);
      if (!explicitToken) {
        return res.status(401).json({ success: false, error: 'Session token required to release seat locks.' });
      }

      if (supabase) {
        await supabase.rpc('release_seat_locks_atomic', {
          p_session_token: explicitToken,
          p_train_id: trainId ? String(trainId) : null,
          p_travel_date: travelDate || null,
          p_class_code: classCode || null,
          p_seat_numbers: seats.length > 0 ? seats : null,
        });
      }
      return res.status(200).json({ success: true, message: 'Seats released successfully.' });
    }

    return res.status(404).json({ success: false, error: `Seats endpoint '${action}' not found.` });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Internal seats server error.' });
  }
}
