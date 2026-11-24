from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.timetable import Room, RoomType
from app.schemas.timetable import RoomCreate, RoomUpdate, RoomResponse

router = APIRouter()


@router.get("", response_model=List[RoomResponse], summary="List all campus rooms")
def list_rooms(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    type: Optional[RoomType] = None,
    building: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Room)
    if type:
        query = query.filter(Room.type == type)
    if building:
        query = query.filter(Room.building.ilike(f"%{building}%"))
    if is_active is not None:
        query = query.filter(Room.is_active == is_active)
    if search:
        query = query.filter(
            (Room.room_number.ilike(f"%{search}%")) |
            (Room.building.ilike(f"%{search}%"))
        )
    return query.order_by(Room.building.asc(), Room.room_number.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=RoomResponse, status_code=status.HTTP_201_CREATED, summary="Create room (Admin only)")
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    existing = db.query(Room).filter(Room.room_number == payload.room_number).first()
    if existing:
        raise EntityAlreadyExistsException(f"Room with identifier '{payload.room_number}' already exists.")

    room = Room(
        room_number=payload.room_number,
        building=payload.building,
        floor=payload.floor,
        capacity=payload.capacity,
        type=payload.type,
        is_active=payload.is_active
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@router.get("/{room_id}", response_model=RoomResponse, summary="Get room by ID")
def get_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise EntityNotFoundException(f"Room with ID {room_id} not found.")
    return room


@router.put("/{room_id}", response_model=RoomResponse, summary="Update room (Admin only)")
def update_room(
    room_id: int,
    payload: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise EntityNotFoundException(f"Room with ID {room_id} not found.")

    if payload.room_number is not None and payload.room_number != room.room_number:
        if db.query(Room).filter(Room.room_number == payload.room_number, Room.id != room_id).first():
            raise EntityAlreadyExistsException(f"Room '{payload.room_number}' already in use.")
        room.room_number = payload.room_number

    if payload.building is not None:
        room.building = payload.building
    if payload.floor is not None:
        room.floor = payload.floor
    if payload.capacity is not None:
        room.capacity = payload.capacity
    if payload.type is not None:
        room.type = payload.type
    if payload.is_active is not None:
        room.is_active = payload.is_active

    db.commit()
    db.refresh(room)
    return room


@router.delete("/{room_id}", summary="Delete room (Admin only)")
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise EntityNotFoundException(f"Room with ID {room_id} not found.")

    db.delete(room)
    db.commit()
    return {"message": f"Room {room_id} deleted successfully."}
