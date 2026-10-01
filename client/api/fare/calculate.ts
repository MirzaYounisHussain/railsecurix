import { SCHEDULED_TRAINS, CLASS_INFO, QUOTA_INFO, normalizeQuota } from '../_data';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const body = req.body || {};
  const { trainId, travelClass, quota, numPassengers = 1 } = body;

  const train = SCHEDULED_TRAINS.find(t => t.id === trainId || t.train_number === trainId) || SCHEDULED_TRAINS[0];
  const cMeta = CLASS_INFO[travelClass] || { multiplier: 1.0 };
  const qCode = normalizeQuota(quota);
  const qMeta = QUOTA_INFO[qCode] || { surcharge_pct: 0.0 };

  const baseFare = train.fare_base;
  const singleFare = Math.round((baseFare * cMeta.multiplier) * (1 + qMeta.surcharge_pct));
  const reservationFee = 40;
  const farePerPax = singleFare + reservationFee;
  const totalFare = farePerPax * Number(numPassengers || 1);

  return res.status(200).json({
    base_fare: baseFare,
    travel_class: travelClass,
    class_multiplier: cMeta.multiplier,
    quota: qCode,
    quota_surcharge_pct: qMeta.surcharge_pct,
    fare_per_passenger: farePerPax,
    reservation_fee_per_pax: reservationFee,
    num_passengers: Number(numPassengers || 1),
    total_fare: totalFare
  });
}
