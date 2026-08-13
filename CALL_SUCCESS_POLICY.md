# Call Success Policy & Outcome Analytics

## 🎯 Step 1: Definition of a Successful Call

For the **Kathirvelan Karthik — Digital Financial & Citizen Assistant** voice agent, call outcomes are evaluated as follows:

### ✅ Successful Call Definition
A call (Browser web audio or SIP phone call) is recorded as **Successful** when:
1. **Interactive Query Completion**: The caller engages in at least **1 interactive turn** where the agent delivers information or answers questions (e.g., scheme eligibility details, market weather reports, or retrieving saved caller profiles).
2. **Tool Execution**: The call triggers an agent function tool (such as saving caller details or creating a human escalation ticket) with explicit verbal caller consent.
3. **No Unhandled Errors**: The session finishes without unexpected runtime exceptions or crashes.

### ❌ Failed Call Definition
A call is recorded as **Failed** when:
1. **Early Disconnect**: The caller hangs up or disconnects before any interactive dialogue turn takes place (0 turns).
2. **Runtime Failure**: An unexpected network/server error interrupts the agent session before query resolution.

---

## 💾 Step 2 & 4: Database Storage & Real Data Pipeline

All call outcomes are saved to SQLite (`backend/caller_memory.db`) under the `call_outcomes` table:

```sql
CREATE TABLE IF NOT EXISTS call_outcomes (
    call_id TEXT PRIMARY KEY,
    room_name TEXT,
    start_time TEXT,
    end_time TEXT,
    outcome TEXT NOT NULL, -- 'success' or 'failed'
    reason TEXT,
    user_id TEXT,
    turns INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Live metrics are queried dynamically by the Next.js API route (`/api/calls/stats`) directly from SQLite. No numbers are hardcoded.

---

## 📊 Step 3: Web Dashboard

The web dashboard is integrated directly into the Next.js frontend UI (`frontend/components/app/dashboard-view.tsx`) with top navigation switching between the **Voice Assistant** and **Call Analytics Dashboard**.

It displays:
1. **Total Calls** count
2. **Successful Calls** count
3. **Failed Calls** count
4. **Success Rate (%)** & visual progress indicator
5. **Sanitized Call Outcome Log Table**

---

## 🔒 Step 6: Privacy Guardrails

To strictly protect caller information:
- Passwords, OTPs, PINs, full bank account numbers, medical information, and full conversation transcripts are **never stored in public telemetry logs** or rendered on the dashboard.
- User IDs are masked (e.g. `cit***`), showing only non-sensitive outcome metadata and issue categories.
