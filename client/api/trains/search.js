import { SCHEDULED_TRAINS, getSimulatedAvailability, normalizeQuota } from '../_data.js';
import { ALL_STATIONS, INITIAL_ROUTE_CACHE } from '../_stations_data.js';

const RAILRADAR_BASE_URL = (process.env.RAILRADAR_BASE_URL || 'https://api.railradar.in').replace(/\/+$/, '');
const DEFAULT_RAILRADAR_KEY = 'rg_90dc13474f7c4078895124c57e21dc68';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

// Seed in-memory route cache with pre-cached routes from SQLite
const runtimeRouteCache = new Map();
for (const [routeKey, trains] of Object.entries(INITIAL_ROUTE_CACHE || {})) {
  runtimeRouteCache.set(routeKey, {
    trains,
    updatedAt: Date.now()
  });
}

function normalizeRailwayName(name) {
  if (!name) return '';
  return String(name).trim().replace(/\bjammutavi\b/gi, 'Jammu Tawi');
}

export function resolveStationCode(input) {
  if (!input) return '';
  const clean = String(input).trim();
  if (!clean) return '';

  const parts = clean.split(' - ');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim().toUpperCase();
  }

  const upper = clean.toUpperCase();

  // 1. Exact station code match
  const exactCode = ALL_STATIONS.find((s) => s.stationCode.toUpperCase() === upper);
  if (exactCode) return exactCode.stationCode.toUpperCase();

  // 2. Exact station name match
  const exactName = ALL_STATIONS.find((s) => s.stationName.toUpperCase() === upper);
  if (exactName) return exactName.stationCode.toUpperCase();

  // 3. Prefix or substring match on code or name
  const prefixMatch = ALL_STATIONS.find(
    (s) =>
      s.stationCode.toUpperCase().startsWith(upper) ||
      s.stationName.toUpperCase().startsWith(upper)
  );
  if (prefixMatch) return prefixMatch.stationCode.toUpperCase();

  const subMatch = ALL_STATIONS.find(
    (s) =>
      s.stationName.toUpperCase().includes(upper) ||
      (s.city && s.city.toUpperCase().includes(upper))
  );
  if (subMatch) return subMatch.stationCode.toUpperCase();

  return upper;
}

