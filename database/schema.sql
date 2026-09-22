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

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_pnr ON bookings(pnr);
CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON active_sessions(session_token);
