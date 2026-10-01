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
  travelDate: string; // ISO format or string
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

const STORAGE_PREFIX = "railsim_bookings_";

export const getStorageKey = (usernameOrId?: string): string => {
  const userKey = (usernameOrId || "testuser").trim().toLowerCase();
  return `${STORAGE_PREFIX}${userKey}`;
};

export const saveUserBookingLocal = (usernameOrId: string, booking: Booking): void => {
  if (typeof window === "undefined" || !booking || !booking.PNR) return;
  try {
    const key = getStorageKey(usernameOrId);
    const existingRaw = localStorage.getItem(key);
    const existing: Booking[] = existingRaw ? JSON.parse(existingRaw) : [];
    // Deduplicate by PNR
    const filtered = existing.filter((b) => b.PNR !== booking.PNR);
    filtered.unshift(booking);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to save booking to localStorage:", err);
  }
};

export const getLocalUserBookings = (usernameOrId?: string): Booking[] => {
  if (typeof window === "undefined") return [];
  try {
    const key = getStorageKey(usernameOrId);
    const existingRaw = localStorage.getItem(key);
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch (err) {
    console.error("Failed to read bookings from localStorage:", err);
    return [];
  }
};

export const createBooking = async (
  userId: string,
  trainId: string,
  trainNumber: string,
  trainName: string,
  passengerName: string,
  age: number,
  gender: string,
  travelDate: string,
  totalAmount?: number,
  seats?: Seat[],
  trainData?: any
): Promise<CreateBookingResult> => {
  const travelClass = seats && seats.length > 0 ? seats[0].class : "3A";
  const paxList =
    seats && seats.length > 0
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
    quota: "GN",
    passengers: paxList,
  });

  const seatAllocated =
    res.passengers && res.passengers[0]?.seat_allocated
      ? res.passengers[0].seat_allocated
      : "CNF";

  const result: CreateBookingResult = {
    PNR: res.pnr,
    bookingId: res.bookingId,
    coach: travelClass,
    seatNumber: seatAllocated,
    seats: seats || [],
    totalFare: res.totalFare || totalAmount || 0,
    status: res.status || "CONFIRMED",
    passengers: res.passengers || paxList,
  };

  // Persist locally for user
  const newBooking: Booking = {
    id: String(res.bookingId || res.pnr),
    userId: userId || "testuser",
    trainId: String(trainId || trainNumber),
    trainNumber: String(trainNumber),
    trainName: trainName || (trainData && trainData.trainName) || `Express (${trainNumber})`,
    passengerName,
    age,
    gender,
    coach: travelClass,
    seatNumber: seatAllocated,
    travelDate,
    PNR: res.pnr,
    bookingStatus: "confirmed",
    totalAmount: result.totalFare,
    fare: result.totalFare,
    source: trainData?.source || "NDLS",
    destination: trainData?.destination || "BCT",
    departureTime: trainData?.departureTime || "06:00 AM",
    arrivalTime: trainData?.arrivalTime || "12:43 PM",
    passengers: result.passengers,
    createdAt: new Date().toISOString(),
  };

  saveUserBookingLocal(userId || "testuser", newBooking);

  return result;
};

