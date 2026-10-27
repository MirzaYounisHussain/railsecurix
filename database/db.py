"""
RailSim Express - Database Layer
Handles SQLite connection pooling, table initialization, user authentication,
booking persistence, and administrative query models.
"""

import json
from datetime import datetime, timedelta
import os
import sqlite3
import hashlib
import hmac
import secrets
from werkzeug.security import generate_password_hash, check_password_hash

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'database', 'railsim.db')
SCHEMA_PATH = os.path.join(BASE_DIR, 'database', 'schema.sql')

DEFAULT_STATIONS = [
    {"code": "NDLS", "name": "New Delhi", "city": "New Delhi", "state": "Delhi"},
    {"code": "BCT", "name": "Mumbai Central", "city": "Mumbai", "state": "Maharashtra"},
    {"code": "HWH", "name": "Howrah Junction", "city": "Kolkata", "state": "West Bengal"},
    {"code": "MAS", "name": "Chennai Central", "city": "Chennai", "state": "Tamil Nadu"},
    {"code": "SBC", "name": "KSR Bengaluru", "city": "Bengaluru", "state": "Karnataka"},
    {"code": "PNBE", "name": "Patna Junction", "city": "Patna", "state": "Bihar"},
    {"code": "ADI", "name": "Ahmedabad Junction", "city": "Ahmedabad", "state": "Gujarat"},
    {"code": "PUNE", "name": "Pune Junction", "city": "Pune", "state": "Maharashtra"},
    {"code": "HYB", "name": "Hyderabad Deccan", "city": "Hyderabad", "state": "Telangana"},
    {"code": "JAT", "name": "Jammu Tawi", "city": "Jammu", "state": "Jammu & Kashmir"},
]

