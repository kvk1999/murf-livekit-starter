import logging

# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from livekit import rtc
# pyrefly: ignore [missing-import]
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    cli,
    inference,
    tokenize,
    room_io,
    UserInputTranscribedEvent,
    function_tool,
    RunContext,
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from db import get_caller, save_caller, record_call_start, update_call_outcome
from livekit.agents.llm import handoff
from prompt import SYSTEM_PROMPT, OUTBOUND_SYSTEM_PROMPT, SPECIALIST_SYSTEM_PROMPT

logger = logging.getLogger("agent")

load_dotenv(".env.local")


# Goodbye phrases across English, Tamil, and Tanglish
GOODBYE_PHRASES = [
    "bye", "goodbye", "good bye", "see you", "see ya", "catch you later",
    "talk later", "thank you bye", "thanks bye", "take care", "have a good day",
    "have a nice day", "good night", "good evening", "ok bye", "ok thanks",
    "okay bye", "okay thanks", "nandri", "poitten", "poi varen", "seri bye",
    "vanakkam bye", "adios", "cheers", "later", "tataa", "tata",
]


class FraudSpecialistAgent(Agent):
    """Specialist Agent for Cyber Safety & Fraud Prevention."""

    def __init__(self, session_stats: dict = None) -> None:
        super().__init__(instructions=SPECIALIST_SYSTEM_PROMPT)
        self._session_stats = session_stats or {}

    async def on_enter(self) -> None:
        """Invoked immediately after handoff takeover."""
        logger.info("FraudSpecialistAgent took over the session.")
        await self.session.generate_reply(
            instructions=(
                "Introduce yourself as the Cyber Safety and Fraud Prevention Specialist. "
                "Reassure the user, acknowledge their concern based on the conversation history, "
                "and ask them to share any additional details about the incident."
            )
        )

    @function_tool
    async def collect_farewell_feedback(
        self,
        context: RunContext,
        rating: str,
        feedback_comment: str = "",
    ):
        """Call this tool ONLY when the caller is saying goodbye or signing off.
        Ask the caller for a quick rating (1-5 or Excellent/Good/Ok/Poor) and
        any optional comment, then use this tool to record it before ending the call.

        Args:
            rating: Caller's satisfaction rating (e.g., '5', 'Excellent', 'Good', 'Ok', 'Poor').
            feedback_comment: Optional caller comment or suggestion.
        """
        logger.info(f"Specialist collected farewell feedback — rating={rating!r}, comment={feedback_comment!r}")
        self._session_stats["farewell_rating"] = rating
        self._session_stats["farewell_comment"] = feedback_comment
        self._session_stats["graceful_goodbye"] = True
        return (
            f"Thank you for your feedback! Rating: {rating}."
            " Stay safe online and have a wonderful day!"
        )


