"""
RailSim Express - Database Layer
Handles SQLite connection pooling, table initialization, user authentication,
booking persistence, and administrative query models.
"""

import os
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'database', 'railsim.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'database', 'schema.sql')

def get_db_path():
    """Return database path respecting testing environment overrides."""
    return os.environ.get('DATABASE_PATH', DEFAULT_DB_PATH)

def get_db_connection():
    """Create and return a configured SQLite connection with row factories."""
    db_path = get_db_path()
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON;')
    conn.execute('PRAGMA journal_mode = WAL;')
    return conn

def init_db():
    """Initialize schema and seed initial administrative and standard test users."""
    conn = get_db_connection()
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()

    # Seed Default User
    user = conn.execute('SELECT id FROM users WHERE username = ?', ('testuser',)).fetchone()
    if not user:
        conn.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            ('testuser', generate_password_hash('password123'), 'Test Traveler', 'traveler@example.com', 'user')
        )

    # Seed Default Admin
    admin = conn.execute('SELECT id FROM users WHERE username = ?', ('admin',)).fetchone()
    if not admin:
        conn.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            ('admin', generate_password_hash('Admin@RailSim2026!'), 'Security Administrator', 'security-admin@railsim.local', 'admin')
        )

    conn.commit()
    conn.close()

# --------------------------------------------------------------------------
# User Model Operations
# --------------------------------------------------------------------------
def get_user_by_username(username):
    """Retrieve user record by username."""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """Retrieve user record by primary key id."""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user

def create_user(username, password, full_name, email, role='user'):
    """Create a new user with hashed password."""
    conn = get_db_connection()
    hashed = generate_password_hash(password)
    try:
        cursor = conn.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            (username, hashed, full_name, email, role)
        )
        conn.commit()
        new_id = cursor.lastrowid
        return new_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

# --------------------------------------------------------------------------
# Booking & Passenger Operations
# --------------------------------------------------------------------------
def save_booking(user_id, booking_data, passengers):
    """
    Persist confirmed booking and its allocated passengers transactionally.
    Returns the newly created booking row ID.
    """
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            '''INSERT INTO bookings (
                   pnr, user_id, booking_ref, train_id, train_number, train_name,
                   source_station, dest_station, departure_time, arrival_time,
                   travel_class, travel_date, quota, total_fare, status,
                   contact_mobile, contact_email
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                booking_data['pnr'],
                user_id,
                booking_data.get('booking_ref', 'REF-0000'),
                booking_data['train_id'],
                booking_data['train_number'],
                booking_data['train_name'],
                booking_data['source_station'],
                booking_data['dest_station'],
                booking_data['departure_time'],
                booking_data['arrival_time'],
                booking_data['travel_class'],
                booking_data['travel_date'],
                booking_data.get('quota', 'GN'),
                booking_data['total_fare'],
                'CONFIRMED',
                booking_data.get('contact_mobile', '9876543210'),
                booking_data.get('contact_email', 'traveler@example.com')
            )
        )
        booking_id = cursor.lastrowid

        for p in passengers:
            conn.execute(
                '''INSERT INTO passengers (
                       booking_id, name, age, gender, berth_choice, seat_allocated, status
                   ) VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (
                    booking_id,
                    p.get('name', 'Passenger'),
                    int(p.get('age', 30)),
                    p.get('gender', 'M'),
                    p.get('berth', p.get('berth_choice', 'NO_PREF')),
                    p.get('seat_allocated', 'B1-12 (LOWER)'),
                    p.get('status', 'CNF')
                )
            )

        conn.commit()
        return booking_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_bookings_by_user(user_id):
    """Retrieve all bookings owned by a specific user with passenger count."""
    conn = get_db_connection()
    rows = conn.execute(
        '''SELECT b.*, COUNT(p.id) as passenger_count
           FROM bookings b
           LEFT JOIN passengers p ON b.id = p.booking_id
           WHERE b.user_id = ?
           GROUP BY b.id
           ORDER BY b.created_at DESC''',
        (user_id,)
    ).fetchall()
    conn.close()
    return rows

def get_booking_by_pnr(pnr, user_id=None):
    """
    Retrieve single booking by PNR, ensuring ownership if user_id is passed.
    Includes passenger details list.
    """
    conn = get_db_connection()
    if user_id is not None:
        booking = conn.execute(
            'SELECT * FROM bookings WHERE pnr = ? AND user_id = ?',
            (pnr, user_id)
        ).fetchone()
    else:
        booking = conn.execute(
            'SELECT * FROM bookings WHERE pnr = ?',
            (pnr,)
        ).fetchone()

    if not booking:
        conn.close()
        return None, []

    passengers = conn.execute(
        'SELECT * FROM passengers WHERE booking_id = ? ORDER BY id ASC',
        (booking['id'],)
    ).fetchall()
    conn.close()
    return booking, passengers

def get_all_bookings():
    """Retrieve global booking roster for administrator review."""
    conn = get_db_connection()
    rows = conn.execute(
        '''SELECT b.*, u.username, u.full_name, COUNT(p.id) as passenger_count
           FROM bookings b
           JOIN users u ON b.user_id = u.id
           LEFT JOIN passengers p ON b.id = p.booking_id
           GROUP BY b.id
           ORDER BY b.created_at DESC'''
    ).fetchall()
    conn.close()
    return rows

def get_all_users():
    """Retrieve all users for admin user directory."""
    conn = get_db_connection()
    rows = conn.execute(
        '''SELECT id, username, full_name, email, role, created_at,
                  (SELECT COUNT(*) FROM bookings WHERE user_id = users.id) as total_bookings
           FROM users
           ORDER BY created_at DESC'''
    ).fetchall()
    conn.close()
    return rows

# --------------------------------------------------------------------------
# Session & Telemetry Tracking
# --------------------------------------------------------------------------
def upsert_active_session(session_token, user_id=None, username=None, role='guest',
                          ip_address=None, user_agent=None, risk_score=14, security_action='ALLOW'):
    """Record or update active visitor session state."""
    conn = get_db_connection()
    conn.execute(
        '''INSERT INTO active_sessions (
               session_token, user_id, username, role, ip_address, user_agent,
               risk_score, security_action, last_active
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
           ON CONFLICT(session_token) DO UPDATE SET
               user_id = COALESCE(excluded.user_id, active_sessions.user_id),
               username = COALESCE(excluded.username, active_sessions.username),
               role = COALESCE(excluded.role, active_sessions.role),
               risk_score = excluded.risk_score,
               security_action = excluded.security_action,
               last_active = CURRENT_TIMESTAMP''',
        (session_token, user_id, username, role, ip_address, user_agent, risk_score, security_action)
    )
    conn.commit()
    conn.close()

def get_active_sessions():
    """Retrieve all active session records for cybersecurity telemetry diagnostics."""
    conn = get_db_connection()
    rows = conn.execute(
        'SELECT * FROM active_sessions ORDER BY last_active DESC LIMIT 100'
    ).fetchall()
    conn.close()
    return rows
