/**
 * RailSecurix - Risk Score Serverless Function
 * Handles GET /api/security/risk-score
 */

import { extractSessionToken, getSupabaseClient } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
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
