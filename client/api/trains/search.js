import { SCHEDULED_TRAINS, getSimulatedAvailability, normalizeQuota } from '../_data.js';

const POPULAR_STATIONS = [
  { name: "NEW DELHI", code: "NDLS", full: "NEW DELHI - NDLS" },
  { name: "JAMMU TAWI", code: "JAT", full: "JAMMU TAWI - JAT" },
  { name: "MUMBAI CENTRAL", code: "BCT", full: "MUMBAI CENTRAL - BCT" },
  { name: "HOWRAH JN", code: "HWH", full: "HOWRAH JN - HWH" },
  { name: "KSR BENGALURU", code: "SBC", full: "KSR BENGALURU - SBC" },
  { name: "CHENNAI CENTRAL", code: "MAS", full: "CHENNAI CENTRAL - MAS" },
  { name: "VARANASI JN", code: "BSB", full: "VARANASI JN - BSB" },
  { name: "PUNE JN", code: "PUNE", full: "PUNE JN - PUNE" },
  { name: "AHMEDABAD JN", code: "ADI", full: "AHMEDABAD JN - ADI" },
  { name: "LUCKNOW NR", code: "LKO", full: "LUCKNOW NR - LKO" },
  { name: "PATNA JN", code: "PNBE", full: "PATNA JN - PNBE" },
];

function getStationCode(input) {
  if (!input) return '';
  const clean = input.trim().toUpperCase();
  const found = POPULAR_STATIONS.find(s =>
    s.code === clean || s.name === clean || s.full === clean || clean.includes(s.code) || clean.includes(s.name)
  );
  if (found) return found.code;
  const parts = clean.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim() : clean;
}

export default function handler(req, res) {
  // CORS & caching headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const source = (req.query?.source || '').toString().trim();
    const dest = (req.query?.destination || '').toString().trim();
    const date = (req.query?.date || new Date().toISOString().slice(0, 10)).toString().trim();
    const quotaParam = (req.query?.quota || 'GN').toString().trim();
    const normQuota = normalizeQuota(quotaParam);

    const srcCode = getStationCode(source);
    const destCode = getStationCode(dest);

    // Prevent same source and destination station search
    if (srcCode && destCode && srcCode === destCode) {
      return res.status(400).json({
        error: 'Source and destination cannot be the same.'
      });
    }

    const sClean = source.toUpperCase();
    const dClean = dest.toUpperCase();

    let matching = SCHEDULED_TRAINS.filter(t => {
      const sMatch = !source ||
        (srcCode && t.source_code === srcCode) ||
        sClean === t.source_code ||
        t.source_station.toUpperCase().includes(sClean) ||
        (sClean && t.source_station.toUpperCase().split(' - ')[0].includes(sClean));

      const dMatch = !dest ||
        (destCode && t.dest_code === destCode) ||
        dClean === t.dest_code ||
        t.dest_station.toUpperCase().includes(dClean) ||
        (dClean && t.dest_station.toUpperCase().split(' - ')[0].includes(dClean));

      return sMatch && dMatch;
    });

    // If no direct routes match, fallback to the network's top active express trains
    if (matching.length === 0) {
      matching = SCHEDULED_TRAINS.slice(0, 4);
    }

    const results = matching.map(t => {
      const availMatrix = t.available_classes.map(cCode =>
        getSimulatedAvailability(t, cCode, date, normQuota)
      );

      return {
        id: t.id,
        trainNumber: t.train_number,
        trainName: t.train_name,
        source: t.source_code,
        destination: t.dest_code,
        sourceStation: t.source_station,
        destStation: t.dest_station,
        departureTime: t.departure_time,
        arrivalTime: t.arrival_time,
        duration: t.duration,
        fare: t.fare_base,
        runsOn: t.runs_on,
        availableClasses: t.available_classes,
        totalSeats: t.total_seats || 72,
        seatsAvailable: availMatrix[0] ? availMatrix[0].available_count : 42,
        availabilityMatrix: availMatrix
      };
    });

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}

