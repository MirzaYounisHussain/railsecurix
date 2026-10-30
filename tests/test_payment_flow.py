import os
import sys
import json
import uuid
import hmac
import hashlib
import sqlite3

# Ensure project root in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import create_app
from database.db import DEFAULT_DB_PATH as DB_PATH

def run_tests():
    print("===============================================================")
    print("RAILSECURIX: PAYMENT FLOW & RECONCILIATION COMPREHENSIVE TESTS")
    print("===============================================================")

    app = create_app()
    app.config["TESTING"] = True
    client = app.test_client()

    # 1. Login as testuser
    login_res = client.post("/api/auth/login", json={"username": "testuser", "password": "password123"})
    assert login_res.status_code == 200, f"Login failed: {login_res.data}"
    print("[PASS] 1. Logged in successfully as testuser")

    # ------------------------------------------------------------------------
    # 2. Create Provisional Booking (Strictly PAYMENT_PENDING, pax HOLD)
    # ------------------------------------------------------------------------
    booking_payload = {
        "trainId": "22439",
        "travelClass": "CC",
        "travelDate": "2026-11-15",
        "quota": "GN",
        "contactMobile": "9876543210",
        "contactEmail": "traveler@example.com",
        "passengers": [
            {"name": "Aditi Sharma", "age": 28, "gender": "F", "berth": "WINDOW", "seat": "C2-14"},
            {"name": "Rohan Sharma", "age": 30, "gender": "M", "berth": "AISLE", "seat": "C2-15"}
        ]
    }
    b_res = client.post("/api/bookings/create", json=booking_payload)
    assert b_res.status_code == 201, f"Booking creation failed: {b_res.data}"
    b_data = b_res.get_json()
    assert b_data["success"] is True
    assert b_data["status"] == "PAYMENT_PENDING", f"Expected PAYMENT_PENDING, got {b_data['status']}"
    assert b_data["passengers"][0]["status"] == "HOLD", "Expected passenger status HOLD"
    pnr = b_data["pnr"]
    booking_ref = b_data["bookingRef"]
    print(f"[PASS] 2. Booking created: PNR={pnr}, Ref={booking_ref}, Status={b_data['status']}")

    # 3. Verify SQLite DB initial state
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM bookings WHERE booking_ref = ?", (booking_ref,)).fetchone()
    assert row is not None, "Booking not found in DB"
    assert row["status"] == "PAYMENT_PENDING", f"DB status is {row['status']}"
    pax_rows = conn.execute("SELECT * FROM passengers WHERE booking_id = ?", (row["id"],)).fetchall()
    assert len(pax_rows) == 2
    assert pax_rows[0]["status"] == "HOLD"
    conn.close()
    print("[PASS] 3. Verified database: booking is PAYMENT_PENDING and passengers are HOLD")

    # ------------------------------------------------------------------------
    # 4. Successful Simulated Payment Confirmation
    # ------------------------------------------------------------------------
    pay_payload = {
        "bookingRef": booking_ref,
        "amount": b_data["totalFare"],
        "method": "RailSim iPay",
        "status": "SUCCESS"
    }
    pay_res = client.post("/api/bookings/confirm-payment", json=pay_payload)
    assert pay_res.status_code == 200, f"Payment confirm failed: {pay_res.data}"
    pay_data = pay_res.get_json()
    assert pay_data["success"] is True
    assert pay_data["status"] == "CONFIRMED", f"Expected CONFIRMED, got {pay_data['status']}"
    assert pay_data["verified"] is True
    assert pay_data["isSimulated"] is True
    assert pay_data["transactionId"] is not None
    assert pay_data["transactionId"].startswith("SIM-TXN-")
    sim_txn = pay_data["transactionId"]
    print(f"[PASS] 4. Payment confirmed: Status={pay_data['status']}, TxnId={sim_txn}, Verified={pay_data['verified']}, Simulated={pay_data['isSimulated']}")

    # 5. Verify updated state in SQLite DB
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM bookings WHERE booking_ref = ?", (booking_ref,)).fetchone()
    assert row["status"] == "CONFIRMED", f"DB status should be CONFIRMED, got {row['status']}"
    assert row["payment_gateway_ref"] == sim_txn
    pax_rows = conn.execute("SELECT * FROM passengers WHERE booking_id = ?", (row["id"],)).fetchall()
    assert pax_rows[0]["status"] == "CNF"
    assert pax_rows[1]["status"] == "CNF"
    conn.close()
    print("[PASS] 5. Verified database: booking status updated to CONFIRMED, passengers updated to CNF")

    # 6. Verify PNR Status API returns CONFIRMED
    pnr_res = client.get(f"/api/bookings/pnr/{pnr}")
    assert pnr_res.status_code == 200, f"PNR query failed: {pnr_res.data}"
    pnr_data = pnr_res.get_json()
    assert pnr_data["status"] == "CONFIRMED"
    print(f"[PASS] 6. Verified PNR status: {pnr_data['status']} for {pnr}")

    # ------------------------------------------------------------------------
    # 7. Duplicate Payment Callback (Idempotency)
    # ------------------------------------------------------------------------
    dup_res = client.post("/api/bookings/confirm-payment", json=pay_payload)
    assert dup_res.status_code == 200
    dup_data = dup_res.get_json()
    assert dup_data["success"] is True
    assert dup_data["status"] == "CONFIRMED"
    assert dup_data["alreadyConfirmed"] is True
    print("[PASS] 7. Verified idempotency: duplicate callback returned alreadyConfirmed=True without error")

    # ------------------------------------------------------------------------
    # 8. State Machine Guard: Cannot cancel already confirmed booking via failed callback
    # ------------------------------------------------------------------------
    fail_on_confirmed = client.post("/api/bookings/confirm-payment", json={
        "bookingRef": booking_ref,
        "amount": b_data["totalFare"],
        "method": "RailSim iPay",
        "status": "FAILED"
    })
    assert fail_on_confirmed.status_code == 400
    assert "Invalid transition" in fail_on_confirmed.get_json()["error"]
    print("[PASS] 8. Verified transition safety: cannot cancel already confirmed booking via late failed callback")

    # ------------------------------------------------------------------------
    # 9. Failed Payment Handling
    # ------------------------------------------------------------------------
    b_fail_res = client.post("/api/bookings/create", json=booking_payload)
    b_fail_data = b_fail_res.get_json()
    ref_fail = b_fail_data["bookingRef"]

    fail_res = client.post("/api/bookings/confirm-payment", json={
        "bookingRef": ref_fail,
        "amount": b_fail_data["totalFare"],
        "method": "RailSim iPay",
        "status": "FAILED"
    })
    assert fail_res.status_code == 200
    fail_data = fail_res.get_json()
    assert fail_data["status"] == "CANCELLED"
    assert fail_data["verified"] is False

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    fail_row = conn.execute("SELECT * FROM bookings WHERE booking_ref = ?", (ref_fail,)).fetchone()
    assert fail_row["status"] == "CANCELLED"
    pax_fail = conn.execute("SELECT * FROM passengers WHERE booking_id = ?", (fail_row["id"],)).fetchall()
    assert pax_fail[0]["status"] == "CAN"
    conn.close()
    print("[PASS] 9. Verified failed payment: booking marked CANCELLED, passengers CAN, provisional hold released")

    # ------------------------------------------------------------------------
    # 10. Pending Payment Handling
    # ------------------------------------------------------------------------
    b_pend_res = client.post("/api/bookings/create", json=booking_payload)
    b_pend_data = b_pend_res.get_json()
    ref_pend = b_pend_data["bookingRef"]

    pend_res = client.post("/api/bookings/confirm-payment", json={
        "bookingRef": ref_pend,
        "amount": b_pend_data["totalFare"],
        "method": "UPI",
        "status": "PENDING"
    })
    assert pend_res.status_code == 200
    pend_data = pend_res.get_json()
    assert pend_data["status"] == "PAYMENT_PENDING"
    assert pend_data["verified"] is False
    print("[PASS] 10. Verified pending payment: booking remains PAYMENT_PENDING with verified=False")

    # ------------------------------------------------------------------------
    # 11. Non-existent Booking Reference Rejection
    # ------------------------------------------------------------------------
    not_found_res = client.post("/api/bookings/confirm-payment", json={
        "bookingRef": "REF-NONEXISTENT999",
        "method": "RailSim iPay"
    })
    assert not_found_res.status_code == 404
    print("[PASS] 11. Verified non-existent booking rejected with 404")

    # ------------------------------------------------------------------------
    # 12. Real Gateway Webhook HMAC Verification
    # ------------------------------------------------------------------------
    test_secret = "whsec_test_secret_for_local_verification_12345"
    os.environ["PAYMENT_WEBHOOK_SECRET"] = test_secret

    b_wh_res = client.post("/api/bookings/create", json=booking_payload)
    b_wh_data = b_wh_res.get_json()
    ref_wh = b_wh_data["bookingRef"]

    # 12a: Unsigned webhook rejected with 401
    unauth_wh = client.post("/api/bookings/webhook", json={"bookingRef": ref_wh})
    assert unauth_wh.status_code == 401
    print("[PASS] 12. Verified webhook rejects unauthenticated request with 401")

    # 12b: Invalid HMAC signature rejected with 401
    bad_sig_wh = client.post(
        "/api/bookings/webhook",
        data=json.dumps({"bookingRef": ref_wh}),
        headers={"Content-Type": "application/json", "X-Gateway-Signature": "bad_sig"}
    )
    assert bad_sig_wh.status_code == 401
    print("[PASS] 13. Verified webhook rejects invalid HMAC signature with 401")

    # 12c: Valid HMAC signature reconciles successfully to CONFIRMED
    wh_payload = json.dumps({
        "bookingRef": ref_wh,
        "gatewayTxnId": "GW-REAL-TXN-888999",
        "status": "SUCCESS",
        "amount": b_wh_data["totalFare"]
    })
    valid_sig = hmac.new(test_secret.encode("utf-8"), wh_payload.encode("utf-8"), hashlib.sha256).hexdigest()
    good_wh = client.post(
        "/api/bookings/webhook",
        data=wh_payload,
        headers={"Content-Type": "application/json", "X-Gateway-Signature": valid_sig}
    )
    assert good_wh.status_code == 200, f"Webhook failed: {good_wh.data}"
    good_wh_data = good_wh.get_json()
    assert good_wh_data["status"] == "CONFIRMED"
    print("[PASS] 14. Verified cryptographically signed webhook reconciles payment to CONFIRMED")

    # Clean up test env var
    del os.environ["PAYMENT_WEBHOOK_SECRET"]

    print("\n===============================================================")
    print("ALL 14 PAYMENT AND RECONCILIATION TESTS PASSED (14/14)!")
    print("===============================================================")

if __name__ == "__main__":
    run_tests()