DEFAULT_TRAINS = [
    {
        "id": "T12951",
        "train_number": "12951",
        "train_name": "Tejas Rajdhani Express",
        "source_code": "NDLS",
        "dest_code": "BCT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "16:55",
        "arrival_time": "08:35",
        "duration": "15h 40m",
        "fare_base": 780.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["1A", "2A", "3A", "3E"]',
        "total_seats": 72
    },
    {
        "id": "T12953",
        "train_number": "12953",
        "train_name": "August Kranti Tejas",
        "source_code": "NDLS",
        "dest_code": "BCT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "17:15",
        "arrival_time": "10:05",
        "duration": "16h 50m",
        "fare_base": 740.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["1A", "2A", "3A"]',
        "total_seats": 64
    },
    {
        "id": "T22436",
        "train_number": "22436",
        "train_name": "Vande Bharat Express",
        "source_code": "NDLS",
        "dest_code": "BCT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "06:00",
        "arrival_time": "14:15",
        "duration": "08h 15m",
        "fare_base": 920.0,
        "runs_on": '["M", "T", "W", "F", "S", "S"]',
        "available_classes": '["CC", "EC"]',
        "total_seats": 52
    },
    {
        "id": "T12002",
        "train_number": "12002",
        "train_name": "Shatabdi Express",
        "source_code": "NDLS",
        "dest_code": "BCT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "06:15",
        "arrival_time": "15:20",
        "duration": "09h 05m",
        "fare_base": 680.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["CC", "EC"]',
        "total_seats": 56
    },
    {
        "id": "T12622",
        "train_number": "12622",
        "train_name": "Tamil Nadu Superfast",
        "source_code": "NDLS",
        "dest_code": "MAS",
        "source_station": "NDLS - New Delhi",
        "dest_station": "MAS - Chennai Central",
        "departure_time": "21:05",
        "arrival_time": "06:15",
        "duration": "33h 10m",
        "fare_base": 650.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["2A", "3A", "SL", "2S"]',
        "total_seats": 72
    },
    {
        "id": "T12301",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "source_code": "NDLS",
        "dest_code": "HWH",
        "source_station": "NDLS - New Delhi",
        "dest_station": "HWH - Howrah Junction",
        "departure_time": "16:50",
        "arrival_time": "09:55",
        "duration": "17h 05m",
        "fare_base": 820.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["1A", "2A", "3A", "3E"]',
        "total_seats": 72
    },
    {
        "id": "T22692",
        "train_number": "22692",
        "train_name": "Bengaluru Rajdhani",
        "source_code": "NDLS",
        "dest_code": "SBC",
        "source_station": "NDLS - New Delhi",
        "dest_station": "SBC - KSR Bengaluru",
        "departure_time": "20:45",
        "arrival_time": "06:40",
        "duration": "33h 55m",
        "fare_base": 850.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["1A", "2A", "3A"]',
        "total_seats": 64
    },
    {
        "id": "T12295",
        "train_number": "12295",
        "train_name": "Sanghamitra Superfast",
        "source_code": "SBC",
        "dest_code": "PNBE",
        "source_station": "SBC - KSR Bengaluru",
        "dest_station": "PNBE - Patna Junction",
        "departure_time": "09:15",
        "arrival_time": "09:20",
        "duration": "48h 05m",
        "fare_base": 610.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["2A", "3A", "SL"]',
        "total_seats": 72
    },
    {
        "id": "T22439",
        "train_number": "22439",
        "train_name": "VANDE BHARAT EX",
        "source_code": "NDLS",
        "dest_code": "JAT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "JAT - Jammu Tawi",
        "departure_time": "06:00",
        "arrival_time": "12:43",
        "duration": "06h 43m",
        "fare_base": 1100.0,
        "runs_on": '["M", "T", "W", "F", "S", "S"]',
        "available_classes": '["EC", "CC"]',
        "total_seats": 52
    },
    {
        "id": "T12919",
        "train_number": "12919",
        "train_name": "MALWA EXPRESS",
        "source_code": "NDLS",
        "dest_code": "JAT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "JAT - Jammu Tawi",
        "departure_time": "04:30",
        "arrival_time": "14:30",
        "duration": "10h 00m",
        "fare_base": 450.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["SL", "3E", "3A", "2A", "1A"]',
        "total_seats": 72
    },
    {
        "id": "T12477",
        "train_number": "12477",
        "train_name": "JAM SVDK EXP",
        "source_code": "NDLS",
        "dest_code": "JAT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "JAT - Jammu Tawi",
        "departure_time": "05:40",
        "arrival_time": "14:50",
        "duration": "09h 10m",
        "fare_base": 480.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["SL", "3E", "3A", "2A", "1A"]',
        "total_seats": 72
    },
    {
        "id": "T20847",
        "train_number": "20847",
        "train_name": "DURG MCTM SF",
        "source_code": "NDLS",
        "dest_code": "JAT",
        "source_station": "NDLS - New Delhi",
        "dest_station": "JAT - Jammu Tawi",
        "departure_time": "07:45",
        "arrival_time": "17:43",
        "duration": "09h 58m",
        "fare_base": 460.0,
        "runs_on": '["M", "T", "W", "T", "F", "S", "S"]',
        "available_classes": '["2A", "3A", "SL"]',
        "total_seats": 72
    }
]

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

