from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException, BadRequestException
from app.models.user import User, UserRole
from app.models.academic import Subject, Semester, AcademicSession
from app.models.exam import Exam, ExamSchedule, ExamType, ExamStatus
from app.schemas.exam import (
    ExamCreate,
    ExamUpdate,
    ExamResponse,
    ExamScheduleCreate,
    ExamScheduleUpdate,
    ExamScheduleResponse,
)

router = APIRouter()


@router.get("", response_model=List[ExamResponse], summary="List all examinations")
def list_exams(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    academic_session_id: Optional[int] = None,
    semester_id: Optional[int] = None,
    exam_type: Optional[ExamType] = None,
    status: Optional[ExamStatus] = None,
    is_published: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Exam)

    # Students only see published exams by default when querying list
    if current_user.role == UserRole.STUDENT:
        query = query.filter(Exam.is_published == True)
    elif is_published is not None:
        query = query.filter(Exam.is_published == is_published)

    if academic_session_id:
        query = query.filter(Exam.academic_session_id == academic_session_id)
    if semester_id:
        query = query.filter(Exam.semester_id == semester_id)
    if exam_type:
        query = query.filter(Exam.exam_type == exam_type)
    if status:
        query = query.filter(Exam.status == status)

    return query.order_by(Exam.start_date.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=ExamResponse, status_code=status.HTTP_201_CREATED, summary="Create examination (Admin only)")
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    if payload.start_date > payload.end_date:
        raise BadRequestException("Exam start date cannot be later than end date.")

    # Validate session and semester
    session = db.query(AcademicSession).filter(AcademicSession.id == payload.academic_session_id).first()
    if not session:
        raise EntityNotFoundException(f"Academic session with ID {payload.academic_session_id} not found.")

    semester = db.query(Semester).filter(Semester.id == payload.semester_id).first()
    if not semester:
        raise EntityNotFoundException(f"Semester with ID {payload.semester_id} not found.")

    exam = Exam(
        academic_session_id=payload.academic_session_id,
        semester_id=payload.semester_id,
        name=payload.name,
        exam_type=payload.exam_type,
        status=payload.status,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_published=payload.is_published,
        description=payload.description
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.get("/{exam_id}", response_model=ExamResponse, summary="Get examination details")
def get_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException(f"Exam with ID {exam_id} not found.")
    if current_user.role == UserRole.STUDENT and not exam.is_published:
        raise EntityNotFoundException("This examination result is not yet published.")
    return exam


@router.put("/{exam_id}", response_model=ExamResponse, summary="Update examination (Admin only)")
def update_exam(
    exam_id: int,
    payload: ExamUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException(f"Exam with ID {exam_id} not found.")

    if payload.name is not None:
        exam.name = payload.name
    if payload.exam_type is not None:
        exam.exam_type = payload.exam_type
    if payload.status is not None:
        exam.status = payload.status
    if payload.start_date is not None:
        exam.start_date = payload.start_date
    if payload.end_date is not None:
        exam.end_date = payload.end_date
    if payload.is_published is not None:
        exam.is_published = payload.is_published
        if payload.is_published:
            exam.status = ExamStatus.PUBLISHED
    if payload.description is not None:
        exam.description = payload.description

    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/publish", response_model=ExamResponse, summary="Publish examination results (Admin only)")
def publish_exam_results(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException(f"Exam with ID {exam_id} not found.")

    exam.is_published = True
    exam.status = ExamStatus.PUBLISHED
    db.commit()
    db.refresh(exam)
    return exam


@router.post("/{exam_id}/unpublish", response_model=ExamResponse, summary="Unpublish examination results (Admin only)")
def unpublish_exam_results(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException(f"Exam with ID {exam_id} not found.")

    exam.is_published = False
    exam.status = ExamStatus.FINALIZED
    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/{exam_id}", summary="Delete examination (Admin only)")
def delete_exam(
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException(f"Exam with ID {exam_id} not found.")

    db.delete(exam)
    db.commit()
    return {"message": f"Examination '{exam.name}' deleted successfully."}


# Exam Schedule Endpoints
@router.post("/{exam_id}/schedules", response_model=ExamScheduleResponse, status_code=status.HTTP_201_CREATED, summary="Add subject to exam schedule (Admin only)")
def add_exam_subject_schedule(
    exam_id: int,
    payload: ExamScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException(f"Exam with ID {exam_id} not found.")

    subject = db.query(Subject).filter(Subject.id == payload.subject_id).first()
    if not subject:
        raise EntityNotFoundException(f"Subject with ID {payload.subject_id} not found.")

    existing = db.query(ExamSchedule).filter(
        ExamSchedule.exam_id == exam_id,
        ExamSchedule.subject_id == payload.subject_id
    ).first()
    if existing:
        raise EntityAlreadyExistsException("This subject is already scheduled in this examination.")

    if payload.passing_marks > payload.max_marks:
        raise BadRequestException("Passing marks cannot exceed maximum marks.")

    schedule = ExamSchedule(
        exam_id=exam_id,
        subject_id=payload.subject_id,
        exam_date=payload.exam_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        max_marks=payload.max_marks,
        passing_marks=payload.passing_marks,
        room_number=payload.room_number
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.delete("/schedules/{schedule_id}", summary="Delete exam schedule slot (Admin only)")
def delete_exam_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    schedule = db.query(ExamSchedule).filter(ExamSchedule.id == schedule_id).first()
    if not schedule:
        raise EntityNotFoundException(f"Exam schedule with ID {schedule_id} not found.")

    db.delete(schedule)
    db.commit()
    return {"message": "Subject removed from examination schedule."}
