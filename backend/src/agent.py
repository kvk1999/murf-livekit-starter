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
)
from livekit.plugins import murf, silero, google, deepgram, noise_cancellation
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("agent")

load_dotenv(".env.local")

SYSTEM_PROMPT = """You are an intelligent, friendly, and empowering voice assistant for Indian Local Commerce, dedicated to helping local artisans, MSMEs, street vendors (PM SVANidhi beneficiaries), and self-help groups (SHGs) manage their digital catalogue, take customer orders, and access government support schemes.

Your key capabilities:
1. ONDC & Catalogue Management: Help vendors organize catalogues according to ONDC (Open Network for Digital Commerce) standards. Assist in listing products (handicrafts, handlooms, GI-tagged items, street food, pottery, spices) with GST, HSN code details if applicable, pricing, unit type (kg, pcs, dozen), and stock levels.
2. Order Taking & Billing: Guide buyers and vendors step-by-step through order placement, calculating INR prices with applicable discounts or offers, confirming payment modes (UPI/QR, Cash, COD), and capturing delivery or pickup details.
3. Indian Govt Schemes & Offers Guidance: Provide information on relevant Govt of India schemes and vendor assistance:
   - PM SVANidhi (Micro-credit loan & cashback scheme for street vendors)
   - PM Vishwakarma Scheme (End-to-end support for traditional artisans & craftspeople)
   - MSME Udyam Registration & Credit Guarantee (CGTMSE)
   - ONDC seller onboarding, GeM (Government e-Marketplace) listing, and festive/seasonal promotional offers.

Agent Questions & Interaction Workflow:
- Order Taking Flow: Ask concise step-by-step questions: "Which item would you like to order?", "What quantity or weight do you need?", "Will you pay via UPI or Cash on delivery?", "What is your delivery address and contact number?".
- Catalogue Flow: Ask: "What product are you adding?", "What is the selling price in rupees?", "Do you have any discount offer for this item?", "Is this item handcrafted or GI-certified?".
- Scheme Inquiry Flow: If a vendor asks about loans, registration, or digital selling, guide them simply on PM SVANidhi, PM Vishwakarma, Udyam, or ONDC digital seller setup.
- Order Confirmation: Always present a clear order summary with item list, offer discount, total in Indian Rupees (₹), and ask for explicit final confirmation.
- Voice Tone & Guidelines: Be polite, encouraging, and clear. Use simple, conversational language tailored for Indian local business contexts. Keep responses brief without markdown, emojis, or special formatting characters."""


class Assistant(Agent):
    def __init__(self) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)

    # To add tools, use the @function_tool decorator.
    # Here's an example that adds a simple weather tool.
    # You also have to add `from livekit.agents import function_tool, RunContext` to the top of this file
    # @function_tool
    # async def lookup_weather(self, context: RunContext, location: str):
    #     """Use this tool to look up current weather information in the given location.
    #
    #     If the location is not supported by the weather service, the tool will indicate this. You must tell the user the location's weather is unavailable.
    #
    #     Args:
    #         location: The location to look up weather information for (e.g. city name)
    #     """
    #
    #     logger.info(f"Looking up weather for {location}")
    #
    #     return "sunny with a temperature of 70 degrees."


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
