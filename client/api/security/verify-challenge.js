/**
 * RailSecurix - Bot Challenge Verification Serverless Function
 * Handles POST /api/security/verify-challenge
 */

import { extractSessionToken, getSupabaseClient } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const answer = (body.challenge_answer || body.answer || '').toString().trim().toUpperCase();

  if (answer === 'TRAIN') {
    const sessionToken = extractSessionToken(req);
    const supabase = getSupabaseClient();
    if (supabase && sessionToken) {
      await supabase
        .from('active_sessions')
        .update({
          risk_score: 14,
          security_action: 'CHALLENGE_PASSED (Low Risk)',
        })
        .eq('session_token', sessionToken)
        .catch(() => {});
    }

    return res.status(200).json({
      success: true,
      riskScore: 14,
      message: 'Challenge passed successfully',
    });
  }

  return res.status(400).json({
    success: false,
    error: 'Incorrect pattern selection',
  });
}
