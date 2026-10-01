export interface TrainRecord {
  id: string;
  train_number: string;
  train_name: string;
  source_code: string;
  dest_code: string;
  source_station: string;
  dest_station: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  fare_base: number;
  runs_on: string[];
  available_classes: string[];
  total_seats: number;
}

export const CLASS_INFO: Record<string, { name: string; code: string; multiplier: number }> = {
  '1A': { name: '1A (AC First)', code: '1A', multiplier: 3.2 },
  '2A': { name: '2A (AC 2 Tier)', code: '2A', multiplier: 2.1 },
  '3A': { name: '3A (AC 3 Tier)', code: '3A', multiplier: 1.5 },
  '3E': { name: '3E (AC 3 Economy)', code: '3E', multiplier: 1.35 },
  'CC': { name: 'CC (AC Chair Car)', code: 'CC', multiplier: 1.25 },
  'EC': { name: 'EC (Exec Chair Car)', code: 'EC', multiplier: 2.3 },
  'SL': { name: 'SL (Sleeper)', code: 'SL', multiplier: 1.0 },
  '2S': { name: '2S (Second Sitting)', code: '2S', multiplier: 0.45 },
};

export const QUOTA_INFO: Record<string, { name: string; code: string; surcharge_pct: number }> = {
  'GN': { name: 'General (GN)', code: 'GN', surcharge_pct: 0.0 },
  'TQ': { name: 'Tatkal (TQ)', code: 'TQ', surcharge_pct: 0.25 },
  'PT': { name: 'Premium Tatkal (PT)', code: 'PT', surcharge_pct: 0.45 },
  'LD': { name: 'Ladies (LD)', code: 'LD', surcharge_pct: 0.0 },
};

