from datetime import time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.timetable import DayOfWeek, RoomType
from app.schemas.academic import SubjectAllocationResponse


# Room Schemas
class RoomBase(BaseModel):
    room_number: str
    building: str
    floor: int = 1
    capacity: int = 60
    type: RoomType = RoomType.CLASSROOM
    is_active: bool = True


class RoomCreate(RoomBase):
    pass


class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    building: Optional[str] = None
    floor: Optional[int] = None
    capacity: Optional[int] = None
    type: Optional[RoomType] = None
    is_active: Optional[bool] = None


class RoomResponse(RoomBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Timetable Schemas
class TimetableBase(BaseModel):
    subject_allocation_id: int
    day_of_week: DayOfWeek
    start_time: time
    end_time: time
    room_id: Optional[int] = None
    room_number: Optional[str] = None
    is_active: bool = True


class TimetableCreate(TimetableBase):
    pass


class TimetableUpdate(BaseModel):
    subject_allocation_id: Optional[int] = None
    day_of_week: Optional[DayOfWeek] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_id: Optional[int] = None
    room_number: Optional[str] = None
    is_active: Optional[bool] = None


class TimetableResponse(TimetableBase):
    id: int
    allocation: Optional[SubjectAllocationResponse] = None
    room: Optional[RoomResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Daily/Weekly Schedule View Schemas
class ScheduleSlotItem(BaseModel):
    timetable_id: int
    subject_allocation_id: int
    subject_code: str
    subject_name: str
    faculty_name: str
    day_of_week: DayOfWeek
    start_time: str
    end_time: str
    room_number: str
    section_name: str
    course_name: str
    semester_name: str


class DayScheduleResponse(BaseModel):
    day: str
    slots: List[ScheduleSlotItem] = []


class WeeklyScheduleResponse(BaseModel):
    days: List[DayScheduleResponse] = []
