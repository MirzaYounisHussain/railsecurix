"""
RailSim Express - Flask Web Application Runner
AI-Secured Simulated Railway Reservation Portal
Compliant with Indian Railway Booking Patterns & IRCTC Workflow Inspiration.
"""

import os
import sys
import uuid
import random
from datetime import datetime, timedelta
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, jsonify, abort
)
from werkzeug.security import check_password_hash

# Ensure project root is in sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from database.db import (
    init_db,
    get_user_by_username,
    get_user_by_id,
    create_user,
    save_booking,
    get_bookings_by_user,
    get_booking_by_pnr,
    get_all_bookings,
    get_all_users,
    upsert_active_session,
    get_active_sessions
)
from backend.auth_utils import login_required, admin_required

FRONTEND_TEMPLATES = os.path.join(BASE_DIR, 'frontend', 'templates')
FRONTEND_STATIC = os.path.join(BASE_DIR, 'frontend', 'static')

# --------------------------------------------------------------------------
# Realistic Train Classes & Quotas Definitions
# --------------------------------------------------------------------------
CLASS_INFO = {
    '1A': {'name': '1A (AC First)', 'code': '1A', 'multiplier': 3.2},
    '2A': {'name': '2A (AC 2 Tier)', 'code': '2A', 'multiplier': 2.1},
    '3A': {'name': '3A (AC 3 Tier)', 'code': '3A', 'multiplier': 1.5},
    '3E': {'name': '3E (AC 3 Economy)', 'code': '3E', 'multiplier': 1.35},
    'CC': {'name': 'CC (AC Chair Car)', 'code': 'CC', 'multiplier': 1.25},
    'EC': {'name': 'EC (Exec Chair Car)', 'code': 'EC', 'multiplier': 2.3},
    'SL': {'name': 'SL (Sleeper)', 'code': 'SL', 'multiplier': 1.0},
    '2S': {'name': '2S (Second Sitting)', 'code': '2S', 'multiplier': 0.45},
}

QUOTA_INFO = {
    'GN': {'name': 'General (GN)', 'code': 'GN', 'surcharge_pct': 0.0},
    'TQ': {'name': 'Tatkal (TQ)', 'code': 'TQ', 'surcharge_pct': 0.25},
    'PT': {'name': 'Premium Tatkal (PT)', 'code': 'PT', 'surcharge_pct': 0.45},
    'LD': {'name': 'Ladies (LD)', 'code': 'LD', 'surcharge_pct': 0.0},
}

