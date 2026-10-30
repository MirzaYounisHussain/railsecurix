"""
Test suite for RailRadar 7-Day TTL Caching, Local-First Storage, and Weekly Synchronization.
"""

import os
import pytest
from datetime import datetime, timezone, timedelta
from database.db import (
    get_sync_metadata,
    set_sync_metadata,
    is_sync_due,
    bulk_upsert_stations,
    bulk_upsert_trains,
    search_stations,
    get_all_stations,
    get_all_trains,
)
from backend.railradar_service import (
    sync_stations_weekly,
    sync_trains_weekly,
    get_railradar_sync_status,
)


def test_weekly_sync_due_logic(app):
    """Verify 7-day TTL check: fresh cache skips API call, expired triggers sync."""
    key = "test_weekly_key"

    # 1. No sync recorded -> sync is due
    assert is_sync_due(key, interval_days=7) is True

    # 2. Fresh sync recorded today -> sync is NOT due (cache hit, 0 API calls)
    set_sync_metadata(key, item_count=100, status="success")
    assert is_sync_due(key, interval_days=7) is False

    # 3. Old sync recorded 8 days ago -> sync IS due (weekly refresh needed)
    old_time = (datetime.now(timezone.utc) - timedelta(days=8)).strftime('%Y-%m-%d %H:%M:%S')
    from database.db import get_db_connection
    conn = get_db_connection()
    conn.execute("UPDATE sync_metadata SET last_synced_at = ? WHERE key = ?", (old_time, key))
    conn.commit()
    conn.close()

    assert is_sync_due(key, interval_days=7) is True


def test_station_bulk_upsert_and_search(app):
    """Verify local SQLite storage handles new IRCTC stations and performs rapid search."""
    sample_stations = [
        {"code": "GKP", "name": "Gorakhpur Junction", "city": "Gorakhpur", "state": "Uttar Pradesh"},
        {"code": "BSB", "name": "Varanasi Junction", "city": "Varanasi", "state": "Uttar Pradesh"},
        {"code": "ASR", "name": "Amritsar Junction", "city": "Amritsar", "state": "Punjab"},
    ]

    count = bulk_upsert_stations(sample_stations)
    assert count >= 1

    # Search by code
    results_code = search_stations("GKP")
    assert len(results_code) >= 1
    assert results_code[0]["code"] == "GKP"
    assert "Gorakhpur" in results_code[0]["name"]

    # Search by city/name
    results_name = search_stations("Amritsar")
    assert len(results_name) >= 1
    assert results_name[0]["code"] == "ASR"


def test_railradar_offline_fallback_zero_api_call(app, monkeypatch):
    """When no API key is set, sync runs in offline cached mode without outbound HTTP calls."""
    monkeypatch.setenv("RAILRADAR_API_KEY", "")

    # Sync stations without API key
    res_stn = sync_stations_weekly(force=True)
    assert res_stn["status"] in ("offline_cached", "cached")
    assert res_stn["source"] == "local_sqlite_cache"

    # Sync trains without API key
    res_trn = sync_trains_weekly(force=True)
    assert res_trn["status"] in ("offline_cached", "cached")
    assert res_trn["source"] == "local_sqlite_cache"


def test_api_sync_status_endpoint(client):
    """Verify GET /api/sync/status provides 7-day TTL and database metrics."""
    res = client.get("/api/sync/status")
    assert res.status_code == 200
    data = res.get_json()
    assert "stations" in data
    assert "trains" in data
    assert data["ttl_days"] == 7
    assert "refresh_frequency" in data
    assert data["stations"]["total_in_sqlite"] >= 5


def test_api_stations_query_autocomplete(client):
    """Verify GET /api/stations?q=... returns matching stations from SQLite."""
    res = client.get("/api/stations?q=NDLS")
    assert res.status_code == 200
    stations = res.get_json()
    assert len(stations) >= 1
    assert stations[0]["stationCode"] == "NDLS"

    # Verify default query returns all
    res_all = client.get("/api/stations")
    assert res_all.status_code == 200
    all_stn = res_all.get_json()
    assert len(all_stn) >= 5
