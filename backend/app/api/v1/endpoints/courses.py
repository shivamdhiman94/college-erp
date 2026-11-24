from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.academic import Course, Department
from app.schemas.academic import CourseCreate, CourseUpdate, CourseResponse

router = APIRouter()


@router.get("", response_model=List[CourseResponse], summary="List all courses")
def list_courses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Course)
    if department_id:
        query = query.filter(Course.department_id == department_id)
    if is_active is not None:
        query = query.filter(Course.is_active == is_active)
    if search:
        query = query.filter(
            (Course.name.ilike(f"%{search}%")) | (Course.code.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=CourseResponse, status_code=status.HTTP_201_CREATED, summary="Create course (Admin only)")
def create_course(
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Verify department exists
    dept = db.query(Department).filter(Department.id == payload.department_id).first()
    if not dept:
        raise EntityNotFoundException(f"Department with ID {payload.department_id} does not exist.")

    # Check duplicate code
    existing = db.query(Course).filter(Course.code == payload.code).first()
    if existing:
        raise EntityAlreadyExistsException(f"Course with code '{payload.code}' already exists.")

    course = Course(
        department_id=payload.department_id,
        code=payload.code,
        name=payload.name,
        duration_years=payload.duration_years,
        total_semesters=payload.total_semesters,
        is_active=payload.is_active
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.get("/{course_id}", response_model=CourseResponse, summary="Get course by ID")
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise EntityNotFoundException(f"Course with ID {course_id} not found.")
    return course


@router.put("/{course_id}", response_model=CourseResponse, summary="Update course (Admin only)")
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise EntityNotFoundException(f"Course with ID {course_id} not found.")

    if payload.department_id is not None:
        dept = db.query(Department).filter(Department.id == payload.department_id).first()
        if not dept:
            raise EntityNotFoundException(f"Department with ID {payload.department_id} does not exist.")
        course.department_id = payload.department_id

    if payload.code is not None:
        conflict = db.query(Course).filter(Course.code == payload.code, Course.id != course_id).first()
        if conflict:
            raise EntityAlreadyExistsException(f"Course with code '{payload.code}' already exists.")
        course.code = payload.code

    if payload.name is not None:
        course.name = payload.name
    if payload.duration_years is not None:
        course.duration_years = payload.duration_years
    if payload.total_semesters is not None:
        course.total_semesters = payload.total_semesters
    if payload.is_active is not None:
        course.is_active = payload.is_active

    db.commit()
    db.refresh(course)
    return course


@router.delete("/{course_id}", summary="Delete course (Admin only)")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise EntityNotFoundException(f"Course with ID {course_id} not found.")

    db.delete(course)
    db.commit()
    return {"message": f"Course {course_id} deleted successfully"}
