"""
Unit tests for Booking Persistence and Traveler History.
Verifies that bookings are saved to the database and displayed in My Bookings.
"""

def test_booking_saved_to_user_history(client):
    """Confirm that a booking made by an authenticated traveler appears in My Bookings."""
    # 1. Sign in
    client.post('/login', data={'username': 'testuser', 'password': 'password123'}, follow_redirects=True)

    # 2. Add booking to review
    client.post('/review', data={
        'train_id': 'T12951',
        'travel_class': '3A',
        'travel_date': '2026-09-22',
        'quota': 'GN',
        'fare': '1170.0',
        'contact_mobile': '9876543210',
        'contact_email': 'traveler@example.com',
        'passenger_name[]': ['Dr. Vikram Sen'],
        'passenger_age[]': ['34'],
        'passenger_gender[]': ['M'],
        'passenger_berth[]': ['LOWER']
    })

    # 3. Confirm booking
    confirm_res = client.post('/confirm', data={'booking_ref': 'REF-TEST123', 'total_fare': '1210'})
    assert confirm_res.status_code == 200

    # 4. Check My Bookings page
    my_bookings_res = client.get('/my-bookings')
    assert my_bookings_res.status_code == 200
    html = my_bookings_res.get_data(as_text=True)
    assert 'Tejas Rajdhani Express' in html
    assert '1210' in html
