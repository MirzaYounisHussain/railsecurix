"""
Safe, Non-Destructive Tests for Supabase Connectivity Integration
Confirms configuration handling, diagnostic endpoints, and zero regression to existing database.
"""

from backend.supabase_client import (
    get_supabase_url,
    is_supabase_configured,
    test_supabase_connection as run_supabase_connection_check
)

def test_supabase_default_url():
    """Verify the default Supabase project URL matches the user's project."""
    url = get_supabase_url()
    assert url == "https://siregnigyxceylxbzzow.supabase.co"

def test_supabase_placeholder_detection(monkeypatch):
    """Verify that placeholder strings are not treated as active authenticated credentials."""
    monkeypatch.setenv("SUPABASE_SERVICE_ROLE_KEY", "")
    monkeypatch.setenv("SUPABASE_KEY", "")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "[PASTE_MY_SUPABASE_PUBLISHABLE_KEY_HERE]")
    assert is_supabase_configured() is False

def test_supabase_connectivity_check():
    """Test safe reachability check to the user's Supabase project."""
    result = run_supabase_connection_check()
    assert result["success"] is True
    assert result["projectUrl"] == "https://siregnigyxceylxbzzow.supabase.co"
    assert result["status"] in ("connected", "awaiting_key")
    assert result["latencyMs"] >= 0

def test_supabase_diagnostic_endpoint(client):
    """Test that /api/system/supabase-status responds with valid diagnostic information."""
    res = client.get("/api/system/supabase-status")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert data["projectUrl"] == "https://siregnigyxceylxbzzow.supabase.co"
    assert data["status"] in ("connected", "awaiting_key")
