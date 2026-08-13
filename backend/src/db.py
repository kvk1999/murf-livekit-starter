import json
import os
import sqlite3
from datetime import datetime
from typing import Any, Dict, List, Optional

DB_PATH = os.environ.get(
    "CALLER_DB_PATH",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "caller_memory.db"),
)


def init_db(db_path: str = DB_PATH) -> None:
    """Initialize SQLite database tables for storing caller memory and call outcome logs."""
    abs_path = os.path.abspath(db_path)
    os.makedirs(os.path.dirname(abs_path), exist_ok=True)
    with sqlite3.connect(abs_path) as conn:
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
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS call_outcomes (
                call_id TEXT PRIMARY KEY,
                room_name TEXT,
                start_time TEXT,
                end_time TEXT,
                outcome TEXT NOT NULL,
                reason TEXT,
                user_id TEXT,
                turns INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


def get_caller(identifier: str, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    """Lookup caller by user_id or name in SQLite database."""
    init_db(db_path)
    abs_path = os.path.abspath(db_path)
    with sqlite3.connect(abs_path) as conn:
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
    abs_path = os.path.abspath(db_path)

    with sqlite3.connect(abs_path) as conn:
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


def record_call_start(
    call_id: str,
    room_name: str,
    user_id: str = "guest",
    db_path: str = DB_PATH,
) -> str:
    """Record initial call session start in SQLite database."""
    init_db(db_path)
    start_time = datetime.now().isoformat()
    abs_path = os.path.abspath(db_path)
    with sqlite3.connect(abs_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT OR REPLACE INTO call_outcomes (call_id, room_name, start_time, outcome, reason, user_id, turns)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                call_id,
                room_name,
                start_time,
                "failed",
                "In progress / Pending evaluation",
                user_id,
                0,
            ),
        )
        conn.commit()
    return call_id


def update_call_outcome(
    call_id: str,
    outcome: str,
    reason: str = "",
    turns: int = 0,
    user_id: Optional[str] = None,
    db_path: str = DB_PATH,
) -> Dict[str, Any]:
    """Record or update final call outcome (success or failed) when a call ends."""
    init_db(db_path)
    end_time = datetime.now().isoformat()
    normalized_outcome = "success" if outcome.lower() == "success" else "failed"
    abs_path = os.path.abspath(db_path)

    with sqlite3.connect(abs_path) as conn:
        cursor = conn.cursor()
        if user_id:
            cursor.execute(
                """
                UPDATE call_outcomes
                SET end_time = ?, outcome = ?, reason = ?, turns = ?, user_id = ?
                WHERE call_id = ?
                """,
                (end_time, normalized_outcome, reason, turns, user_id, call_id),
            )
        else:
            cursor.execute(
                """
                UPDATE call_outcomes
                SET end_time = ?, outcome = ?, reason = ?, turns = ?
                WHERE call_id = ?
                """,
                (end_time, normalized_outcome, reason, turns, call_id),
            )

        if cursor.rowcount == 0:
            cursor.execute(
                """
                INSERT INTO call_outcomes (call_id, room_name, start_time, end_time, outcome, reason, user_id, turns)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    call_id,
                    "default_room",
                    end_time,
                    end_time,
                    normalized_outcome,
                    reason,
                    user_id or "guest",
                    turns,
                ),
            )
        conn.commit()

    return {
        "status": "success",
        "call_id": call_id,
        "outcome": normalized_outcome,
        "reason": reason,
        "turns": turns,
    }


def get_call_stats(db_path: str = DB_PATH) -> Dict[str, Any]:
    """Retrieve call metrics: Total calls, Successful calls, Failed calls."""
    init_db(db_path)
    abs_path = os.path.abspath(db_path)
    with sqlite3.connect(abs_path) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM call_outcomes")
        total_calls = cursor.fetchone()[0] or 0

        cursor.execute(
            "SELECT COUNT(*) FROM call_outcomes WHERE LOWER(outcome) = 'success'"
        )
        successful_calls = cursor.fetchone()[0] or 0

        cursor.execute(
            "SELECT COUNT(*) FROM call_outcomes WHERE LOWER(outcome) = 'failed'"
        )
        failed_calls = cursor.fetchone()[0] or 0

    success_rate = (
        round((successful_calls / total_calls * 100), 1) if total_calls > 0 else 0.0
    )

    return {
        "total_calls": total_calls,
        "successful_calls": successful_calls,
        "failed_calls": failed_calls,
        "success_rate": success_rate,
    }


def get_call_history(
    limit: int = 20, db_path: str = DB_PATH
) -> List[Dict[str, Any]]:
    """Retrieve recent call records, ensuring privacy protection by excluding sensitive transcripts/credentials."""
    init_db(db_path)
    abs_path = os.path.abspath(db_path)
    with sqlite3.connect(abs_path) as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT call_id, room_name, start_time, end_time, outcome, reason, user_id, turns, created_at
            FROM call_outcomes
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()

    history = []
    for r in rows:
        history.append(
            {
                "call_id": r[0],
                "room_name": r[1],
                "start_time": r[2],
                "end_time": r[3],
                "outcome": r[4],
                "reason": r[5],
                "user_id": r[6],
                "turns": r[7],
                "created_at": r[8],
            }
        )
    return history

