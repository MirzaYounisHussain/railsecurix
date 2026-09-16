"""
Pytest configuration and shared fixtures for RailSim Express.
"""

import pytest
import sys
import os

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app import create_app

@pytest.fixture
def app():
    """Create and configure a test Flask application."""
    test_app = create_app()
    test_app.config.update({
        'TESTING': True,
        'SECRET_KEY': 'test-secret-key-cybersecurity-2026',
        'WTF_CSRF_ENABLED': False
    })
    yield test_app

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()
