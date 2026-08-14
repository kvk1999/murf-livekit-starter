# Day 8 – Build a Call Analytics Dashboard

Welcome to **Day 8** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. Your agent can now converse, remember past sessions, use real tools, place outbound calls, and escalate to humans. Today, you will build a **lightweight analytics dashboard** to track and evaluate how your agent performs in production.

---

## 🎯 Day 8 Objectives

* **Step 1: Define Call Success**: Align success metrics with the call objectives set on Day 2 for our **Financial Services / Citizen Assistant** track (Kathirvelan Karthik). A call is **successful** if the agent successfully completed its core goal (e.g., provided accurate scheme eligibility details, answered a financial literacy query, or securely generated an escalation/follow-up ticket). A call is **failed** if the caller dropped off early, the session ended due to an unresolved error, or the goal was not met.
* **Step 2: Track and Record Outcomes**: Automatically log the conclusion of every session into our backend SQLite database (`caller_memory.db`), capturing whether the interaction resulted in a success or failure status.
* **Step 3: Build a Simple Web Dashboard**: Create a clean interface displaying three key performance indicators:
1. **Total Calls**
2. **Successful Calls**
3. **Failed Calls**


* **Step 4: Pull Real Data Dynamically**: Connect the dashboard backend directly to the database so metrics update in real-time from actual browser or SIP calls—no hardcoded values.
* **Step 5: Test the Success Path**: Run a successful live test call, verifying that the dashboard counters increment correctly.
* **Step 6: Protect Caller Privacy**: Ensure sensitive information (such as passwords, OTPs, PINs, full account numbers, or raw conversation transcripts) is never exposed on the dashboard interface.

---

## 💻 Implementation Blueprint (`backend/src/db.py` & Dashboard Endpoint)

### 1. Database Logging (`db.py`)

Extend your SQLite database to record session outcomes upon disconnection:

```python
import sqlite3
from datetime import datetime

def log_call_outcome(user_id: str, success: bool, summary: str = ""):
    conn = sqlite3.connect("caller_memory.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS call_analytics (
            call_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            success BOOLEAN,
            summary TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute(
        "INSERT INTO call_analytics (user_id, success, summary) VALUES (?, ?, ?)",
        (user_id, success, summary)
    )
    conn.commit()
    conn.close()

def get_analytics_metrics():
    conn = sqlite3.connect("caller_memory.db")
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END), SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) FROM call_analytics")
    row = cursor.fetchone()
    conn.close()
    return {
        "total_calls": row[0] or 0,
        "successful_calls": row[1] or 0,
        "failed_calls": row[2] or 0
    }

```

### 2. Simple Dashboard API / View

You can expose these metrics via a lightweight endpoint or render them directly in a minimalist frontend view:

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/analytics")
def analytics_endpoint():
    metrics = get_analytics_metrics()
    return metrics

```

---

## ✅ Day 8 Verification Checklist

* [x] Defined clear success criteria aligned with the assistant's primary objectives.
* [x] Integrated call logging to record success/failure states automatically upon session close.
* [x] Built a clean dashboard displaying total, successful, and failed call metrics.
* [x] Verified that dashboard data is dynamically fetched from real database entries.
* [x] Confirmed that private data and raw transcripts are safely excluded from analytics views.