export const SCHEDULED_TRAINS: TrainRecord[] = [
  {
    id: "T12951",
    train_number: "12951",
    train_name: "Tejas Rajdhani Express",
    source_code: "NDLS",
    dest_code: "BCT",
    source_station: "NDLS - New Delhi",
    dest_station: "BCT - Mumbai Central",
    departure_time: "16:55",
    arrival_time: "08:35",
    duration: "15h 40m",
    fare_base: 780.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["1A", "2A", "3A", "3E"],
    total_seats: 72
  },
  {
    id: "T12953",
    train_number: "12953",
    train_name: "August Kranti Tejas",
    source_code: "NDLS",
    dest_code: "BCT",
    source_station: "NDLS - New Delhi",
    dest_station: "BCT - Mumbai Central",
    departure_time: "17:15",
    arrival_time: "10:05",
    duration: "16h 50m",
    fare_base: 740.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["1A", "2A", "3A"],
    total_seats: 64
  },
  {
    id: "T22436",
    train_number: "22436",
    train_name: "Vande Bharat Express",
    source_code: "NDLS",
    dest_code: "BCT",
    source_station: "NDLS - New Delhi",
    dest_station: "BCT - Mumbai Central",
    departure_time: "06:00",
    arrival_time: "14:15",
    duration: "08h 15m",
    fare_base: 920.0,
    runs_on: ["M", "T", "W", "F", "S", "S"],
    available_classes: ["CC", "EC"],
    total_seats: 52
  },
  {
    id: "T12002",
    train_number: "12002",
    train_name: "Shatabdi Express",
    source_code: "NDLS",
    dest_code: "BCT",
    source_station: "NDLS - New Delhi",
    dest_station: "BCT - Mumbai Central",
    departure_time: "06:15",
    arrival_time: "15:20",
    duration: "09h 05m",
    fare_base: 680.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["CC", "EC"],
    total_seats: 56
  },
  {
    id: "T12622",
    train_number: "12622",
    train_name: "Tamil Nadu Superfast",
    source_code: "NDLS",
    dest_code: "MAS",
    source_station: "NDLS - New Delhi",
    dest_station: "MAS - Chennai Central",
    departure_time: "21:05",
    arrival_time: "06:15",
    duration: "33h 10m",
    fare_base: 650.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["2A", "3A", "SL", "2S"],
    total_seats: 72
  },
  {
    id: "T12301",
    train_number: "12301",
    train_name: "Howrah Rajdhani Express",
    source_code: "NDLS",
    dest_code: "HWH",
    source_station: "NDLS - New Delhi",
    dest_station: "HWH - Howrah Junction",
    departure_time: "16:50",
    arrival_time: "09:55",
    duration: "17h 05m",
    fare_base: 820.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["1A", "2A", "3A", "3E"],
    total_seats: 72
  },
  {
    id: "T22692",
    train_number: "22692",
    train_name: "Bengaluru Rajdhani",
    source_code: "NDLS",
    dest_code: "SBC",
    source_station: "NDLS - New Delhi",
    dest_station: "SBC - KSR Bengaluru",
    departure_time: "20:45",
    arrival_time: "05:20",
    duration: "32h 35m",
    fare_base: 890.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["1A", "2A", "3A"],
    total_seats: 64
  },
  {
    id: "T12295",
    train_number: "12295",
    train_name: "Sanghamitra Superfast",
    source_code: "SBC",
    dest_code: "PNBE",
    source_station: "SBC - KSR Bengaluru",
    dest_station: "PNBE - Patna Junction",
    departure_time: "09:15",
    arrival_time: "09:20",
    duration: "48h 05m",
    fare_base: 610.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["2A", "3A", "SL"],
    total_seats: 72
  },
  {
    id: "T22439",
    train_number: "22439",
    train_name: "VANDE BHARAT EX",
    source_code: "NDLS",
    dest_code: "JAT",
    source_station: "NDLS - New Delhi",
    dest_station: "JAT - Jammu Tawi",
    departure_time: "06:00",
    arrival_time: "12:43",
    duration: "06h 43m",
    fare_base: 1100.0,
    runs_on: ["M", "T", "W", "F", "S", "S"],
    available_classes: ["EC", "CC"],
    total_seats: 52
  },
  {
    id: "T12919",
    train_number: "12919",
    train_name: "MALWA EXPRESS",
    source_code: "NDLS",
    dest_code: "JAT",
    source_station: "NDLS - New Delhi",
    dest_station: "JAT - Jammu Tawi",
    departure_time: "04:30",
    arrival_time: "14:30",
    duration: "10h 00m",
    fare_base: 450.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["SL", "3E", "3A", "2A", "1A"],
    total_seats: 72
  },
  {
    id: "T12477",
    train_number: "12477",
    train_name: "JAM SVDK EXP",
    source_code: "NDLS",
    dest_code: "JAT",
    source_station: "NDLS - New Delhi",
    dest_station: "JAT - Jammu Tawi",
    departure_time: "05:40",
    arrival_time: "14:50",
    duration: "09h 10m",
    fare_base: 480.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["SL", "3E", "3A", "2A", "1A"],
    total_seats: 72
  },
  {
    id: "T20847",
    train_number: "20847",
    train_name: "DURG MCTM SF",
    source_code: "NDLS",
    dest_code: "JAT",
    source_station: "NDLS - New Delhi",
    dest_station: "JAT - Jammu Tawi",
    departure_time: "07:45",
    arrival_time: "17:43",
    duration: "09h 58m",
    fare_base: 460.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["2A", "3A", "SL"],
    total_seats: 72
  },
  {
    id: "T12809",
    train_number: "12809",
    train_name: "Mumbai CSMT - Howrah Mail",
    source_code: "BCT",
    dest_code: "HWH",
    source_station: "BCT - Mumbai Central",
    dest_station: "HWH - Howrah Junction",
    departure_time: "21:10",
    arrival_time: "05:45",
    duration: "32h 35m",
    fare_base: 710.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["1A", "2A", "3A", "SL"],
    total_seats: 72
  },
  {
    id: "T12859",
    train_number: "12859",
    train_name: "Gitanjali Express",
    source_code: "BCT",
    dest_code: "HWH",
    source_station: "BCT - Mumbai Central",
    dest_station: "HWH - Howrah Junction",
    departure_time: "06:00",
    arrival_time: "13:05",
    duration: "31h 05m",
    fare_base: 690.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["2A", "3A", "SL", "2S"],
    total_seats: 72
  },
  {
    id: "T12261",
    train_number: "12261",
    train_name: "Howrah AC Duronto",
    source_code: "BCT",
    dest_code: "HWH",
    source_station: "BCT - Mumbai Central",
    dest_station: "HWH - Howrah Junction",
    departure_time: "17:15",
    arrival_time: "19:50",
    duration: "26h 35m",
    fare_base: 880.0,
    runs_on: ["M", "T", "W", "T", "F", "S", "S"],
    available_classes: ["1A", "2A", "3A"],
    total_seats: 64
  }
];

