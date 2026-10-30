"""
RailSecurix - Supabase Backend Integration Module

Provides safe, non-destructive Supabase connectivity helpers for the Python/Flask backend.
Designed to coexist with SQLite and local authentication without altering existing database
schema, users, tables, or workflows.
"""

import os
import time
import logging
from typing import Optional, Dict, Any
import requests

logger = logging.getLogger("railsecurix.supabase")

SUPABASE_DEFAULT_URL = "https://siregnigyxceylxbzzow.supabase.co"

def get_supabase_url() -> str:
    """Return configured Supabase project URL."""
    return os.environ.get("SUPABASE_URL", SUPABASE_DEFAULT_URL).strip()

def get_supabase_key() -> str:
    """Return configured Supabase API key (anon key or service role key)."""
    return (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
        or ""
    ).strip()

def is_supabase_configured() -> bool:
    """Check if valid Supabase credentials (not placeholders) are configured."""
    key = get_supabase_key()
    url = get_supabase_url()
    if not url or not key:
        return False
    if "PASTE_MY_SUPABASE_PUBLISHABLE_KEY_HERE" in key or key.startswith("["):
        return False
    return True

def get_supabase_client():
    """
    Return initialized Supabase client instance if configured.
    Returns None if unconfigured or dependencies are unavailable.
    """
    if not is_supabase_configured():
        return None
    try:
        from supabase import create_client, Client
        url = get_supabase_url()
        key = get_supabase_key()
        return create_client(url, key)
    except Exception as e:
        logger.warning(f"Could not initialize Supabase Python client: {e}")
        return None

def test_supabase_connection() -> Dict[str, Any]:
    """
    Perform a safe, read-only connectivity check to the configured Supabase instance.
    Does not create, modify, or delete any tables or records.
    """
    url = get_supabase_url()
    key = get_supabase_key()
    start_time = time.time()

    if not is_supabase_configured():
        # Test basic network reachability of the Supabase project endpoint
        try:
            resp = requests.get(f"{url}/rest/v1/", timeout=8)
            latency_ms = round((time.time() - start_time) * 1000, 1)
            # HTTP 401 proves the project endpoint is live and reachable, waiting for valid key
            if resp.status_code in (401, 200):
                return {
                    "success": True,
                    "configured": False,
                    "projectUrl": url,
                    "status": "awaiting_key",
                    "latencyMs": latency_ms,
                    "message": (
                        "Supabase project URL is online and reachable. "
                        "Awaiting publishable key in environment variables to enable authenticated operations."
                    )
                }
            return {
                "success": False,
                "configured": False,
                "projectUrl": url,
                "status": "unexpected_status",
                "latencyMs": latency_ms,
                "message": f"Supabase endpoint responded with status {resp.status_code}."
            }
        except Exception as e:
            return {
                "success": False,
                "configured": False,
                "projectUrl": url,
                "status": "unreachable",
                "message": f"Network error connecting to Supabase: {str(e)}"
            }

    # When a key is configured, perform an authenticated health check
    try:
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "User-Agent": "RailSecurix/2.0"
        }
        # Safe ping to Supabase Auth health endpoint
        resp = requests.get(f"{url}/auth/v1/health", headers=headers, timeout=8)
        latency_ms = round((time.time() - start_time) * 1000, 1)

        if resp.status_code == 200:
            return {
                "success": True,
                "configured": True,
                "projectUrl": url,
                "status": "connected",
                "latencyMs": latency_ms,
                "message": "Supabase connection verified successfully with valid credentials."
            }
        elif resp.status_code == 401:
            return {
                "success": False,
                "configured": True,
                "projectUrl": url,
                "status": "invalid_credentials",
                "latencyMs": latency_ms,
                "message": "Supabase endpoint is reachable, but the provided API key was rejected (HTTP 401)."
            }
        else:
            return {
                "success": True,
                "configured": True,
                "projectUrl": url,
                "status": f"http_{resp.status_code}",
                "latencyMs": latency_ms,
                "message": f"Supabase endpoint responded with HTTP {resp.status_code}."
            }
    except Exception as e:
        return {
            "success": False,
            "configured": True,
            "projectUrl": url,
            "status": "connection_error",
            "message": f"Error during authenticated Supabase check: {str(e)}"
        }
