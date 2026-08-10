# Day 1 – Get Your Voice Agent Talking

Welcome to **Day 1** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. The goal of Day 1 is to establish a working voice pipeline capable of receiving user speech, processing it, and responding back using an Indian voice powered by **Murf Falcon TTS**.

---

## 🎯 Day 1 Objectives

* **Repository Setup**: Clone and initialize the starter voice agent architecture.


* **Track Selection**: Selected **Local Commerce** to assist street vendors, artisans, and small business owners across India.


* **Indian Voice Integration**: Configured Murf Falcon TTS with an Indian locale voice (`ta-IN-anisha` / `en-IN-anisha`).


* **Pipeline Verification**: Established a live WebRTC audio connection through LiveKit to test bidirectional voice speech.



---

## 🛠️ Architecture & Tech Stack

```
[🎙️ User Speech] 
       │
       ▼
[Deepgram Nova-3 STT] ──► [Google Gemini LLM] ──► [Murf Falcon TTS] ──► [🔊 User Hears]

```

* **Voice AI Framework**: LiveKit Agents SDK (`livekit-agents`)


* **Text-to-Speech (TTS)**: Murf Falcon (`livekit-murf`) using `ta-IN-anisha` / `en-IN-anisha`

* **Speech-to-Text (STT)**: Deepgram Nova-3 (`deepgram.STT`) set to multilingual mode


* **LLM**: Google Gemini (`gemini-3.5-flash-lite`)


* **Turn Detection & VAD**: Silero VAD + LiveKit Multilingual Turn Detector



---

## 💻 Key Implementation (`backend/src/agent.py`)

The pipeline session is initialized inside `backend/src/agent.py`:

```python
session = AgentSession(
    stt=deepgram.STT(model="nova-3", language="multi"),
    llm=google.LLM(
        model="gemini-3.5-flash-lite",
    ),
    tts=murf.TTS(
        voice="ta-IN-anisha",
        style="Conversation",
        tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
        text_pacing=True,
    ),
    turn_detection=MultilingualModel(),
    vad=ctx.proc.userdata["vad"],
    preemptive_generation=True,
)

```

---

## 🚀 How to Run (Day 1 Setup)

### 1. Prerequisites

* Python 3.10+


* `uv` package manager


* Node.js 18+ & `pnpm`


### 2. Environment Variables

Copy `.env.example` to `.env.local` in `backend/` and `frontend/` with your credentials:

* `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`

* `MURF_API_KEY`

* `DEEPGRAM_API_KEY`

* `GOOGLE_API_KEY`


### 3. Start Backend & Frontend

**Backend Setup**:

```bash
cd backend
uv sync
uv run python src/agent.py download-files
uv run python src/agent.py dev

```

**Frontend Setup**:

```bash
cd frontend
pnpm install
pnpm dev

```

---

## ✅ Day 1 Verification Checklist

* [x] Repository cloned and environment variables configured.


* [x] Backend agent registered with LiveKit and listening for connections.


* [x] Frontend opens at `http://localhost:3000` and requests microphone permissions.


* [x] Agent successfully responds to spoken audio using a Murf Falcon Indian voice.