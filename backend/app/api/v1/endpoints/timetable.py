from typing import List, Optional
from datetime import time, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException, BadRequestException
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.student import Student, Enrollment, EnrollmentStatus
from app.models.academic import SubjectAllocation, Subject, Section, Course, Semester, AcademicSession
from app.models.timetable import Timetable, Room, DayOfWeek
from app.schemas.timetable import (
    TimetableCreate,
    TimetableUpdate,
    TimetableResponse,
    WeeklyScheduleResponse,
    DayScheduleResponse,
    ScheduleSlotItem,
)

router = APIRouter()

DAYS_ORDER = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
]


def check_time_overlap(s1: time, e1: time, s2: time, e2: time) -> bool:
    """Returns True if time range [s1, e1] overlaps with [s2, e2]"""
    return s1 < e2 and s2 < e1


def validate_scheduling_conflicts(
    db: Session,
    allocation: SubjectAllocation,
    day_of_week: DayOfWeek,
    start_time: time,
    end_time: time,
    room_id: Optional[int] = None,
    room_number: Optional[str] = None,
    exclude_timetable_id: Optional[int] = None,
):
    if start_time >= end_time:
        raise BadRequestException("Class start time must be earlier than end time.")

    # Find all active timetable entries on the same day in the same academic session
    query = (
        db.query(Timetable)
        .join(SubjectAllocation, SubjectAllocation.id == Timetable.subject_allocation_id)
        .filter(
            Timetable.day_of_week == day_of_week,
            Timetable.is_active == True,
            SubjectAllocation.academic_session_id == allocation.academic_session_id
        )
    )
    if exclude_timetable_id:
        query = query.filter(Timetable.id != exclude_timetable_id)

    existing_slots = query.all()

    for slot in existing_slots:
        if check_time_overlap(start_time, end_time, slot.start_time, slot.end_time):
            slot_alloc = slot.allocation

            # 1. Faculty Conflict
            if slot_alloc.faculty_id == allocation.faculty_id:
                fac_name = f"{slot_alloc.faculty.first_name} {slot_alloc.faculty.last_name}" if slot_alloc.faculty else "Instructor"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Faculty Conflict: {fac_name} is already scheduled to teach '{slot_alloc.subject.code}' on {day_of_week.value} from {slot.start_time.strftime('%H:%M')} to {slot.end_time.strftime('%H:%M')}."
                )

            # 2. Section Conflict
            if slot_alloc.section_id == allocation.section_id:
                sec_name = slot_alloc.section.name if slot_alloc.section else "Section"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Section Conflict: Section {sec_name} already has '{slot_alloc.subject.code}' scheduled on {day_of_week.value} from {slot.start_time.strftime('%H:%M')} to {slot.end_time.strftime('%H:%M')}."
                )

            # 3. Room Conflict
            if room_id and slot.room_id and slot.room_id == room_id:
                rm_name = slot.room.room_number if slot.room else f"Room #{room_id}"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Room Conflict: {rm_name} is already booked on {day_of_week.value} from {slot.start_time.strftime('%H:%M')} to {slot.end_time.strftime('%H:%M')}."
                )
            elif room_number and slot.room_number and slot.room_number.lower() == room_number.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Room Conflict: Room '{room_number}' is already occupied on {day_of_week.value} from {slot.start_time.strftime('%H:%M')} to {slot.end_time.strftime('%H:%M')}."
                )


@router.get("", response_model=List[TimetableResponse], summary="List all timetable entries")
def list_timetables(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    day_of_week: Optional[DayOfWeek] = None,
    section_id: Optional[int] = None,
    faculty_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    room_id: Optional[int] = None,
    academic_session_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Timetable).join(SubjectAllocation, SubjectAllocation.id == Timetable.subject_allocation_id)

    if day_of_week:
        query = query.filter(Timetable.day_of_week == day_of_week)
    if section_id:
        query = query.filter(SubjectAllocation.section_id == section_id)
    if faculty_id:
        query = query.filter(SubjectAllocation.faculty_id == faculty_id)
    if subject_id:
        query = query.filter(SubjectAllocation.subject_id == subject_id)
    if room_id:
        query = query.filter(Timetable.room_id == room_id)
    if academic_session_id:
        query = query.filter(SubjectAllocation.academic_session_id == academic_session_id)

    return query.order_by(Timetable.day_of_week.asc(), Timetable.start_time.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=TimetableResponse, status_code=status.HTTP_201_CREATED, summary="Create timetable entry (Admin only)")
