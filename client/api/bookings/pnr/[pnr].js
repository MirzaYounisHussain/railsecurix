export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const rawPnr = req.query?.pnr || (req.url ? req.url.split('/').filter(Boolean).pop() : '');
  const pnr = Array.isArray(rawPnr) ? rawPnr[0] : rawPnr;

  return res.status(404).json({ success: false, error: `PNR ${pnr || ''} not found in database.` });
}
