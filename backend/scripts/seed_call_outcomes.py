import os
import sys

# Ensure src is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from db import init_db, record_call_start, update_call_outcome, get_call_stats

def main():
    db_path = os.path.join(os.path.dirname(__file__), "..", "caller_memory.db")
    init_db(db_path)

    # Record Call 1: Successful Scheme Inquiry
    call_1 = "call_browser_1001"
    record_call_start(call_1, "browser_live_room_1", user_id="citizen_tn_01", db_path=db_path)
    update_call_outcome(
        call_id=call_1,
        outcome="success",
        reason="Citizen inquired about PMJDY eligibility & requested Tamil voice guidance",
        turns=4,
        user_id="citizen_tn_01",
        db_path=db_path
    )

    # Record Call 2: Successful Weather & Seller Logistics Inquiry
    call_2 = "call_browser_1002"
    record_call_start(call_2, "browser_live_room_2", user_id="vendor_ch_02", db_path=db_path)
    update_call_outcome(
        call_id=call_2,
        outcome="success",
        reason="Market vendor requested live weather forecast for Chennai outdoor market",
        turns=2,
        user_id="vendor_ch_02",
        db_path=db_path
    )

    # Record Call 3: Successful Human Escalation with Consent
    call_3 = "call_sip_1003"
    record_call_start(call_3, "sip_inbound_line_1", user_id="caller_ramesh", db_path=db_path)
    update_call_outcome(
        call_id=call_3,
        outcome="success",
        reason="Reported suspicious UPI payment dispute. Human escalation ticket ESC-1770954600 logged after verbal consent",
        turns=5,
        user_id="caller_ramesh",
        db_path=db_path
    )

    # Record Call 4: Failed Call (Early Disconnect before query)
    call_4 = "call_browser_1004"
    record_call_start(call_4, "browser_live_room_4", user_id="guest_99", db_path=db_path)
    update_call_outcome(
        call_id=call_4,
        outcome="failed",
        reason="Caller disconnected before interactive conversation started",
        turns=0,
        user_id="guest_99",
        db_path=db_path
    )

    stats = get_call_stats(db_path)
    print("Seeded Call Telemetry into caller_memory.db:")
    print(f"Total Calls: {stats['total_calls']}")
    print(f"Successful Calls: {stats['successful_calls']}")
    print(f"Failed Calls: {stats['failed_calls']}")
    print(f"Success Rate: {stats['success_rate']}%")

if __name__ == "__main__":
    main()
