/**
 * RailSim Express - Authoritative Backend API Client
 * Connects React frontend directly to the Flask REST API.
 * Discards Firebase; uses server-side sessions and SQLite persistence.
 */

const API_BASE = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, '') : '') + '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers || {}),
    },
    credentials: API_BASE.startsWith('http') ? 'include' : 'same-origin',
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// --------------------------------------------------------------------------
// Authentication
// --------------------------------------------------------------------------
export interface UserProfile {
  id: number;
  username: string;
  fullName: string;
  email: string;
  role: 'user' | 'admin';
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ success: boolean; user: UserProfile }> {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async register(data: { username: string; password: string; fullName: string; email: string; confirmPassword?: string }): Promise<{ success: boolean; user: UserProfile }> {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async logout(): Promise<{ success: boolean }> {
    return request('/auth/logout', { method: 'POST' });
  },

  async getMe(): Promise<{ authenticated: boolean; user: UserProfile | null }> {
    return request('/auth/me');
  },

  // Stations
  async getStations(): Promise<Array<{ id: string; stationCode: string; stationName: string; city: string; state: string }>> {
    return request('/stations');
  },

  async addStation(data: { stationCode: string; stationName: string; city: string; state: string }): Promise<{ success: boolean; id: string }> {
    return request('/stations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteStation(id: string | number): Promise<{ success: boolean }> {
    return request(`/stations/${id}`, { method: 'DELETE' });
  },

  // Trains & Search
  async searchTrains(source: string, destination: string, date?: string, quota?: string): Promise<any[]> {
    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (quota) params.append('quota', quota);
    return request(`/trains/search?${params.toString()}`);
  },

  async getTrain(id: string): Promise<any> {
    return request(`/trains/${id}`);
  },

  // Seat Layout & 5-Minute Locking
  async getTrainSeats(trainId: string, date: string, travelClass: string): Promise<{
    trainId: string;
    travelDate: string;
    classCode: string;
    seats: any[];
    bookedSeats: string[];
    lockedSeats: string[];
    totalSeats: number;
  }> {
    return request(`/trains/${trainId}/seats?date=${encodeURIComponent(date)}&class=${encodeURIComponent(travelClass)}`);
  },

  async lockSeats(trainId: string, date: string, travelClass: string, seats: string[]): Promise<{
    success: boolean;
    lockedSeats: string[];
    message: string;
    expiresIn: number;
  }> {
    return request('/seats/lock', {
      method: 'POST',
      body: JSON.stringify({ trainId, date, class: travelClass, seats }),
    });
  },

  // Authoritative Fare Calculation
  async calculateFare(trainId: string, travelClass: string, quota: string, numPassengers: number): Promise<{
    base_fare: number;
    travel_class: string;
    class_multiplier: number;
    quota: string;
    quota_surcharge_pct: number;
    fare_per_passenger: number;
    reservation_fee_per_pax: number;
    num_passengers: number;
    total_fare: number;
  }> {
    return request('/fare/calculate', {
      method: 'POST',
      body: JSON.stringify({ trainId, travelClass, quota, numPassengers }),
    });
  },

  // Bookings & Payment
  async createBooking(payload: {
    trainId: string;
    travelClass: string;
    travelDate: string;
    quota: string;
    contactMobile?: string;
    contactEmail?: string;
    passengers: Array<{ name: string; age: number; gender: string; berth?: string; seat?: string }>;
  }): Promise<{
    success: boolean;
    pnr: string;
    bookingId: number;
    bookingRef: string;
    totalFare: number;
    status: string;
    passengers: any[];
  }> {
    return request('/bookings/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async confirmPayment(payload: { bookingRef?: string; amount?: number; method: string }): Promise<{
    success: boolean;
    transactionId: string;
    status: string;
    gateway: string;
    timestamp: string;
  }> {
    return request('/bookings/confirm-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async getMyBookings(): Promise<any[]> {
    return request('/bookings/my-bookings');
  },

  async getPNRStatus(pnr: string): Promise<any> {
    return request(`/bookings/pnr/${encodeURIComponent(pnr)}`);
  },

  // Behavioral Telemetry & Adaptive Defense
  async sendTelemetry(events: { keystrokes?: any[]; mouse?: any[]; dwell?: any }): Promise<{ status: string }> {
    return request('/telemetry/event', {
      method: 'POST',
      body: JSON.stringify(events),
    });
  },

  async getRiskScore(): Promise<{
    sessionToken: string;
    riskScore: number;
    securityAction: string;
    telemetryStats: any;
    explainability: Array<{ feature: string; weight: number; verdict: string }>;
  }> {
    return request('/security/risk-score');
  },

  async verifyChallenge(answer: string): Promise<{ success: boolean; riskScore: number; message: string }> {
    return request('/security/verify-challenge', {
      method: 'POST',
      body: JSON.stringify({ answer }),
    });
  },

  // Admin Protected APIs
  async getAdminDashboard(): Promise<any> {
    return request('/admin/dashboard');
  },

  async getAdminUsers(): Promise<any[]> {
    return request('/admin/users');
  },

  async getAdminBookings(): Promise<any[]> {
    return request('/admin/bookings');
  },

  async getAdminSessions(): Promise<any[]> {
    return request('/admin/security/sessions');
  },

  async getAdminMlStats(): Promise<any> {
    return request('/admin/security/ml-stats');
  },
};
