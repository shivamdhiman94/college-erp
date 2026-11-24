import asyncio
import json
import logging
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Set, Any
from fastapi import WebSocket, WebSocketDisconnect
from app.models.user import UserRole

logger = logging.getLogger("erp.events")


class EventScope(str, Enum):
    BROADCAST = "BROADCAST"
    ROLES = "ROLES"
    USERS = "USERS"


class EventType(str, Enum):
    NOTICE_CREATED = "NOTICE_CREATED"
    NOTICE_PINNED = "NOTICE_PINNED"
    NOTICE_UNPINNED = "NOTICE_UNPINNED"
    ATTENDANCE_MARKED = "ATTENDANCE_MARKED"
    MARKS_SAVED = "MARKS_SAVED"
    EXAM_RESULTS_PUBLISHED = "EXAM_RESULTS_PUBLISHED"
    ASSIGNMENT_CREATED = "ASSIGNMENT_CREATED"
    ASSIGNMENT_SUBMITTED = "ASSIGNMENT_SUBMITTED"
    ASSIGNMENT_GRADED = "ASSIGNMENT_GRADED"
    SYSTEM_ALERT = "SYSTEM_ALERT"
    PING = "PING"
    PONG = "PONG"


class EventMessage:
    def __init__(
        self,
        event_type: EventType,
        payload: Dict[str, Any],
        target_scope: EventScope = EventScope.BROADCAST,
        target_roles: Optional[List[UserRole]] = None,
        target_user_ids: Optional[List[int]] = None,
        actor: Optional[Dict[str, Any]] = None,
        event_id: Optional[str] = None,
        timestamp: Optional[str] = None,
    ):
        self.event_id = event_id or str(uuid.uuid4())
        self.event_type = event_type
        self.timestamp = timestamp or datetime.now(timezone.utc).isoformat()
        self.payload = payload
        self.target_scope = target_scope
        self.target_roles = [r.value if isinstance(r, UserRole) else str(r) for r in (target_roles or [])]
        self.target_user_ids = target_user_ids or []
        self.actor = actor

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "type": self.event_type.value if isinstance(self.event_type, EventType) else str(self.event_type),
            "timestamp": self.timestamp,
            "payload": self.payload,
            "actor": self.actor,
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict())


class ConnectionManager:
    """
    Manages active authenticated WebSocket connections across users and roles.
    Thread-safe and async-compatible.
    """

    def __init__(self):
        # Maps user_id -> set of active WebSockets (supports multiple browser tabs)
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Maps user_id -> role value
        self.user_roles: Dict[int, str] = {}
        # Lock for dictionary access
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, user_id: int, role: str):
        await websocket.accept()
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            self.active_connections[user_id].add(websocket)
            self.user_roles[user_id] = role
        logger.info(f"WebSocket connected: user_id={user_id}, role={role}. Total users online: {len(self.active_connections)}")

    async def disconnect(self, websocket: WebSocket, user_id: int):
        async with self._lock:
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    self.user_roles.pop(user_id, None)
        logger.info(f"WebSocket disconnected: user_id={user_id}. Remaining users online: {len(self.active_connections)}")

    async def send_personal_message(self, message: Dict[str, Any], websocket: WebSocket):
        try:
            await websocket.send_text(json.dumps(message))
        except Exception as e:
            logger.warning(f"Failed to send personal message over WebSocket: {e}")

    async def dispatch(self, event: EventMessage):
        """
        Dispatches event strictly to authorized connections based on target scope.
        Protects against data leakage between Admin, Faculty, and Student roles.
        """
        message_json = event.to_json()
        dead_connections: List[tuple[int, WebSocket]] = []

        async with self._lock:
            # Determine candidate user IDs based on target scope
            recipients: List[tuple[int, WebSocket]] = []

            for uid, sockets in self.active_connections.items():
                u_role = self.user_roles.get(uid, "")

                # 1. User targeting
                if event.target_scope == EventScope.USERS:
                    if uid in event.target_user_ids:
                        for ws in sockets:
                            recipients.append((uid, ws))

                # 2. Role targeting
                elif event.target_scope == EventScope.ROLES:
                    if u_role in event.target_roles or u_role == UserRole.ADMIN.value:
                        for ws in sockets:
                            recipients.append((uid, ws))

                # 3. Broadcast
                elif event.target_scope == EventScope.BROADCAST:
                    for ws in sockets:
                        recipients.append((uid, ws))

        # Send to all matched recipients concurrently
        if not recipients:
            logger.debug(f"Event {event.event_type} dispatched, but no matching connected clients online.")
            return

        for uid, ws in recipients:
            try:
                await ws.send_text(message_json)
            except Exception as e:
                logger.debug(f"Error sending to user {uid}: {e}. Marking for cleanup.")
                dead_connections.append((uid, ws))

        # Cleanup any broken connections encountered
        if dead_connections:
            async with self._lock:
                for uid, ws in dead_connections:
                    if uid in self.active_connections:
                        self.active_connections[uid].discard(ws)
                        if not self.active_connections[uid]:
                            del self.active_connections[uid]
                            self.user_roles.pop(uid, None)


# Global singleton instance
event_manager = ConnectionManager()


def dispatch_event(event: EventMessage):
    """
    Safely dispatches an event in the background after the database transaction has committed.
    Safe to call from both synchronous and asynchronous route handlers.
    """
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(event_manager.dispatch(event))
    except RuntimeError:
        # No running event loop in thread; create one or run in executor
        try:
            asyncio.run(event_manager.dispatch(event))
        except Exception as e:
            logger.warning(f"Could not dispatch event without event loop: {e}")
