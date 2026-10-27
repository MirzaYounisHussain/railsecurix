"""
Unit & Integration Tests for RailSecurix Administrator Security:
Verifies secure production bootstrapping with ADMIN_INITIAL_PASSWORD,
prevents silent production startup with unconfigured administrator passwords,
ensures subsequent container restarts preserve existing passwords,
and confirms local development fallbacks function without regression.
"""

import os
import tempfile
import sqlite3
import pytest
from werkzeug.security import check_password_hash

from database.db import init_db, get_user_by_username
from backend.app import create_app, _check_user_credentials

def test_production_startup_without_admin_password_fails():
    """Verify production startup halts if ADMIN_INITIAL_PASSWORD is missing on a fresh database."""
    temp_fd, temp_db_path = tempfile.mkstemp(suffix='.db')
    os.close(temp_fd)
    
    orig_db = os.environ.get('DATABASE_PATH')
    orig_env = os.environ.get('RAILWAY_ENVIRONMENT')
    orig_pass = os.environ.get('ADMIN_INITIAL_PASSWORD')
    
    try:
        os.environ['DATABASE_PATH'] = temp_db_path
        os.environ['RAILWAY_ENVIRONMENT'] = 'production'
        os.environ.pop('ADMIN_INITIAL_PASSWORD', None)
        os.environ.pop('ADMIN_PASSWORD', None)

        with pytest.raises(RuntimeError) as exc_info:
            init_db()
        assert "ADMIN_INITIAL_PASSWORD" in str(exc_info.value)
        assert "Production startup halted" in str(exc_info.value)
    finally:
        if orig_db: os.environ['DATABASE_PATH'] = orig_db
        else: os.environ.pop('DATABASE_PATH', None)
        if orig_env: os.environ['RAILWAY_ENVIRONMENT'] = orig_env
        else: os.environ.pop('RAILWAY_ENVIRONMENT', None)
        if orig_pass: os.environ['ADMIN_INITIAL_PASSWORD'] = orig_pass
        if os.path.exists(temp_db_path):
            try: os.remove(temp_db_path)
            except OSError: pass

def test_production_startup_with_admin_password_succeeds():
    """Verify production startup successfully bootstraps admin with strong configured password."""
    temp_fd, temp_db_path = tempfile.mkstemp(suffix='.db')
    os.close(temp_fd)
    
    orig_db = os.environ.get('DATABASE_PATH')
    orig_env = os.environ.get('RAILWAY_ENVIRONMENT')
    orig_pass = os.environ.get('ADMIN_INITIAL_PASSWORD')
    
    custom_admin_pass = "CustomSecureAdminPass#2026!"
    
    try:
        os.environ['DATABASE_PATH'] = temp_db_path
        os.environ['RAILWAY_ENVIRONMENT'] = 'production'
        os.environ['ADMIN_INITIAL_PASSWORD'] = custom_admin_pass

        # 1. Initialize DB with production password
        init_db()

        # 2. Check admin user in DB
        admin_user = get_user_by_username('admin')
        assert admin_user is not None
        assert admin_user['role'] == 'admin'
        assert check_password_hash(admin_user['password_hash'], custom_admin_pass)

        # 3. Verify credential checker: custom password succeeds
        assert _check_user_credentials(admin_user, custom_admin_pass) is True

        # 4. Verify hardcoded fallbacks are strictly rejected in production
        assert _check_user_credentials(admin_user, 'Admin@RailSim2026!') is False
        assert _check_user_credentials(admin_user, 'Admin@123') is False
        assert _check_user_credentials(admin_user, 'admin123') is False

    finally:
        if orig_db: os.environ['DATABASE_PATH'] = orig_db
        else: os.environ.pop('DATABASE_PATH', None)
        if orig_env: os.environ['RAILWAY_ENVIRONMENT'] = orig_env
        else: os.environ.pop('RAILWAY_ENVIRONMENT', None)
        if orig_pass: os.environ['ADMIN_INITIAL_PASSWORD'] = orig_pass
        else: os.environ.pop('ADMIN_INITIAL_PASSWORD', None)
        if os.path.exists(temp_db_path):
            try: os.remove(temp_db_path)
            except OSError: pass

