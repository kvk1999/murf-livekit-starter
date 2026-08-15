# Day 10 – Building Namma Kadai Assistant: A Voice Agent Journey for Tamil Nadu

Over the past ten days, I embarked on an incredible journey building **Namma Kadai Assistant**, an AI-powered digital financial assistant tailored for Tamil Nadu as part of the **10 Days of Voice Agents — #VoiceForBharat** challenge hosted by **Murf AI**.

Building a production-ready voice agent requires more than just connecting an LLM to a microphone; it demands ultra-low latency, robust memory, real-world tools, telephony integration, and careful human safety guardrails. Here is a complete guide and story of how Namma Kadai Assistant came to life.

---

## 🚀 1. Introduction: What is Namma Kadai Assistant?

Voice is the most natural medium for digital inclusion across India, especially for citizens who prefer regional languages or want quick oral guidance rather than navigating complex web portals.

**Namma Kadai Assistant** is an intelligent assistant designed to provide friendly, reliable guidance on:

* **Government Welfare Schemes** (such as PMJDY and PMSBY).


* **Digital Banking Safety & Fraud Prevention** (avoiding UPI scams, phishing, and OTP fraud).


* **General Financial Literacy** (savings, budgeting, loans, and financial planning).



By leveraging **Murf Falcon TTS**, the agent delivers ultra-low-latency (~130ms time-to-first-audio), expressive, natural-sounding voice interactions in English and Tamil code-mixed formats.

---

## 🛠️ 2. Core Architecture & Stack

The agent runs on a modern real-time voice pipeline designed for low latency and high concurrency:

```
[🎙️ User Speech] 
       │
       ▼
[Deepgram Nova-3 STT] ──► [Google Gemini LLM] ──► [Murf Falcon TTS] ──► [🔊 User Hears]

```

* **Voice Framework**: LiveKit Agents SDK (`livekit-agents`)


* **Speech-to-Text (STT)**: Deepgram Nova-3 (multilingual mode)


* **LLM**: Google Gemini (`gemini-3.5-flash-lite`)


* **Text-to-Speech (TTS)**: Murf Falcon (`livekit-murf`) using regional voices


* **Turn Detection**: Silero VAD + LiveKit Multilingual Turn Detector



---

## 💡 3. Key Features Built Across the Challenge

1. **Structured Personality & Guardrails (Days 1–2)**: Defined a strict system prompt that enforces polite, concise, and speakable responses while preventing unauthorized financial guarantees or false scheme confirmations.


2. **Persistent SQLite Memory (Day 4)**: Added a lightweight database (`caller_memory.db`) to store caller profiles and preferences securely, enabling the agent to greet returning users by name.


3. **Dynamic Domain Tools (Day 5)**: Integrated function tools enabling the agent to look up live data or rule datasets dynamically on demand.


4. **Outbound Calling via SIP / Linphone (Day 6)**: Shifted from reactive listening to proactive engagement by configuring outbound SIP trunks and ensuring compliant call openings (stating who is calling, why, and how to opt out).
5. **Human Escalation (Day 7)**: Implemented an escalation tool (`create_escalation`) with strict verbal consent rules to hand over complex financial fraud cases to human support teams.
6. **Analytics Dashboard (Day 8)**: Built a backend logger and dashboard endpoint to track total, successful, and failed calls dynamically without exposing private user transcripts.


7. **Specialist Multi-Agent Handoffs (Day 9)**: Created a separate `FraudSpecialistAgent` and equipped the main triage agent with a seamless handoff tool (`transfer_to_fraud_specialist`) that preserves ongoing chat context (`chat_ctx`).

---

## 🧗‍♂️ 4. Overcoming Technical Hurdles

Every real-world build encounters friction. Here is a major challenge faced during development and how it was solved:

* **The Challenge (Dynamic Accent & Voice Switching)**: Initially, when users switched between English and Tamil during a conversation, the TTS engine remained locked to a single accent, causing unnatural pronunciation of regional terms.
* **The Solution**: We attached an event listener to `session.on("user_input_transcribed")` to analyze incoming transcripts. If regional keywords were detected, the backend dynamically updated the Murf Falcon voice options mid-session (`session.tts.update_options(voice="ta-IN-anisha")`), achieving smooth bilingual flow.



---

## 🚀 5. How to Build and Run Your Own Agent

You can inspect the complete codebase in the public repository.

### Prerequisites

* Python 3.10+ & `uv`

* Node.js 18+ & `pnpm`

* LiveKit Cloud Account



### Setup Instructions

1. **Clone the repository**:
```bash
git clone https://github.com/murf-ai/murf-livekit-starter
cd murf-livekit-starter

```


2. **Configure Environment Variables**:
Copy `.env.example` to `.env.local` inside both `backend/` and `frontend/`, and populate your credentials:


* `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

* `MURF_API_KEY`

* `DEEPGRAM_API_KEY`

* `GOOGLE_API_KEY`



3. **Run the Backend & Frontend**:
```bash
# Terminal 1: Backend Agent
cd backend && uv sync && uv run python src/agent.py dev

# Terminal 2: Frontend UI
cd frontend && pnpm install && pnpm dev

```


4. Open `http://localhost:3000`, click **Start Call**, allow microphone permissions, and converse with Namma Kadai Assistant!



---

## 📸 6. Visual Evidence & Demos

* **Frontend UI**: Clean, light government-tech aesthetic featuring instant voice indicators and status badges.


* **Demo Video**: Watch the Day 2 walkthrough and architecture overview here: [Murf AI Challenge Day 2 Walkthrough](https://www.youtube.com/watch?v=wwPFUEXfcoM).