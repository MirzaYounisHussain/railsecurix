"""
Unit tests for Role-Based Authorization and Access Control.
Verifies that normal users cannot access administrative or diagnostics routes,
while authorized admins can access all admin views.
"""

def test_admin_routes_forbidden_for_anonymous(client):
    """Anonymous visitors must be denied access to admin endpoints."""
    endpoints = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/bookings',
        '/admin/security',
        '/admin/bot-detection',
        '/status'
    ]
    for ep in endpoints:
        res = client.get(ep)
        # Should redirect to login or return 403
        assert res.status_code in (302, 403), f"Endpoint {ep} allowed unauthorized access with status {res.status_code}"

def test_admin_routes_forbidden_for_traveler(client):
    """Normal traveler account must receive 403 Forbidden on admin endpoints."""
    # Sign in as regular user
    client.post('/login', data={'username': 'testuser', 'password': 'password123'}, follow_redirects=True)

    endpoints = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/bookings',
        '/admin/security',
        '/admin/bot-detection',
        '/status'
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 403, f"Endpoint {ep} allowed traveler access with status {res.status_code}"
        assert '403 - Access Forbidden' in res.get_data(as_text=True)

def test_admin_routes_accessible_for_admin(client):
    """Admin account must have access to all administrative endpoints."""
    # Sign in as admin
    login_res = client.post('/login', data={'username': 'admin', 'password': 'Admin@RailSim2026!'}, follow_redirects=True)
    assert login_res.status_code == 200

    endpoints = [
        '/admin/dashboard',
        '/admin/users',
        '/admin/bookings',
        '/admin/security',
        '/admin/bot-detection',
        '/status'
    ]
    for ep in endpoints:
        res = client.get(ep)
        assert res.status_code == 200, f"Endpoint {ep} failed for admin with status {res.status_code}"
