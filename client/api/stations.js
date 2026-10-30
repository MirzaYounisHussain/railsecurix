import { ALL_STATIONS } from './_stations_data.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = (req.query?.q || '').toString().trim();
  const rawLimit = parseInt(req.query?.limit, 10);
  const limit = !isNaN(rawLimit) && rawLimit > 0 ? rawLimit : 100;

  if (!q) {
    return res.status(200).json(ALL_STATIONS);
  }

  const qUpper = q.toUpperCase();
  const matches = [];

  for (let i = 0; i < ALL_STATIONS.length; i++) {
    const s = ALL_STATIONS[i];
    const codeUpper = s.stationCode.toUpperCase();
    const nameUpper = s.stationName.toUpperCase();
    const cityUpper = (s.city || '').toUpperCase();

    if (
      codeUpper.includes(qUpper) ||
      nameUpper.includes(qUpper) ||
      cityUpper.includes(qUpper)
    ) {
      let rank = 3;
      if (codeUpper === qUpper) rank = 0;
      else if (codeUpper.startsWith(qUpper)) rank = 1;
      else if (nameUpper.startsWith(qUpper)) rank = 2;

      matches.push({ station: s, rank });
    }
  }

  matches.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.station.stationName.localeCompare(b.station.stationName);
  });

  return res.status(200).json(matches.slice(0, limit).map((m) => m.station));
}