class Assistant(Agent):
    def __init__(self, session_stats: dict, is_outbound: bool = False) -> None:
        instructions = OUTBOUND_SYSTEM_PROMPT if is_outbound else SYSTEM_PROMPT
        super().__init__(instructions=instructions)
        # Shared mutable dict with the my_agent closure for farewell state
        self._session_stats = session_stats

    @function_tool
    async def transfer_to_fraud_specialist(self, context: RunContext):
        """Transfer the active call and conversation to the Cyber Safety & Fraud Prevention Specialist.

        Use this tool when the user reports active financial fraud, unauthorized UPI/bank debits,
        phishing links, fake loan apps, or compromised account credentials.

        This handoff passes the complete conversation context to the specialist so the user
        does not need to repeat their problem.
        """
        logger.info("Handoff triggered: Transferring call to Cyber Safety & Fraud Prevention Specialist.")
        
        # Step 5: Make the handoff clear to the user before switching
        await context.session.generate_reply(
            instructions="Say clearly to the user: 'I will connect you to our Cyber Safety and Fraud Prevention Specialist right away.'"
        )

        # Step 2 & 4: Instantiate specialist agent and transfer control via session.update_agent
        specialist = FraudSpecialistAgent(session_stats=self._session_stats)
        context.session.update_agent(specialist)

        # Trigger specialist self-introduction and takeover
        await specialist.on_enter()

        return "Handoff to Cyber Safety and Fraud Prevention Specialist complete."


    @function_tool
    async def collect_farewell_feedback(
        self,
        context: RunContext,
        rating: str,
        feedback_comment: str = "",
    ):

        """Call this tool ONLY when the caller is saying goodbye or signing off.
        Ask the caller for a quick rating (1-5 or Excellent/Good/Ok/Poor) and
        any optional comment, then use this tool to record it before ending the call.

        After calling this tool, say a warm farewell and end naturally.

        Args:
            rating: Caller's satisfaction rating (e.g., '5', 'Excellent', 'Good', 'Ok', 'Poor').
            feedback_comment: Optional caller comment or suggestion (e.g., 'Very helpful, explained PM Kisan scheme clearly').
        """
        logger.info(f"Farewell feedback collected — rating={rating!r}, comment={feedback_comment!r}")
        self._session_stats["farewell_rating"] = rating
        self._session_stats["farewell_comment"] = feedback_comment
        self._session_stats["graceful_goodbye"] = True
        return (
            f"Thank you for your feedback! Rating: {rating}."
            " It was a pleasure helping you. Have a wonderful day!"
        )

    @function_tool
    async def get_current_weather(self, context: RunContext, city: str):
        """Fetch live real-time weather data for a specific city to help street vendors and local commerce sellers plan outdoor markets and delivery logistics.

        Use this tool ONLY when the user asks about live weather, current temperature, rain conditions, or weather-dependent outdoor market conditions for a specified location/city.

        Args:
            city: The name of the city or location (e.g., 'Chennai', 'Mumbai', 'Delhi', 'Bengaluru').
        """
        import json
        import urllib.parse
        import urllib.request
        from datetime import datetime

        logger.info(f"Executing live weather lookup for city: {city}")
        try:
            # Step 1: Geocoding via Open-Meteo Geocoding API
            encoded_city = urllib.parse.quote(city)
            geo_url = f"https://geocoding-api.open-meteo.com/v1/search?name={encoded_city}&count=1&language=en&format=json"
            
            req = urllib.request.Request(
                geo_url,
                headers={"User-Agent": "VoiceAgentLocalCommerce/1.0"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                geo_data = json.loads(resp.read().decode("utf-8"))

            if not geo_data.get("results"):
                logger.warning(f"Geocoding lookup returned no results for '{city}'")
                return f"I could not locate '{city}'. Please check the city name and try again."

            loc = geo_data["results"][0]
            lat = loc["latitude"]
            lon = loc["longitude"]
            location_name = f"{loc.get('name', city)}, {loc.get('country', '')}"

            # Step 2: Fetch current weather metrics from Open-Meteo API
            weather_url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
            req_w = urllib.request.Request(
                weather_url,
                headers={"User-Agent": "VoiceAgentLocalCommerce/1.0"}
            )
            with urllib.request.urlopen(req_w, timeout=5) as resp_w:
                weather_data = json.loads(resp_w.read().decode("utf-8"))

            curr = weather_data.get("current_weather")
            if not curr:
                return f"Weather data is currently unavailable for {location_name}."

            temp = curr.get("temperature")
            windspeed = curr.get("windspeed")
            weathercode = curr.get("weathercode")
            obs_time = curr.get("time", datetime.now().strftime("%Y-%m-%d %H:%M"))

            # Map Weather Codes to friendly descriptions
            weather_descriptions = {
                0: "clear sky",
                1: "mainly clear",
                2: "partly cloudy",
                3: "overcast",
                45: "foggy",
                48: "depositing rime fog",
                51: "light drizzle",
                53: "moderate drizzle",
                55: "dense drizzle",
                61: "slight rain",
                63: "moderate rain",
                65: "heavy rain",
                80: "slight rain showers",
                81: "moderate rain showers",
                82: "violent rain showers",
                95: "thunderstorm",
            }
            condition = weather_descriptions.get(weathercode, "current conditions")

            report = (
                f"Live weather update for {location_name} as of {obs_time} (UTC): "
                f"Temperature is {temp}°C with {condition} and wind speed of {windspeed} km/h."
            )
            logger.info(f"Weather lookup successful: {report}")
            return report

        except urllib.error.URLError as e:
            logger.error(f"Network timeout or failure while fetching weather for {city}: {e}")
            return (
                f"I am sorry, but I am currently unable to fetch live weather data for {city} "
                f"due to a network service timeout. Please try again in a few moments."
            )
        except Exception as e:
            logger.error(f"Unexpected error in get_current_weather for {city}: {e}")
            return (
                f"I encountered an unexpected issue while looking up the weather for {city}. "
                f"Please verify the location and try asking again."
            )

    @function_tool
    async def lookup_caller(self, context: RunContext, identifier: str):
        """Lookup a returning caller by their name or user_id in the database.

        Args:
            identifier: The name or unique ID of the caller (e.g. 'Ramesh', 'user_123').
        """
        logger.info(f"Looking up caller in database: {identifier}")
        record = get_caller(identifier)
        if record:
            logger.info(f"Caller record found: {record}")
            return record
        return f"No record found for caller '{identifier}'."

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
        """Save or update caller data in the SQLite database after explicit verbal consent.

        Args:
            user_id: Unique caller ID or mobile number (e.g., 'ramesh_01' or '9876543210').
            name: Caller's name.
            language_preference: User's preferred language (e.g., 'Tamil', 'English', 'Hindi').
            past_orders: Details of past orders or products discussed (e.g., 'Cotton sarees', 'Terracotta pots').
            usual_quantities: Usual purchase/order quantities (e.g., '50 units', '10 kg').
            preferred_delivery_slot: Preferred delivery time or location preference.
            business_type: Vendor or buyer role (e.g., 'Handicraft artisan', 'Street vendor').
            user_consent_confirmed: Set to True ONLY IF the user explicitly said YES to saving their information.
        """
        if not user_consent_confirmed:
            logger.warning(f"Save attempt for '{name}' denied: user consent was not granted.")
            return "User denied permission to save their data. No information was recorded."

        facts = {}
        if past_orders:
            facts["past_orders"] = past_orders
        if usual_quantities:
            facts["usual_quantities"] = usual_quantities
        if preferred_delivery_slot:
            facts["preferred_delivery_slot"] = preferred_delivery_slot
        if business_type:
            facts["business_type"] = business_type

        logger.info(f"Saving caller info for {name} ({user_id}) with consent={user_consent_confirmed}")
        result = save_caller(
            user_id=user_id,
            name=name,
            language_preference=language_preference,
            facts=facts,
            user_consent_confirmed=user_consent_confirmed,
        )
        return result

    @function_tool
    async def create_human_escalation(
        self,
        context: RunContext,
        who: str,
        what: str,
        checked: str,
        urgency: str = "medium",
        language: str = "English",
        follow_up: str = "phone",
        user_permission_granted: bool = False,
    ):
        """Create a human-help ticket when the agent encounters an issue requiring human intervention.

        IMPORTANT: ALWAYS ask for caller permission first before invoking this tool with user_permission_granted=True!
        Do NOT include sensitive private data like passwords, OTPs, PINs, or full payment numbers.

        Use situations (Choose two reasons):
        1. Complex account/payment dispute or explicit user request for a human supervisor.
        2. Technical issue/system error repeated multiple times despite troubleshooting steps.

        Args:
            who: Identity or name of caller needing help (e.g. 'Ramesh', 'Street vendor #102').
            what: Concise summary of what happened.
            checked: What steps or tools the agent already checked/attempted.
            urgency: Urgency level ('low', 'medium', or 'high').
            language: Caller's language (e.g., 'English', 'Tamil', 'Hindi').
            follow_up: Preferred follow-up method (e.g. 'phone', 'email', 'chat').
            user_permission_granted: Must be True ONLY IF the caller explicitly gave permission to share their details.
        """
        from human_help import create_escalation
        logger.info(f"Triggering create_human_escalation tool for {who}, permission_granted={user_permission_granted}")
        res = create_escalation(
            who=who,
            what=what,
            checked=checked,
            urgency=urgency,
            language=language,
            follow_up=follow_up,
            user_permission_granted=user_permission_granted,
        )
        if res.get("status") == "cancelled":
            return res["message"]
        return f"Human help request created successfully. Reference ID: {res['reference_id']}. {res['next_step_message']}"


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    import time
    call_id = f"call_{ctx.room.name}_{int(time.time())}"
    record_call_start(call_id=call_id, room_name=ctx.room.name)
    # session_stats is the single source of truth for this call's runtime state
    session_stats = {
        "turns": 0,
        "recorded": False,
        "graceful_goodbye": False,
        "farewell_prompted": False,
        "farewell_rating": None,
        "farewell_comment": "",
        "agent_greeted": False,   # True once session.start() + ctx.connect() succeed
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
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

    @session.on("user_input_transcribed")
    def on_user_input_transcribed(ev: UserInputTranscribedEvent):
        session_stats["turns"] += 1
        transcript = ev.transcript.strip().lower()
        if not transcript:
            return

        # ── Goodbye / farewell detection ──────────────────────────────────────
        is_goodbye = any(phrase in transcript for phrase in GOODBYE_PHRASES)
        if is_goodbye and not session_stats["farewell_prompted"]:
            session_stats["farewell_prompted"] = True
            logger.info(f"Goodbye phrase detected in: '{ev.transcript}'. Prompting for feedback.")
            # Pre-emptively mark graceful goodbye so that even if the caller
            # hangs up before rating us the call is still SUCCESS (not FAILED).
            if session_stats["turns"] >= 1:
                session_stats["graceful_goodbye"] = True

        # ── Language / TTS voice switching ────────────────────────────────────
        # Check for Baloo Thambi 2 script characters (native tamil)
        has_baloo_thambi_2 = any(ord(c) >= 0x0900 and ord(c) <= 0x092F for c in transcript)

        # Check for common Tanglish/Tamil romanized keywords
        tamil_keywords = {
            "vanakkam", "nandri", "epadi", "iniku", "naalaikku", "inaikku", "adutha", "thayyar", "paaru",
            "nanban", "savaal", "thambi", "anna", "akka", "semma", "enna", "pandhu", "visiri",
            "gethu", "macha", "machan", "arisi", "pai", "paakkalam", "seri", "sirappu", "romba", "nalladhu", "kannadi"
        }
        words = set(transcript.split())
        has_tamil_words = not words.isdisjoint(tamil_keywords)

        if has_baloo_thambi_2 or has_tamil_words:
            logger.info(f"Detected Tamil/Tanglish speech: '{ev.transcript}'. Switching TTS to ta-IN-anisha")
            session.tts.update_options(voice="ta-IN-anisha")
        else:
            logger.info(f"Detected English speech: '{ev.transcript}'. Switching TTS to en-IN-anisha")
            session.tts.update_options(voice="en-IN-anisha")

    # Detect if session is an outbound call (via room name or SIP context)
    is_outbound_call = "outbound" in ctx.room.name.lower() or "sip" in ctx.room.name.lower()

    try:
        # Start the session, which initializes the voice pipeline and warms up the models
        await session.start(
            agent=Assistant(session_stats=session_stats, is_outbound=is_outbound_call),
            room=ctx.room,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=lambda params: (
                        noise_cancellation.BVCTelephony()
                        if params.participant.kind
                        == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                        else noise_cancellation.BVC()
                    ),
                ),
            ),
        )

        # Join the room and connect to the user
        await ctx.connect()

        # Session started and agent is live — mark as greeted
        # (even 0 user turns = caller connected and heard the greeting)
        session_stats["agent_greeted"] = True
        logger.info(f"Agent greeted caller in room {ctx.room.name}")

        if is_outbound_call:
            logger.info("Outbound call connected. Speaking mandatory 3-part opening statement...")
            await session.say(
                "Hello! This is Namma Kadai Voice Assistant calling from Indian Local Commerce to confirm your product delivery slot and check market weather conditions. If you wish to stop receiving these calls, simply say stop or hang up at any time."
            )
    except Exception as exc:
        logger.error(f"Error during call session {call_id}: {exc}")
        if not session_stats["recorded"]:
            update_call_outcome(
                call_id=call_id,
                outcome="failed",
                reason=f"Session error: {str(exc)}",
                turns=session_stats["turns"],
            )
            session_stats["recorded"] = True
    finally:
        if not session_stats["recorded"]:
            turns = session_stats["turns"]
            graceful = session_stats["graceful_goodbye"]
            rating = session_stats["farewell_rating"]
            comment = session_stats["farewell_comment"]

            if graceful and turns >= 1:
                outcome = "success"
                reason_parts = ["Caller signed off gracefully after conversation"]
                if rating:
                    reason_parts.append(f"Rating: {rating}")
                if comment:
                    reason_parts.append(f"Feedback: {comment}")
                reason = " | ".join(reason_parts)
            elif turns >= 1:
                outcome = "success"
                reason = "Inquiry completed / active interactive dialogue turns recorded"
            elif session_stats["agent_greeted"]:
                # Agent greeted the caller — caller connected but signed off
                # without speaking. Count as success (not a disconnect failure).
                outcome = "success"
                reason = "Agent greeted caller — caller signed off without verbal interaction"
            else:
                outcome = "failed"
                reason = "Session error or caller disconnected before agent greeting"

            update_call_outcome(
                call_id=call_id,
                outcome=outcome,
                reason=reason,
                turns=turns,
            )
            session_stats["recorded"] = True
            logger.info(f"Recorded call outcome for {call_id}: {outcome} (turns={turns}, graceful={graceful})")


if __name__ == "__main__":
    cli.run_app(server)
