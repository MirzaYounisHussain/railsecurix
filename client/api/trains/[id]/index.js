/**
 * RailSecurix - Train Details Serverless Function
 * Handles GET /api/trains/:id
 */

import { SCHEDULED_TRAINS } from '../../_data.js';
import { getSupabaseClient } from '../../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawId = req.query?.id || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const trainId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!trainId) {
    return res.status(400).json({ error: 'Train ID is required' });
  }

  let train = null;
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('trains')
      .select('*')
      .or(`id.eq.${trainId},train_number.eq.${trainId}`)
      .limit(1);
    if (data && data.length > 0) {
      const t = data[0];
      train = {
        id: String(t.id),
        trainNumber: t.train_number,
        trainName: t.train_name,
        source: t.source_code,
        destination: t.dest_code,
        sourceStation: t.source_station,
        destStation: t.dest_station,
        departureTime: t.departure_time,
        arrivalTime: t.arrival_time,
        duration: t.duration,
        fare: Number(t.fare_base || 650.0),
        runsOn: Array.isArray(t.runs_on) ? t.runs_on : ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        availableClasses: Array.isArray(t.available_classes) ? t.available_classes : ['1A', '2A', '3A', 'SL'],
        totalSeats: t.total_seats || 72,
      };
    }
  }

  if (!train) {
    const found = SCHEDULED_TRAINS.find(t => t.id === trainId || t.train_number === trainId);
    if (found) {
      train = {
        id: found.id,
        trainNumber: found.train_number,
        trainName: found.train_name,
        source: found.source_code,
        destination: found.dest_code,
        sourceStation: found.source_station,
        destStation: found.dest_station,
        departureTime: found.departure_time,
        arrivalTime: found.arrival_time,
        duration: found.duration,
        fare: found.fare_base,
        runsOn: found.runs_on,
        availableClasses: found.available_classes,
        totalSeats: found.total_seats || 72,
      };
    }
  }

  if (!train) {
    return res.status(404).json({ error: 'Train not found' });
  }

  return res.status(200).json(train);
}
