"""
RailRadar Service - Local-First Cache & Weekly Synchronization Engine
Handles 7-day TTL caching, API quota minimization, and fallback storage
for Indian Railways station directories and train timetable schedules.
"""

import os
import re
import time
import logging
import threading
from datetime import datetime, timezone, timedelta
import requests
from dotenv import load_dotenv

load_dotenv()

def normalize_railway_name(name: str) -> str:
    """Correct common phonetic typos from upstream railway NTES feeds."""
    if not name:
        return ""
    # Standardize Jammutavi -> Jammu Tawi
    cleaned = re.sub(r'(?i)\bjammutavi\b', 'Jammu Tawi', name.strip())
    return cleaned
from database.db import (
    get_sync_metadata,
    set_sync_metadata,
    is_sync_due,
    bulk_upsert_stations,
    bulk_upsert_trains,
    get_all_stations,
    get_all_trains,
    get_trains_by_route,
    get_cached_route_trains,
    save_cached_route_trains,
    get_station_by_code,
    search_stations,
    get_db_connection,
)

logger = logging.getLogger("railradar_service")
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter('%(asctime)s [%(levelname)s] [RailRadar] %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

RAILRADAR_BASE_URL = os.getenv("RAILRADAR_BASE_URL", "https://api.railradar.in").rstrip("/")
WEEKLY_INTERVAL_DAYS = 7
_scheduler_started = False
_scheduler_lock = threading.Lock()


def get_api_key() -> str:
    """Retrieve RailRadar API key from environment variables or .env file."""
    return os.getenv("RAILRADAR_API_KEY", "").strip()


def get_headers(api_key: str | None = None) -> dict:
    """Construct authentication headers for RailRadar API."""
    key = api_key or get_api_key()
    headers = {
        "User-Agent": "RailSimExpress/1.0",
        "Accept": "application/json",
    }
    if key:
        headers["Authorization"] = f"Bearer {key}"
        headers["x-api-key"] = key
    return headers


# --------------------------------------------------------------------------
# Station Directory Synchronization (Weekly)
# --------------------------------------------------------------------------
def sync_stations_weekly(force: bool = False) -> dict:
    """
    Synchronize all Indian Railways stations from RailRadar API to local SQLite.
    Guaranteed: Strictly runs once every 7 days unless forced.
    If cache is < 7 days old, returns local cache without touching the API.
    """
    key = "stations_sync"
    if not force and not is_sync_due(key, interval_days=WEEKLY_INTERVAL_DAYS):
        meta = get_sync_metadata(key)
        return {
            "status": "cached",
            "source": "local_sqlite_cache",
            "message": "Stations cache is fresh (< 7 days old). Zero API calls made.",
            "last_synced_at": meta.get("last_synced_at") if meta else None,
            "cached_count": meta.get("item_count") if meta else 0,
        }

    api_key = get_api_key()
    if not api_key:
        logger.info("No RAILRADAR_API_KEY provided. Operating in offline-cached mode.")
        meta = get_sync_metadata(key)
        if not meta:
            set_sync_metadata(key, item_count=len(get_all_stations()), status="offline_seeded", details="Offline fallback with default stations")
        return {
            "status": "offline_cached",
            "source": "local_sqlite_cache",
            "message": "No RAILRADAR_API_KEY set. Serving from local SQLite database without API call.",
            "total_stations": len(get_all_stations()),
        }

    logger.info("Weekly station sync due (> 7 days). Calling RailRadar API...")
    url = f"{RAILRADAR_BASE_URL}/v1/lookup/stations/ntes"

    try:
        resp = requests.get(url, headers=get_headers(api_key), timeout=20)
        if resp.status_code == 200:
            payload = resp.json()
            data = payload.get("data", {})

            # Format 1: NTES dict mapping { "NDLS": "NEW DELHI", ... }
            station_list = []
            if isinstance(data, dict):
                for code, name in data.items():
                    c_clean = str(code).strip().upper()
                    n_clean = normalize_railway_name(str(name).strip().title())
                    city_clean = "Jammu" if c_clean == "JAT" else n_clean
                    state_clean = "Jammu & Kashmir" if c_clean == "JAT" else ""
                    station_list.append({
                        "code": c_clean,
                        "name": n_clean,
                        "city": city_clean,
                        "state": state_clean
                    })
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        code = item.get("code") or item.get("stationCode")
                        name = item.get("name") or item.get("stationName")
                        if code and name:
                            c_clean = str(code).strip().upper()
                            n_clean = normalize_railway_name(str(name).strip().title())
                            city_clean = "Jammu" if c_clean == "JAT" else item.get("city", "").strip()
                            state_clean = "Jammu & Kashmir" if c_clean == "JAT" else item.get("state", "").strip()
                            station_list.append({
                                "code": c_clean,
                                "name": n_clean,
                                "city": city_clean,
                                "state": state_clean
                            })

            if station_list:
                bulk_upsert_stations(station_list)
                set_sync_metadata(key, item_count=len(station_list), status="success", details=f"Synced {len(station_list)} stations via RailRadar NTES")
                logger.info("Successfully synced %d stations to local SQLite database.", len(station_list))
                return {
                    "status": "synced",
                    "source": "railradar_api",
                    "count": len(station_list),
                    "last_synced_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                }

        # Secondary fallback: compressed stations endpoint
        comp_url = f"{RAILRADAR_BASE_URL}/v1/lookup/stations/compressed"
        comp_resp = requests.get(comp_url, headers=get_headers(api_key), timeout=20)
        if comp_resp.status_code == 200:
            try:
                raw_data = comp_resp.json().get("data", "")
            except Exception:
                raw_data = comp_resp.text
            lines = raw_data.strip().split("\n")
            station_list = []
            for line in lines:
                parts = line.strip().split("|")
                if len(parts) >= 2:
                    code = parts[0].strip().upper()
                    name = normalize_railway_name(parts[1].strip().title())
                    city = "Jammu" if code == "JAT" else name
                    state = "Jammu & Kashmir" if code == "JAT" else ""
                    if code and name:
                        station_list.append({"code": code, "name": name, "city": city, "state": state})

            if station_list:
                bulk_upsert_stations(station_list)
                set_sync_metadata(key, item_count=len(station_list), status="success", details=f"Synced {len(station_list)} stations via RailRadar Compressed")
                logger.info("Successfully synced %d stations via compressed endpoint.", len(station_list))
                return {
                    "status": "synced",
                    "source": "railradar_api_compressed",
                    "count": len(station_list),
                    "last_synced_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                }

        err_msg = f"RailRadar API returned HTTP {resp.status_code}: {resp.text[:200]}"
        logger.warning(err_msg)
        set_sync_metadata(key, item_count=len(get_all_stations()), status="api_error_cached", details=err_msg)
        return {
            "status": "api_error_offline_fallback",
            "message": "RailRadar API call unsuccessful; preserved existing SQLite database.",
            "http_status": resp.status_code,
            "total_stations": len(get_all_stations())
        }

    except Exception as exc:
        logger.error("Exception during RailRadar station sync: %s", exc)
        set_sync_metadata(key, item_count=len(get_all_stations()), status="exception_cached", details=str(exc))
        return {
            "status": "exception_offline_fallback",
            "message": f"Network or execution issue ({exc}); preserving local SQLite records.",
            "total_stations": len(get_all_stations())
        }


# --------------------------------------------------------------------------
# Train Directory Synchronization (Weekly)
# --------------------------------------------------------------------------
def sync_trains_weekly(force: bool = False) -> dict:
    """
    Synchronize active train timetable directory from RailRadar API to local SQLite.
    Guaranteed: Strictly runs once every 7 days unless forced.
    If cache is < 7 days old, returns local cache without touching the API.
    """
    key = "trains_sync"
    if not force and not is_sync_due(key, interval_days=WEEKLY_INTERVAL_DAYS):
        meta = get_sync_metadata(key)
        return {
            "status": "cached",
            "source": "local_sqlite_cache",
            "message": "Trains cache is fresh (< 7 days old). Zero API calls made.",
            "last_synced_at": meta.get("last_synced_at") if meta else None,
            "cached_count": meta.get("item_count") if meta else 0,
        }

    api_key = get_api_key()
    if not api_key:
        logger.info("No RAILRADAR_API_KEY provided. Operating in offline-cached mode for trains.")
        meta = get_sync_metadata(key)
        if not meta:
            set_sync_metadata(key, item_count=len(get_all_trains()), status="offline_seeded", details="Offline fallback with default trains")
        return {
            "status": "offline_cached",
            "source": "local_sqlite_cache",
            "message": "No RAILRADAR_API_KEY set. Serving trains from local SQLite database.",
            "total_trains": len(get_all_trains()),
        }

    logger.info("Weekly trains sync due (> 7 days). Calling RailRadar API...")
    url = f"{RAILRADAR_BASE_URL}/v1/legacy/trains/all-kvs"

    try:
        resp = requests.get(url, headers=get_headers(api_key), timeout=25)
        if resp.status_code == 200:
            payload = resp.json()
            data = payload.get("data", [])
            train_list = []

            # Format: [ [ "12919", "Malwa Express" ], ... ]
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, (list, tuple)) and len(item) >= 2:
                        train_num = str(item[0]).strip()
                        train_name = normalize_railway_name(str(item[1]).strip())
                        if train_num and train_name:
                            train_list.append({
                                "id": f"T{train_num}",
                                "train_number": train_num,
                                "train_name": train_name,
                                "source_code": "NDLS",
                                "dest_code": "BCT",
                                "source_station": "NDLS - New Delhi",
                                "dest_station": "BCT - Mumbai Central",
                                "departure_time": "08:00",
                                "arrival_time": "20:00",
                                "duration": "12h 00m",
                                "fare_base": 650.0,
                                "runs_on": ["M", "T", "W", "T", "F", "S", "S"],
                                "available_classes": ["1A", "2A", "3A", "SL"],
                                "total_seats": 72
                            })

            if train_list:
                bulk_upsert_trains(train_list)
                set_sync_metadata(key, item_count=len(train_list), status="success", details=f"Synced {len(train_list)} trains via RailRadar KVS")
                logger.info("Successfully synced %d trains to local SQLite database.", len(train_list))
                return {
                    "status": "synced",
                    "source": "railradar_api",
                    "count": len(train_list),
                    "last_synced_at": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
                }

        err_msg = f"RailRadar trains API returned HTTP {resp.status_code}: {resp.text[:200]}"
        logger.warning(err_msg)
        set_sync_metadata(key, item_count=len(get_all_trains()), status="api_error_cached", details=err_msg)
        return {
            "status": "api_error_offline_fallback",
            "message": "RailRadar trains API unsuccessful; preserved existing SQLite database.",
            "http_status": resp.status_code,
            "total_trains": len(get_all_trains())
        }

    except Exception as exc:
        logger.error("Exception during RailRadar trains sync: %s", exc)
        set_sync_metadata(key, item_count=len(get_all_trains()), status="exception_cached", details=str(exc))
        return {
            "status": "exception_offline_fallback",
            "message": f"Network issue ({exc}); preserving local SQLite records.",
            "total_trains": len(get_all_trains())
        }


# --------------------------------------------------------------------------
# Route-Specific Trains Between Stations (7-Day TTL Cache)
# --------------------------------------------------------------------------
def resolve_station_code(text: str) -> str:
    """Extract or lookup uppercase station code from input text."""
    if not text:
        return ""
    clean = text.strip()
    parts = clean.split(" - ")
    if len(parts) > 1:
        return parts[-1].strip().upper()
    # Direct code match
    stn = get_station_by_code(clean)
    if stn:
        return stn["code"]
    # Fuzzy name lookup
    results = search_stations(clean, limit=1)
    if results:
        return results[0]["code"]
    return clean.upper()


def fetch_trains_between_stations_api(src_code: str, dest_code: str) -> list[dict]:
    """Query RailRadar API for trains operating between two station codes."""
    api_key = get_api_key()
    if not api_key:
        return []

    # Handle known multi-terminal metropolitan stations
    candidate_pairs = [(src_code, dest_code)]
    if dest_code == "BCT":
        candidate_pairs.append((src_code, "MMCT"))
    elif dest_code == "MMCT":
        candidate_pairs.append((src_code, "BCT"))
    if src_code == "BCT":
        candidate_pairs.append(("MMCT", dest_code))
    elif src_code == "MMCT":
        candidate_pairs.append(("BCT", dest_code))

    day_map = {
        "mon": "M", "tue": "T", "wed": "W", "thu": "T",
        "fri": "F", "sat": "S", "sun": "S"
    }

    for s_c, d_c in candidate_pairs:
        url = f"{RAILRADAR_BASE_URL}/v1/trains/between/{s_c}/{d_c}"
        try:
            resp = requests.get(url, headers=get_headers(api_key), timeout=15)
            if resp.status_code == 200:
                payload = resp.json()
                raw_trains = payload.get("data", {}).get("trains", [])
                if not raw_trains:
                    continue

                parsed = []
                for item in raw_trains:
                    tr = item.get("train", {})
                    fr = item.get("from", {})
                    to = item.get("to", {})
                    train_num = str(tr.get("number", "")).strip()
                    raw_name = str(tr.get("name", "")).strip()
                    if not train_num or not raw_name:
                        continue

                    clean_name = normalize_railway_name(raw_name)
                    dur_mins = item.get("duration", 0)
                    dur_str = f"{dur_mins // 60}h {dur_mins % 60:02d}m" if dur_mins else "12h 00m"
                    dist = float(item.get("distance", 500.0) or 500.0)
                    fare = round(max(220.0, dist * 1.15), 1)

                    name_upper = clean_name.upper()
                    if "VANDE BHARAT" in name_upper:
                        classes = ["CC", "EC"]
                        fare = round(fare * 1.35, 1)
                    elif "RAJDHANI" in name_upper:
                        classes = ["1A", "2A", "3A", "3E"]
                        fare = round(fare * 1.25, 1)
                    elif "SHATABDI" in name_upper:
                        classes = ["CC", "EC"]
                    elif "TEJAS" in name_upper:
                        classes = ["1A", "2A", "3A"]
                    elif "GARIB RATH" in name_upper:
                        classes = ["3A", "CC"]
                        fare = round(fare * 0.75, 1)
                    else:
                        classes = ["1A", "2A", "3A", "SL", "2S"]

                    run_days_raw = tr.get("runDays", [])
                    runs_on = [day_map.get(d.lower(), "M") for d in run_days_raw if d.lower() in day_map]
                    if not runs_on:
                        runs_on = ["M", "T", "W", "T", "F", "S", "S"]

                    from_name = normalize_railway_name(fr.get("name", s_c))
                    to_name = normalize_railway_name(to.get("name", d_c))

                    parsed.append({
                        "id": f"T{train_num}",
                        "train_number": train_num,
                        "train_name": clean_name,
                        "source_code": src_code,
                        "dest_code": dest_code,
                        "source_station": f"{src_code} - {from_name}",
                        "dest_station": f"{dest_code} - {to_name}",
                        "departure_time": fr.get("departure", "08:00"),
                        "arrival_time": to.get("arrival", "20:00"),
                        "duration": dur_str,
                        "fare_base": fare,
                        "runs_on": runs_on,
                        "run_days": [d.lower() for d in run_days_raw] if run_days_raw else ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
                        "available_classes": classes,
                        "total_seats": 72
                    })

                if parsed:
                    return parsed
        except Exception as exc:
            logger.warning("Error fetching trains between %s and %s: %s", s_c, d_c, exc)

    return []


def get_or_sync_trains_between(source_code: str, dest_code: str) -> list[dict]:
    """
    Retrieve trains running between source_code and dest_code.
    Cache-first: Checks SQLite route_cache table first.
    If not cached or expired (> 7 days), calls RailRadar API once,
    persists in SQLite route_cache and trains table, and updates 7-day TTL metadata.
    """
    s_clean = source_code.strip().upper()
    d_clean = dest_code.strip().upper()
    if not s_clean or not d_clean or s_clean == d_clean:
        return []

    route_key = f"route_{s_clean}_{d_clean}"
    cached_trains, updated_at = get_cached_route_trains(s_clean, d_clean)
    sync_due = is_sync_due(route_key, interval_days=WEEKLY_INTERVAL_DAYS)

    # Cache hit: Fresh records (< 7 days old) in SQLite route_cache
    if cached_trains and not sync_due:
        return cached_trains

    # Cache miss or expired: Fetch from RailRadar API
    api_trains = fetch_trains_between_stations_api(s_clean, d_clean)
    if api_trains:
        save_cached_route_trains(s_clean, d_clean, api_trains)
        bulk_upsert_trains(api_trains)
        set_sync_metadata(route_key, item_count=len(api_trains), status="success", details=f"Synced {len(api_trains)} trains for route {s_clean}-{d_clean}")
        return api_trains

    if cached_trains:
        return cached_trains

    return get_trains_by_route(s_clean, d_clean)


# --------------------------------------------------------------------------
# Sync Status Inspector
# --------------------------------------------------------------------------
def get_railradar_sync_status() -> dict:
    """Return consolidated sync metadata and database metrics."""
    stn_meta = get_sync_metadata("stations_sync")
    trn_meta = get_sync_metadata("trains_sync")

    all_stations = get_all_stations()
    all_trains = get_all_trains()

    def calc_next_sync(meta):
        if not meta or not meta.get("last_synced_at"):
            return "Immediate / Pending Initial Sync"
        try:
            last_str = str(meta["last_synced_at"])
            if "T" in last_str:
                last_dt = datetime.fromisoformat(last_str.replace("Z", "+00:00"))
            else:
                last_dt = datetime.strptime(last_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            next_dt = last_dt + timedelta(days=WEEKLY_INTERVAL_DAYS)
            return next_dt.strftime("%Y-%m-%d %H:%M:%S UTC")
        except Exception:
            return "Unknown"

    return {
        "api_key_configured": bool(get_api_key()),
        "refresh_frequency": "Every 7 Days (Weekly Sync Policy)",
        "ttl_days": WEEKLY_INTERVAL_DAYS,
        "stations": {
            "last_synced_at": stn_meta.get("last_synced_at") if stn_meta else None,
            "status": stn_meta.get("status") if stn_meta else "never_synced",
            "item_count": stn_meta.get("item_count") if stn_meta else len(all_stations),
            "is_sync_due": is_sync_due("stations_sync", interval_days=WEEKLY_INTERVAL_DAYS),
            "next_sync_due_at": calc_next_sync(stn_meta),
            "total_in_sqlite": len(all_stations),
        },
        "trains": {
            "last_synced_at": trn_meta.get("last_synced_at") if trn_meta else None,
            "status": trn_meta.get("status") if trn_meta else "never_synced",
            "item_count": trn_meta.get("item_count") if trn_meta else len(all_trains),
            "is_sync_due": is_sync_due("trains_sync", interval_days=WEEKLY_INTERVAL_DAYS),
            "next_sync_due_at": calc_next_sync(trn_meta),
            "total_in_sqlite": len(all_trains),
        }
    }


# --------------------------------------------------------------------------
# Weekly Background Scheduler
# --------------------------------------------------------------------------
def _scheduler_loop():
    """Background daemon loop that periodically checks if 7 days have passed."""
    # Initial grace delay of 5 seconds to let Flask start smoothly
    time.sleep(5)
    logger.info("Weekly RailRadar scheduler active. Checking sync status...")
    while True:
        try:
            if is_sync_due("stations_sync", interval_days=WEEKLY_INTERVAL_DAYS):
                logger.info("Stations sync due. Executing weekly sync...")
                sync_stations_weekly(force=False)
            if is_sync_due("trains_sync", interval_days=WEEKLY_INTERVAL_DAYS):
                logger.info("Trains sync due. Executing weekly sync...")
                sync_trains_weekly(force=False)
        except Exception as e:
            logger.error("Error in background weekly scheduler loop: %s", e)

        # Sleep for 1 hour before checking again
        time.sleep(3600)


def start_weekly_background_scheduler():
    """Start the non-blocking background daemon thread for weekly sync checks."""
    global _scheduler_started
    with _scheduler_lock:
        if not _scheduler_started:
            worker = threading.Thread(target=_scheduler_loop, name="RailRadarWeeklyScheduler", daemon=True)
            worker.start()
            _scheduler_started = True
            logger.info("Started RailRadar weekly background scheduler thread.")