# --------------------------------------------------------------------------
# Simulated Train Schedule Dataset (With Realistic Classes & Runs On)
# --------------------------------------------------------------------------
SCHEDULED_TRAINS = [
    {
        "id": "T12951",
        "train_number": "12951",
        "train_name": "Tejas Rajdhani Express",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "16:55",
        "arrival_time": "08:35",
        "duration": "15h 40m",
        "fare_base": 780.0,
        "runs_on": ["M", "T", "W", "T", "F", "S", "S"],
        "available_classes": ["1A", "2A", "3A", "3E"]
    },
    {
        "id": "T12953",
        "train_number": "12953",
        "train_name": "August Kranti Tejas",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "17:15",
        "arrival_time": "10:05",
        "duration": "16h 50m",
        "fare_base": 740.0,
        "runs_on": ["M", "T", "W", "T", "F", "S", "S"],
        "available_classes": ["1A", "2A", "3A"]
    },
    {
        "id": "T22436",
        "train_number": "22436",
        "train_name": "Vande Bharat Express",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "06:00",
        "arrival_time": "14:15",
        "duration": "08h 15m",
        "fare_base": 920.0,
        "runs_on": ["M", "T", "W", "F", "S", "S"],
        "available_classes": ["CC", "EC"]
    },
    {
        "id": "T12002",
        "train_number": "12002",
        "train_name": "Shatabdi Express",
        "source_station": "NDLS - New Delhi",
        "dest_station": "BCT - Mumbai Central",
        "departure_time": "06:15",
        "arrival_time": "15:20",
        "duration": "09h 05m",
        "fare_base": 680.0,
        "runs_on": ["M", "T", "W", "T", "F", "S", "S"],
        "available_classes": ["CC", "EC"]
    },
    {
        "id": "T12622",
        "train_number": "12622",
        "train_name": "Tamil Nadu Superfast",
        "source_station": "NDLS - New Delhi",
        "dest_station": "MAS - Chennai Central",
        "departure_time": "21:05",
        "arrival_time": "06:15",
        "duration": "33h 10m",
        "fare_base": 650.0,
        "runs_on": ["M", "T", "W", "T", "F", "S", "S"],
        "available_classes": ["2A", "3A", "SL", "2S"]
    },
    {
        "id": "T12301",
        "train_number": "12301",
        "train_name": "Howrah Rajdhani Express",
        "source_station": "NDLS - New Delhi",
        "dest_station": "HWH - Howrah Junction",
        "departure_time": "16:50",
        "arrival_time": "09:55",
        "duration": "17h 05m",
        "fare_base": 820.0,
        "runs_on": ["M", "T", "W", "T", "F", "S", "S"],
        "available_classes": ["1A", "2A", "3A", "3E"]
    },
    {
        "id": "T22692",
        "train_number": "22692",
        "train_name": "Bengaluru Rajdhani",
        "source_station": "NDLS - New Delhi",
        "dest_station": "SBC - KSR Bengaluru",
        "departure_time": "20:45",
        "arrival_time": "05:20",
        "duration": "32h 35m",
        "fare_base": 890.0,
        "runs_on": ["M", "T", "W", "T", "F", "S", "S"],
        "available_classes": ["1A", "2A", "3A"]
    }
]

# --------------------------------------------------------------------------
# Dynamic Simulated Availability Engine
# --------------------------------------------------------------------------
def get_simulated_availability(train, class_code, journey_date, quota='GN'):
    """
    Dynamically generates realistic simulated berth availability and itemized fare.
    Calculated from train base, class multiplier, quota, and date seed.
    Guarantees no hardcoded availability strings.
    """
    class_meta = CLASS_INFO.get(class_code, {'name': class_code, 'multiplier': 1.0})
    quota_meta = QUOTA_INFO.get(quota, {'name': 'General', 'surcharge_pct': 0.0})

    seed_str = f"{train['id']}_{class_code}_{journey_date}_{quota}"
    val = sum(ord(c) for c in seed_str)

    if quota in ('TQ', 'PT'):
        status_mod = val % 10
        if status_mod < 6:
            seats = (val % 24) + 4
            status_text = f"AVAILABLE - {seats:02d}"
            status_type = "available"
        elif status_mod < 8:
            rac = (val % 8) + 1
            status_text = f"RAC - {rac:02d}"
            status_type = "rac"
        else:
            wl = (val % 10) + 1
            status_text = f"WL - {wl:02d}"
            status_type = "wl"
    else:
        status_mod = val % 12
        if status_mod < 8:
            seats = (val % 56) + 14
            status_text = f"AVAILABLE - {seats:02d}"
            status_type = "available"
        elif status_mod < 10:
            rac = (val % 12) + 1
            status_text = f"RAC - {rac:02d}"
            status_type = "rac"
        else:
            wl = (val % 14) + 1
            status_text = f"WL - {wl:02d}"
            status_type = "wl"

    base_single = train['fare_base'] * class_meta['multiplier']
    surcharge = base_single * quota_meta['surcharge_pct']
    single_fare = round(base_single + surcharge)

    return {
        'class_code': class_code,
        'class_name': class_meta['name'],
        'status_text': status_text,
        'status_type': status_type,
        'fare': single_fare,
        'quota': quota
    }


