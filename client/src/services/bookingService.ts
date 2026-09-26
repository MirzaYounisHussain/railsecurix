import { api } from "@/services/api";

export interface Seat {
  seatNumber: string;
  class: string;
  price: number;
}

export interface Booking {
  id: string;
  userId: string;
  trainId: string;
  trainNumber: string;
  trainName?: string;
  passengerName: string;
  age: number;
  gender: string;
  coach: string;
  seatNumber: string | number;
  travelDate: string; // ISO format: YYYY-MM-DD
  PNR: string;
  bookingStatus: string;
  seats?: Seat[];
  totalAmount?: number;
  fare?: number;
  source?: string;
  destination?: string;
  departureTime?: string;
  arrivalTime?: string;
  passengers?: any[];
  createdAt: any;
}

export interface CreateBookingResult {
  PNR: string;
  bookingId: number | string;
  coach: string;
  seatNumber: string | number;
  seats: Seat[];
  totalFare: number;
  status: string;
  passengers: any[];
}

export const createBooking = async (
  _userId: string,
  trainId: string,
  trainNumber: string,
  trainName: string,
  passengerName: string,
  age: number,
  gender: string,
  travelDate: string,
  totalAmount?: number,
  seats?: Seat[],
  _trainData?: any
): Promise<CreateBookingResult> => {
  const travelClass = seats && seats.length > 0 ? seats[0].class : '3A';
  const paxList = seats && seats.length > 0
    ? seats.map((s, idx) => ({
        name: idx === 0 ? passengerName : `Passenger ${idx + 1}`,
        age,
        gender,
        seat: s.seatNumber,
      }))
    : [{ name: passengerName, age, gender }];

  const res = await api.createBooking({
    trainId,
    travelClass,
    travelDate,
    quota: 'GN',
    passengers: paxList,
  });

  return {
    PNR: res.pnr,
    bookingId: res.bookingId,
    coach: travelClass,
    seatNumber: res.passengers && res.passengers[0]?.seat_allocated ? res.passengers[0].seat_allocated : 'CNF',
    seats: seats || [],
    totalFare: res.totalFare || totalAmount || 0,
    status: res.status || 'CONFIRMED',
    passengers: res.passengers || paxList,
  };
};

export const getUserBookings = async (_userId?: string): Promise<Booking[]> => {
  try {
    const list = await api.getMyBookings();
    return list.map((b: any) => ({
      id: String(b.id || b.pnr),
      userId: String(b.user_id || '1'),
      trainId: b.train_id || b.train_number,
      trainNumber: b.train_number,
      trainName: b.train_name,
      passengerName: b.passengers && b.passengers.length > 0 ? b.passengers[0].name : 'Traveler',
      age: b.passengers && b.passengers.length > 0 ? b.passengers[0].age : 30,
      gender: b.passengers && b.passengers.length > 0 ? b.passengers[0].gender : 'M',
      coach: b.travel_class,
      seatNumber: b.passengers && b.passengers.length > 0 ? b.passengers[0].seat_allocated : 'CNF',
      travelDate: b.travel_date,
      PNR: b.pnr,
      bookingStatus: b.status ? b.status.toLowerCase() : 'confirmed',
      totalAmount: b.total_fare,
      fare: b.total_fare,
      source: b.source_station,
      destination: b.dest_station,
      departureTime: b.departure_time,
      arrivalTime: b.arrival_time,
      passengers: b.passengers,
      createdAt: b.created_at,
    }));
  } catch {
    return [];
  }
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const list = await api.getAdminBookings();
    return list.map((b: any) => ({
      id: String(b.id || b.pnr),
      userId: String(b.user_id || '1'),
      trainId: b.train_id || b.train_number,
      trainNumber: b.train_number,
      trainName: b.train_name,
      passengerName: b.passengers && b.passengers.length > 0 ? b.passengers[0].name : 'Traveler',
      age: b.passengers && b.passengers.length > 0 ? b.passengers[0].age : 30,
      gender: b.passengers && b.passengers.length > 0 ? b.passengers[0].gender : 'M',
      coach: b.travel_class,
      seatNumber: b.passengers && b.passengers.length > 0 ? b.passengers[0].seat_allocated : 'CNF',
      travelDate: b.travel_date,
      PNR: b.pnr,
      bookingStatus: b.status ? b.status.toLowerCase() : 'confirmed',
      totalAmount: b.total_fare,
      fare: b.total_fare,
      source: b.source_station,
      destination: b.dest_station,
      departureTime: b.departure_time,
      arrivalTime: b.arrival_time,
      passengers: b.passengers,
      createdAt: b.created_at,
    }));
  } catch {
    return getUserBookings();
  }
};

export const cancelBooking = async (_bookingId: string, _trainId?: string): Promise<boolean> => {
  return true;
};

export const getBookingByPNR = async (pnr: string): Promise<Booking | null> => {
  try {
    const b = await api.getPNRStatus(pnr);
    if (!b) return null;
    return {
      id: b.pnr,
      userId: '1',
      trainId: b.trainNumber,
      trainNumber: b.trainNumber,
      trainName: b.trainName,
      passengerName: b.passengers && b.passengers.length > 0 ? b.passengers[0].name : 'Traveler',
      age: b.passengers && b.passengers.length > 0 ? b.passengers[0].age : 30,
      gender: b.passengers && b.passengers.length > 0 ? b.passengers[0].gender : 'M',
      coach: b.travelClass,
      seatNumber: b.passengers && b.passengers.length > 0 ? b.passengers[0].seat_allocated : 'CNF',
      travelDate: b.travelDate,
      PNR: b.pnr,
      bookingStatus: b.status ? b.status.toLowerCase() : 'confirmed',
      totalAmount: b.totalFare,
      fare: b.totalFare,
      source: b.source,
      destination: b.destination,
      departureTime: b.departureTime,
      arrivalTime: b.arrivalTime,
      passengers: b.passengers,
      createdAt: b.createdAt,
    };
  } catch {
    return null;
  }
};
