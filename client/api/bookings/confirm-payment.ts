export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const transactionId = `TXN-${Date.now()}`;

  return res.status(200).json({
    success: true,
    transactionId,
    status: 'SUCCESS',
    gateway: 'SIMULATED_RAIL_GATEWAY',
    timestamp: new Date().toISOString()
  });
}
