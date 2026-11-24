import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.core.config import settings
from app.core.security import decode_token
from app.core.events import event_manager, EventMessage, EventType, EventScope
from app.db.session import SessionLocal
from app.models.user import User

logger = logging.getLogger("erp.ws")
router = APIRouter()


async def authenticate_websocket(websocket: WebSocket, token: Optional[str] = None) -> Optional[User]:
    """
    Authenticate WebSocket connection via token query param or initial auth message.
    Validates signature, expiration, and active account status in DB.
    """
    auth_token = token

    # If token not in query param, wait for initial authenticate packet
    if not auth_token:
        try:
            # Receive initial frame with 5-second timeout
            data_text = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
            data = json.loads(data_text)
            if data.get("type") == "authenticate":
                auth_token = data.get("token")
        except Exception:
            return None

    if not auth_token:
        return None

    payload = decode_token(auth_token)
    if not payload:
        return None

    if payload.get("type") != "access":
        return None

    user_id_str = payload.get("sub")
    if not user_id_str:
        return None

    try:
        user_id = int(user_id_str)
    except ValueError:
        return None

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            return None
        return user
    finally:
        db.close()


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = Query(None)
):
    """
    Authenticated real-time WebSocket connection endpoint.
    Client provides ?token=<jwt_access_token> during connection handshake.
    """
    # Authenticate before accepting
    user = await authenticate_websocket(websocket, token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Authentication failed or token expired")
        return

    user_id = user.id
    user_role = user.role.value
    username = user.username

    # Accept & register connection
    await event_manager.connect(websocket, user_id=user_id, role=user_role)

    # Send handshake acknowledgment
    await event_manager.send_personal_message(
        {
            "type": "CONNECTION_ESTABLISHED",
            "user_id": user_id,
            "username": username,
            "role": user_role,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
        websocket
    )

    try:
        while True:
            # Listen for client frames (ping/pong, client telemetry)
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
                msg_type = data.get("type", "").upper()

                if msg_type == "PING":
                    await event_manager.send_personal_message(
                        {
                            "type": "PONG",
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        },
                        websocket
                    )
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await event_manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.warning(f"WebSocket connection error for user {user_id}: {e}")
        await event_manager.disconnect(websocket, user_id)
