"""
RailSim Express - Flask Web Application Runner
Phase 1: Simulated Railway Booking Application
"""

import os
import uuid
import random
from datetime import datetime, timedelta
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, flash, jsonify
)

# Application Paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FRONTEND_TEMPLATES = os.path.join(BASE_DIR, 'frontend', 'templates')
FRONTEND_STATIC = os.path.join(BASE_DIR, 'frontend', 'static')

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

    # Simulated Train Schedule Dataset
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
            "fare_base": 780.0
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
            "fare_base": 740.0
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
            "fare_base": 820.0
        },
        {
            "id": "T12622",
            "train_number": "12622",
            "train_name": "Tamil Nadu Express",
            "source_station": "NDLS - New Delhi",
            "dest_station": "MAS - Chennai Central",
            "departure_time": "21:05",
            "arrival_time": "06:15",
            "duration": "33h 10m",
            "fare_base": 650.0
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
            "fare_base": 890.0
        }
    ]

    # In-memory session telemetry counter for Phase 1 simulation
    session_telemetry_cache = {}

    @app.before_request
    def ensure_session():
        """Ensure every visitor receives a unique session token."""
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

    # --------------------------------------------------------------------------
    # 1. Home Page
    # --------------------------------------------------------------------------
    @app.route('/')
    def index():
        return render_template('index.html')

    # --------------------------------------------------------------------------
    # 2. Registration Page
    # --------------------------------------------------------------------------
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

            # In Phase 1 simulation, log traveler in immediately
            session['username'] = username
            session['user_id'] = random.randint(1000, 9999)
            session['full_name'] = full_name
            flash(f'Registration successful! Welcome, {full_name or username}.', 'success')
            return redirect(url_for('search'))

        return render_template('register.html')

    # --------------------------------------------------------------------------
    # 3. Login Page
    # --------------------------------------------------------------------------
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if request.method == 'POST':
            username = request.form.get('username', '').strip()
            password = request.form.get('password', '')

            # Phase 1 simulation allows login for testuser or any valid input
            if username and password:
                session['username'] = username
                session['user_id'] = random.randint(1000, 9999)
                flash(f'Signed in successfully as {username}.', 'success')
                return redirect(url_for('search'))
            else:
                flash('Invalid credentials. Try testuser / password123.', 'danger')

        return render_template('login.html')

    @app.route('/logout')
    def logout():
        session.pop('username', None)
        session.pop('user_id', None)
        flash('You have been securely signed out.', 'info')
        return redirect(url_for('index'))

    # --------------------------------------------------------------------------
    # 4. Dedicated Train Search Page
    # --------------------------------------------------------------------------
    @app.route('/search')
    def search():
        return render_template('search.html')

    # --------------------------------------------------------------------------
    # 5. Search Results Page
    # --------------------------------------------------------------------------
    @app.route('/results')
    def results():
        source = request.args.get('source', 'NDLS')
        dest = request.args.get('dest', 'BCT')
        travel_date = request.args.get('date', (datetime.utcnow() + timedelta(days=3)).strftime('%Y-%m-%d'))
        quota = request.args.get('quota', 'GN')

        # Filter or return simulated trains
        matching_trains = [
            t for t in SCHEDULED_TRAINS
            if source in t['source_station'] or dest in t['dest_station']
        ]
        if not matching_trains:
            matching_trains = SCHEDULED_TRAINS[:3]

        return render_template(
            'results.html',
            trains=matching_trains,
            source=source,
            dest=dest,
            travel_date=travel_date,
            quota=quota
        )

    # --------------------------------------------------------------------------
    # 6. Passenger Details Page
    # --------------------------------------------------------------------------
    @app.route('/passenger')
    def passenger():
        train_id = request.args.get('train_id', 'T12951')
        travel_class = request.args.get('travel_class', '3A')
        travel_date = request.args.get('date', '2026-09-20')
        quota = request.args.get('quota', 'GN')

        train = next((t for t in SCHEDULED_TRAINS if t['id'] == train_id), SCHEDULED_TRAINS[0])
        multiplier = {'1A': 3.2, '2A': 2.1, '3A': 1.5, 'SL': 1.0}.get(travel_class, 1.0)
        fare = round(train['fare_base'] * multiplier)

        return render_template(
            'passenger.html',
            train=train,
            travel_class=travel_class,
            travel_date=travel_date,
            quota=quota,
            fare=fare
        )

    # --------------------------------------------------------------------------
    # 7. Booking Review & Summary Page
    # --------------------------------------------------------------------------
    @app.route('/review', methods=['POST'])
    def review():
        train_id = request.form.get('train_id', 'T12951')
        travel_class = request.form.get('travel_class', '3A')
        travel_date = request.form.get('travel_date', '2026-09-20')
        quota = request.form.get('quota', 'GN')
        fare = float(request.form.get('fare', 650.0))

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

        total_fare = int((fare + 40.0) * len(passengers))
        booking_ref = f"REF-{uuid.uuid4().hex[:8].upper()}"

        train = next((t for t in SCHEDULED_TRAINS if t['id'] == train_id), SCHEDULED_TRAINS[0])

        # Cache pending booking in session
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
            'total_fare': total_fare,
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
            booking_ref=booking_ref
        )

    # --------------------------------------------------------------------------
    # 8. Simulated Payment Page
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
            total_fare=booking['total_fare']
        )

    # --------------------------------------------------------------------------
    # 9. Booking Confirmation Page
    # --------------------------------------------------------------------------
    @app.route('/confirm', methods=['POST'])
    def confirm_booking():
        booking = session.get('current_booking')
        if not booking:
            flash('Session expired or booking not found.', 'warning')
            return redirect(url_for('search'))

        # Generate realistic 10-digit PNR
        pnr = f"{random.randint(200, 899)}-{random.randint(1000000, 9999999)}"

        # Assign berths for each passenger
        coaches = {'1A': 'H1', '2A': 'A1', '3A': 'B2', 'SL': 'S4'}
        coach = coaches.get(booking['travel_class'], 'B1')

        for i, p in enumerate(booking['passengers']):
            berth_num = random.randint(1, 72)
            p['seat_allocated'] = f"{coach} - {berth_num} ({p.get('berth', 'LOWER')})"

        booking['pnr'] = pnr
        booking['confirmed_at'] = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

        return render_template(
            'confirmation.html',
            pnr=pnr,
            booking=booking
        )

    # --------------------------------------------------------------------------
    # 10. User & Session Status / Behavioral Diagnostics Page
    # --------------------------------------------------------------------------
    @app.route('/status')
    def status():
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
    # 11. Adaptive Verification Challenge
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
    # 12. API Health & Telemetry Ingestion Stub
    # --------------------------------------------------------------------------
    @app.route('/api/health')
    def api_health():
        return jsonify({
            'status': 'healthy',
            'service': 'RailSim Express Prototype',
            'version': '1.0.0-phase1',
            'timestamp': datetime.utcnow().isoformat()
        })

    @app.route('/api/telemetry/event', methods=['POST'])
    def telemetry_event():
        """Phase 1 telemetry endpoint stub."""
        tok = session.get('session_token', 'UNKNOWN')
        data = request.get_json(silent=True) or {}
        if tok in session_telemetry_cache:
            session_telemetry_cache[tok]['keystrokes'] += len(data.get('keystrokes', []))
        return jsonify({'status': 'received', 'session': tok}), 200

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