def test_subsequent_restarts_do_not_reset_admin_password():
    """Verify that subsequent container restarts do not overwrite an existing admin password."""
    temp_fd, temp_db_path = tempfile.mkstemp(suffix='.db')
    os.close(temp_fd)
    
    orig_db = os.environ.get('DATABASE_PATH')
    orig_env = os.environ.get('RAILWAY_ENVIRONMENT')
    orig_pass = os.environ.get('ADMIN_INITIAL_PASSWORD')
    
    initial_pass = "InitialStrongPassword@1"
    changed_env_pass = "DifferentPasswordAfterRestart@2"
    
    try:
        os.environ['DATABASE_PATH'] = temp_db_path
        os.environ['RAILWAY_ENVIRONMENT'] = 'production'
        os.environ['ADMIN_INITIAL_PASSWORD'] = initial_pass

        # First boot: seeds initial_pass
        init_db()
        admin_1 = get_user_by_username('admin')
        hash_1 = admin_1['password_hash']
        assert check_password_hash(hash_1, initial_pass)

        # Second boot (e.g., container restart with different or empty env var)
        os.environ['ADMIN_INITIAL_PASSWORD'] = changed_env_pass
        init_db()
        admin_2 = get_user_by_username('admin')
        hash_2 = admin_2['password_hash']

        # Hash must remain unchanged and original password must still work
        assert hash_1 == hash_2
        assert check_password_hash(hash_2, initial_pass)
        assert not check_password_hash(hash_2, changed_env_pass)

    finally:
        if orig_db: os.environ['DATABASE_PATH'] = orig_db
        else: os.environ.pop('DATABASE_PATH', None)
        if orig_env: os.environ['RAILWAY_ENVIRONMENT'] = orig_env
        else: os.environ.pop('RAILWAY_ENVIRONMENT', None)
        if orig_pass: os.environ['ADMIN_INITIAL_PASSWORD'] = orig_pass
        else: os.environ.pop('ADMIN_INITIAL_PASSWORD', None)
        if os.path.exists(temp_db_path):
            try: os.remove(temp_db_path)
            except OSError: pass

def test_local_development_fallback_preserves_testing_credentials():
    """Verify local development continues to seed and authenticate standard testing credentials."""
    temp_fd, temp_db_path = tempfile.mkstemp(suffix='.db')
    os.close(temp_fd)
    
    orig_db = os.environ.get('DATABASE_PATH')
    orig_env = os.environ.get('RAILWAY_ENVIRONMENT')
    orig_pass = os.environ.get('ADMIN_INITIAL_PASSWORD')
    
    try:
        os.environ['DATABASE_PATH'] = temp_db_path
        os.environ.pop('RAILWAY_ENVIRONMENT', None)
        os.environ.pop('IS_PRODUCTION', None)
        os.environ.pop('ADMIN_INITIAL_PASSWORD', None)
        os.environ.pop('ADMIN_PASSWORD', None)

        # Local boot: seeds standard academic testing credentials
        init_db()
        admin_user = get_user_by_username('admin')
        assert admin_user is not None
        assert _check_user_credentials(admin_user, 'Admin@RailSim2026!') is True

    finally:
        if orig_db: os.environ['DATABASE_PATH'] = orig_db
        else: os.environ.pop('DATABASE_PATH', None)
        if orig_env: os.environ['RAILWAY_ENVIRONMENT'] = orig_env
        else: os.environ.pop('RAILWAY_ENVIRONMENT', None)
        if orig_pass: os.environ['ADMIN_INITIAL_PASSWORD'] = orig_pass
        if os.path.exists(temp_db_path):
            try: os.remove(temp_db_path)
            except OSError: pass
