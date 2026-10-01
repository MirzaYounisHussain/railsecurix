export default function handler(req, res) {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
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
        fullName: 'Test Traveler',
        email: 'traveler@example.com',
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
    if (uLower === 'admin' && (password === 'Admin@123' || password === 'admin123')) {
      const user = {
        id: 2,
        username: 'admin',
        fullName: 'Security Administrator',
        email: 'security-admin@railsim.local',
        role: 'admin'
      };

      const cookieVal = encodeURIComponent(JSON.stringify(user));
      res.setHeader('Set-Cookie', `railsim_session=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`);

      return res.status(200).json({
        success: true,
        user
      });
    }

    // Invalid credentials
    return res.status(401).json({
      success: false,
      error: 'Invalid username or password. Please verify your credentials.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Authentication service error'
    });
  }
}
