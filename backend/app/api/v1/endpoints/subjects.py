from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.academic import Subject, Course, Department, SubjectType
from app.schemas.academic import SubjectCreate, SubjectUpdate, SubjectResponse

router = APIRouter()


@router.get("", response_model=List[SubjectResponse], summary="List all subjects")
def list_subjects(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    course_id: Optional[int] = None,
    department_id: Optional[int] = None,
    semester_number: Optional[int] = None,
    type: Optional[SubjectType] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Subject)
    if course_id:
        query = query.filter(Subject.course_id == course_id)
    if department_id:
        query = query.filter(Subject.department_id == department_id)
    if semester_number:
        query = query.filter(Subject.semester_number == semester_number)
    if type:
        query = query.filter(Subject.type == type)
    if search:
        query = query.filter(
            (Subject.name.ilike(f"%{search}%")) | (Subject.code.ilike(f"%{search}%"))
        )
    return query.order_by(Subject.semester_number.asc(), Subject.code.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED, summary="Create subject (Admin only)")
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Verify course
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise EntityNotFoundException(f"Course with ID {payload.course_id} does not exist.")

    # Verify department
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise EntityNotFoundException(f"Department with ID {payload.department_id} does not exist.")

    # Check duplicate code
    existing = db.query(Subject).filter(Subject.code == payload.code).first()
    if existing:
        raise EntityAlreadyExistsException(f"Subject with code '{payload.code}' already exists.")

    subject = Subject(
        course_id=payload.course_id,
        department_id=payload.department_id,
        code=payload.code,
        name=payload.name,
        semester_number=payload.semester_number,
        type=payload.type,
        credits=payload.credits,
        max_marks=payload.max_marks,
        passing_marks=payload.passing_marks
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


@router.get("/{subject_id}", response_model=SubjectResponse, summary="Get subject by ID")
def get_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise EntityNotFoundException(f"Subject with ID {subject_id} not found.")
    return subject


@router.put("/{subject_id}", response_model=SubjectResponse, summary="Update subject (Admin only)")
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise EntityNotFoundException(f"Subject with ID {subject_id} not found.")

    if payload.course_id is not None:
        if not db.query(Course).filter(Course.id == payload.course_id).first():
            raise EntityNotFoundException(f"Course with ID {payload.course_id} does not exist.")
        subject.course_id = payload.course_id

    if payload.department_id is not None:
        if not db.query(Department).filter(Department.id == payload.department_id).first():
            raise EntityNotFoundException(f"Department with ID {payload.department_id} does not exist.")
        subject.department_id = payload.department_id

    if payload.code is not None:
        conflict = db.query(Subject).filter(Subject.code == payload.code, Subject.id != subject_id).first()
        if conflict:
            raise EntityAlreadyExistsException(f"Subject with code '{payload.code}' already exists.")
        subject.code = payload.code

    if payload.name is not None:
        subject.name = payload.name
    if payload.semester_number is not None:
        subject.semester_number = payload.semester_number
    if payload.type is not None:
        subject.type = payload.type
    if payload.credits is not None:
        subject.credits = payload.credits
    if payload.max_marks is not None:
        subject.max_marks = payload.max_marks
    if payload.passing_marks is not None:
        subject.passing_marks = payload.passing_marks

    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}", summary="Delete subject (Admin only)")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise EntityNotFoundException(f"Subject with ID {subject_id} not found.")

    db.delete(subject)
    db.commit()
    return {"message": f"Subject {subject_id} deleted successfully"}
