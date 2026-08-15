# Day 6 – Outbound Calling with Your Voice Agent

Welcome to **Day 6** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. After building inbound conversational capabilities, persistent memory, and live tool integrations over the first five days, today shifts focus to **outbound calling**—initiating proactive voice contact with users.

---

## 🎯 Day 6 Objectives

* **Step 1: Find the Outbound Use Case**: Define a proactive trigger for your track. For our **Financial Services / Citizen Assistant** track, a great outbound use case is a **scheme deadline reminder** for someone already found eligible, or an alert regarding financial cyber safety and welfare scheme closures.
* **Step 2: Integrate a Telephony Service**: Connect a telephony service such as Twilio or use **Linphone (SIP)** to power programmable outbound voice calls.
* **Step 3: Execute the Call**: Have your agent place an automated call to a phone number or SIP client you control and complete a successful interaction.
* **Step 4: Master the Outbound Opening**: Because outbound calls are unsolicited, the first two sentences must clearly state:
1. Who is calling (e.g., Namma Kadai Assistant, Indian Local Commerce Voice Guide).
2. Why they are calling (e.g., to share an important update regarding government welfare scheme deadlines).
3. How to opt out or make it stop immediately.


* **Step 5 & 6: Record & Post on LinkedIn**: Capture a short video of the phone ringing and the live outbound interaction taking place. Post it on LinkedIn mentioning **Murf Falcon** (the fastest TTS API), tagging the official **Murf AI** handle, and using **#VoiceForBharat**.
* **Step 7: Submit**: Share your LinkedIn post link on the official submission form via Discord.

---

## 🛠️ Outbound Calling via Linphone (SIP)

If your Twilio trial credits are exhausted, you can use **Linphone** as a free SIP client to test and receive outbound agent calls locally:

1. **Set up a Linphone account**: Register on [linphone.org](https://www.linphone.org) to obtain your SIP address (`sip:<your-username>@sip.linphone.org`).
2. **Configure LiveKit Cloud**:
* Create a LiveKit Cloud project and save `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in your backend `.env` file.
* Navigate to the **Telephony** section in LiveKit Cloud, click **SIP Trunks**, and create an outbound trunk:
```json
{
  "name": "linphone-trunk",
  "address": "sip.linphone.org",
  "transport": "SIP_TRANSPORT_TLS",
  "numbers": ["sip:<your-linphone-username>"]
}

```


* Save the returned **TRUNK ID** as `LIVEKIT_SIP_OUTBOUND_TRUNK_ID` in your backend `.env` file.


3. **Configure the Linphone App**:
* Install the Linphone app on your phone, log in with your credentials, and grant microphone permissions.
* Go to **Settings -> Calls -> Advanced calls settings** and toggle **"Media encryption mandatory" OFF**.


4. **Run and Dial**:
* Start your agent backend:
```bash
uv run python src/telephony/outbound/agent.py dev

```


* Trigger the outbound call from your terminal:
```bash
uv run python src/telephony/outbound/dial.py --to <your-linphone-username>

```


* Answer the incoming call on your Linphone app and speak directly with your AI agent!



---

## ✅ Day 6 Verification Checklist

* [x] Outbound use case defined for your track.
* [x] Telephony/SIP trunk integration established via Twilio or Linphone.
* [x] Agent successfully places an outbound call with a compliant opening statement (who is calling, why, and opt-out instructions).
* [x] Recorded interaction and posted the video update on LinkedIn with **#VoiceForBharat**.