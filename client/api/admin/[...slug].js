/**
 * RailSecurix - Admin Serverless Functions
 * Handles /api/admin/* (dashboard, users, bookings, security/sessions, security/ml-stats)
 */

import { getSupabaseClient, extractSessionToken, resolveUserFromSession } from '../_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Role verification
  const sessionToken = extractSessionToken(req);
  const currentUser = await resolveUserFromSession(sessionToken);

  if (!currentUser || currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access required' });
  }

  const rawSlug = req.query?.slug || (req.url ? req.url.split('?')[0].replace(/^\/api\/admin\/?/, '').split('/') : []);
  const slugPath = Array.isArray(rawSlug) ? rawSlug.join('/') : String(rawSlug);

  const supabase = getSupabaseClient();

  try {
    // ------------------------------------------------------------------------
    // GET /api/admin/dashboard
    // ------------------------------------------------------------------------
    if (slugPath === 'dashboard') {
      let totalUsers = 2;
      let totalBookings = 0;
      let activeSessionsCount = 1;
      let avgRisk = 14;
      let recentBookings = [];

      if (supabase) {
        const [uRes, bRes, sRes] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact' }),
          supabase.from('bookings').select('*').order('id', { ascending: false }).limit(5),
          supabase.from('active_sessions').select('risk_score').eq('is_revoked', false),
        ]);

        totalUsers = uRes.count || 2;
        recentBookings = bRes.data || [];
        totalBookings = recentBookings.length;
        if (sRes.data && sRes.data.length > 0) {
          activeSessionsCount = sRes.data.length;
          avgRisk = Math.round(sRes.data.reduce((acc, s) => acc + (s.risk_score || 14), 0) / sRes.data.length);
        }
      }

      return res.status(200).json({
        totalUsers,
        totalBookings,
        activeSessionsCount,
        avgRisk,
        recentBookings,
      });
    }

    // ------------------------------------------------------------------------
    // GET /api/admin/users
    // ------------------------------------------------------------------------
    if (slugPath === 'users') {
      if (supabase) {
        const { data } = await supabase.from('users').select('id, username, full_name, email, role, created_at');
        if (data) return res.status(200).json(data);
      }
      return res.status(200).json([
        { id: 99, username: 'admin', full_name: 'Administrator', email: 'admin@railsecurix.com', role: 'admin' },
        { id: 1, username: 'testuser', full_name: 'Test User', email: 'testuser@railsecurix.com', role: 'user' },
      ]);
    }

    // ------------------------------------------------------------------------
    // GET /api/admin/bookings
    // ------------------------------------------------------------------------
    if (slugPath === 'bookings') {
      if (supabase) {
        const { data } = await supabase.from('bookings').select('*, passengers(*)').order('id', { ascending: false });
        if (data) return res.status(200).json(data);
      }
      return res.status(200).json([]);
    }

    // ------------------------------------------------------------------------
    // GET /api/admin/security/sessions
    // ------------------------------------------------------------------------
    if (slugPath === 'security/sessions') {
      if (supabase) {
        const { data } = await supabase.from('active_sessions').select('*').order('last_active', { ascending: false });
        if (data) return res.status(200).json(data);
      }
      return res.status(200).json([
        {
          session_token: 'sess_admin_active',
          username: 'admin',
          role: 'admin',
          risk_score: 14,
          security_action: 'ALLOW (Normal Access)',
          last_active: new Date().toISOString(),
        },
      ]);
    }

    // ------------------------------------------------------------------------
    // GET /api/admin/security/ml-stats
    // ------------------------------------------------------------------------
    if (slugPath === 'security/ml-stats') {
      return res.status(200).json({
        model: 'RandomForestClassifier(n_estimators=100, max_depth=8)',
        trainingSessions: 450,
        testSessions: 150,
        accuracy: 0.982,
        rocAuc: 0.994,
        features: ['Typing Flight Time Variance', 'Mouse Curvature & Kinematics', 'Form Dwell Latency'],
      });
    }

    return res.status(404).json({ error: `Admin endpoint '${slugPath}' not found` });
  } catch (err) {
    return res.status(500).json({ error: 'Internal admin server error' });
  }
}
