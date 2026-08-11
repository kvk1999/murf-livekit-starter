import asyncio
import argparse
import os
import sys
import logging
from dotenv import load_dotenv

load_dotenv(".env.local")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("linphone_dialer")


async def dial_linphone(to_username: str, room_name: str = "outbound-room"):
    """Dial out to a Linphone SIP user via LiveKit SIP outbound trunk."""
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

    # LiveKit SIP Trunk (e.g. linphone-trunk for sip.linphone.org) expects bare username (e.g. 'koushik9900') or phone number ('+1...')
    target = to_username
    if target.startswith("sip:"):
        target = target[4:]
    if "@" in target:
        target = target.split("@")[0]
    sip_target = target

    logger.info(f"Connecting to LiveKit: {livekit_url}")
    lk_api = api.LiveKitAPI(livekit_url, api_key, api_secret)

    logger.info(f"Initiating SIP call to '{sip_target}' using trunk '{trunk_id}' in room '{room_name}'...")
    try:
        req = api.CreateSIPParticipantRequest(
            sip_trunk_id=trunk_id,
            sip_call_to=sip_target,
            room_name=room_name,
            participant_identity=f"linphone_{to_username.replace('sip:', '').split('@')[0]}",
            participant_name=f"Linphone User ({to_username})",
        )
        participant = await lk_api.sip.create_sip_participant(req)
        logger.info(f"✅ Call dispatched successfully! Participant ID: {participant.participant_id}")
        logger.info("📱 Check your Linphone app now to accept the incoming call!")
    except Exception as e:
        logger.error(f"❌ Failed to dispatch Linphone call: {e}")
    finally:
        await lk_api.aclose()


def main():
    parser = argparse.ArgumentParser(description="Dial a Linphone account using LiveKit SIP Outbound Trunk")
    parser.add_argument(
        "--to", "-t",
        required=True,
        help="Linphone username (e.g. koushik9900) or full SIP URI (e.g. sip:koushik9900@sip.linphone.org)"
    )
    parser.add_argument(
        "--room", "-r",
        default="linphone-call-room",
        help="LiveKit room name (default: linphone-call-room)"
    )

    args = parser.parse_args()
    asyncio.run(dial_linphone(to_username=args.to, room_name=args.room))


if __name__ == "__main__":
    main()
