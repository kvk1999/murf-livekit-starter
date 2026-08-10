# Day 2 – Give Your Agent a Personality, a Job, and Limits

Welcome to **Day 2** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. The goal of Day 2 is to transform your talking voice agent into a structured professional with a defined job, strict guardrails, and dynamic language matching.

---

## 🎯 Day 2 Objectives

* **Call Objectives**: Define clear goals for what a successful call should achieve (e.g., managing digital catalogues, guiding order placements, and assisting with government schemes).
* **Guardrails & Refusals**: Establish hard boundaries on what the agent must refuse, what it must never claim, and provide a clear escalation path.


* **Code-Mixed Language Support**: Verify that the agent can handle users mixing regional languages (like Tamil or Hindi) with English.
* **First-Turn Greeting**: Craft an opening greeting that sets the agent's identity, role, and tone.

---

## 🛡️ Track-Specific Guardrails (Local Commerce)

For our Local Commerce track, strict boundaries ensure safe and compliant interactions:

* **Never confirm orders, prices, or delivery dates** that the seller has not explicitly set.


* **Never make false claims** about official government scheme approvals or monetary grants.
* **Escalation Script**: Direct vendors or buyers to official portals (like the PM SVANidhi website or local municipal authorities) for account disputes or unconfirmed order modifications.

---

## 💻 Key Implementation (`backend/src/agent.py` & `prompt.py`)

The agent's behavior, personality, and boundaries are strictly defined within the system instructions and runtime event listeners:

### 1. System Prompt Structure

The agent is instructed on its identity, knowledge boundaries, and tone:

* **Identity**: Intelligent and empowering voice assistant for Indian Local Commerce (MSMEs, street vendors, and SHGs).


* **Style**: Brief, polite, and clear responses without markdown formatting or emojis, optimized for spoken output.



### 2. Code-Mixed Language Detection & Voice Switching

The backend dynamically listens to transcriptions and switches the Murf Falcon voice register between English and regional accents as needed:

```python
@session.on("user_input_transcribed")
def on_user_input_transcribed(ev: UserInputTranscribedEvent):
    transcript = ev.transcript.strip().lower()
    if not transcript:
        return

    # Dynamic language/accent matching for regional inputs
    has_tamil_words = not set(transcript.split()).isdisjoint(tamil_keywords)
    if has_tamil_words:
        session.tts.update_options(voice="ta-IN-anisha")
    else:
        session.tts.update_options(voice="en-IN-anisha")

```

---

## ✅ Day 2 Verification Checklist

* [x] Defined call objectives and structured identity prompt.


* [x] Established hard guardrails refusing unauthorized order confirmations and price guarantees.


* [x] Verified code-mixed language handling and dynamic accent switching.


* [x] Tested first-turn greeting and refusal handling on camera.