/**
 * RailSecurix - Telemetry Ingestion Serverless Function
 * Handles POST /api/telemetry/event
 */

import { extractSessionToken } from '../_supabase.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sessionToken = extractSessionToken(req) || 'sess_anon';
  return res.status(200).json({ status: 'received', session: sessionToken });
}
