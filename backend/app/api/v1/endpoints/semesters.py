from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.academic import Semester, Course, AcademicSession
from app.schemas.academic import SemesterCreate, SemesterUpdate, SemesterResponse

router = APIRouter()


@router.get("", response_model=List[SemesterResponse], summary="List all semesters")
def list_semesters(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    course_id: Optional[int] = None,
    academic_session_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Semester)
    if course_id:
        query = query.filter(Semester.course_id == course_id)
    if academic_session_id:
        query = query.filter(Semester.academic_session_id == academic_session_id)
    if is_active is not None:
        query = query.filter(Semester.is_active == is_active)
    return query.order_by(Semester.semester_number.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=SemesterResponse, status_code=status.HTTP_201_CREATED, summary="Create semester (Admin only)")
def create_semester(
    payload: SemesterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Verify course
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise EntityNotFoundException(f"Course with ID {payload.course_id} does not exist.")

    # Verify session
    session = db.query(AcademicSession).filter(AcademicSession.id == payload.academic_session_id).first()
    if not session:
        raise EntityNotFoundException(f"Academic session with ID {payload.academic_session_id} does not exist.")

    # Check duplicate semester structure
    existing = db.query(Semester).filter(
        Semester.course_id == payload.course_id,
        Semester.academic_session_id == payload.academic_session_id,
        Semester.semester_number == payload.semester_number
    ).first()
    if existing:
        raise EntityAlreadyExistsException(
            f"Semester {payload.semester_number} for this course and academic session already exists."
        )

    sem = Semester(
        course_id=payload.course_id,
        academic_session_id=payload.academic_session_id,
        semester_number=payload.semester_number,
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_active=payload.is_active
    )
    db.add(sem)
    db.commit()
    db.refresh(sem)
    return sem


@router.get("/{semester_id}", response_model=SemesterResponse, summary="Get semester by ID")
def get_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sem = db.query(Semester).filter(Semester.id == semester_id).first()
    if not sem:
        raise EntityNotFoundException(f"Semester with ID {semester_id} not found.")
    return sem


@router.put("/{semester_id}", response_model=SemesterResponse, summary="Update semester (Admin only)")
def update_semester(
    semester_id: int,
    payload: SemesterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    sem = db.query(Semester).filter(Semester.id == semester_id).first()
    if not sem:
        raise EntityNotFoundException(f"Semester with ID {semester_id} not found.")

    new_course_id = payload.course_id if payload.course_id is not None else sem.course_id
    new_session_id = payload.academic_session_id if payload.academic_session_id is not None else sem.academic_session_id
    new_sem_number = payload.semester_number if payload.semester_number is not None else sem.semester_number

    if payload.course_id is not None:
        if not db.query(Course).filter(Course.id == payload.course_id).first():
            raise EntityNotFoundException(f"Course with ID {payload.course_id} does not exist.")
    if payload.academic_session_id is not None:
        if not db.query(AcademicSession).filter(AcademicSession.id == payload.academic_session_id).first():
            raise EntityNotFoundException(f"Academic session with ID {payload.academic_session_id} does not exist.")

    # Check collision if unique key attributes changed
    if (new_course_id != sem.course_id or new_session_id != sem.academic_session_id or new_sem_number != sem.semester_number):
        conflict = db.query(Semester).filter(
            Semester.course_id == new_course_id,
            Semester.academic_session_id == new_session_id,
            Semester.semester_number == new_sem_number,
            Semester.id != semester_id
        ).first()
        if conflict:
            raise EntityAlreadyExistsException(
                f"Semester {new_sem_number} already exists for this course and academic session."
            )

    if payload.course_id is not None:
        sem.course_id = payload.course_id
    if payload.academic_session_id is not None:
        sem.academic_session_id = payload.academic_session_id
    if payload.semester_number is not None:
        sem.semester_number = payload.semester_number
    if payload.name is not None:
        sem.name = payload.name
    if payload.start_date is not None:
        sem.start_date = payload.start_date
    if payload.end_date is not None:
        sem.end_date = payload.end_date
    if payload.is_active is not None:
        sem.is_active = payload.is_active

    db.commit()
    db.refresh(sem)
    return sem


@router.delete("/{semester_id}", summary="Delete semester (Admin only)")
def delete_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    sem = db.query(Semester).filter(Semester.id == semester_id).first()
    if not sem:
        raise EntityNotFoundException(f"Semester with ID {semester_id} not found.")

    db.delete(sem)
    db.commit()
    return {"message": f"Semester {semester_id} deleted successfully"}
