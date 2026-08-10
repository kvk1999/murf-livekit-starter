# Day 4 – Give Your Agent a Memory That Lasts

Welcome to **Day 4** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. The goal of Day 4 is to equip your voice agent with persistent memory so it remembers callers across different sessions using database tools rather than hardcoded prompts.

---

## 🎯 Day 4 Objectives

* **Database Integration**: Set up an SQLite database (`caller_memory.db`) to store caller profiles and interactions persistently.


* **Track-Specific Fact Storage**: Save essential caller details and track-specific facts such as `past_orders`, `usual_quantities`, `preferred_delivery_slot`, and `business_type`.


* **Function-Driven Memory**: Give the agent dedicated function tools (`lookup_caller` and `save_caller_info`) so it reads and writes data dynamically.


* **Returning Caller Greetings**: Welcome returning callers by name and reference their previous interactions automatically.


* **Mandatory Consent Rule**: Require explicit verbal permission from the caller before saving any personal details.



---

## 💻 Key Implementation (`db.py` & `backend/src/agent.py`)

### 1. Database Schema & Operations (`db.py`)

A lightweight SQLite table stores caller profiles and JSON-encoded track facts:

* `user_id` (Primary Key)


* `name`

* `language_preference`

* `facts` (JSON object containing order preferences and vendor details)


* `last_interaction` (Timestamp)



### 2. Function Tools (`agent.py`)

The agent uses `@function_tool` decorators to interact with the database:

* **`lookup_caller`**: Searches the SQLite database when a caller introduces themselves.


* **`save_caller_info`**: Saves or updates caller records **only if** `user_consent_confirmed=True`.



```python
@function_tool
async def save_caller_info(
    self,
    context: RunContext,
    user_id: str,
    name: str,
    language_preference: str,
    past_orders: str = "",
    usual_quantities: str = "",
    preferred_delivery_slot: str = "",
    business_type: str = "",
    user_consent_confirmed: bool = False,
):
    """Save or update caller data in the SQLite database after explicit verbal consent."""
    if not user_consent_confirmed:
        return "User denied permission to save their data. No information was recorded."
    # Database save execution...

```

---

## ✅ Day 4 Verification Checklist

* [x] Database records persist even after fully restarting the agent.


* [x] Agent fetches and updates caller information through function calls, not hardcoded prompts.


* [x] A second call from the same user seamlessly continues from past context.


* [x] Agent explicitly requests verbal consent before saving data and honors refusals.