"""
Tests for Phase 1: Simulated Railway Booking Website.
Verifies all 12 views, session initialization, workflow transitions, and simulated payment.
"""

def test_api_health(client):
    """Verify health endpoint returns healthy status."""
    response = client.get('/api/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert 'RailSecurix' in data['service']

def test_index_page(client):
    """Verify home page loads and displays branding."""
    response = client.get('/')
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'RailSecurix' in html
    assert 'Book Train Ticket' in html
    assert 'Railway Ticket Reservation' in html

def test_register_flow(client):
    """Verify registration page rendering and form submission."""
    # GET request
    get_res = client.get('/register')
    assert get_res.status_code == 200
    assert 'Create Traveler Account' in get_res.get_data(as_text=True)

    # POST request
    post_res = client.post('/register', data={
        'full_name': 'Test Passenger',
        'username': 'testpass',
        'email': 'testpass@example.com',
        'password': 'Password123!',
        'confirm_password': 'Password123!'
    }, follow_redirects=True)
    assert post_res.status_code == 200
    html = post_res.get_data(as_text=True)
    assert 'Registration successful' in html
    assert 'Train Route & Schedule Search' in html

def test_login_flow(client):
    """Verify sign in and session persistence."""
    # GET request
    get_res = client.get('/login')
    assert get_res.status_code == 200
    assert 'Sign In' in get_res.get_data(as_text=True)

    # POST request
    post_res = client.post('/login', data={
        'username': 'testuser',
        'password': 'password123'
    }, follow_redirects=True)
    assert post_res.status_code == 200
    html = post_res.get_data(as_text=True)
    assert 'Signed in successfully as testuser' in html

def test_search_page(client):
    """Verify dedicated train search page."""
    response = client.get('/search')
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'Train Route & Schedule Search' in html
    assert 'NDLS' in html
    assert 'BCT' in html

def test_results_page(client):
    """Verify train search results rendering."""
    response = client.get('/results?source=NDLS&dest=BCT&date=2026-09-20&quota=GN')
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'NDLS &rarr; BCT' in html
    assert 'Tejas Rajdhani Express' in html
    assert '1A (AC First)' in html
    assert '3A (AC 3 Tier)' in html

def test_passenger_page(client):
    """Verify passenger details form."""
    response = client.get('/passenger?train_id=T12951&travel_class=3A&date=2026-09-20&quota=GN')
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'Passenger Information' in html
    assert 'Tejas Rajdhani Express' in html
    assert 'Base Fare per passenger' in html

def test_complete_booking_workflow(client):
    """
    End-to-End simulated flow:
    Review -> Payment -> Confirmation (PNR generation).
    """
    # 1. Submit Passenger Details to Review
    review_res = client.post('/review', data={
        'train_id': 'T12951',
        'travel_class': '3A',
        'travel_date': '2026-09-20',
        'quota': 'GN',
        'fare': '1170.0',
        'passenger_name[]': ['Dr. Vikram Sen', 'Priya Sen'],
        'passenger_age[]': ['34', '31'],
        'passenger_gender[]': ['M', 'F'],
        'passenger_berth[]': ['LOWER', 'MIDDLE']
    })
    assert review_res.status_code == 200
    review_html = review_res.get_data(as_text=True)
    assert 'Review Journey Details' in review_html
    assert 'Dr. Vikram Sen' in review_html
    assert 'Priya Sen' in review_html

    # 2. Proceed to Simulated Payment Page
    payment_res = client.get('/payment')
    assert payment_res.status_code == 200
    payment_html = payment_res.get_data(as_text=True)
    assert 'Simulated Payment' in payment_html
    assert 'SIMULATED PAYMENT ENVIRONMENT' in payment_html
    assert 'traveler@mockpay' in payment_html

    # 3. Authorize Simulated Payment & Confirm
    confirm_res = client.post('/confirm', data={
        'booking_ref': 'REF-12345',
        'total_fare': '2420'
    })
    assert confirm_res.status_code == 200
    confirm_html = confirm_res.get_data(as_text=True)
    assert 'TICKET BOOKED SUCCESSFULLY' in confirm_html
    assert 'PASSENGER NAME RECORD (PNR)' in confirm_html
    assert 'Dr. Vikram Sen' in confirm_html
    assert 'CONFIRMED' in confirm_html

def test_status_page(client):
    """Verify session diagnostics: forbidden for guest, accessible for admin."""
    # 1. Unauthenticated / guest receives 403
    unauth_res = client.get('/status')
    assert unauth_res.status_code == 403

    # 2. Authenticated administrator receives 200
    client.post('/login', data={'username': 'admin', 'password': 'Admin@RailSim2026!'}, follow_redirects=True)
    response = client.get('/status')
    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert 'Session & Behavioral Security Diagnostics' in html
    assert 'Current Bot Risk Score' in html
    assert 'Behavioral Telemetry Channels' in html

def test_adaptive_challenge_flow(client):
    """Verify challenge presentation and verification logic."""
    # 1. GET Challenge
    challenge_res = client.get('/challenge?return_url=/payment')
    assert challenge_res.status_code == 200
    assert 'Additional Verification Required' in challenge_res.get_data(as_text=True)

    # 2. POST Incorrect Answer -> Stays on challenge
    fail_res = client.post('/verify-challenge', data={
        'challenge_answer': 'AIRPLANE',
        'return_url': '/payment'
    }, follow_redirects=True)
    assert fail_res.status_code == 200
    assert 'Incorrect pattern selection' in fail_res.get_data(as_text=True)

    # 3. POST Correct Answer -> Success & redirect
    pass_res = client.post('/verify-challenge', data={
        'challenge_answer': 'TRAIN',
        'return_url': '/payment'
    }, follow_redirects=True)
    assert pass_res.status_code == 200
    assert 'Verification passed successfully' in pass_res.get_data(as_text=True)
