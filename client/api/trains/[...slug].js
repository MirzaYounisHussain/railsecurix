/**
 * RailSecurix - Trains Catch-All Router Serverless Function
 * Handles:
 *  - GET /api/trains/search
 *  - GET /api/trains/status/:trainNumber
 *  - GET /api/trains/:id/seats
 *  - GET /api/trains/:id
 */

import { SCHEDULED_TRAINS, getSimulatedAvailability, normalizeQuota } from '../_data.js';
import { getSupabaseClient, extractSessionToken } from '../_supabase.js';

const POPULAR_STATIONS = [
  { name: 'NEW DELHI', code: 'NDLS', full: 'NEW DELHI - NDLS' },
  { name: 'JAMMU TAWI', code: 'JAT', full: 'JAMMU TAWI - JAT' },
  { name: 'MUMBAI CENTRAL', code: 'BCT', full: 'MUMBAI CENTRAL - BCT' },
  { name: 'HOWRAH JN', code: 'HWH', full: 'HOWRAH JN - HWH' },
  { name: 'KSR BENGALURU', code: 'SBC', full: 'KSR BENGALURU - SBC' },
  { name: 'CHENNAI CENTRAL', code: 'MAS', full: 'CHENNAI CENTRAL - MAS' },
  { name: 'VARANASI JN', code: 'BSB', full: 'VARANASI JN - BSB' },
  { name: 'PUNE JN', code: 'PUNE', full: 'PUNE JN - PUNE' },
  { name: 'AHMEDABAD JN', code: 'ADI', full: 'AHMEDABAD JN - ADI' },
  { name: 'LUCKNOW NR', code: 'LKO', full: 'LUCKNOW NR - LKO' },
  { name: 'PATNA JN', code: 'PNBE', full: 'PATNA JN - PNBE' },
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse path segments: support req.query.slug (array or string) or fallback to req.url
  const rawSlug = req.query?.slug || (req.url ? req.url.split('?')[0].replace(/^\/api\/trains\/?/, '').split('/').filter(Boolean) : []);
  const slug = Array.isArray(rawSlug) ? rawSlug : [String(rawSlug)];

  const firstSeg = (slug[0] || '').toString().trim();
  const secondSeg = (slug[1] || '').toString().trim();

  // ==========================================================================
  // ROUTE 1: GET /api/trains/search
  // ==========================================================================
  if (firstSeg.toLowerCase() === 'search') {
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
          error: 'Source and destination cannot be the same.',
        });
      }

      const sClean = source.toUpperCase();
      const dClean = dest.toUpperCase();

      let trainsCatalog = SCHEDULED_TRAINS;
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data: dbTrains } = await supabase.from('trains').select('*');
        if (dbTrains && dbTrains.length > 0) {
          trainsCatalog = dbTrains.map(t => ({
            id: String(t.id),
            train_number: t.train_number,
            train_name: t.train_name,
            source_code: t.source_code,
            dest_code: t.dest_code,
            source_station: t.source_station,
            dest_station: t.dest_station,
            departure_time: t.departure_time,
            arrival_time: t.arrival_time,
            duration: t.duration,
            fare_base: Number(t.fare_base || 650.0),
            runs_on: Array.isArray(t.runs_on) ? t.runs_on : ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            available_classes: Array.isArray(t.available_classes) ? t.available_classes : ['1A', '2A', '3A', 'SL'],
            total_seats: t.total_seats || 72,
          }));
        }
      }

      let matching = trainsCatalog.filter(t => {
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

      if (matching.length === 0) {
        matching = trainsCatalog.slice(0, 4);
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
          availabilityMatrix: availMatrix,
        };
      });

      return res.status(200).json(results);
    } catch (error) {
      return res.status(500).json({ error: error?.message || 'Internal server error' });
    }
  }

  // ==========================================================================
  // ROUTE 2: GET /api/trains/status/:trainNumber
  // ==========================================================================
  if (firstSeg.toLowerCase() === 'status') {
    const rawNum = secondSeg || req.query?.trainNumber || '';
    const trainNumber = rawNum.toString().trim();

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

  // ==========================================================================
  // ROUTE 3: GET /api/trains/:id/seats
  // ==========================================================================
  if (secondSeg.toLowerCase() === 'seats' || (req.url && req.url.includes('/seats'))) {
    const trainId = firstSeg || req.query?.id || '';
    const travelDate = (req.query?.date || new Date().toISOString().slice(0, 10)).toString();
    const classCode = (req.query?.class || '3A').toString().toUpperCase();
    const sessionToken = extractSessionToken(req) || '';

    const supabase = getSupabaseClient();
    let seats = [];
    let bookedSeats = [];
    let lockedSeats = [];

    if (supabase && trainId) {
      try {
        await supabase.rpc('ensure_train_seats_initialized', {
          p_train_id: String(trainId),
          p_travel_date: travelDate,
          p_class_code: classCode,
        });

        const { data: dbSeats } = await supabase
          .from('seats')
          .select('*')
          .eq('train_id', String(trainId))
          .eq('travel_date', travelDate)
          .eq('class_code', classCode)
          .order('id');

        if (dbSeats && dbSeats.length > 0) {
          const now = new Date();
          seats = dbSeats.map(s => {
            const isBooked = Boolean(s.is_booked || s.booking_id);
            const isLocked = !isBooked && Boolean(s.locked_until && new Date(s.locked_until) > now);
            const isLockedByMe = isLocked && s.locked_by_session === sessionToken;

            if (isBooked) bookedSeats.push(s.seat_number);
            if (isLocked) lockedSeats.push(s.seat_number);

            return {
              id: s.id,
              seatNumber: s.seat_number,
              berthType: s.berth_type || (s.seat_number.includes('Window') ? 'WINDOW' : 'LOWER'),
              isBooked,
              isLocked,
              isLockedByMe,
            };
          });
        }
      } catch {
        // fallback to generated layout
      }
    }

    if (seats.length === 0) {
      for (let i = 1; i <= 36; i++) {
        const seatNum = `${classCode}-${i}`;
        const isBooked = (i % 7 === 0 || i % 11 === 0);
        const isLocked = (i === 14 || i === 22);

        if (isBooked) bookedSeats.push(seatNum);
        if (isLocked) lockedSeats.push(seatNum);

        seats.push({
          id: i,
          seatNumber: seatNum,
          berthType: i % 4 === 1 ? 'LOWER' : (i % 4 === 2 ? 'MIDDLE' : (i % 4 === 3 ? 'UPPER' : 'SIDE_LOWER')),
          isBooked,
          isLocked,
          isLockedByMe: false,
        });
      }
    }

    return res.status(200).json({
      trainId: String(trainId),
      travelDate,
      classCode,
      seats,
      bookedSeats,
      lockedSeats,
      totalSeats: seats.length,
    });
  }

  // ==========================================================================
  // ROUTE 4: GET /api/trains/:id
  // ==========================================================================
  const trainId = firstSeg || req.query?.id || '';

  if (!trainId) {
    return res.status(400).json({ error: 'Train ID is required' });
  }

  let train = null;
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase
      .from('trains')
      .select('*')
      .or(`id.eq.${trainId},train_number.eq.${trainId}`)
      .limit(1);
    if (data && data.length > 0) {
      const t = data[0];
      train = {
        id: String(t.id),
        trainNumber: t.train_number,
        trainName: t.train_name,
        source: t.source_code,
        destination: t.dest_code,
        sourceStation: t.source_station,
        destStation: t.dest_station,
        departureTime: t.departure_time,
        arrivalTime: t.arrival_time,
        duration: t.duration,
        fare: Number(t.fare_base || 650.0),
        runsOn: Array.isArray(t.runs_on) ? t.runs_on : ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
        availableClasses: Array.isArray(t.available_classes) ? t.available_classes : ['1A', '2A', '3A', 'SL'],
        totalSeats: t.total_seats || 72,
      };
    }
  }

  if (!train) {
    const found = SCHEDULED_TRAINS.find(t => t.id === trainId || t.train_number === trainId);
    if (found) {
      train = {
        id: found.id,
        trainNumber: found.train_number,
        trainName: found.train_name,
        source: found.source_code,
        destination: found.dest_code,
        sourceStation: found.source_station,
        destStation: found.dest_station,
        departureTime: found.departure_time,
        arrivalTime: found.arrival_time,
        duration: found.duration,
        fare: found.fare_base,
        runsOn: found.runs_on,
        availableClasses: found.available_classes,
        totalSeats: found.total_seats || 72,
      };
    }
  }

  if (!train) {
    return res.status(404).json({ error: 'Train not found' });
  }

  return res.status(200).json(train);
}
