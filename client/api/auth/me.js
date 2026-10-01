export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const cookieHeader = req.headers?.cookie || '';
    const match = cookieHeader.match(/railsim_session=([^;]+)/);

    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      const user = JSON.parse(decoded);
      if (user && user.username) {
        return res.status(200).json({
          authenticated: true,
          user
        });
      }
    }
  } catch (e) {
    // If parsing fails, fall through to unauthenticated
  }

  return res.status(200).json({
    authenticated: false,
    user: null
  });
}
