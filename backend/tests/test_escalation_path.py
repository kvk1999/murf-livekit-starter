import pytest
import os
import json
import sys

# Ensure src is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from human_help import create_escalation, sanitize_data

def test_escalation_path_with_consent(tmp_path):
    """Test Step 1-6: Escalation creation when permission is granted."""
    test_store = os.path.join(tmp_path, "test_escalations.jsonl")

    # Step 3: Summary data with private info to verify redacting/privacy
    who = "Caller Ramesh"
    what = "Payment dispute on order #9948"
    checked = "Verified order status in DB, payment failed on gateway"
    urgency = "high"
    language = "Tamil"
    follow_up = "phone"
    
    # Step 4: Ask before sharing -> user says YES (user_permission_granted=True)
    res = create_escalation(
        who=who,
        what=what,
        checked=checked,
        urgency=urgency,
        language=language,
        follow_up=follow_up,
        user_permission_granted=True,
        file_path=test_store
    )

    # Step 6: Verify reference ID & next step
    assert "reference_id" in res
    assert res["reference_id"].startswith("ESC-")
    assert "Your request has been submitted under Reference ID" in res["next_step_message"]
    
    # Step 5: Verify record persisted in store
    assert os.path.exists(test_store)
    with open(test_store, "r", encoding="utf-8") as f:
        lines = f.readlines()
        assert len(lines) == 1
        record = json.loads(lines[0])
        assert record["reference_id"] == res["reference_id"]
        assert record["summary"]["who"] == who
        assert record["summary"]["what"] == what
        assert record["summary"]["checked"] == checked
        assert record["summary"]["urgency"] == urgency
        assert record["summary"]["language"] == language
        assert record["summary"]["follow_up"] == follow_up

def test_escalation_path_permission_denied(tmp_path):
    """Test Step 4: Permission denied path -> Request MUST NOT be created."""
    test_store = os.path.join(tmp_path, "test_escalations.jsonl")

    res = create_escalation(
        who="Caller Priya",
        what="Repeated app glitch",
        checked="Restarted session",
        urgency="medium",
        user_permission_granted=False, # User said NO
        file_path=test_store
    )

    assert res["status"] == "cancelled"
    assert "Permission denied" in res["message"]
    assert not os.path.exists(test_store) # File should not be created

def test_sensitive_data_sanitization():
    """Test Step 3: Ensure passwords, OTPs, PINs, and secret fields are sanitized."""
    data = {
        "user": "vendor_01",
        "password": "secretpassword123",
        "otp": "123456",
        "pin": "9999",
        "issue": "Cannot log in"
    }
    sanitized = sanitize_data(data)
    assert sanitized["password"] == "[REDACTED]"
    assert sanitized["otp"] == "[REDACTED]"
    assert sanitized["pin"] == "[REDACTED]"
    assert sanitized["user"] == "vendor_01"
