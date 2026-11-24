import enum
from sqlalchemy import Column, Integer, String, Time, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class DayOfWeek(str, enum.Enum):
    MONDAY = "MONDAY"
    TUESDAY = "TUESDAY"
    WEDNESDAY = "WEDNESDAY"
    THURSDAY = "THURSDAY"
    FRIDAY = "FRIDAY"
    SATURDAY = "SATURDAY"
    SUNDAY = "SUNDAY"


class RoomType(str, enum.Enum):
    CLASSROOM = "CLASSROOM"
    LABORATORY = "LABORATORY"
    SEMINAR_HALL = "SEMINAR_HALL"
    AUDITORIUM = "AUDITORIUM"
    OTHER = "OTHER"


class Room(Base):
    __tablename__ = "rooms"

    id = Column(Integer, primary_key=True, index=True)
    room_number = Column(String(50), unique=True, index=True, nullable=False)
    building = Column(String(100), nullable=False)
    floor = Column(Integer, default=1, nullable=False)
    capacity = Column(Integer, default=60, nullable=False)
    type = Column(Enum(RoomType), default=RoomType.CLASSROOM, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    timetables = relationship("Timetable", back_populates="room")


class Timetable(Base):
    __tablename__ = "timetables"

    id = Column(Integer, primary_key=True, index=True)
    subject_allocation_id = Column(Integer, ForeignKey("subject_allocations.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    room_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    allocation = relationship("SubjectAllocation", back_populates="timetables")
    room = relationship("Room", back_populates="timetables")
