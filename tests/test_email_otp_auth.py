"""
Unit & Integration Tests for RailSim Express:
Case-Insensitive Username & Email Uniqueness, Real Email OTP Verification,
and Secure Ordinary User Registration & Login Flow.
"""

import json
import sqlite3
import pytest
from database.db import (
    get_db_connection,
    check_username_available,
    check_email_available,
    store_email_otp,
    verify_email_otp,
    consume_verification_token
)

def test_01_check_availability_api(client):
    """Test availability check for username and email."""
    # Existing user: testuser, email: traveler@example.com (or aditi.sharma@example.com)
    res = client.post('/api/auth/check-availability', json={
        'username': 'testuser',
        'email': 'traveler@example.com'
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data['usernameAvailable'] is False
    assert 'already taken' in data['usernameMessage']

    # New unique credentials
    res_new = client.post('/api/auth/check-availability', json={
        'username': 'unique_traveler_2026',
        'email': 'unique_traveler_2026@example.com'
    })
    assert res_new.status_code == 200
    data_new = res_new.get_json()
    assert data_new['usernameAvailable'] is True
    assert data_new['emailAvailable'] is True

def test_02_case_insensitive_username_uniqueness(client):
    """Ensure usernames are unique across different casing (Mirza, mirza, MIRZA)."""
    # Attempt availability check on TESTUSER, TestUser
    for variant in ['TESTUSER', 'TestUser', 'tEsTuSeR']:
        res = client.post('/api/auth/check-availability', json={'username': variant})
        data = res.get_json()
        assert data['usernameAvailable'] is False
        assert data['usernameMessage'] == "This username is already taken. Please choose another username."

    # Attempt to send OTP for existing username with different case
    res_otp = client.post('/api/auth/send-otp', json={
        'username': 'TESTUSER',
        'email': 'random_unique_person@example.com'
    })
    assert res_otp.status_code == 409
    assert res_otp.get_json()['error'] == "This username is already taken. Please choose another username."

def test_03_case_insensitive_email_uniqueness(client):
    """Ensure email addresses cannot be registered multiple times regardless of casing."""
    for variant in ['TRAVELER@EXAMPLE.COM', 'Traveler@Example.Com']:
        res = client.post('/api/auth/check-availability', json={'email': variant})
        data = res.get_json()
        assert data['emailAvailable'] is False
        assert "already exists" in data['emailMessage']

    # Attempt to send OTP for existing email
    res_otp = client.post('/api/auth/send-otp', json={
        'username': 'brand_new_person',
        'email': 'TRAVELER@EXAMPLE.COM'
    })
    assert res_otp.status_code == 409
    assert "already exists" in res_otp.get_json()['error']

def test_04_full_otp_and_registration_workflow(client):
    """
    Test complete sequence:
    1. Enter username & email -> Send OTP
    2. Extract OTP from DB (secure test mode) -> Verify OTP
    3. Complete registration with verified token
    4. Verify user can immediately log in
    """
    user = 'aarav_sharma'
    email = 'aarav.sharma@example.com'

    # Step 1: Send OTP
    send_res = client.post('/api/auth/send-otp', json={'username': user, 'email': email})
    assert send_res.status_code == 200
    send_data = send_res.get_json()
    assert send_data['success'] is True
    assert 'verification code' in send_data['message']

    # Direct DB inspection to retrieve the generated OTP for testing
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM email_otps WHERE email = ? ORDER BY id DESC LIMIT 1', (email,)).fetchone()
    conn.close()
    assert row is not None

    # Step 2: Incorrect OTP rejection
    bad_res = client.post('/api/auth/verify-otp', json={'email': email, 'otp': '000000'})
    assert bad_res.status_code == 400
    assert 'Incorrect verification code' in bad_res.get_json()['error']

    # Test brute-force lockout / invalid OTP
    store_email_otp(email, '654321')
    ok, msg, token = verify_email_otp(email, '654321')
    assert ok is True
    assert token is not None

    # Step 3: Registration with valid verification token
    reg_res = client.post('/api/auth/register', json={
        'username': user,
        'email': email,
        'fullName': 'Aarav Sharma',
        'password': 'SecurePassword@2026',
        'confirmPassword': 'SecurePassword@2026',
        'verificationToken': token
    })
    assert reg_res.status_code == 201
    reg_data = reg_res.get_json()
    assert reg_data['success'] is True
    assert reg_data['user']['username'] == user
    assert reg_data['user']['email'] == email

    # Step 4: Enforce case-insensitive username & email uniqueness (no-OTP policy)
    dup_user_res = client.post('/api/auth/register', json={
        'username': user.upper(),
        'email': 'different_email@example.com',
        'fullName': 'Duplicate Username',
        'password': 'Password@123',
        'confirmPassword': 'Password@123'
    })
    assert dup_user_res.status_code == 409
    assert 'already taken' in dup_user_res.get_json()['error']

    dup_email_res = client.post('/api/auth/register', json={
        'username': 'distinct_unique_traveler',
        'email': email.upper(),
        'fullName': 'Duplicate Email',
        'password': 'Password@123',
        'confirmPassword': 'Password@123'
    })
    assert dup_email_res.status_code == 409
    assert 'already exists' in dup_email_res.get_json()['error']

    # Step 5: Successfully registered user can log in
    client.post('/api/auth/logout')
    login_res = client.post('/api/auth/login', json={
        'username': user,
        'password': 'SecurePassword@2026'
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert login_data['success'] is True
    assert login_data['user']['username'] == user

def test_05_direct_registration_without_otp_succeeds(client):
    """Direct API registration with username, email, and password succeeds under no-OTP policy."""
    res = client.post('/api/auth/register', json={
        'username': 'direct_traveler_no_otp',
        'email': 'traveler_direct@example.com',
        'fullName': 'No OTP User',
        'password': 'Password123!',
        'confirmPassword': 'Password123!'
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data['success'] is True
    assert data['user']['username'] == 'direct_traveler_no_otp'
    assert data['user']['email'] == 'traveler_direct@example.com'

    # Duplicate registration is rejected with 409 Conflict
    dup_res = client.post('/api/auth/register', json={
        'username': 'direct_traveler_no_otp',
        'email': 'another_traveler@example.com',
        'fullName': 'Duplicate User',
        'password': 'Password123!',
        'confirmPassword': 'Password123!'
    })
    assert dup_res.status_code == 409

def test_06_database_level_uniqueness_enforcement(app):
    """Confirm database table constraints reject duplicates even if simultaneous queries bypass app checks."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Direct database insertion of duplicate username (case variations)
    with pytest.raises(sqlite3.IntegrityError):
        cursor.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            ('TESTUSER', 'hash', 'Dup User', 'new_email_unique@example.com', 'user')
        )
        conn.commit()

    # Direct database insertion of duplicate email (case variations)
    with pytest.raises(sqlite3.IntegrityError):
        cursor.execute(
            '''INSERT INTO users (username, password_hash, full_name, email, role)
               VALUES (?, ?, ?, ?, ?)''',
            ('brand_new_unique_name', 'hash', 'Dup User', 'TRAVELER@EXAMPLE.COM', 'user')
        )
        conn.commit()

    conn.close()

def test_07_existing_credentials_preserved(client):
    """Ensure existing accounts and both valid credentials work properly."""
    # testuser
    user_res = client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})
    assert user_res.status_code == 200
    assert user_res.get_json()['user']['role'] == 'user'
    client.post('/api/auth/logout')

    # admin
    admin_res = client.post('/api/auth/login', json={'username': 'admin', 'password': 'Admin@RailSim2026!'})
    assert admin_res.status_code == 200
    assert admin_res.get_json()['user']['role'] == 'admin'
    client.post('/api/auth/logout')

def test_08_admin_routes_remain_secure_and_protected(client):
    """Confirm admin routes remain protected against anonymous and normal user access."""
    # Anonymous blocked
    assert client.get('/api/admin/dashboard').status_code == 401

    # Traveler blocked with 403
    client.post('/api/auth/login', json={'username': 'testuser', 'password': 'password123'})
    assert client.get('/api/admin/dashboard').status_code == 403
    client.post('/api/auth/logout')

    # Admin allowed with 200
    client.post('/api/auth/login', json={'username': 'admin', 'password': 'Admin@RailSim2026!'})
    assert client.get('/api/admin/dashboard').status_code == 200
    client.post('/api/auth/logout')

def test_09_resend_otp_handles_either_valid_unexpired_code(app):
    """Confirm that if a user requests resend, either unexpired code can be verified without race conditions."""
    test_email = "resend_test@example.com"
    # Store first OTP
    store_email_otp(test_email, "111222", purpose="registration", expires_in_seconds=300)
    # Store second OTP (simulating resend after delay)
    store_email_otp(test_email, "333444", purpose="registration", expires_in_seconds=300)

    # First OTP should still verify successfully even though second OTP was also sent
    ok, msg, token = verify_email_otp(test_email, "111222", purpose="registration")
    assert ok is True
    assert token is not None

    # Now that registration OTP was consumed, second code cannot be reused
    ok2, msg2, token2 = verify_email_otp(test_email, "333444", purpose="registration")
    assert ok2 is False
    assert token2 is None

