from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.security import get_password_hash
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.academic import Department
from app.schemas.faculty import (
    FacultyCreateWithUser,
    FacultyUpdate,
    FacultyResponse,
    FacultyDetailResponse,
)

router = APIRouter()


@router.get("", response_model=List[FacultyResponse], summary="List faculty members")
def list_faculty(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Faculty)
    if department_id:
        query = query.filter(Faculty.department_id == department_id)
    if search:
        query = query.filter(
            (Faculty.first_name.ilike(f"%{search}%")) |
            (Faculty.last_name.ilike(f"%{search}%")) |
            (Faculty.employee_code.ilike(f"%{search}%")) |
            (Faculty.designation.ilike(f"%{search}%"))
        )
    return query.order_by(Faculty.employee_code.asc()).offset(skip).limit(limit).all()


@router.get("/me/profile", response_model=FacultyDetailResponse, summary="Get current logged-in faculty profile")
def get_my_faculty_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise EntityNotFoundException("Faculty profile not found for this user account.")
    return faculty


@router.post("", response_model=FacultyResponse, status_code=status.HTTP_201_CREATED, summary="Create faculty & user account (Admin only)")
def create_faculty(
    payload: FacultyCreateWithUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Verify department
    if not db.query(Department).filter(Department.id == payload.department_id).first():
        raise EntityNotFoundException(f"Department with ID {payload.department_id} not found.")

    # Unique check for User
    if db.query(User).filter(User.email == payload.email).first():
        raise EntityAlreadyExistsException(f"User with email '{payload.email}' already exists.")
    if db.query(User).filter(User.username == payload.username).first():
        raise EntityAlreadyExistsException(f"User with username '{payload.username}' already exists.")

    # Unique check for Faculty employee code
    if db.query(Faculty).filter(Faculty.employee_code == payload.employee_code).first():
        raise EntityAlreadyExistsException(f"Faculty with employee code '{payload.employee_code}' already exists.")

    # 1. Create User account
    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.FACULTY,
        is_active=True
    )
    db.add(user)
    db.flush()

    # 2. Create Faculty record
    faculty = Faculty(
        user_id=user.id,
        department_id=payload.department_id,
        employee_code=payload.employee_code,
        first_name=payload.first_name,
        last_name=payload.last_name,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        joining_date=payload.joining_date,
        qualification=payload.qualification,
        designation=payload.designation,
        phone=payload.phone,
        address=payload.address
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)
    return faculty


@router.get("/{faculty_id}", response_model=FacultyDetailResponse, summary="Get faculty details by ID")
def get_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise EntityNotFoundException(f"Faculty member with ID {faculty_id} not found.")
    return faculty


@router.put("/{faculty_id}", response_model=FacultyResponse, summary="Update faculty (Admin only)")
def update_faculty(
    faculty_id: int,
    payload: FacultyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise EntityNotFoundException(f"Faculty member with ID {faculty_id} not found.")

    if payload.department_id is not None:
        if not db.query(Department).filter(Department.id == payload.department_id).first():
            raise EntityNotFoundException(f"Department with ID {payload.department_id} not found.")
        faculty.department_id = payload.department_id

    if payload.employee_code is not None and payload.employee_code != faculty.employee_code:
        if db.query(Faculty).filter(Faculty.employee_code == payload.employee_code, Faculty.id != faculty_id).first():
            raise EntityAlreadyExistsException(f"Employee code '{payload.employee_code}' is already assigned.")
        faculty.employee_code = payload.employee_code

    if payload.first_name is not None:
        faculty.first_name = payload.first_name
    if payload.last_name is not None:
        faculty.last_name = payload.last_name
    if payload.gender is not None:
        faculty.gender = payload.gender
    if payload.date_of_birth is not None:
        faculty.date_of_birth = payload.date_of_birth
    if payload.joining_date is not None:
        faculty.joining_date = payload.joining_date
    if payload.qualification is not None:
        faculty.qualification = payload.qualification
    if payload.designation is not None:
        faculty.designation = payload.designation
    if payload.phone is not None:
        faculty.phone = payload.phone
    if payload.address is not None:
        faculty.address = payload.address

    db.commit()
    db.refresh(faculty)
    return faculty


@router.delete("/{faculty_id}", summary="Delete or deactivate faculty (Admin only)")
def delete_faculty(
    faculty_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    faculty = db.query(Faculty).filter(Faculty.id == faculty_id).first()
    if not faculty:
        raise EntityNotFoundException(f"Faculty member with ID {faculty_id} not found.")

    user = db.query(User).filter(User.id == faculty.user_id).first()
    db.delete(faculty)
    if user:
        db.delete(user)
    db.commit()
    return {"message": f"Faculty {faculty_id} and associated user account deleted successfully."}
