-- RailSim Express Database Schema
-- SQLite WAL mode compliant

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pnr TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    booking_ref TEXT NOT NULL,
    train_id TEXT NOT NULL,
    train_number TEXT NOT NULL,
    train_name TEXT NOT NULL,
    source_station TEXT NOT NULL,
    dest_station TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    travel_class TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    quota TEXT NOT NULL DEFAULT 'GN',
    total_fare REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    contact_mobile TEXT,
    contact_email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    gender TEXT NOT NULL,
    berth_choice TEXT DEFAULT 'NO_PREF',
    seat_allocated TEXT,
    status TEXT DEFAULT 'CNF',
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS active_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_token TEXT UNIQUE NOT NULL,
    user_id INTEGER,
    username TEXT,
    role TEXT DEFAULT 'guest',
    ip_address TEXT,
    user_agent TEXT,
    risk_score INTEGER DEFAULT 14,
    security_action TEXT DEFAULT 'ALLOW (Normal Access)',
    keystroke_count INTEGER DEFAULT 0,
    mouse_event_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trains (
    id TEXT PRIMARY KEY,
    train_number TEXT UNIQUE NOT NULL,
    train_name TEXT NOT NULL,
    source_code TEXT NOT NULL,
    dest_code TEXT NOT NULL,
    source_station TEXT NOT NULL,
    dest_station TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration TEXT NOT NULL,
    fare_base REAL NOT NULL,
    runs_on TEXT NOT NULL,
    available_classes TEXT NOT NULL,
    total_seats INTEGER DEFAULT 72
);

CREATE TABLE IF NOT EXISTS seats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_id TEXT NOT NULL,
    travel_date TEXT NOT NULL,
    class_code TEXT NOT NULL,
    seat_number TEXT NOT NULL,
    berth_type TEXT NOT NULL,
    is_window INTEGER DEFAULT 0,
    is_booked INTEGER DEFAULT 0,
    booking_id INTEGER,
    locked_until TIMESTAMP,
    locked_by_session TEXT,
    FOREIGN KEY (booking_id) REFERENCES bookings (id) ON DELETE SET NULL,
    UNIQUE(train_id, travel_date, class_code, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_seats_lookup ON seats(train_id, travel_date, class_code);
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(code);

-- Case-insensitive uniqueness constraints for user accounts
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_nocase ON users(username COLLATE NOCASE);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_nocase ON users(email COLLATE NOCASE);

-- Secure Email OTP verification store
CREATE TABLE IF NOT EXISTS email_otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'registration',
    attempts INTEGER NOT NULL DEFAULT 0,
    verified INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps(email, purpose, verified);
CREATE INDEX IF NOT EXISTS idx_email_otps_token ON email_otps(verification_token);
