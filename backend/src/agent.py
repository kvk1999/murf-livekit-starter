from asyncio import base_events
from asyncio import base_events
from asyncio import base_events
from asyncio import base_events
from asyncio import base_events
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

from db import get_caller, save_caller

logger = logging.getLogger("agent")

load_dotenv(".env.local")

SYSTEM_PROMPT = """You are an intelligent, friendly, and empowering voice assistant for Indian Local Commerce, dedicated to helping local artisans, MSMEs, street vendors (PM SVANidhi beneficiaries), and self-help groups (SHGs) manage their digital catalogue, take customer orders, and access government support schemes.

Caller Memory & Database Tools Rules:
1. Lookup Caller: Call `lookup_caller` when a user introduces themselves, provides their name, or shares their ID.
2. Returning Caller Greeting: If `lookup_caller` returns existing records, greet them warmly by name and reference their previous interaction or saved facts. For example: "Namaste Ramesh! Last time we spoke about your cotton order / silk sarees. How can I help you today?"
3. Facts to Track (Local Commerce Track):
   - `past_orders`: Recent products ordered or enquired about (e.g., cotton sarees, spices)
   - `usual_quantities`: Typical order size or bulk quantity
   - `preferred_delivery_slot`: Preferred delivery timing/location
   - `business_type`: Type of vendor/buyer (e.g., street vendor, handicraft artisan)
4. MANDATORY CONSENT RULE BEFORE SAVING:
   - Before saving or updating ANY caller information in the database, you MUST verbally inform the caller and ask for explicit permission.
   - Example: "May I save your name and order preferences so I can remember you next time?"
   - IF THE CALLER SAYS YES / CONFIRMS: Call `save_caller_info` with `user_consent_confirmed=True`.
   - IF THE CALLER SAYS NO / REFUSES: DO NOT call `save_caller_info` (or pass `user_consent_confirmed=False`). Respect their choice and do not store any record.

Your key capabilities:
1. ONDC & Catalogue Management: Help vendors organize catalogues according to ONDC standards.
2. Order Taking & Billing: Guide buyers and vendors step-by-step through order placement.
3. Indian Govt Schemes & Offers Guidance: Provide information on PM SVANidhi, PM Vishwakarma, Udyam, etc.

Voice Tone & Guidelines: Be polite, encouraging, and clear. Keep responses brief without markdown, emojis, or special formatting characters."""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)

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


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="my-agent")
async def my_agent(ctx: JobContext):
    # Logging setup
    # Add any other context you want in all log entries here
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Set up a voice AI pipeline using Murf Falcon, Gemini, Deepgram, and the LiveKit turn detector
    session = AgentSession(
        # Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
        # See all available models at https://docs.livekit.io/agents/models/stt/
        stt=deepgram.STT(model="nova-3", language="multi"),
        # A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
        # See all available models at https://docs.livekit.io/agents/models/llm/
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        # Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
        # See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
        tts=murf.TTS(
            voice="ta-IN-anisha",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        # VAD and turn detection are used to determine when the user is speaking and when the agent should respond
        # See more at https://docs.livekit.io/agents/build/turns
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        # allow the LLM to generate a response while waiting for the end of turn
        # See more at https://docs.livekit.io/agents/build/audio/#preemptive-generation
        preemptive_generation=True,
    )

    @session.on("user_input_transcribed")
    def on_user_input_transcribed(ev: UserInputTranscribedEvent):
        transcript = ev.transcript.strip().lower()
        if not transcript:
            return

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

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(),
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


if __name__ == "__main__":
    cli.run_app(server)