async function fetchTrainsBetweenStationsApi(srcCode, destCode) {
  const apiKey = (process.env.RAILRADAR_API_KEY || DEFAULT_RAILRADAR_KEY).trim();
  if (!apiKey) return [];

  const candidatePairs = [[srcCode, destCode]];
  if (destCode === 'BCT') candidatePairs.push([srcCode, 'MMCT']);
  else if (destCode === 'MMCT') candidatePairs.push([srcCode, 'BCT']);
  if (srcCode === 'BCT') candidatePairs.push(['MMCT', destCode]);
  else if (srcCode === 'MMCT') candidatePairs.push(['BCT', destCode]);

  const dayMap = {
    mon: 'M',
    tue: 'T',
    wed: 'W',
    thu: 'T',
    fri: 'F',
    sat: 'S',
    sun: 'S'
  };

  for (const [sC, dC] of candidatePairs) {
    const url = `${RAILRADAR_BASE_URL}/v1/trains/between/${encodeURIComponent(sC)}/${encodeURIComponent(dC)}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'RailSimExpress/1.0',
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'x-api-key': apiKey
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!resp.ok) continue;
      const payload = await resp.json();
      const rawTrains = payload?.data?.trains || [];
      if (!Array.isArray(rawTrains) || rawTrains.length === 0) continue;

      const parsed = [];
      for (const item of rawTrains) {
        const tr = item?.train || {};
        const fr = item?.from || {};
        const to = item?.to || {};
        const trainNum = String(tr.number || '').trim();
        const rawName = String(tr.name || '').trim();
        if (!trainNum || !rawName) continue;

        const cleanName = normalizeRailwayName(rawName);
        const durMins = Number(item?.duration || 0);
        const durStr = durMins > 0
          ? `${Math.floor(durMins / 60)}h ${String(durMins % 60).padStart(2, '0')}m`
          : '12h 00m';
        const dist = Number(item?.distance || 500.0) || 500.0;
        let fare = Math.round(Math.max(220.0, dist * 1.15) * 10) / 10;

        const nameUpper = cleanName.toUpperCase();
        let classes = ['1A', '2A', '3A', 'SL', '2S'];
        if (nameUpper.includes('VANDE BHARAT')) {
          classes = ['CC', 'EC'];
          fare = Math.round(fare * 1.35 * 10) / 10;
        } else if (nameUpper.includes('RAJDHANI')) {
          classes = ['1A', '2A', '3A', '3E'];
          fare = Math.round(fare * 1.25 * 10) / 10;
        } else if (nameUpper.includes('SHATABDI')) {
          classes = ['CC', 'EC'];
        } else if (nameUpper.includes('TEJAS')) {
          classes = ['1A', '2A', '3A'];
        } else if (nameUpper.includes('GARIB RATH')) {
          classes = ['3A', 'CC'];
          fare = Math.round(fare * 0.75 * 10) / 10;
        }

        const runDaysRaw = Array.isArray(tr.runDays) ? tr.runDays : [];
        let runsOn = runDaysRaw
          .map((d) => dayMap[String(d).toLowerCase()])
          .filter(Boolean);
        if (runsOn.length === 0) {
          runsOn = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        }

        const fromName = normalizeRailwayName(fr.name || sC);
        const toName = normalizeRailwayName(to.name || dC);

        const trainObj = {
          id: `T${trainNum}`,
          train_number: trainNum,
          train_name: cleanName,
          source_code: srcCode,
          dest_code: destCode,
          source_station: `${srcCode} - ${fromName}`,
          dest_station: `${destCode} - ${toName}`,
          departure_time: fr.departure || '08:00',
          arrival_time: to.arrival || '20:00',
          duration: durStr,
          fare_base: fare,
          runs_on: runsOn,
          run_days: runDaysRaw.length > 0
            ? runDaysRaw.map((d) => String(d).toLowerCase())
            : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          available_classes: classes,
          total_seats: 72
        };

        parsed.push(trainObj);

        // Register in SCHEDULED_TRAINS if not already present so fare calculation endpoint can find it
        if (!SCHEDULED_TRAINS.some((existing) => existing.id === trainObj.id)) {
          SCHEDULED_TRAINS.push(trainObj);
        }
      }

      if (parsed.length > 0) {
        return parsed;
      }
    } catch (err) {
      console.warn(`RailRadar fetch warning for ${sC}->${dC}:`, err?.message || err);
    }
  }

  return [];
}

async function getOrSyncTrainsBetween(srcCode, destCode) {
  const sClean = (srcCode || '').trim().toUpperCase();
  const dClean = (destCode || '').trim().toUpperCase();
  if (!sClean || !dClean || sClean === dClean) return [];

  const routeKey = `${sClean}_${dClean}`;
  const cached = runtimeRouteCache.get(routeKey);
  if (cached && Array.isArray(cached.trains) && cached.trains.length > 0) {
    if (Date.now() - cached.updatedAt < SEVEN_DAYS_MS) {
      return cached.trains;
    }
  }

  const liveTrains = await fetchTrainsBetweenStationsApi(sClean, dClean);
  if (liveTrains.length > 0) {
    runtimeRouteCache.set(routeKey, {
      trains: liveTrains,
      updatedAt: Date.now()
    });
    return liveTrains;
  }

  return cached?.trains || [];
}

export default async function handler(req, res) {
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

    const srcCode = resolveStationCode(source);
    const destCode = resolveStationCode(dest);

    // Prevent same source and destination station search
    if (srcCode && destCode && srcCode === destCode) {
      return res.status(400).json({
        error: 'Source and destination cannot be the same.'
      });
    }

    let matching = [];
    if (srcCode && destCode) {
      matching = await getOrSyncTrainsBetween(srcCode, destCode);
    }

    const sClean = source.toUpperCase();
    const dClean = dest.toUpperCase();

    if (matching.length === 0) {
      matching = SCHEDULED_TRAINS.filter((t) => {
        const sMatch =
          !source ||
          (srcCode && t.source_code === srcCode) ||
          sClean === t.source_code ||
          t.source_station.toUpperCase().includes(sClean) ||
          (sClean && t.source_station.toUpperCase().split(' - ')[0].includes(sClean));

        const dMatch =
          !dest ||
          (destCode && t.dest_code === destCode) ||
          dClean === t.dest_code ||
          t.dest_station.toUpperCase().includes(dClean) ||
          (dClean && t.dest_station.toUpperCase().split(' - ')[0].includes(dClean));

        return sMatch && dMatch;
      });
    }

    // Filter trains by day of week if travel_date is valid (matching backend/app.py)
    const dayNames3 = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    let curDay3 = null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [y, m, d] = date.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      if (!isNaN(dt.getTime())) {
        curDay3 = dayNames3[dt.getUTCDay()];
      }
    }

    const applicableTrains = matching.filter((t) => {
      const runDays = t.run_days;
      if (Array.isArray(runDays) && runDays.length > 0 && curDay3) {
        const cleanDays = runDays.map((d) => String(d).trim().toLowerCase());
        if (!cleanDays.includes(curDay3) && cleanDays.length < 7) {
          return false;
        }
      }
      return true;
    });

    const results = applicableTrains.map((t) => {
      const availMatrix = (t.available_classes || ['1A', '2A', '3A', 'SL']).map((cCode) =>
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