def create_app():
    """Application factory for RailSim Express."""
    app = Flask(
        __name__,
        template_folder=FRONTEND_TEMPLATES,
        static_folder=FRONTEND_STATIC
    )

    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'railsim-cybersecurity-prototype-key-2026')
    app.config['SESSION_COOKIE_NAME'] = 'railsim_session'
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

    # Initialize SQLite database and seed defaults
    with app.app_context():
        init_db()

    # In-memory session telemetry cache for real-time aggregation
    session_telemetry_cache = {}

    @app.before_request
    def ensure_session():
        """Ensure visitor session token is tracked in database and telemetry cache."""
        if 'session_token' not in session:
            session['session_token'] = str(uuid.uuid4())
            session['session_start'] = datetime.utcnow().isoformat()
            session['risk_score'] = 14
            session['security_action'] = 'ALLOW (Normal Access)'
            session_telemetry_cache[session['session_token']] = {
                'keystrokes': 0,
                'mouse_events': 0,
                'scrolls': 0,
                'started_at': datetime.utcnow()
            }

        # Sync active session
        try:
            upsert_active_session(
                session_token=session['session_token'],
                user_id=session.get('user_id'),
                username=session.get('username'),
                role=session.get('role', 'guest'),
                ip_address=request.remote_addr,
                user_agent=request.user_agent.string[:120] if request.user_agent else 'Unknown',
                risk_score=session.get('risk_score', 14),
                security_action=session.get('security_action', 'ALLOW (Normal Access)')
            )
        except Exception:
            pass

    # --------------------------------------------------------------------------
    # 1. Home Page (Indian Railway Search Card Layout)
    # --------------------------------------------------------------------------
    @app.route('/')
    def index():
        return render_template(
            'index.html',
            class_options=CLASS_INFO,
            quota_options=QUOTA_INFO,
            default_date=(datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d')
        )

    # --------------------------------------------------------------------------
    # 2. Train Search Form
    # --------------------------------------------------------------------------
    @app.route('/search')
    def search():
        return render_template(
            'search.html',
            class_options=CLASS_INFO,
            quota_options=QUOTA_INFO,
            default_date=(datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d')
        )

    # --------------------------------------------------------------------------
    # 3. Train Results & Availability Matrix
    # --------------------------------------------------------------------------
    @app.route('/results')
    def results():
        source = request.args.get('source', 'NDLS')
        dest = request.args.get('dest', 'BCT')
        travel_date = request.args.get('date', (datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d'))
        quota = request.args.get('quota', 'GN')
        class_pref = request.args.get('class_pref', 'ALL')

        # Filter trains matching source or destination
        matching = [
            t for t in SCHEDULED_TRAINS
            if source in t['source_station'] or dest in t['dest_station']
        ]
        if not matching:
            matching = SCHEDULED_TRAINS[:3]

        # Calculate dynamic availability for each train's available classes
        trains_with_availability = []
        for t in matching:
            t_copy = dict(t)
            avail_list = []
            for c_code in t['available_classes']:
                # If specific class filter requested, highlight or filter
                avail = get_simulated_availability(t, c_code, travel_date, quota)
                avail_list.append(avail)
            t_copy['availability_matrix'] = avail_list
            trains_with_availability.append(t_copy)

        return render_template(
            'results.html',
            trains=trains_with_availability,
            source=source,
            dest=dest,
            travel_date=travel_date,
            quota=quota,
            class_pref=class_pref,
            quota_info=QUOTA_INFO.get(quota, {'name': 'General (GN)'})
        )

    # --------------------------------------------------------------------------
    # 4. Passenger Details Form
    # --------------------------------------------------------------------------
    @app.route('/passenger')
    def passenger():
        train_id = request.args.get('train_id', 'T12951')
        travel_class = request.args.get('travel_class', '3A')
        travel_date = request.args.get('date', (datetime.utcnow() + timedelta(days=2)).strftime('%Y-%m-%d'))
        quota = request.args.get('quota', 'GN')

        train = next((t for t in SCHEDULED_TRAINS if t['id'] == train_id), SCHEDULED_TRAINS[0])
        avail = get_simulated_availability(train, travel_class, travel_date, quota)
        fare = avail['fare']

        return render_template(
            'passenger.html',
            train=train,
            travel_class=travel_class,
            travel_class_name=CLASS_INFO.get(travel_class, {}).get('name', travel_class),
            travel_date=travel_date,
            quota=quota,
            quota_name=QUOTA_INFO.get(quota, {}).get('name', quota),
            fare=fare,
            avail=avail
        )

    # --------------------------------------------------------------------------
    # 5. Booking Review & Summary Page
    # --------------------------------------------------------------------------
    @app.route('/review', methods=['POST'])
    def review():
        train_id = request.form.get('train_id', 'T12951')
        travel_class = request.form.get('travel_class', '3A')
        travel_date = request.form.get('travel_date', '2026-09-20')
        quota = request.form.get('quota', 'GN')
        fare = float(request.form.get('fare', 650.0))
        contact_mobile = request.form.get('contact_mobile', '9876543210')
        contact_email = request.form.get('contact_email', 'traveler@example.com')

        names = request.form.getlist('passenger_name[]')
        ages = request.form.getlist('passenger_age[]')
        genders = request.form.getlist('passenger_gender[]')
        berths = request.form.getlist('passenger_berth[]')

        passengers = []
        for i in range(len(names)):
            passengers.append({
                'name': names[i] or f'Passenger {i+1}',
                'age': ages[i] if i < len(ages) else 30,
                'gender': genders[i] if i < len(genders) else 'M',
                'berth': berths[i] if i < len(berths) else 'NO_PREF'
            })

        if not passengers:
            passengers = [{'name': 'Aditi Sharma', 'age': 28, 'gender': 'F', 'berth': 'LOWER'}]

        reservation_charge_per_pax = 40.0
        total_fare = int((fare + reservation_charge_per_pax) * len(passengers))
        booking_ref = f"REF-{uuid.uuid4().hex[:8].upper()}"

        train = next((t for t in SCHEDULED_TRAINS if t['id'] == train_id), SCHEDULED_TRAINS[0])

        session['current_booking'] = {
            'booking_ref': booking_ref,
            'train_id': train_id,
            'train_number': train['train_number'],
            'train_name': train['train_name'],
            'source_station': train['source_station'],
            'dest_station': train['dest_station'],
            'departure_time': train['departure_time'],
            'arrival_time': train['arrival_time'],
            'travel_class': travel_class,
            'travel_date': travel_date,
            'quota': quota,
            'fare': fare,
            'total_fare': total_fare,
            'contact_mobile': contact_mobile,
            'contact_email': contact_email,
            'passengers': passengers
        }

        return render_template(
            'review.html',
            train=train,
            travel_class=travel_class,
            travel_date=travel_date,
            quota=quota,
            fare=fare,
            total_fare=total_fare,
            passengers=passengers,
            booking_ref=booking_ref,
            contact_mobile=contact_mobile,
            contact_email=contact_email
        )

    # --------------------------------------------------------------------------
    # 6. Simulated Payment Gateway
    # --------------------------------------------------------------------------
    @app.route('/payment')
    def payment():
        booking = session.get('current_booking')
        if not booking:
            flash('No pending booking found. Please select a train.', 'warning')
            return redirect(url_for('search'))

        return render_template(
            'payment.html',
            booking_ref=booking['booking_ref'],
            total_fare=booking['total_fare'],
            booking=booking
        )

    # --------------------------------------------------------------------------
    # 7. Booking Confirmation & Electronic Reservation Slip (ERS)
    # --------------------------------------------------------------------------
    @app.route('/confirm', methods=['POST'])
    def confirm_booking():
        booking = session.get('current_booking')
        if not booking:
            flash('Session expired or booking not found.', 'warning')
            return redirect(url_for('search'))

        # Generate realistic 10-digit PNR (e.g. 245-8912304)
        pnr = f"{random.randint(200, 899)}-{random.randint(1000000, 9999999)}"

        coaches = {'1A': 'H1', '2A': 'A1', '3A': 'B2', '3E': 'M1', 'CC': 'C1', 'EC': 'E1', 'SL': 'S4', '2S': 'D2'}
        coach = coaches.get(booking['travel_class'], 'B1')

        for i, p in enumerate(booking['passengers']):
            berth_num = random.randint(1, 72)
            p['seat_allocated'] = f"{coach} - {berth_num} ({p.get('berth', 'LOWER')})"
            p['status'] = 'CNF'

        booking['pnr'] = pnr
        booking['confirmed_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        # Persist to database if user is logged in
        user_id = session.get('user_id')
        if not user_id:
            # Fallback to testuser if not logged in
            default_user = get_user_by_username('testuser')
            user_id = default_user['id'] if default_user else 1

        try:
            save_booking(user_id, booking, booking['passengers'])
        except Exception:
            pass

        return render_template(
            'confirmation.html',
            pnr=pnr,
            booking=booking
        )

    # --------------------------------------------------------------------------
    # 8. User Booking History (My Bookings)
    # --------------------------------------------------------------------------
    @app.route('/my-bookings')
    @login_required
    def my_bookings():
        user_id = session['user_id']
        bookings_list = get_bookings_by_user(user_id)
        return render_template('my_bookings.html', bookings=bookings_list)

    # --------------------------------------------------------------------------
    # 9. User Profile Page
    # --------------------------------------------------------------------------
    @app.route('/profile')
    @login_required
    def profile():
        user = get_user_by_id(session['user_id'])
        user_bookings = get_bookings_by_user(session['user_id'])
        return render_template('profile.html', user=user, bookings_count=len(user_bookings))

    # --------------------------------------------------------------------------
    # 10. Authentication: Login, Register, Logout
    # --------------------------------------------------------------------------
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '')

            user = get_user_by_username(username)
            if user and check_password_hash(user['password_hash'], password):
                session['username'] = user['username']
                session['user_id'] = user['id']
                session['role'] = user['role']
                session['full_name'] = user['full_name']
                session['email'] = user['email']

                flash(f"Signed in successfully as {user['username']}.", 'success')
                if user['role'] == 'admin':
                    return redirect(url_for('admin_dashboard'))
                return redirect(url_for('search'))
            else:
                flash('Invalid credentials. For testing, try: testuser / password123 (User) or admin / Admin@RailSim2026! (Admin).', 'danger')

        return render_template('login.html')

    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if request.method == 'POST':
            full_name = request.form.get('full_name', '').strip()
            username = request.form.get('username', '').strip()
            email = request.form.get('email', '').strip()
            password = request.form.get('password', '')
            confirm_password = request.form.get('confirm_password', '')

            if not username or not password:
                flash('Username and password are required.', 'danger')
                return render_template('register.html')

            if password != confirm_password:
                flash('Passwords do not match. Please verify.', 'danger')
                return render_template('register.html')

            new_user_id = create_user(username, password, full_name, email, role='user')
            if not new_user_id:
                flash('Username already registered. Please choose another or sign in.', 'danger')
                return render_template('register.html')

            session['username'] = username
            session['user_id'] = new_user_id
            session['role'] = 'user'
            session['full_name'] = full_name
            session['email'] = email

            flash(f'Registration successful! Welcome, {full_name or username}.', 'success')
            return redirect(url_for('search'))

        return render_template('register.html')

    @app.route('/logout')
    def logout():
        session.clear()
        flash('You have been securely signed out.', 'info')
        return redirect(url_for('index'))

    # --------------------------------------------------------------------------
    # 11. Admin Protected Routes (Role-Based Authorization Enforced)
    # --------------------------------------------------------------------------
    @app.route('/admin/dashboard')
    @admin_required
    def admin_dashboard():
        all_users = get_all_users()
        all_bookings = get_all_bookings()
        sessions = get_active_sessions()
        avg_risk = round(sum(s['risk_score'] for s in sessions) / len(sessions)) if sessions else 14
        return render_template(
            'admin/dashboard.html',
            total_users=len(all_users),
            total_bookings=len(all_bookings),
            active_sessions_count=len(sessions),
            avg_risk=avg_risk,
            recent_bookings=all_bookings[:5]
        )

    @app.route('/admin/users')
    @admin_required
    def admin_users():
        users_list = get_all_users()
        return render_template('admin/users.html', users=users_list)

    @app.route('/admin/bookings')
    @admin_required
    def admin_bookings():
        bookings_list = get_all_bookings()
        return render_template('admin/bookings.html', bookings=bookings_list)

    @app.route('/admin/security')
    @app.route('/admin/sessions')
    @admin_required
    def admin_security():
        sessions = get_active_sessions()
        return render_template('admin/security.html', sessions=sessions)

    @app.route('/admin/bot-detection')
    @admin_required
    def admin_bot_detection():
        sessions = get_active_sessions()
        return render_template('admin/bot_detection.html', sessions=sessions)

    # --------------------------------------------------------------------------
    # 12. Security Status Diagnostics (Restricted strictly to Admin)
    # --------------------------------------------------------------------------
    @app.route('/status')
    def status():
        """
        Cybersecurity diagnostic status.
        Unauthorized regular users or guests receive 403 Forbidden.
        Authenticated administrators receive full telemetry diagnostics.
        """
        if session.get('role') != 'admin':
            return render_template('403.html'), 403

        tok = session.get('session_token')
        stats = session_telemetry_cache.get(tok, {
            'keystrokes': 48,
            'mouse_dist': '1,680 px',
            'scrolls': 14,
            'dwell_time': '18.6 s'
        })
        return render_template(
            'status.html',
            risk_score=session.get('risk_score', 14),
            security_action=session.get('security_action', 'ALLOW (Normal Access)'),
            telemetry_stats=stats
        )

    # --------------------------------------------------------------------------
    # 13. Adaptive Behavioral Challenge
    # --------------------------------------------------------------------------
    @app.route('/challenge')
    def challenge():
        return render_template(
            'challenge.html',
            risk_score=session.get('risk_score', 52),
            return_url=request.args.get('return_url', '/payment')
        )

    @app.route('/verify-challenge', methods=['POST'])
    def verify_challenge():
        answer = request.form.get('challenge_answer')
        return_url = request.form.get('return_url', '/payment')

        if answer == 'TRAIN':
            flash('Verification passed successfully! Booking flow resumed.', 'success')
            session['risk_score'] = max(10, session.get('risk_score', 52) - 30)
            session['security_action'] = 'CHALLENGE_PASSED (Low Risk)'
            return redirect(return_url)
        else:
            flash('Incorrect pattern selection. Please try again.', 'danger')
            return redirect(url_for('challenge', return_url=return_url))

    # --------------------------------------------------------------------------
    # 14. API Endpoints
    # --------------------------------------------------------------------------
    @app.route('/api/health')
    def api_health():
        return jsonify({
            'status': 'healthy',
            'service': 'RailSim Express Prototype',
            'version': '1.2.0-railway-irctc-workflow',
            'timestamp': datetime.utcnow().isoformat()
        })

    @app.route('/api/telemetry/event', methods=['POST'])
    def telemetry_event():
        """Behavioral telemetry ingestion endpoint."""
        tok = session.get('session_token', 'UNKNOWN')
        data = request.get_json(silent=True) or {}
        if tok in session_telemetry_cache:
            session_telemetry_cache[tok]['keystrokes'] += len(data.get('keystrokes', []))
            session_telemetry_cache[tok]['mouse_events'] += len(data.get('mouse', []))
        return jsonify({'status': 'received', 'session': tok}), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
