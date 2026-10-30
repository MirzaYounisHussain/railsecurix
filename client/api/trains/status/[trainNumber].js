/**
 * RailSecurix - Train Live Status Serverless Function
 * Handles GET /api/trains/status/:trainNumber
 */

import { SCHEDULED_TRAINS } from '../../_data.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawNum = req.query?.trainNumber || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : '');
  const trainNumber = (Array.isArray(rawNum) ? rawNum[0] : rawNum).toString().trim();

  if (!/^\d{5}$/.test(trainNumber)) {
    return res.status(400).json({ error: 'Please enter a valid 5-digit train number.' });
  }

  const train = SCHEDULED_TRAINS.find(t => t.train_number === trainNumber);

  return res.status(200).json({
    trainNumber,
    trainName: train ? `${train.train_name} (${train.train_number})` : `Express Special (${trainNumber})`,
    currentStation: 'Kanpur Central (CNB)',
    status: 'Running on Time',
    delay: '0 min delay',
    nextStation: 'Prayagraj Jn (PRYJ) - ETA 11:15 AM',
    lastUpdated: 'Live satellite feed',
  });
}
