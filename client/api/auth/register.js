export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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
