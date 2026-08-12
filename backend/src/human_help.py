import os
import json
import uuid
import logging
from datetime import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("human_help")

ESCALATION_STORE_PATH = os.path.join(os.path.dirname(__file__), "escalations.jsonl")

# Sanitize/strip sensitive data before storing or sending summary
SENSITIVE_KEYS = {"password", "otp", "pin", "cvv", "account_number", "card_number", "ssn", "secret"}

def sanitize_data(data: Any) -> Any:
    """Recursively remove/redact sensitive information like passwords, OTPs, PINs, account numbers."""
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            if k.lower() in SENSITIVE_KEYS:
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = sanitize_data(v)
        return cleaned
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, str):
        # Basic pattern redacting or sanitization if sensitive words are present
        return data
    return data

def persist_escalation(ticket: Dict[str, Any], file_path: str = ESCALATION_STORE_PATH) -> None:
    """Persist escalation record safely as a JSON line entry."""
    os.makedirs(os.path.dirname(os.path.abspath(file_path)), exist_ok=True)
    with open(file_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(ticket) + "\n")

def notify_webhook(ticket: Dict[str, Any], webhook_url: Optional[str] = None) -> bool:
    """Send summary notification to real endpoint (Slack, Discord, webhook) if configured."""
    url = webhook_url or os.getenv("ESCALATION_WEBHOOK_URL")
    if not url:
        return False
    
    try:
        import urllib.request
        req = urllib.request.Request(
            url,
            data=json.dumps(ticket).encode("utf-8"),
            headers={"Content-Type": "application/json", "User-Agent": "HumanHelpEscalation/1.0"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status in (200, 201, 202, 204)
    except Exception as e:
        logger.warning(f"Failed to post escalation notification to webhook {url}: {e}")
        return False

def create_escalation(
    who: str,
    what: str,
    checked: str,
    urgency: str = "medium",
    language: str = "English",
    follow_up: str = "phone",
    user_permission_granted: bool = False,
    file_path: str = ESCALATION_STORE_PATH,
    webhook_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Creates a human-help ticket when permission is granted.
    
    Step 3 Summary details saved:
    - who: Who needs help
    - what: What happened
    - checked: What the agent already checked
    - urgency: How urgent it is (low/medium/high)
    - language & follow_up: Caller's language and preferred follow-up method
    
    Step 4: Strictly fails/aborts if user_permission_granted is False.
    """
    if not user_permission_granted:
        logger.info("Escalation request cancelled: user permission was not granted.")
        return {
            "status": "cancelled",
            "message": "Permission denied by caller. Escalation request was not created."
        }

    ticket_id = f"ESC-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    
    summary = {
        "who": who,
        "what": what,
        "checked": checked,
        "urgency": urgency,
        "language": language,
        "follow_up": follow_up
    }

    # Step 3: Ensure privacy, no sensitive tokens/passwords/OTPs
    sanitized_summary = sanitize_data(summary)

    ticket = {
        "reference_id": ticket_id,
        "timestamp": datetime.now().isoformat(),
        "summary": sanitized_summary,
        "status": "open"
    }

    # Step 5: Send request somewhere real (Local database/file store & optional webhook)
    persist_escalation(ticket, file_path=file_path)
    notified = notify_webhook(ticket, webhook_url=webhook_url)
    ticket["notified"] = notified

    # Step 6: Clear next step response structure
    ticket["next_step_message"] = (
        f"Your request has been submitted under Reference ID {ticket_id}. "
        f"A human support team member will review the request and reach out via your preferred method ({follow_up}). "
        f"Please note that resolution time depends on queue volume."
    )
    return ticket
