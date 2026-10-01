import { SCHEDULED_TRAINS, getSimulatedAvailability, normalizeQuota, extractStationKey } from '../_data';

export default function handler(req: any, res: any) {
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

    const srcKey = extractStationKey(source);
    const destKey = extractStationKey(dest);

    // Prevent same source and destination station search
    if (srcKey && destKey && srcKey === destKey) {
      return res.status(400).json({
        error: 'Source and destination cannot be the same.'
      });
    }

    const sClean = source.toUpperCase();
    const dClean = dest.toUpperCase();

    let matching = SCHEDULED_TRAINS.filter(t => {
      const sMatch = !sClean ||
        sClean === t.source_code ||
        t.source_station.toUpperCase().includes(sClean) ||
        (srcKey && (srcKey === t.source_code || t.source_station.toUpperCase().includes(srcKey)));

      const dMatch = !dClean ||
        dClean === t.dest_code ||
        t.dest_station.toUpperCase().includes(dClean) ||
        (destKey && (destKey === t.dest_code || t.dest_station.toUpperCase().includes(destKey)));

      return sMatch && dMatch;
    });

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
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
