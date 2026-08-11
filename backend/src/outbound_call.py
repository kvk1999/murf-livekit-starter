import asyncio
import argparse
import os
import sys
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv(".env.local")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("outbound_call")


async def dispatch_livekit_sip_call(
    phone_number_or_sip: str,
    room_name: str,
    trunk_id: str,
    participant_identity: str
):
    """Dispatch an outbound SIP call using LiveKit API.
    
    Supports Linphone SIP addresses (e.g. sip:username@sip.linphone.org or raw linphone username)
    as well as standard E.164 phone numbers (e.g. +919876543210).
    """
    try:
        from livekit import api
    except ImportError:
        logger.error("LiveKit SDK not installed. Run 'uv sync' or 'pip install livekit-api'")
        sys.exit(1)

    livekit_url = os.getenv("LIVEKIT_URL")
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not all([livekit_url, api_key, api_secret]):
        logger.error("Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET in .env.local")
        sys.exit(1)

    # Format destination for LiveKit SIP outbound call
    # LiveKit SIP Trunk expects bare username (e.g. 'koushik9900') or phone number ('+91...')
    target_address = phone_number_or_sip
    if target_address.startswith("sip:"):
        target_address = target_address[4:]
    if "@" in target_address:
        target_address = target_address.split("@")[0]

    logger.info(f"Connecting to LiveKit server at {livekit_url}...")
    lk_api = api.LiveKitAPI(livekit_url, api_key, api_secret)

    logger.info(
        f"Creating SIP Participant for target '{target_address}' in room '{room_name}' (Trunk ID: {trunk_id})..."
    )
    
    try:
        req = api.CreateSIPParticipantRequest(
            sip_trunk_id=trunk_id,
            sip_call_to=target_address,
            room_name=room_name,
            participant_identity=participant_identity,
            participant_name="Customer " + target_address,
        )
        participant = await lk_api.sip.create_sip_participant(req)
        logger.info(f"✅ Outbound SIP call initiated successfully! Participant ID: {participant.participant_id}")
        logger.info("📱 Check your Linphone app now to accept the call!")
    except Exception as e:
        logger.error(f"❌ Failed to create SIP participant: {e}")
    finally:
        await lk_api.aclose()


def main():
    parser = argparse.ArgumentParser(
        description="Initiate an Outbound Telephony / Linphone Call for Indian Local Commerce Voice Agent."
    )
    parser.add_argument(
        "--to", "-t", "--phone", "-p",
        dest="target",
        required=True,
        help="Target phone number (e.g. +919876543210) or Linphone address / username (e.g. koushik9900 or sip:koushik9900@sip.linphone.org)"
    )
    parser.add_argument(
        "--room", "-r",
        default="outbound-local-commerce-room",
        help="LiveKit room name for the session (default: outbound-local-commerce-room)"
    )
    parser.add_argument(
        "--trunk-id",
        default=os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID") or os.getenv("LIVEKIT_SIP_TRUNK_ID") or os.getenv("SIP_TRUNK_ID"),
        help="LiveKit SIP Outbound Trunk ID (defaults to LIVEKIT_SIP_OUTBOUND_TRUNK_ID from .env.local)"
    )
    parser.add_argument(
        "--identity", "-i",
        default="sip_caller",
        help="Participant identity string"
    )

    args = parser.parse_args()

    if not args.trunk_id:
        logger.error("Missing SIP Trunk ID. Set LIVEKIT_SIP_OUTBOUND_TRUNK_ID in .env.local or pass --trunk-id.")
        sys.exit(1)

    print("=" * 60)
    print("  OUTBOUND LINPHONE / SIP CALL DISPATCH - LOCAL COMMERCE")
    print("=" * 60)
    print(f" Target Destination : {args.target}")
    print(f" Room Name          : {args.room}")
    print(f" SIP Trunk ID       : {args.trunk_id}")
    print("=" * 60)

    asyncio.run(dispatch_livekit_sip_call(
        phone_number_or_sip=args.target,
        room_name=args.room,
        trunk_id=args.trunk_id,
        participant_identity=args.identity,
    ))


if __name__ == "__main__":
    main()