def run_migrations(conn):
    """Ensure existing databases have all required columns without data loss."""
    # 1. Ensure bookings table has contact_mobile and contact_email
    cursor = conn.execute("PRAGMA table_info(bookings);")
    existing_booking_cols = {row['name'] if isinstance(row, sqlite3.Row) else row[1] for row in cursor.fetchall()}
    if 'contact_mobile' not in existing_booking_cols:
        conn.execute("ALTER TABLE bookings ADD COLUMN contact_mobile TEXT DEFAULT '9876543210';")
    if 'contact_email' not in existing_booking_cols:
        conn.execute("ALTER TABLE bookings ADD COLUMN contact_email TEXT DEFAULT 'traveler@example.com';")

    # 2. Ensure passengers table has berth_choice and status
    cursor = conn.execute("PRAGMA table_info(passengers);")
    existing_pax_cols = {row['name'] if isinstance(row, sqlite3.Row) else row[1] for row in cursor.fetchall()}
    if 'berth_choice' not in existing_pax_cols:
        conn.execute("ALTER TABLE passengers ADD COLUMN berth_choice TEXT DEFAULT 'NO_PREF';")
    if 'status' not in existing_pax_cols:
        conn.execute("ALTER TABLE passengers ADD COLUMN status TEXT DEFAULT 'CNF';")

    # 3. Ensure case-insensitive unique indexes on users table
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_nocase ON users(username COLLATE NOCASE);")
    conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_nocase ON users(email COLLATE NOCASE);")

    # 4. Ensure email_otps table exists
    conn.execute("""
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
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON email_otps(email, purpose, verified);")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_email_otps_token ON email_otps(verification_token);")

    conn.commit()

def _get_initial_admin_password():
    """
    Retrieve initial password for seeding the administrator account.
    In production environments (Railway / external URL), requires ADMIN_INITIAL_PASSWORD
    or ADMIN_PASSWORD to be explicitly configured. Falls back to academic test credentials
    only in local development.
    """
    admin_pass = (os.environ.get('ADMIN_INITIAL_PASSWORD') or os.environ.get('ADMIN_PASSWORD') or '').strip()
    is_production = bool(
        os.environ.get('RAILWAY_ENVIRONMENT')
        or os.environ.get('IS_PRODUCTION')
        or (os.environ.get('FRONTEND_URL') and 'localhost' not in os.environ.get('FRONTEND_URL'))
    )
    if is_production and not admin_pass:
        raise RuntimeError(
            "Production startup halted: A fresh production database was detected, but ADMIN_INITIAL_PASSWORD "
            "(or ADMIN_PASSWORD) is not set in environment variables. Set a strong initial password in your "
            "hosting environment variables to bootstrap the administrator account securely."
        )
    return admin_pass if admin_pass else 'Admin@RailSim2026!'

def init_db():
    """Initialize schema and seed initial administrative, standard test users, stations, and trains."""
    conn = get_db_connection()
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        conn.executescript(f.read())
    conn.commit()

    # Run non-destructive column migrations on existing tables
    run_migrations(conn)

    # Seed Default User
    user = conn.execute('SELECT id FROM users WHERE username = ? COLLATE NOCASE', ('testuser',)).fetchone()
    if not user:
        conn.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            ('testuser', generate_password_hash('password123'), 'Test Traveler', 'traveler@example.com', 'user')
        )

    # Seed Default Admin
    admin = conn.execute('SELECT id FROM users WHERE username = ? COLLATE NOCASE', ('admin',)).fetchone()
    if not admin:
        conn.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            ('admin', generate_password_hash(_get_initial_admin_password()), 'Security Administrator', 'security-admin@railsim.local', 'admin')
        )

    # Seed Default Stations
    for st in DEFAULT_STATIONS:
        conn.execute(
            '''INSERT OR IGNORE INTO stations (code, name, city, state)
               VALUES (?, ?, ?, ?)''',
            (st['code'], st['name'], st['city'], st['state'])
        )

    # Seed Default Trains
    for tr in DEFAULT_TRAINS:
        conn.execute(
            '''INSERT OR IGNORE INTO trains (
                   id, train_number, train_name, source_code, dest_code,
                   source_station, dest_station, departure_time, arrival_time,
                   duration, fare_base, runs_on, available_classes, total_seats
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
            (
                tr['id'], tr['train_number'], tr['train_name'], tr['source_code'], tr['dest_code'],
                tr['source_station'], tr['dest_station'], tr['departure_time'], tr['arrival_time'],
                tr['duration'], tr['fare_base'], tr['runs_on'], tr['available_classes'], tr['total_seats']
            )
        )

    conn.commit()
    conn.close()

# --------------------------------------------------------------------------
# User Model Operations
# --------------------------------------------------------------------------
def get_user_by_username(username):
    """Retrieve user record by username (case-insensitive, trimmed)."""
    if not username:
        return None
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE username = ? COLLATE NOCASE', (username.strip(),)).fetchone()
    conn.close()
    return user

def get_user_by_email(email):
    """Retrieve user record by email (case-insensitive, trimmed)."""
    if not email:
        return None
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE email = ? COLLATE NOCASE', (email.strip(),)).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """Retrieve user record by primary key id."""
    conn = get_db_connection()
    user = conn.execute('SELECT * FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    return user

def check_username_available(username):
    """Check if a username is available (case-insensitive). Returns True if free."""
    if not username or not username.strip():
        return False
    return get_user_by_username(username) is None

def check_email_available(email):
    """Check if an email is available (case-insensitive). Returns True if free."""
    if not email or not email.strip():
        return False
    return get_user_by_email(email) is None

def create_user(username, password, full_name, email, role='user'):
    """Create a new user with hashed password after enforcing case-insensitive uniqueness."""
    norm_username = (username or '').strip()
    norm_email = (email or '').strip().lower()
    norm_name = (full_name or '').strip()
    if not norm_username or not password or not norm_email:
        return None
    conn = get_db_connection()
    hashed = generate_password_hash(password)
    try:
        cursor = conn.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            (norm_username, hashed, norm_name, norm_email, role)
        )
        conn.commit()
        new_id = cursor.lastrowid
        return new_id
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

# --------------------------------------------------------------------------
# Email OTP Verification Operations
# --------------------------------------------------------------------------
def _hash_otp(otp: str, salt: str) -> str:
    """Compute deterministic SHA-256 hash for OTP with per-code salt."""
    return hashlib.sha256((salt + otp).encode('utf-8')).hexdigest()

def get_last_otp_sent_time(email: str, purpose: str = 'registration'):
    """Return datetime when the last OTP was generated for this email/purpose, or None."""
    norm_email = (email or '').strip().lower()
    conn = get_db_connection()
    row = conn.execute(
        '''SELECT created_at FROM email_otps
           WHERE email = ? AND purpose = ?
           ORDER BY id DESC LIMIT 1''',
        (norm_email, purpose)
    ).fetchone()
    conn.close()
    if not row or not row['created_at']:
        return None
    try:
        return datetime.strptime(row['created_at'], '%Y-%m-%d %H:%M:%S')
    except Exception:
        try:
            return datetime.fromisoformat(row['created_at'])
        except Exception:
            return None

def store_email_otp(email: str, otp: str, purpose: str = 'registration', expires_in_seconds: int = 300) -> bool:
    """
    Store securely hashed OTP with salt, purpose, and expiration timestamp.
    Clean up expired unverified OTPs for this email and purpose while keeping
    active unexpired OTPs valid until verified or expired.
    """
    norm_email = (email or '').strip().lower()
    salt = secrets.token_hex(16)
    otp_hash = _hash_otp(otp.strip(), salt)
    now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    expires_at = (datetime.utcnow() + timedelta(seconds=expires_in_seconds)).strftime('%Y-%m-%d %H:%M:%S')

    conn = get_db_connection()
    try:
        # Expire any already-expired unverified OTPs for this email
        conn.execute(
            '''UPDATE email_otps SET verified = -1
               WHERE email = ? AND purpose = ? AND verified = 0 AND expires_at < ?''',
            (norm_email, purpose, now_str)
        )
        conn.execute(
            '''INSERT INTO email_otps (email, otp_hash, salt, purpose, attempts, verified, expires_at)
               VALUES (?, ?, ?, ?, 0, 0, ?)''',
            (norm_email, otp_hash, salt, purpose, expires_at)
        )
        conn.commit()
        return True
    finally:
        conn.close()

def verify_email_otp(email: str, otp: str, purpose: str = 'registration', max_attempts: int = 5) -> tuple[bool, str, str | None]:
    """
    Verify OTP against stored hash for email.
    Checks any active unexpired OTP issued for this email/purpose.
    Enforces expiration, attempt limits, and single-use verification token generation.
    Returns: (is_valid: bool, message: str, verification_token: str | None)
    """
    norm_email = (email or '').strip().lower()
    clean_otp = (otp or '').strip()

    if not norm_email or not clean_otp or len(clean_otp) != 6 or not clean_otp.isdigit():
        return False, "Please enter a valid 6-digit verification code.", None

    conn = get_db_connection()
    try:
        rows = conn.execute(
            '''SELECT * FROM email_otps
               WHERE email = ? AND purpose = ? AND verified = 0
               ORDER BY id DESC''',
            (norm_email, purpose)
        ).fetchall()

        if not rows:
            return False, "No active verification code found. Please request a new code.", None

        now = datetime.utcnow()
        matched_row = None
        valid_rows = []

        for row in rows:
            try:
                expires_at = datetime.strptime(row['expires_at'], '%Y-%m-%d %H:%M:%S')
            except Exception:
                expires_at = datetime.fromisoformat(row['expires_at'])

            if now > expires_at or row['attempts'] >= max_attempts:
                conn.execute('UPDATE email_otps SET verified = -1 WHERE id = ?', (row['id'],))
                continue

            valid_rows.append(row)
            expected_hash = _hash_otp(clean_otp, row['salt'])
            if hmac.compare_digest(expected_hash, row['otp_hash']):
                matched_row = row
                break

        if matched_row:
            verification_token = secrets.token_urlsafe(32)
            # Mark the matching OTP row as successfully verified
            conn.execute(
                '''UPDATE email_otps SET verified = 1, verification_token = ? WHERE id = ?''',
                (verification_token, matched_row['id'])
            )
            # Invalidate all other pending OTPs for this email and purpose
            conn.execute(
                '''UPDATE email_otps SET verified = -1 WHERE email = ? AND purpose = ? AND verified = 0''',
                (norm_email, purpose)
            )
            conn.commit()
            return True, "Email verified successfully.", verification_token

        if not valid_rows:
            conn.commit()
            return False, "Verification code has expired. Please request a new code.", None

        # None matched - increment attempts on the most recent valid OTP
        most_recent = valid_rows[0]
        new_attempts = most_recent['attempts'] + 1
        remaining = max_attempts - new_attempts
        if remaining <= 0:
            conn.execute(
                '''UPDATE email_otps SET attempts = ?, verified = -1 WHERE email = ? AND purpose = ? AND verified = 0''',
                (new_attempts, norm_email, purpose)
            )
            conn.commit()
            return False, "Too many failed attempts. This code is locked. Please request a new code.", None
        else:
            conn.execute('UPDATE email_otps SET attempts = ? WHERE id = ?', (new_attempts, most_recent['id']))
            conn.commit()
            return False, f"Incorrect verification code. {remaining} attempt(s) remaining.", None
    finally:
        conn.close()

def consume_verification_token(email: str, token: str, purpose: str = 'registration') -> bool:
    """
    Validate and consume single-use verification token upon account creation.
    Returns True if valid and successfully consumed, False otherwise.
    """
    norm_email = (email or '').strip().lower()
    clean_token = (token or '').strip()

    if not norm_email or not clean_token:
        return False

    conn = get_db_connection()
    try:
        row = conn.execute(
            '''SELECT * FROM email_otps
               WHERE email = ? AND purpose = ? AND verified = 1 AND verification_token = ?''',
            (norm_email, purpose, clean_token)
        ).fetchone()

        if not row:
            return False

        conn.execute('UPDATE email_otps SET verification_token = NULL WHERE id = ?', (row['id'],))
        conn.commit()
        return True
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
            # Mark seat as booked in seats table if seat_allocated is given
            seat_code = (p.get('seat_allocated') or '').split(' ')[0]
            if seat_code:
                conn.execute(
                    '''UPDATE seats SET is_booked = 1, booking_id = ?, locked_until = NULL, locked_by_session = NULL
                       WHERE train_id = ? AND travel_date = ? AND seat_number = ?''',
                    (booking_id, booking_data['train_id'], booking_data['travel_date'], seat_code)
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

# --------------------------------------------------------------------------
# Station Model Operations
# --------------------------------------------------------------------------
def get_all_stations():
    """Retrieve all stations ordered by station name."""
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM stations ORDER BY name ASC').fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_station_by_code(code):
    """Retrieve station by its uppercase code (e.g. NDLS)."""
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM stations WHERE code = ?', (code.upper().strip(),)).fetchone()
    conn.close()
    return dict(row) if row else None

def add_station(code, name, city, state):
    """Add a new station record."""
    conn = get_db_connection()
    try:
        cursor = conn.execute(
            'INSERT INTO stations (code, name, city, state) VALUES (?, ?, ?, ?)',
            (code.upper().strip(), name.strip(), city.strip(), state.strip())
        )
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

def delete_station(station_id):
    """Delete a station by primary key id."""
    conn = get_db_connection()
    conn.execute('DELETE FROM stations WHERE id = ?', (station_id,))
    conn.commit()
    conn.close()

# --------------------------------------------------------------------------
# Train Model Operations
# --------------------------------------------------------------------------
def get_all_trains():
    """Retrieve all trains with deserialized schedules."""
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM trains ORDER BY train_number ASC').fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d['runs_on'] = json.loads(d['runs_on']) if isinstance(d['runs_on'], str) else d['runs_on']
        d['available_classes'] = json.loads(d['available_classes']) if isinstance(d['available_classes'], str) else d['available_classes']
        result.append(d)
    return result

def get_train_by_id(train_id):
    """Retrieve single train record by ID or train number."""
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM trains WHERE id = ? OR train_number = ?', (train_id, train_id)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d['runs_on'] = json.loads(d['runs_on']) if isinstance(d['runs_on'], str) else d['runs_on']
    d['available_classes'] = json.loads(d['available_classes']) if isinstance(d['available_classes'], str) else d['available_classes']
    return d

def search_trains_db(source='', destination='', travel_date=None):
    """Filter scheduled trains matching origin and destination station codes or names."""
    all_trains = get_all_trains()
    s_clean = (source or '').upper().strip()
    d_clean = (destination or '').upper().strip()

    matching = []
    for t in all_trains:
        s_match = not s_clean or (s_clean == t['source_code'] or s_clean in t['source_station'].upper())
        d_match = not d_clean or (d_clean == t['dest_code'] or d_clean in t['dest_station'].upper())
        if s_match and d_match:
            matching.append(t)

    return matching if matching else all_trains[:3]

# --------------------------------------------------------------------------
# Authoritative Fare Calculation Engine
# --------------------------------------------------------------------------
CLASS_MULTIPLIERS = {
    '1A': 3.2,
    '2A': 2.1,
    '3A': 1.5,
    '3E': 1.35,
    'CC': 1.25,
    'EC': 2.3,
    'SL': 1.0,
    '2S': 0.45,
}

QUOTA_SURCHARGES = {
    'GN': 0.0,
    'TQ': 0.25,
    'PT': 0.45,
    'LD': 0.0,
}

def calculate_authoritative_fare(train_id, travel_class, quota='GN', num_passengers=1):
    """
    Authoritative server-side fare calculation.
    Frontend fares are never trusted.
    """
    train = get_train_by_id(train_id)
    base = train['fare_base'] if train else 650.0
    mult = CLASS_MULTIPLIERS.get(travel_class, 1.0)
    surch = QUOTA_SURCHARGES.get(quota, 0.0)
    reservation_fee_per_pax = 40.0

    fare_per_passenger = round((base * mult) * (1.0 + surch))
    itemized = {
        'base_fare': base,
        'travel_class': travel_class,
        'class_multiplier': mult,
        'quota': quota,
        'quota_surcharge_pct': surch,
        'fare_per_passenger': fare_per_passenger,
        'reservation_fee_per_pax': reservation_fee_per_pax,
        'num_passengers': num_passengers,
        'total_fare': int((fare_per_passenger + reservation_fee_per_pax) * max(1, num_passengers))
    }
    return itemized

# --------------------------------------------------------------------------
# Seat Layout & Transactional 5-Minute Locking Engine
# --------------------------------------------------------------------------
SEATS_LAYOUT_CONFIG = {
    'SL': {'rows': 3, 'seats_per_row': 8, 'coach_prefix': 'S1'},
    '2A': {'rows': 2, 'seats_per_row': 8, 'coach_prefix': 'A1'},
    '3A': {'rows': 4, 'seats_per_row': 8, 'coach_prefix': 'B1'},
    '1A': {'rows': 2, 'seats_per_row': 4, 'coach_prefix': 'H1'},
    'CC': {'rows': 4, 'seats_per_row': 5, 'coach_prefix': 'C1'},
    'EC': {'rows': 2, 'seats_per_row': 4, 'coach_prefix': 'E1'},
    '2S': {'rows': 4, 'seats_per_row': 6, 'coach_prefix': 'D1'},
}

def get_or_create_seats_for_train(train_id, travel_date, class_code, session_token=None):
    """
    Retrieves or generates initial seat records for the specified train, travel date, and class.
    Automatically purges expired seat locks.
    Returns list of seat dicts with isBooked, isLocked, and isMine status.
    """
    conn = get_db_connection()
    now_str = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

    # Release expired locks
    conn.execute(
        '''UPDATE seats SET locked_until = NULL, locked_by_session = NULL
           WHERE locked_until IS NOT NULL AND locked_until < ?''',
        (now_str,)
    )
    conn.commit()

    existing = conn.execute(
        '''SELECT * FROM seats WHERE train_id = ? AND travel_date = ? AND class_code = ?
           ORDER BY id ASC''',
        (train_id, travel_date, class_code)
    ).fetchall()

    if not existing:
        cfg = SEATS_LAYOUT_CONFIG.get(class_code, {'rows': 3, 'seats_per_row': 8, 'coach_prefix': 'S1'})
        total_seats = cfg['rows'] * cfg['seats_per_row']
        berth_types = ['LOWER', 'MIDDLE', 'UPPER', 'SIDE_LOWER', 'SIDE_UPPER', 'WINDOW', 'AISLE']

        for i in range(total_seats):
            seat_num = f"{class_code}-{i+1}"
            berth = berth_types[i % len(berth_types)]
            is_win = 1 if (i % cfg['seats_per_row'] in (0, cfg['seats_per_row'] - 1)) else 0
            conn.execute(
                '''INSERT OR IGNORE INTO seats (
                       train_id, travel_date, class_code, seat_number, berth_type, is_window, is_booked
                   ) VALUES (?, ?, ?, ?, ?, ?, 0)''',
                (train_id, travel_date, class_code, seat_num, berth, is_win)
            )
        conn.commit()
        existing = conn.execute(
            '''SELECT * FROM seats WHERE train_id = ? AND travel_date = ? AND class_code = ?
               ORDER BY id ASC''',
            (train_id, travel_date, class_code)
        ).fetchall()

    seats_list = []
    fare_info = calculate_authoritative_fare(train_id, class_code, 'GN', 1)
    for r in existing:
        d = dict(r)
        is_locked = bool(d['locked_until'] and d['locked_until'] > now_str)
        is_mine = bool(is_locked and session_token and d['locked_by_session'] == session_token)
        seats_list.append({
            'seatNumber': d['seat_number'],
            'class': d['class_code'],
            'price': fare_info['fare_per_passenger'],
            'berthType': d['berth_type'],
            'isWindow': bool(d['is_window']),
            'isBooked': bool(d['is_booked']),
            'isLocked': is_locked,
            'isMine': is_mine,
            'lockedUntil': d['locked_until']
        })

    conn.close()
    return seats_list

def lock_seats_transactional(train_id, travel_date, class_code, seat_numbers, session_token, lock_seconds=300):
    """
    Acquires a 5-minute temporary lock on selected seats to prevent double-booking.
    Returns (success: bool, locked_seats: list, message: str, expires_in: int)
    """
    if not seat_numbers:
        return False, [], "No seats specified.", 0

    conn = get_db_connection()
    now = datetime.utcnow()
    now_str = now.strftime('%Y-%m-%d %H:%M:%S')
    expiry_time = now + timedelta(seconds=lock_seconds)
    expiry_str = expiry_time.strftime('%Y-%m-%d %H:%M:%S')

    # Release expired locks
    conn.execute(
        '''UPDATE seats SET locked_until = NULL, locked_by_session = NULL
           WHERE locked_until IS NOT NULL AND locked_until < ?''',
        (now_str,)
    )

    try:
        # Validate that no seat is booked or locked by someone else
        for seat_num in seat_numbers:
            seat = conn.execute(
                '''SELECT * FROM seats WHERE train_id = ? AND travel_date = ? AND class_code = ? AND seat_number = ?''',
                (train_id, travel_date, class_code, seat_num)
            ).fetchone()

            if seat:
                if seat['is_booked']:
                    conn.close()
                    return False, [], f"Seat {seat_num} is already booked.", 0
                if seat['locked_until'] and seat['locked_until'] > now_str and seat['locked_by_session'] != session_token:
                    conn.close()
                    return False, [], f"Seat {seat_num} is currently held by another traveler.", 0

        # Acquire lock
        for seat_num in seat_numbers:
            conn.execute(
                '''INSERT INTO seats (train_id, travel_date, class_code, seat_number, berth_type, is_window, is_booked, locked_until, locked_by_session)
                   VALUES (?, ?, ?, ?, 'LOWER', 0, 0, ?, ?)
                   ON CONFLICT(train_id, travel_date, class_code, seat_number) DO UPDATE SET
                       locked_until = excluded.locked_until,
                       locked_by_session = excluded.locked_by_session''',
                (train_id, travel_date, class_code, seat_num, expiry_str, session_token)
            )

        conn.commit()
        return True, seat_numbers, "Seats locked for 5 minutes.", lock_seconds
    except Exception as e:
        conn.rollback()
        return False, [], str(e), 0
    finally:
        conn.close()
