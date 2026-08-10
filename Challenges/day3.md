# Day 3 – Personalise Your Agent's Frontend

Welcome to **Day 3** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. The goal of Day 3 is to build or personalize a clean user interface that matches your chosen track and clearly reflects all active conversation states.

---

## 🎯 Day 3 Objectives

* **Frontend Customization**: Personalize the starter Next.js UI using colors, text, buttons, and layouts suited for your product and target audience.


* **Agent State Management**: Clearly display five distinct agent states on the interface (*Ready, Connecting, Listening, Speaking, Call ended*).


* **Visualizer & Speaking Indicators**: Make it obvious who is currently speaking using volume bars, waveforms, or status text (*"Listening to you"* and *"Agent is speaking"*).


* **Microphone Error Handling**: Provide clear, actionable instructions if microphone access is blocked by the browser.


* **Mobile Responsiveness**: Verify that important text and buttons are easy to read and tap on mobile viewports.



---

## 💻 Key Implementation (`frontend/app-config.ts` & `frontend/components/`)

The frontend configuration and branding are managed inside the Next.js workspace:

### 1. Branding & Feature Configuration (`frontend/app-config.ts`)

The visualizer type, accent colors, titles, and button text can be tailored to match your agent's track (e.g., Local Commerce street vendor tools):

* **Tech Stack**: Next.js (React, TypeScript), Tailwind CSS, and LiveKit Agents UI (shadcn-based components).


* **Key Files**:
* `frontend/app-config.ts` — Controls branding, feature flags, and visualizer settings.


* `frontend/app/page.tsx` — Main application page.


* `frontend/components/agents-ui/` — Voice UI components for audio visualization and call controls.





### 2. Running the Frontend

```bash
cd frontend
pnpm install
pnpm dev

```

Open `http://localhost:3000` in your browser to test the interactive voice UI.

---

## ✅ Day 3 Verification Checklist

* [x] Frontend branding and layout configured to match the local commerce track.


* [x] UI clearly indicates when the agent is connecting, listening, speaking, or disconnected.


* [x] Clear error messages shown when microphone permissions are denied.


* [x] Verified complete end-to-end conversation flow through the web frontend.