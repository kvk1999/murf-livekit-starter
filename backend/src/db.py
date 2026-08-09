import json
import sqlite3
from datetime import datetime
from typing import Any, Dict, Optional

DB_PATH = "caller_memory.db"


def init_db(db_path: str = DB_PATH) -> None:
    """Initialize SQLite database table for storing caller memory."""
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS callers (
                user_id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                language_preference TEXT,
                facts TEXT,
                last_interaction TEXT
            )
            """
        )
        conn.commit()


def get_caller(identifier: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    """Lookup caller by user_id or name in SQLite database."""
    init_db(db_path)
    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT user_id, name, language_preference, facts, last_interaction
            FROM callers
            WHERE LOWER(user_id) = LOWER(?) OR LOWER(name) = LOWER(?)
            """,
            (identifier, identifier),
        )
        row = cursor.fetchone()
        if not row:
            return None

        user_id, name, language_pref, facts_json, last_interaction = row
        facts = {}
        if facts_json:
            try:
                facts = json.loads(facts_json)
            except Exception:
                facts = {}

        return {
            "user_id": user_id,
            "name": name,
            "language_preference": language_pref,
            "facts": facts,
            "last_interaction": last_interaction,
        }


def save_caller(
    user_id: str,
    name: str,
    language_preference: str,
    facts: Dict[str, Any],
    user_consent_confirmed: bool,
    db_path: str = DB_PATH,
) -> Dict[str, Any]:
    """Save or update caller data if user consent is explicitly confirmed."""
    if not user_consent_confirmed:
        return {
            "status": "error",
            "message": "User consent was not granted. Data was not saved.",
        }

    init_db(db_path)
    now_iso = datetime.now().isoformat()
    facts_json = json.dumps(facts or {})

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO callers (user_id, name, language_preference, facts, last_interaction)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                name = excluded.name,
                language_preference = excluded.language_preference,
                facts = excluded.facts,
                last_interaction = excluded.last_interaction
            """,
            (user_id, name, language_preference, facts_json, now_iso),
        )
        conn.commit()

    return {
        "status": "success",
        "message": f"Caller record for {name} saved successfully.",
        "record": {
            "user_id": user_id,
            "name": name,
            "language_preference": language_preference,
            "facts": facts,
            "last_interaction": now_iso,
        },
    }
