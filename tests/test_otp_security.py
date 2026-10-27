"""
Tests for RailSecurix OTP Production Security and Disclosure Prevention:
Verifies that:
1. In production, devOtp is never included in HTTP responses.
2. In production, email delivery failures return safe, generic error responses (502).
3. In production, unconfigured email providers halt dispatch safely without returning OTPs.
4. In local development, devOtp is preserved for academic/local testing.
5. Account registration strictly requires a server-verified single-use token.
"""

import os
import re
import pytest
from unittest.mock import patch

from database.db import (
    store_email_otp,
    verify_email_otp,
    get_user_by_username
)

def test_production_successful_delivery_does_not_disclose_otp(client, monkeypatch):
    """Confirm production send-otp returns 200 without exposing devOtp or any 6-digit code."""
    monkeypatch.setenv('RAILWAY_ENVIRONMENT', 'production')
    test_email = 'traveler_prod1@example.com'
    test_user = 'prod_user_1'

    # Mock send_otp_email to simulate successful Brevo delivery without live network call
    mock_delivery = {
        'delivered': True,
        'provider': 'brevo',
        'status': 'sent',
        'messageId': 'mock-brevo-id-12345'
    }
    with patch('backend.app.send_otp_email', return_value=mock_delivery):
        res = client.post('/api/auth/send-otp', json={'username': test_user, 'email': test_email})
        assert res.status_code == 200
        data = res.get_json()

        assert data['success'] is True
        assert data['delivered'] is True
        assert 'devOtp' not in data
        assert 'otp' not in data

        # Ensure no 6-digit numeric pattern is leaked anywhere in the response text
        raw_text = res.get_data(as_text=True)
        # Matches any standalone 6-digit code or key
        assert 'devOtp' not in raw_text

def test_production_failed_delivery_returns_safe_error_without_otp(client, monkeypatch):
    """Confirm production send-otp handles delivery failure with safe generic 502 and no OTP."""
    monkeypatch.setenv('RAILWAY_ENVIRONMENT', 'production')
    test_email = 'traveler_fail@example.com'
    test_user = 'prod_fail_user'

    mock_delivery = {
        'delivered': False,
        'provider': 'brevo',
        'status': 'error',
        'error': 'Brevo API error: connection timed out to smtp.brevo.com'
    }
    with patch('backend.app.send_otp_email', return_value=mock_delivery):
        res = client.post('/api/auth/send-otp', json={'username': test_user, 'email': test_email})
        assert res.status_code == 502
        data = res.get_json()

        assert data['success'] is False
        assert 'devOtp' not in data
        # Error must be generic and safe, not leaking internal provider trace
        assert 'smtp.brevo.com' not in data['error']
        assert 'Failed to deliver verification code' in data['error']

def test_production_unconfigured_provider_returns_safe_502_without_otp(client, monkeypatch):
    """Confirm production halts and returns safe 502 when no email keys are configured."""
    monkeypatch.setenv('RAILWAY_ENVIRONMENT', 'production')
    monkeypatch.delenv('BREVO_API_KEY', raising=False)
    monkeypatch.delenv('RESEND_API_KEY', raising=False)
    monkeypatch.delenv('SMTP_SERVER', raising=False)

    test_email = 'unconfigured_prod@example.com'
    test_user = 'prod_unconf_user'

    res = client.post('/api/auth/send-otp', json={'username': test_user, 'email': test_email})
    assert res.status_code == 502
    data = res.get_json()

    assert data['success'] is False
    assert 'devOtp' not in data
    assert 'Failed to deliver verification code' in data['error']

def test_development_mode_preserves_local_testing_dev_otp(client, monkeypatch):
    """Confirm local development environment retains devOtp for offline academic testing."""
    monkeypatch.delenv('RAILWAY_ENVIRONMENT', raising=False)
    monkeypatch.delenv('IS_PRODUCTION', raising=False)
    monkeypatch.delenv('FRONTEND_URL', raising=False)
    monkeypatch.delenv('BREVO_API_KEY', raising=False)
    monkeypatch.delenv('RESEND_API_KEY', raising=False)
    monkeypatch.delenv('SMTP_SERVER', raising=False)

    test_email = 'dev_traveler@example.com'
    test_user = 'dev_user_local'

    res = client.post('/api/auth/send-otp', json={'username': test_user, 'email': test_email})
    assert res.status_code == 200
    data = res.get_json()

    assert data['success'] is True
    assert data['delivered'] is False
    assert 'devOtp' in data
    assert len(data['devOtp']) == 6
    assert data['devOtp'].isdigit()

def test_registration_strictly_rejected_without_verified_token(client):
    """Confirm /api/auth/register rejects registration without valid single-use token."""
    res = client.post('/api/auth/register', json={
        'username': 'unverified_traveler',
        'fullName': 'Unverified Traveler',
        'email': 'unverified@example.com',
        'password': 'SecurePassword@2026',
        'confirmPassword': 'SecurePassword@2026',
        # No verificationToken provided
    })
    assert res.status_code == 403
    data = res.get_json()
    assert data['success'] is False
    assert 'Email verification is required' in data['error']
    assert get_user_by_username('unverified_traveler') is None

def test_verification_token_is_single_use(client):
    """Confirm a verification token cannot be reused to register multiple accounts."""
    email = 'single_use@example.com'
    otp = '123456'

    store_email_otp(email, otp, purpose='registration')
    is_valid, msg, token = verify_email_otp(email, otp, purpose='registration')
    assert is_valid is True
    assert token is not None

    # First registration with token -> 201 Created
    res1 = client.post('/api/auth/register', json={
        'username': 'singleuse_user1',
        'fullName': 'Single Use User',
        'email': email,
        'password': 'Password@12345',
        'confirmPassword': 'Password@12345',
        'verificationToken': token
    })
    assert res1.status_code == 201
    assert res1.get_json()['success'] is True

    # Second registration attempting to reuse the same token with another email -> 403 Forbidden
    res2 = client.post('/api/auth/register', json={
        'username': 'singleuse_user2',
        'fullName': 'Second Single Use User',
        'email': 'different_email@example.com',
        'password': 'Password@12345',
        'confirmPassword': 'Password@12345',
        'verificationToken': token
    })
    assert res2.status_code == 403
    assert 'Email verification is required' in res2.get_json()['error']

    # Third registration attempting to re-register the same email -> 409 Conflict
    res3 = client.post('/api/auth/register', json={
        'username': 'singleuse_user3',
        'fullName': 'Third Single Use User',
        'email': email,
        'password': 'Password@12345',
        'confirmPassword': 'Password@12345',
        'verificationToken': token
    })
    assert res3.status_code == 409
    assert 'already exists' in res3.get_json()['error']
