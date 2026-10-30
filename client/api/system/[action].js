/**
 * RailSecurix - System Diagnostics Serverless Function
 * Handles GET /api/system/supabase-status
 */

import { getSupabaseUrl, isSupabaseConfigured } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawAction = req.query?.action || (req.url ? req.url.split('?')[0].replace(/^\/api\/system\/?/, '').split('/').filter(Boolean)[0] : '');
  const action = (Array.isArray(rawAction) ? rawAction[0] : rawAction || '').toString().toLowerCase();

  // ==========================================================================
  // ROUTE 1: GET /api/system/supabase-status
  // ==========================================================================
  if (action === 'supabase-status') {
    const url = getSupabaseUrl();
    const configured = isSupabaseConfigured();
    const startTime = Date.now();

    try {
      const resp = await fetch(`${url}/rest/v1/`, { method: 'GET', signal: AbortSignal.timeout(8000) });
      const latencyMs = Date.now() - startTime;

      if (configured) {
        return res.status(200).json({
          success: true,
          configured: true,
          projectUrl: url,
          status: 'connected',
          latencyMs,
          message: 'Supabase PostgreSQL database connection active and authenticated.',
        });
      }

      if (resp.status === 401 || resp.status === 200) {
        return res.status(200).json({
          success: true,
          configured: false,
          projectUrl: url,
          status: 'awaiting_key',
          latencyMs,
          message: 'Supabase project endpoint is online and reachable. Awaiting publishable key in environment variables.',
        });
      }

      return res.status(200).json({
        success: false,
        configured: false,
        projectUrl: url,
        status: 'unexpected_status',
        latencyMs,
        message: `Supabase endpoint responded with status ${resp.status}.`,
      });
    } catch (err) {
      return res.status(200).json({
        success: false,
        configured: false,
        projectUrl: url,
        status: 'unreachable',
        latencyMs: Date.now() - startTime,
        message: `Network error connecting to Supabase: ${err.message}`,
      });
    }
  }

  return res.status(404).json({ error: `System action '${action}' not found.` });
}
