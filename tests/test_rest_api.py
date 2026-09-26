"""
Unit and integration tests for RailSim Express REST API Endpoints.
Tests authentication, stations, trains, seat locking, authoritative fare calculation,
booking creation, PNR lookup, telemetry, and administrative role protections.
"""

import json

def test_api_health(client):
    res = client.get('/api/health')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'healthy'
    assert '2.0.0' in data['version']

def test_api_auth_me_anonymous(client):
    res = client.get('/api/auth/me')
    assert res.status_code == 200
    data = res.get_json()
    assert data['authenticated'] is False
    assert data['user'] is None

def test_api_auth_login_and_logout(client):
    # Login with valid credentials
    res = client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['user']['username'] == 'testuser'
    assert data['user']['role'] == 'user'

    # Check /api/auth/me
    me_res = client.get('/api/auth/me')
    assert me_res.status_code == 200
    me_data = me_res.get_json()
    assert me_data['authenticated'] is True
    assert me_data['user']['username'] == 'testuser'

    # Logout
    out_res = client.post('/api/auth/logout')
    assert out_res.status_code == 200

    # Me after logout
    me_after = client.get('/api/auth/me')
    assert me_after.get_json()['authenticated'] is False

def test_api_stations(client):
    res = client.get('/api/stations')
    assert res.status_code == 200
    stations = res.get_json()
    assert len(stations) >= 5
    codes = [s['stationCode'] for s in stations]
    assert 'NDLS' in codes
    assert 'BCT' in codes

def test_api_trains_search(client):
    res = client.get('/api/trains/search?source=NDLS&destination=BCT&quota=GN')
    assert res.status_code == 200
    trains = res.get_json()
    assert len(trains) >= 1
    t = trains[0]
    assert 'trainNumber' in t
    assert 'availabilityMatrix' in t
    assert len(t['availabilityMatrix']) > 0

def test_api_train_seats_and_lock(client):
    # Get seats for train
    seats_res = client.get('/api/trains/T12951/seats?date=2026-09-28&class=3A')
    assert seats_res.status_code == 200
    data = seats_res.get_json()
    assert data['trainId'] == 'T12951'
    assert len(data['seats']) >= 16

    first_seat = data['seats'][0]['seatNumber']

    # Lock seat
    lock_res = client.post('/api/seats/lock', json={
        'trainId': 'T12951',
        'date': '2026-09-28',
        'class': '3A',
        'seats': [first_seat]
    })
    assert lock_res.status_code == 200
    lock_data = lock_res.get_json()
    assert lock_data['success'] is True
    assert first_seat in lock_data['lockedSeats']
    assert lock_data['expiresIn'] == 300

def test_api_fare_calculate(client):
    res = client.post('/api/fare/calculate', json={
        'trainId': 'T12951',
        'travelClass': '3A',
        'quota': 'GN',
        'numPassengers': 2
    })
    assert res.status_code == 200
    fare = res.get_json()
    assert fare['travel_class'] == '3A'
    assert fare['num_passengers'] == 2
    assert fare['total_fare'] > 0

def test_api_booking_create_authoritative(client):
    # Log in first
    client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})

    # Attempt to tamper with totalFare from client side ($1.00)
    res = client.post('/api/bookings/create', json={
        'trainId': 'T12951',
        'travelClass': '3A',
        'travelDate': '2026-09-28',
        'quota': 'GN',
        'totalFare': 1.0,  # Client tampering attempt
        'passengers': [
            {'name': 'Rahul Verma', 'age': 32, 'gender': 'M', 'berth': 'LOWER', 'seat': '3A-1'}
        ]
    })
    assert res.status_code == 201
    booking = res.get_json()
    assert booking['success'] is True
    assert 'pnr' in booking
    assert len(booking['pnr']) == 10
    # Server must have overridden the 1.0 fare with authoritative fare
    assert booking['totalFare'] > 500

    # Verify PNR lookup
    pnr_res = client.get(f"/api/bookings/pnr/{booking['pnr']}")
    assert pnr_res.status_code == 200
    pnr_data = pnr_res.get_json()
    assert pnr_data['pnr'] == booking['pnr']
    assert pnr_data['trainNumber'] == '12951'

def test_api_admin_protection(client):
    # Anonymous request to admin API should return 401
    res = client.get('/api/admin/dashboard')
    assert res.status_code == 401

    # Traveler request to admin API should return 403
    client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})
    t_res = client.get('/api/admin/dashboard')
    assert t_res.status_code == 403

    # Admin request should return 200
    client.post('/api/auth/logout')
    client.post('/api/auth/login', json={'username': 'admin', 'password': 'Admin@RailSim2026!'})
    a_res = client.get('/api/admin/dashboard')
    assert a_res.status_code == 200
    data = a_res.get_json()
    assert 'totalUsers' in data
    assert 'totalBookings' in data
