import argparse
import asyncio
import json
import logging
import os
import sys
import uuid
from dotenv import load_dotenv

load_dotenv(".env.local")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("linphone_dialer")

AGENT_NAME = "outbound-agent"


async def dial_linphone(to_username: str, room_name: str | None = None):
    """Dispatch the outbound AI agent worker into a room and trigger the SIP call."""
    try:
        from livekit import api
    except ImportError:
        logger.error("LiveKit SDK not installed. Run 'uv sync' or 'pip install livekit-api'")
        sys.exit(1)

    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")
    trunk_id = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID") or os.getenv("LIVEKIT_SIP_TRUNK_ID") or os.getenv("SIP_TRUNK_ID")

    if not all([livekit_url, api_key, api_secret]):
        logger.error("Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET in .env.local")
        sys.exit(1)

    if not trunk_id or trunk_id.startswith("your_"):
        logger.error("Missing valid LIVEKIT_SIP_OUTBOUND_TRUNK_ID / SIP_TRUNK_ID in .env.local")
        sys.exit(1)

    # Format SIP target username or phone number
    target = to_username
    if target.startswith("sip:"):
        target = target[4:]
    if "@" in target:
        target = target.split("@")[0]
    sip_target = target

    actual_room = room_name or f"outbound-{uuid.uuid4().hex[:8]}"

    logger.info(f"Connecting to LiveKit: {livekit_url}")
    lk_api = api.LiveKitAPI(livekit_url, api_key, api_secret)

    try:
        logger.info(f"Creating room '{actual_room}'...")
        await lk_api.room.create_room(api.CreateRoomRequest(name=actual_room))

        logger.info(f"Dispatching '{AGENT_NAME}' into room '{actual_room}' to call target '{sip_target}'...")
        await lk_api.agent_dispatch.create_dispatch(
            api.CreateAgentDispatchRequest(
                agent_name=AGENT_NAME,
                room=actual_room,
                metadata=json.dumps({"phone_number": sip_target}),
            )
        )
        logger.info(f"✅ AI Agent dispatched successfully to room '{actual_room}'!")
        logger.info("📱 Check your Linphone app now to accept the incoming call!")
    except Exception as e:
        logger.error(f"❌ Failed to dispatch outbound agent: {e}")
    finally:
        await lk_api.aclose()


def main():
    parser = argparse.ArgumentParser(description="Dial a Linphone account using LiveKit SIP Outbound Trunk and AI Agent Dispatch")
    parser.add_argument(
        "--to", "-t",
        required=True,
        help="Linphone username (e.g. koushik9900) or phone number (+91...)"
    )
    parser.add_argument(
        "--room", "-r",
        default=None,
        help="LiveKit room name (default: auto-generated outbound room)"
    )

    args = parser.parse_args()
    asyncio.run(dial_linphone(to_username=args.to, room_name=args.room))


if __name__ == "__main__":
    main()
