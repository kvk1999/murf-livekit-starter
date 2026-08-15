# Namma Kadai Assistant — Indian Local Commerce Voice Guide

Namma Kadai Assistant is an AI-powered voice assistant for small Indian retailers and shopkeepers, designed to help them with:

* 💰 **Financial Literacy & Guidance**: Understand savings, budgeting, banking, loans, investments, and financial planning.


* 🛡️ **Fraud Prevention & Cyber Safety**: Learn how to avoid UPI fraud, OTP scams, phishing links, and safe transactions.


* 🏛️ **Government Schemes Directory**: Discover central and state welfare schemes (like PMJDY, PMSBY), check eligibility, and understand documentation.


* 🗣️ **Multilingual Voice Assistance**: Immersive, real-time voice consultations using secure AI voice pipelines.



Built with a clean, light, and professional design theme featuring instant voice AI, scheme guidance, and safe & private interactions.

---

## Architecture

Namma Kadai Assistant utilizes a low-latency, real-time voice pipeline to communicate with citizens:

```mermaid
flowchart LR
    A[🎙️ User speaks] -->|audio| B[Deepgram STT]
    B -->|text| C[Gemini LLM]
    C -->|response text| D[Murf Falcon TTS]
    D -->|audio| E[LiveKit]
    E -->|stream| F[🔊 User hears]

    style A fill:#444441,stroke:#888780,color:#fff
    style B fill:#185FA5,stroke:#85B7EB,color:#fff
    style C fill:#534AB7,stroke:#AFA9EC,color:#fff
    style D fill:#0F6E56,stroke:#5DCAA5,color:#fff
    style E fill:#D85A30,stroke:#F0997B,color:#fff
    style F fill:#444441,stroke:#888780,color:#fff

```

---

## Features & Implementation

### 1. Caller Memory Database (SQLite)

* **Location**: `backend/caller_memory.db` (initialized automatically via db.py)


* **Usage**: Stores returning caller information such as `user_id`, `name`, `language_preference`, and `facts` extracted dynamically by the LLM during the voice call[cite: 4, 9, 10]. This enables personalized greetings and contextual continuity when a user reconnects[cite: 4, 9].

### 2. Financial Literacy & Welfare Schemes (System Prompt & Rules)

* **Location**: Implemented within instructions and rules in prompt.py and agent.py[cite: 9, 11].
* **Usage**: Provides instant guidance on major national financial inclusion schemes like Pradhan Mantri Jan Dhan Yojana (PMJDY) and Pradhan Mantri Suraksha Bima Yojana (PMSBY), while strictly adhering to privacy guardrails (never asking for PINs, OTPs, or full bank details).



---

## Quickstart

### Prerequisites

* **Python** 3.10+[cite: 6, 7]
* **[uv](https://docs.astral.sh/uv/)** - fast Python package manager


* **Node.js** 18+


* **pnpm** — fast Node package manager


* A [LiveKit](https://cloud.livekit.io/) project (free tier available)



### Step 1: Set up environment variables

Create `.env.local` in both `backend/` and `frontend/` (copy from `.env.example` in each). You need:

| Variable | Where to get it | Required |
| --- | --- | --- |
| `LIVEKIT_URL` | LiveKit Cloud dashboard

 | Yes

 |
| `LIVEKIT_API_KEY` | LiveKit Cloud dashboard

 | Yes

 |
| `LIVEKIT_API_SECRET` | LiveKit Cloud dashboard

 | Yes

 |
| `MURF_API_KEY` | [murf.ai/api/dashboard](https://murf.ai/api/dashboard)<br> | Yes

 |
| `DEEPGRAM_API_KEY` | [deepgram.com](https://deepgram.com)<br> | Yes

 |
| `GOOGLE_API_KEY` | [aistudio.google.com](https://aistudio.google.com) | Yes

 |

### Step 2: Install backend dependencies

```bash
cd backend
uv sync
uv run python src/agent.py download-files
```[cite: 7]

### Step 3: Install frontend dependencies

```bash
cd frontend
pnpm install
```[cite: 7]

### Step 4: Run the Application

**Option A - All-in-one (from repo root):**[cite: 7]

```bash
# macOS/Linux
chmod +x start_app.sh
./start_app.sh

# Windows (PowerShell)
.\start_app.ps1
```[cite: 7]

**Option B - Separate terminals:**[cite: 7]

```bash
# Terminal 1 — LiveKit Server
livekit-server --dev

# Terminal 2 — Backend agent
cd backend && uv run python src/agent.py dev

# Terminal 3 — Frontend
cd frontend && pnpm dev
```[cite: 7]

Then open **http://localhost:3000** in your browser[cite: 7]. Click **Start Call**, allow microphone access, and speak to interact with Namma Kadai Assistant[cite: 7, 11].

---

## Project Structure


```

murf-livekit-starter/
├── backend/                    # Python voice agent (LiveKit Agents + Murf Falcon)
│   ├── src/
│   │   ├── agent.py            # Agent pipeline and event handlers
│   │   ├── db.py               # SQLite caller database setup and operations
│   │   └── prompt.py           # Namma Kadai Assistant system prompt configuration
│   ├── tests/                  # LLM-judged evaluation suite
│   ├── pyproject.toml          # Python dependencies (uv)
│   └── caller_memory.db        # Local SQLite user profile store
├── frontend/                   # Next.js UI for voice sessions
│   ├── app/
│   │   ├── page.tsx            # Main UI page
│   │   └── api/token/          # LiveKit token endpoint
│   ├── components/             # UI layout and interactive components
│   ├── app-config.ts           # Branding, title, theme configuration
│   └── package.json            # Node dependencies (pnpm)
├── start_app.ps1               # Start script for Windows
├── start_app.sh                # Start script for macOS/Linux
└── README.md                   # This file

```

---

## License

MIT[cite: 7]

```