def create_timetable_entry(
    payload: TimetableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == payload.subject_allocation_id).first()
    if not allocation:
        raise EntityNotFoundException(f"Subject allocation with ID {payload.subject_allocation_id} not found.")

    room_number = payload.room_number
    if payload.room_id:
        room = db.query(Room).filter(Room.id == payload.room_id).first()
        if not room:
            raise EntityNotFoundException(f"Room with ID {payload.room_id} not found.")
        room_number = room.room_number

    # Execute Conflict Detection Engine
    validate_scheduling_conflicts(
        db=db,
        allocation=allocation,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        room_id=payload.room_id,
        room_number=room_number,
    )

    entry = Timetable(
        subject_allocation_id=payload.subject_allocation_id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        room_id=payload.room_id,
        room_number=room_number,
        is_active=payload.is_active
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def format_slot_item(entry: Timetable) -> ScheduleSlotItem:
    alloc = entry.allocation
    sub = alloc.subject if alloc else None
    fac = alloc.faculty if alloc else None
    sec = alloc.section if alloc else None
    sem = sec.semester if sec else None
    crs = sem.course if sem else None

    return ScheduleSlotItem(
        timetable_id=entry.id,
        subject_allocation_id=entry.subject_allocation_id,
        subject_code=sub.code if sub else "",
        subject_name=sub.name if sub else "",
        faculty_name=f"{fac.first_name} {fac.last_name}" if fac else "Staff",
        day_of_week=entry.day_of_week,
        start_time=entry.start_time.strftime("%H:%M"),
        end_time=entry.end_time.strftime("%H:%M"),
        room_number=entry.room_number or (entry.room.room_number if entry.room else "TBD"),
        section_name=sec.name if sec else "",
        course_name=crs.name if crs else "",
        semester_name=sem.name if sem else "",
    )


@router.get("/section/{section_id}/weekly", response_model=WeeklyScheduleResponse, summary="Get weekly timetable matrix for a section")
def get_section_weekly_timetable(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entries = (
        db.query(Timetable)
        .join(SubjectAllocation, SubjectAllocation.id == Timetable.subject_allocation_id)
        .filter(SubjectAllocation.section_id == section_id, Timetable.is_active == True)
        .order_by(Timetable.start_time.asc())
        .all()
    )

    days_map = {d: [] for d in DAYS_ORDER}
    for e in entries:
        if e.day_of_week in days_map:
            days_map[e.day_of_week].append(format_slot_item(e))

    return WeeklyScheduleResponse(
        days=[DayScheduleResponse(day=d.value, slots=days_map[d]) for d in DAYS_ORDER]
    )


@router.get("/faculty/my-schedule", response_model=WeeklyScheduleResponse, summary="Get logged-in faculty weekly schedule")
def get_my_faculty_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise EntityNotFoundException("Faculty profile not found for this user account.")

    entries = (
        db.query(Timetable)
        .join(SubjectAllocation, SubjectAllocation.id == Timetable.subject_allocation_id)
        .filter(SubjectAllocation.faculty_id == faculty.id, Timetable.is_active == True)
        .order_by(Timetable.start_time.asc())
        .all()
    )

    days_map = {d: [] for d in DAYS_ORDER}
    for e in entries:
        if e.day_of_week in days_map:
            days_map[e.day_of_week].append(format_slot_item(e))

    return WeeklyScheduleResponse(
        days=[DayScheduleResponse(day=d.value, slots=days_map[d]) for d in DAYS_ORDER]
    )


@router.get("/student/my-schedule", response_model=WeeklyScheduleResponse, summary="Get logged-in student section weekly timetable")
def get_my_student_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student or not student.current_section_id:
        return WeeklyScheduleResponse(days=[DayScheduleResponse(day=d.value, slots=[]) for d in DAYS_ORDER])

    entries = (
        db.query(Timetable)
        .join(SubjectAllocation, SubjectAllocation.id == Timetable.subject_allocation_id)
        .filter(SubjectAllocation.section_id == student.current_section_id, Timetable.is_active == True)
        .order_by(Timetable.start_time.asc())
        .all()
    )

    days_map = {d: [] for d in DAYS_ORDER}
    for e in entries:
        if e.day_of_week in days_map:
            days_map[e.day_of_week].append(format_slot_item(e))

    return WeeklyScheduleResponse(
        days=[DayScheduleResponse(day=d.value, slots=days_map[d]) for d in DAYS_ORDER]
    )


@router.get("/{entry_id}", response_model=TimetableResponse, summary="Get timetable entry by ID")
def get_timetable_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    entry = db.query(Timetable).filter(Timetable.id == entry_id).first()
    if not entry:
        raise EntityNotFoundException(f"Timetable entry with ID {entry_id} not found.")
    return entry


@router.put("/{entry_id}", response_model=TimetableResponse, summary="Update timetable entry (Admin only)")
def update_timetable_entry(
    entry_id: int,
    payload: TimetableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    entry = db.query(Timetable).filter(Timetable.id == entry_id).first()
    if not entry:
        raise EntityNotFoundException(f"Timetable entry with ID {entry_id} not found.")

    allocation = entry.allocation
    if payload.subject_allocation_id is not None:
        allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == payload.subject_allocation_id).first()
        if not allocation:
            raise EntityNotFoundException(f"Subject allocation with ID {payload.subject_allocation_id} not found.")
        entry.subject_allocation_id = payload.subject_allocation_id

    day_of_week = payload.day_of_week or entry.day_of_week
    start_time = payload.start_time or entry.start_time
    end_time = payload.end_time or entry.end_time
    room_id = payload.room_id if payload.room_id is not None else entry.room_id
    room_number = payload.room_number if payload.room_number is not None else entry.room_number

    if room_id:
        room = db.query(Room).filter(Room.id == room_id).first()
        if room:
            room_number = room.room_number

    # Re-validate conflicts
    validate_scheduling_conflicts(
        db=db,
        allocation=allocation,
        day_of_week=day_of_week,
        start_time=start_time,
        end_time=end_time,
        room_id=room_id,
        room_number=room_number,
        exclude_timetable_id=entry_id,
    )

    entry.day_of_week = day_of_week
    entry.start_time = start_time
    entry.end_time = end_time
    entry.room_id = room_id
    entry.room_number = room_number
    if payload.is_active is not None:
        entry.is_active = payload.is_active

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", summary="Delete timetable entry (Admin only)")
def delete_timetable_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    entry = db.query(Timetable).filter(Timetable.id == entry_id).first()
    if not entry:
        raise EntityNotFoundException(f"Timetable entry with ID {entry_id} not found.")

    db.delete(entry)
    db.commit()
    return {"message": f"Timetable entry {entry_id} deleted successfully."}
