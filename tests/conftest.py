"""
Pytest configuration and shared fixtures for RailSim Express.
Provides isolated test database fixtures for consistent, repeatable test runs.
"""

import pytest
import sys
import os
import tempfile

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.fixture(autouse=True)
def mock_external_email(monkeypatch):
    """Ensure automated tests never make live network calls to third-party email providers."""
    from backend import email_service
    def mock_brevo(api_key, to_email, otp, purpose):
        return {
            "delivered": True,
            "provider": "brevo",
            "messageId": "mock-test-message-id",
            "status": "sent"
        }
    monkeypatch.setattr(email_service, '_send_via_brevo', mock_brevo)

@pytest.fixture
def app():
    """Create and configure an isolated test Flask application."""
    temp_db_fd, temp_db_path = tempfile.mkstemp(suffix='.db')
    os.close(temp_db_fd)
    os.environ['DATABASE_PATH'] = temp_db_path

    from backend.app import create_app
    test_app = create_app()
    test_app.config.update({
        'TESTING': True,
        'SECRET_KEY': 'test-secret-key-cybersecurity-2026',
        'WTF_CSRF_ENABLED': False
    })

    yield test_app

    if os.path.exists(temp_db_path):
        try:
            os.remove(temp_db_path)
        except OSError:
            pass

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()
