/**
 * RailSecurix - Stations ID Serverless Function
 * Handles DELETE /api/stations/:id
 */

import { getSupabaseClient, extractSessionToken, resolveUserFromSession } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Admin verification
  const sessionToken = extractSessionToken(req);
  const user = await resolveUserFromSession(sessionToken);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }

  const rawId = req.query?.id || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const stationId = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!stationId) {
    return res.status(400).json({ error: 'Station ID required' });
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    await supabase.from('stations').delete().eq('id', stationId);
  }

  return res.status(200).json({ success: true });
}
