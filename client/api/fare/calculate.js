/**
 * RailSecurix - Fare Calculation Serverless Function
 * Handles POST /api/fare/calculate
 */

import { calculateAuthoritativeFare, getSupabaseClient } from '../_supabase.js';
import { SCHEDULED_TRAINS } from '../_data.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const trainId = body.trainId || body.train_id;
  const travelClass = body.travelClass || body.class || '3A';
  const quota = body.quota || 'GN';
  const numPassengers = parseInt(body.numPassengers || body.passengers || 1, 10) || 1;

  let train = null;
  const supabase = getSupabaseClient();
  if (supabase && trainId) {
    const { data } = await supabase
      .from('trains')
      .select('*')
      .or(`id.eq.${trainId},train_number.eq.${trainId}`)
      .limit(1);
    if (data && data.length > 0) {
      train = data[0];
    }
  }

  if (!train) {
    train = SCHEDULED_TRAINS.find(t => t.id === trainId || t.train_number === trainId) || SCHEDULED_TRAINS[0];
  }

  const breakdown = calculateAuthoritativeFare(train, travelClass, quota, numPassengers);
  return res.status(200).json(breakdown);
}
