/**
 * RailSecurix - Security Router Serverless Function
 * Handles:
 *  - GET /api/security/risk-score
 *  - POST /api/security/verify-challenge
 */

import { extractSessionToken, getSupabaseClient } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawAction = req.query?.action || (req.url ? req.url.split('?')[0].replace(/^\/api\/security\/?/, '').split('/').filter(Boolean)[0] : '');
  const action = (Array.isArray(rawAction) ? rawAction[0] : rawAction || '').toString().toLowerCase();

  // ==========================================================================
  // ROUTE 1: GET /api/security/risk-score
  // ==========================================================================
  if (action === 'risk-score') {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const sessionToken = extractSessionToken(req) || 'prod-session';
    let riskScore = 14;
    let securityAction = 'ALLOW (Normal Access)';

    const supabase = getSupabaseClient();
    if (supabase && sessionToken) {
      const { data } = await supabase
        .from('active_sessions')
        .select('risk_score, security_action')
        .eq('session_token', sessionToken)
        .limit(1);

      if (data && data.length > 0) {
        riskScore = data[0].risk_score || 14;
        securityAction = data[0].security_action || 'ALLOW (Normal Access)';
      }
    }

    return res.status(200).json({
      sessionToken,
      riskScore,
      securityAction,
      telemetryStats: { keystrokes: 48, mouse_events: 310, scrolls: 12 },
      explainability: [
        { feature: 'Typing Flight Time Variance', weight: 0.34, verdict: 'Normal human distribution' },
        { feature: 'Mouse Curvature & Kinematics', weight: 0.28, verdict: 'Natural cursor trajectory' },
        { feature: 'Form Dwell Latency', weight: 0.22, verdict: 'Appropriate cognitive pause' },
      ],
    });
  }

  // ==========================================================================
  // ROUTE 2: POST /api/security/verify-challenge
  // ==========================================================================
  if (action === 'verify-challenge') {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body || {};
    const answer = (body.challenge_answer || body.answer || '').toString().trim().toUpperCase();

    if (answer === 'TRAIN') {
      const sessionToken = extractSessionToken(req);
      const supabase = getSupabaseClient();
      if (supabase && sessionToken) {
        try {
          await supabase
            .from('active_sessions')
            .update({
              risk_score: 14,
              security_action: 'CHALLENGE_PASSED (Low Risk)',
            })
            .eq('session_token', sessionToken);
        } catch {}
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

  return res.status(404).json({ error: `Security action '${action}' not found.` });
}