export function getSimulatedAvailability(
  train: TrainRecord,
  classCode: string,
  journeyDate: string,
  quota: string = 'GN'
) {
  const classMeta = CLASS_INFO[classCode] || { name: classCode, code: classCode, multiplier: 1.0 };
  const quotaMeta = QUOTA_INFO[quota] || { name: 'General', code: 'GN', surcharge_pct: 0.0 };

  const seedStr = `${train.id}_${classCode}_${journeyDate}_${quota}`;
  let val = 0;
  for (let i = 0; i < seedStr.length; i++) {
    val += seedStr.charCodeAt(i);
  }

  let statusText = '';
  let statusType = 'available';
  let seats = 0;

  if (quota === 'TQ' || quota === 'PT') {
    const statusMod = val % 10;
    if (statusMod < 6) {
      seats = (val % 24) + 4;
      statusText = `AVAILABLE - ${seats.toString().padStart(2, '0')}`;
      statusType = 'available';
    } else if (statusMod < 8) {
      const rac = (val % 8) + 1;
      statusText = `RAC - ${rac.toString().padStart(2, '0')}`;
      statusType = 'rac';
    } else {
      const wl = (val % 10) + 1;
      statusText = `WL - ${wl.toString().padStart(2, '0')}`;
      statusType = 'wl';
    }
  } else {
    const statusMod = val % 12;
    if (statusMod < 8) {
      seats = (val % 56) + 14;
      statusText = `AVAILABLE - ${seats.toString().padStart(2, '0')}`;
      statusType = 'available';
    } else if (statusMod < 10) {
      const rac = (val % 12) + 1;
      statusText = `RAC - ${rac.toString().padStart(2, '0')}`;
      statusType = 'rac';
    } else {
      const wl = (val % 14) + 1;
      statusText = `WL - ${wl.toString().padStart(2, '0')}`;
      statusType = 'wl';
    }
  }

  const baseSingle = train.fare_base * classMeta.multiplier;
  const surcharge = baseSingle * quotaMeta.surcharge_pct;
  const singleFare = Math.round(baseSingle + surcharge);
  const availableCount = statusType === 'available' ? seats : 0;

  return {
    class_code: classCode,
    class_name: classMeta.name,
    status_text: statusText,
    status_type: statusType,
    available_count: availableCount,
    fare: singleFare,
    quota: quota
  };
}

export function normalizeQuota(quota?: string): string {
  if (!quota) return 'GN';
  const q = quota.trim().toUpperCase();
  if (q === 'GENERAL' || q === 'GN') return 'GN';
  if (q === 'TATKAL' || q === 'TQ') return 'TQ';
  if (q === 'PREMIUM TATKAL' || q === 'PT') return 'PT';
  if (q === 'LADIES' || q === 'LD') return 'LD';
  return 'GN';
}

export function extractStationKey(val?: string): string {
  if (!val) return '';
  const parts = val.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1].trim().toUpperCase() : val.trim().toUpperCase();
}
