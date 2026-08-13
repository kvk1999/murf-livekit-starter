import os
import sys
import tempfile
import pytest

# Ensure src is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from db import (
    init_db,
    record_call_start,
    update_call_outcome,
    get_call_stats,
    get_call_history,
)

def test_call_outcomes_flow():
    """Test Steps 1, 2, 5 & 6: Call Outcome Recording and Stats Calculation."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        # Step 1 & 2: Initialize DB
        init_db(db_path)

        stats_initial = get_call_stats(db_path)
        assert stats_initial["total_calls"] == 0
        assert stats_initial["successful_calls"] == 0
        assert stats_initial["failed_calls"] == 0
        assert stats_initial["success_rate"] == 0.0

        # Step 5: Record a successful call (Success Path Test)
        call_1 = record_call_start("call_success_001", "browser_room_1", user_id="user_101", db_path=db_path)
        res_1 = update_call_outcome(
            call_id="call_success_001",
            outcome="success",
            reason="PMJDY Scheme inquiry answered successfully",
            turns=3,
            db_path=db_path,
        )
        assert res_1["outcome"] == "success"

        stats_1 = get_call_stats(db_path)
        assert stats_1["total_calls"] == 1
        assert stats_1["successful_calls"] == 1
        assert stats_1["failed_calls"] == 0
        assert stats_1["success_rate"] == 100.0

        # Record a failed call (Early dropout before interaction)
        call_2 = record_call_start("call_fail_002", "sip_call_room", user_id="user_102", db_path=db_path)
        res_2 = update_call_outcome(
            call_id="call_fail_002",
            outcome="failed",
            reason="Caller hung up before starting query",
            turns=0,
            db_path=db_path,
        )
        assert res_2["outcome"] == "failed"

        stats_2 = get_call_stats(db_path)
        assert stats_2["total_calls"] == 2
        assert stats_2["successful_calls"] == 1
        assert stats_2["failed_calls"] == 1
        assert stats_2["success_rate"] == 50.0

        # Record another successful call (Human Escalation Path)
        call_3 = record_call_start("call_success_003", "browser_room_3", user_id="user_103", db_path=db_path)
        update_call_outcome(
            call_id="call_success_003",
            outcome="success",
            reason="Human escalation ticket created with user consent",
            turns=4,
            db_path=db_path,
        )

        stats_3 = get_call_stats(db_path)
        assert stats_3["total_calls"] == 3
        assert stats_3["successful_calls"] == 2
        assert stats_3["failed_calls"] == 1
        assert stats_3["success_rate"] == 66.7

        # Step 6: Verify History & Privacy Protection
        history = get_call_history(limit=10, db_path=db_path)
        assert len(history) == 3
        for rec in history:
            assert "call_id" in rec
            assert "outcome" in rec
            assert "reason" in rec
            # Verify sensitive credentials (passwords, OTPs, PINs, bank details) are NOT stored in history
            assert "password" not in rec
            assert "otp" not in rec
            assert "pin" not in rec

        print("\nALL CALL OUTCOME DB & STATS TESTS PASSED SUCCESSFULLY!")

    finally:
        try:
            if os.path.exists(db_path):
                os.remove(db_path)
        except Exception:
            pass

if __name__ == "__main__":
    test_call_outcomes_flow()
