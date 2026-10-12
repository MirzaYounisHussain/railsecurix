export default function handler(req, res) {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawAction = req.query?.action || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const action = (Array.isArray(rawAction) ? rawAction[0] : rawAction).toLowerCase();

  try {
    // ------------------------------------------------------------------------
    // POST /api/auth/login
    // ------------------------------------------------------------------------
    if (action === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
      }

      const body = req.body || {};
      const username = (body.username || '').trim();
      const password = body.password || '';

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Please enter both username and password.'
        });
      }

      const uLower = username.toLowerCase();

      // Authenticate test user
      if (uLower === 'testuser' && (password === 'TestUser@123' || password === 'password123')) {
        const user = {
          id: 1,
          username: 'testuser',
          fullName: 'Test User',
          email: 'testuser@railsecurix.com',
          role: 'user'
        };
        const cookieVal = encodeURIComponent(JSON.stringify(user));
        res.setHeader('Set-Cookie', `railsim_session=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
        return res.status(200).json({
          success: true,
          user
        });
      }

      // Authenticate admin user
      if (uLower === 'admin' && (password === 'Admin@RailSim2026!' || password === 'Admin@123' || password === 'admin123')) {
        const user = {
          id: 99,
          username: 'admin',
          fullName: 'Administrator',
          email: 'admin@railsecurix.com',
          role: 'admin'
        };
        const cookieVal = encodeURIComponent(JSON.stringify(user));
        res.setHeader('Set-Cookie', `railsim_session=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);
        return res.status(200).json({
          success: true,
          user
        });
      }

      // Return clean, explicit 401 on failed authentication
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password. Please verify your credentials.'
      });
    }

    // ------------------------------------------------------------------------
    // GET /api/auth/me
    // ------------------------------------------------------------------------
    if (action === 'me') {
      const cookieHeader = req.headers.cookie || '';
      const match = cookieHeader.match(/railsim_session=([^;]+)/);
      if (match) {
        try {
          const user = JSON.parse(decodeURIComponent(match[1]));
          return res.status(200).json({
            authenticated: true,
            user
          });
        } catch {
          // ignore corrupted cookie
        }
      }
      return res.status(200).json({
        authenticated: false,
        user: null
      });
    }

    // ------------------------------------------------------------------------
    // POST /api/auth/logout
    // ------------------------------------------------------------------------
    if (action === 'logout') {
      res.setHeader('Set-Cookie', 'railsim_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    }

    // ------------------------------------------------------------------------
    // POST /api/auth/register
    // ------------------------------------------------------------------------
    if (action === 'register') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method not allowed' });
      }

      const body = req.body || {};
      const username = (body.username || '').trim();
      const password = body.password || '';
      const fullName = (body.fullName || body.full_name || username).trim();
      const email = (body.email || `${username}@example.com`).trim();

      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
      }

      const user = {
        id: Date.now(),
        username,
        fullName: fullName || username,
        email,
        role: 'user'
      };

      const cookieVal = encodeURIComponent(JSON.stringify(user));
      res.setHeader('Set-Cookie', `railsim_session=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

      return res.status(200).json({
        success: true,
        user
      });
    }

    // Unknown action
    return res.status(404).json({
      success: false,
      error: `Auth action '${action}' not found.`
    });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal authentication error occurred.'
    });
  }
}
