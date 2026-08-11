"""Outbound telephony agent — places calls and talks to whoever answers.

Unlike the inbound agent, this one does the dialling. It waits to be dispatched
into a room with a phone number in the job metadata, then asks LiveKit to call
that number and bridge it into the room.

Run the worker with:

    uv run python src/telephony/outbound/agent.py dev

Then trigger a call from another terminal:

    uv run python src/telephony/outbound/dial.py --to koushik9900
"""

import asyncio
import json
import logging
import os

from dotenv import load_dotenv
from livekit import api, rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("outbound-agent")

load_dotenv(".env.local")

# Required — create this with `lk sip outbound create` or set in .env.local
OUTBOUND_TRUNK_ID = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID") or os.getenv("LIVEKIT_SIP_TRUNK_ID") or os.getenv("SIP_TRUNK_ID")

# Optional — a phone number to transfer people to when they ask for a human.
TRANSFER_TO_NUMBER = os.getenv("TRANSFER_TO_NUMBER")

# System prompt for Outbound Deadline Reminder
SYSTEM_PROMPT = """You are an automated Voice AI assistant for the #VoiceForBharat AI Agent Hackathon.
Your job is to inform callers about the upcoming submission deadline for AI agents.

Primary Objective:
1. Announce: "In your kind information, your submission deadline for agents of AI is 15th August, hurry up! If you want to know more say yes or no"
2. If the caller says "YES" or asks for more details: Explain that the final submission deadline for the Voice for Bharat AI Agent challenge is August 15th, and they should submit their project details, LinkedIn demo video link, and repository link before the deadline. Ask if they have any questions or need help with submission.
3. If the caller says "NO" or indicates they don't need details: Thank them politely and use the end_call tool to conclude the call.
4. Keep all responses brief, friendly, clear, and conversational. No special symbols, markdown formatting, or emojis."""

# The exact opening greeting spoken when the outbound call connects.
GREETING = "In your kind information, your submission deadline for agents of AI is 15th August, hurry up! If you want to know more say yes or no."

CALLEE_IDENTITY = "phone-user"


class OutboundAgent(Agent):
    def __init__(self, ctx: JobContext) -> None:
        super().__init__(instructions=SYSTEM_PROMPT)
        self.ctx = ctx

    @function_tool
    async def transfer_to_human(self, context: RunContext) -> str:
        """Transfer the call to a human support agent."""
        if not TRANSFER_TO_NUMBER:
            return "Transfers are not configured. Offer to have support follow up instead."

        await context.session.generate_reply(
            instructions="Tell them you are transferring the call now."
        )

        logger.info("Transferring call to %s", TRANSFER_TO_NUMBER)
        try:
            await self.ctx.api.sip.transfer_sip_participant(
                api.TransferSIPParticipantRequest(
                    room_name=self.ctx.room.name,
                    participant_identity=CALLEE_IDENTITY,
                    transfer_to=f"tel:{TRANSFER_TO_NUMBER}",
                    play_dialtone=True,
                )
            )
        except Exception:
            logger.exception("Transfer failed")
            return "The transfer could not be completed."

        return "Transferred."

    @function_tool
    async def detected_answering_machine(self, context: RunContext) -> str:
        """Hang up if answering machine or voicemail is detected."""
        logger.info("Answering machine detected — hanging up")
        await self._hangup()
        return "Call ended."

    @function_tool
    async def end_call(self, context: RunContext) -> str:
        """Hang up the call when conversation is finished."""
        await context.session.generate_reply(
            instructions="Thank them and say goodbye."
        )

        logger.info("Ending call")
        await self._hangup()
        return "Call ended."

    async def _hangup(self) -> None:
        """Delete the room to drop the SIP leg."""
        await self.ctx.api.room.delete_room(
            api.DeleteRoomRequest(room=self.ctx.room.name)
        )


server = AgentServer()


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


def phone_number_from_metadata(ctx: JobContext) -> str | None:
    """Read target from job metadata passed by dial.py."""
    metadata = ctx.job.metadata
    if not metadata:
        return None
    try:
        return json.loads(metadata).get("phone_number")
    except json.JSONDecodeError:
        return metadata.strip() or None


@server.rtc_session(agent_name="outbound-agent")
async def outbound_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    target = phone_number_from_metadata(ctx)
    if not target:
        logger.error("No phone number or SIP target in job metadata")
        ctx.shutdown()
        return

    if not OUTBOUND_TRUNK_ID:
        logger.error("LIVEKIT_SIP_OUTBOUND_TRUNK_ID is not set")
        ctx.shutdown()
        return

    # Clean target for LiveKit SIP Trunk (expects bare username or phone number)
    sip_target = target
    if sip_target.startswith("sip:"):
        sip_target = sip_target[4:]
    if "@" in sip_target:
        sip_target = sip_target.split("@")[0]

    await ctx.connect()

    session = AgentSession(
        stt=deepgram.STT(model="nova-3"),
        llm=google.LLM(model="gemini-2.5-flash"),
        tts=murf.TTS(voice="en-US-matthew", style="Conversation"),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    session_started = asyncio.create_task(
        session.start(
            agent=OutboundAgent(ctx),
            room=ctx.room,
            room_options=room_io.RoomOptions(
                audio_input=room_io.AudioInputOptions(
                    noise_cancellation=lambda params: (
                        noise_cancellation.BVCTelephony()
                        if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                        else noise_cancellation.BVC()
                    ),
                ),
            ),
        )
    )

    logger.info("Dialing SIP target: %s", sip_target)
    try:
        await ctx.api.sip.create_sip_participant(
            api.CreateSIPParticipantRequest(
                room_name=ctx.room.name,
                sip_trunk_id=OUTBOUND_TRUNK_ID,
                sip_call_to=sip_target,
                participant_identity=CALLEE_IDENTITY,
                participant_name="Phone user",
                wait_until_answered=True,
            )
        )
    except api.TwirpError as e:
        logger.error("Call to %s failed/unanswered: %s", sip_target, e.message)
        session_started.cancel()
        ctx.shutdown()
        return

    await session_started
    # Pause briefly after call is answered so SIP audio channel settles and caller hears full greeting
    await asyncio.sleep(1.5)
    await session.say(GREETING, allow_interruptions=True)


if __name__ == "__main__":
    cli.run_app(server)
