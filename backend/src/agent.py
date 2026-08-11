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
from prompt import SYSTEM_PROMPT, OUTBOUND_SYSTEM_PROMPT

logger = logging.getLogger("agent")

load_dotenv(".env.local")


class Assistant(Agent):
    def __init__(self, is_outbound: bool = False) -> None:
        instructions = OUTBOUND_SYSTEM_PROMPT if is_outbound else SYSTEM_PROMPT
        super().__init__(instructions=instructions)


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

    # Detect if session is an outbound call (via room name or SIP context)
    is_outbound_call = "outbound" in ctx.room.name.lower() or "sip" in ctx.room.name.lower()

    # Start the session, which initializes the voice pipeline and warms up the models
    await session.start(
        agent=Assistant(is_outbound=is_outbound_call),
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

    if is_outbound_call:
        logger.info("Outbound call connected. Speaking mandatory 3-part opening statement...")
        await session.say(
            "Hello! This is Namma Kadai Voice Assistant calling from Indian Local Commerce to confirm your product delivery slot and check market weather conditions. If you wish to stop receiving these calls, simply say stop or hang up at any time."
        )



if __name__ == "__main__":
    cli.run_app(server)
