import { SCHEDULED_TRAINS } from '../_data';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query || {};
  const train = SCHEDULED_TRAINS.find(t => t.id === id || t.train_number === id);

  if (!train) {
    return res.status(404).json({ error: 'Train not found' });
  }

  return res.status(200).json({
    id: train.id,
    trainNumber: train.train_number,
    trainName: train.train_name,
    source: train.source_code,
    destination: train.dest_code,
    sourceStation: train.source_station,
    destStation: train.dest_station,
    departureTime: train.departure_time,
    arrivalTime: train.arrival_time,
    duration: train.duration,
    fare: train.fare_base,
    runsOn: train.runs_on,
    availableClasses: train.available_classes,
    totalSeats: train.total_seats || 72,
    seatsAvailable: 42
  });
}
