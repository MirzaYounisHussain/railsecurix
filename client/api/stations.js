/**
 * RailSecurix - Stations Serverless Function
 * Handles GET /api/stations, POST /api/stations, and DELETE /api/stations/:id
 */

import { getSupabaseClient, extractSessionToken, resolveUserFromSession } from './_supabase.js';

const FALLBACK_STATIONS = [
  { id: '1', stationCode: 'NDLS', stationName: 'New Delhi', city: 'New Delhi', state: 'Delhi' },
  { id: '2', stationCode: 'BCT', stationName: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra' },
  { id: '3', stationCode: 'HWH', stationName: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal' },
  { id: '4', stationCode: 'MAS', stationName: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu' },
  { id: '5', stationCode: 'SBC', stationName: 'KSR Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
  { id: '6', stationCode: 'PNBE', stationName: 'Patna Junction', city: 'Patna', state: 'Bihar' },
  { id: '7', stationCode: 'JAT', stationName: 'Jammu Tawi', city: 'Jammu', state: 'Jammu and Kashmir' },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract stationId from query or URL path (/api/stations/:id)
  const rawId = req.query?.id || (req.url ? req.url.split('?')[0].replace(/^\/api\/stations\/?/, '').split('/').filter(Boolean)[0] : '');
  const stationId = Array.isArray(rawId) ? rawId[0] : rawId;

  const supabase = getSupabaseClient();

  // --------------------------------------------------------------------------
  // DELETE /api/stations/:id
  // --------------------------------------------------------------------------
  if (req.method === 'DELETE') {
    const sessionToken = extractSessionToken(req);
    const user = await resolveUserFromSession(sessionToken);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    if (!stationId) {
      return res.status(400).json({ error: 'Station ID required' });
    }

    if (supabase) {
      await supabase.from('stations').delete().eq('id', stationId);
    }

    const idx = FALLBACK_STATIONS.findIndex(s => s.id === stationId);
    if (idx !== -1) {
      FALLBACK_STATIONS.splice(idx, 1);
    }

    return res.status(200).json({ success: true });
  }

  // --------------------------------------------------------------------------
  // GET /api/stations or GET /api/stations/:id
  // --------------------------------------------------------------------------
  if (req.method === 'GET') {
    if (stationId) {
      if (supabase) {
        const { data } = await supabase
          .from('stations')
          .select('id, code, name, city, state')
          .eq('id', stationId)
          .single();
        if (data) {
          return res.status(200).json({
            id: String(data.id),
            stationCode: data.code,
            stationName: data.name,
            city: data.city || '',
            state: data.state || '',
          });
        }
      }
      const found = FALLBACK_STATIONS.find(s => s.id === stationId);
      if (found) return res.status(200).json(found);
      return res.status(404).json({ error: 'Station not found' });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('stations')
        .select('id, code, name, city, state')
        .order('name');

      if (!error && data && data.length > 0) {
        return res.status(200).json(
          data.map(s => ({
            id: String(s.id),
            stationCode: s.code,
            stationName: s.name,
            city: s.city || '',
            state: s.state || '',
          }))
        );
      }
    }
    return res.status(200).json(FALLBACK_STATIONS);
  }

  // --------------------------------------------------------------------------
  // POST /api/stations
  // --------------------------------------------------------------------------
  if (req.method === 'POST') {
    // Admin verification
    const sessionToken = extractSessionToken(req);
    const user = await resolveUserFromSession(sessionToken);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Administrator access required' });
    }

    const body = req.body || {};
    const code = (body.stationCode || body.code || '').trim().toUpperCase();
    const name = (body.stationName || body.name || '').trim();
    const city = (body.city || '').trim();
    const state = (body.state || '').trim();

    if (!code || !name) {
      return res.status(400).json({ error: 'Station code and name required' });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('stations')
        .insert({ code, name, city, state })
        .select('id')
        .single();

      if (error) {
        return res.status(409).json({ error: 'Station code already exists' });
      }
      return res.status(201).json({ success: true, id: String(data.id) });
    }

    const newId = String(Date.now());
    FALLBACK_STATIONS.push({ id: newId, stationCode: code, stationName: name, city, state });
    return res.status(201).json({ success: true, id: newId });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