export const getUserBookings = async (usernameOrId?: string): Promise<Booking[]> => {
  const localList = getLocalUserBookings(usernameOrId);

  let apiList: Booking[] = [];
  try {
    const list = await api.getMyBookings();
    if (Array.isArray(list) && list.length > 0) {
      apiList = list.map((b: any) => ({
        id: String(b.id || b.pnr),
        userId: String(b.user_id || usernameOrId || "testuser"),
        trainId: b.train_id || b.train_number,
        trainNumber: b.train_number,
        trainName: b.train_name,
        passengerName: b.passengers && b.passengers.length > 0 ? b.passengers[0].name : "Traveler",
        age: b.passengers && b.passengers.length > 0 ? b.passengers[0].age : 30,
        gender: b.passengers && b.passengers.length > 0 ? b.passengers[0].gender : "M",
        coach: b.travel_class,
        seatNumber: b.passengers && b.passengers.length > 0 ? (b.passengers[0].seat_allocated || "CNF") : "CNF",
        travelDate: b.travel_date,
        PNR: b.pnr,
        bookingStatus: b.status ? b.status.toLowerCase() : "confirmed",
        totalAmount: b.total_fare,
        fare: b.total_fare,
        source: b.source_station,
        destination: b.dest_station,
        departureTime: b.departure_time,
        arrivalTime: b.arrival_time,
        passengers: b.passengers,
        createdAt: b.created_at || new Date().toISOString(),
      }));
    }
  } catch {
    // Rely on localList if backend is offline or empty
  }

  // Combine and deduplicate by PNR (local bookings take precedence for richer UI state)
  const map = new Map<string, Booking>();
  apiList.forEach((b) => {
    if (b.PNR) map.set(b.PNR, b);
  });
  localList.forEach((b) => {
    if (b.PNR) map.set(b.PNR, b);
  });

  return Array.from(map.values());
};

export const getAllBookings = async (): Promise<Booking[]> => {
  try {
    const list = await api.getAdminBookings();
    return list.map((b: any) => ({
      id: String(b.id || b.pnr),
      userId: String(b.user_id || "1"),
      trainId: b.train_id || b.train_number,
      trainNumber: b.train_number,
      trainName: b.train_name,
      passengerName: b.passengers && b.passengers.length > 0 ? b.passengers[0].name : "Traveler",
      age: b.passengers && b.passengers.length > 0 ? b.passengers[0].age : 30,
      gender: b.passengers && b.passengers.length > 0 ? b.passengers[0].gender : "M",
      coach: b.travel_class,
      seatNumber: b.passengers && b.passengers.length > 0 ? b.passengers[0].seat_allocated : "CNF",
      travelDate: b.travel_date,
      PNR: b.pnr,
      bookingStatus: b.status ? b.status.toLowerCase() : "confirmed",
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
    return getUserBookings("admin");
  }
};

export const cancelBooking = async (bookingId: string, _trainId?: string): Promise<boolean> => {
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const bookings: Booking[] = JSON.parse(raw);
            const updated = bookings.map((b) =>
              b.id === bookingId || b.PNR === bookingId
                ? { ...b, bookingStatus: "cancelled" }
                : b
            );
            localStorage.setItem(key, JSON.stringify(updated));
          }
        }
      }
    } catch {
      // ignore
    }
  }
  return true;
};

export const getBookingByPNR = async (pnr: string): Promise<Booking | null> => {
  const cleanPnr = (pnr || "").trim();
  if (!cleanPnr) return null;

  // 1. Check local storage across user keys
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const bookings: Booking[] = JSON.parse(raw);
            const found = bookings.find((b) => b.PNR === cleanPnr);
            if (found) return found;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Check API
  try {
    const b = await api.getPNRStatus(cleanPnr);
    if (!b) return null;
    return {
      id: b.pnr,
      userId: "1",
      trainId: b.trainNumber,
      trainNumber: b.trainNumber,
      trainName: b.trainName,
      passengerName: b.passengers && b.passengers.length > 0 ? b.passengers[0].name : "Traveler",
      age: b.passengers && b.passengers.length > 0 ? b.passengers[0].age : 30,
      gender: b.passengers && b.passengers.length > 0 ? b.passengers[0].gender : "M",
      coach: b.travelClass || b.coach || "CC",
      seatNumber: b.passengers && b.passengers.length > 0 ? (b.passengers[0].seat_allocated || "CNF") : "CNF",
      travelDate: b.travelDate,
      PNR: b.pnr,
      bookingStatus: b.status ? b.status.toLowerCase() : "confirmed",
      totalAmount: b.totalFare,
      fare: b.totalFare,
      source: b.source,
      destination: b.destination,
      departureTime: b.departureTime,
      arrivalTime: b.arrivalTime,
      passengers: b.passengers,
      createdAt: b.createdAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
};
