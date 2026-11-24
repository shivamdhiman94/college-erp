from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.academic import SubjectAllocation, Subject, Section, AcademicSession
from app.schemas.academic import (
    SubjectAllocationCreate,
    SubjectAllocationUpdate,
    SubjectAllocationResponse,
)

router = APIRouter()


@router.get("", response_model=List[SubjectAllocationResponse], summary="List all subject allocations")
def list_allocations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    faculty_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    section_id: Optional[int] = None,
    academic_session_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(SubjectAllocation)
    if faculty_id:
        query = query.filter(SubjectAllocation.faculty_id == faculty_id)
    if subject_id:
        query = query.filter(SubjectAllocation.subject_id == subject_id)
    if section_id:
        query = query.filter(SubjectAllocation.section_id == section_id)
    if academic_session_id:
        query = query.filter(SubjectAllocation.academic_session_id == academic_session_id)
    if is_active is not None:
        query = query.filter(SubjectAllocation.is_active == is_active)
    return query.offset(skip).limit(limit).all()


@router.get("/my-allocations", response_model=List[SubjectAllocationResponse], summary="Get allocated subjects for current faculty user")
def get_my_allocations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
    if not faculty:
        raise EntityNotFoundException("Faculty profile not found for this user.")
    return db.query(SubjectAllocation).filter(
        SubjectAllocation.faculty_id == faculty.id,
        SubjectAllocation.is_active == True
    ).all()


@router.post("", response_model=SubjectAllocationResponse, status_code=status.HTTP_201_CREATED, summary="Assign subject to faculty (Admin only)")
def create_allocation(
    payload: SubjectAllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Verify foreign keys
    if not db.query(Faculty).filter(Faculty.id == payload.faculty_id).first():
        raise EntityNotFoundException(f"Faculty with ID {payload.faculty_id} does not exist.")
    if not db.query(Subject).filter(Subject.id == payload.subject_id).first():
        raise EntityNotFoundException(f"Subject with ID {payload.subject_id} does not exist.")
    if not db.query(Section).filter(Section.id == payload.section_id).first():
        raise EntityNotFoundException(f"Section with ID {payload.section_id} does not exist.")
    if not db.query(AcademicSession).filter(AcademicSession.id == payload.academic_session_id).first():
        raise EntityNotFoundException(f"Academic session with ID {payload.academic_session_id} does not exist.")

    # Check duplicate assignment
    existing = db.query(SubjectAllocation).filter(
        SubjectAllocation.faculty_id == payload.faculty_id,
        SubjectAllocation.subject_id == payload.subject_id,
        SubjectAllocation.section_id == payload.section_id,
        SubjectAllocation.academic_session_id == payload.academic_session_id
    ).first()
    if existing:
        raise EntityAlreadyExistsException("This faculty member is already assigned to this subject and section for this academic session.")

    allocation = SubjectAllocation(
        faculty_id=payload.faculty_id,
        subject_id=payload.subject_id,
        section_id=payload.section_id,
        academic_session_id=payload.academic_session_id,
        is_active=payload.is_active
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return allocation


@router.get("/{allocation_id}", response_model=SubjectAllocationResponse, summary="Get allocation by ID")
def get_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == allocation_id).first()
    if not allocation:
        raise EntityNotFoundException(f"Subject allocation with ID {allocation_id} not found.")
    return allocation


@router.put("/{allocation_id}", response_model=SubjectAllocationResponse, summary="Update allocation (Admin only)")
def update_allocation(
    allocation_id: int,
    payload: SubjectAllocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == allocation_id).first()
    if not allocation:
        raise EntityNotFoundException(f"Subject allocation with ID {allocation_id} not found.")

    if payload.faculty_id is not None:
        if not db.query(Faculty).filter(Faculty.id == payload.faculty_id).first():
            raise EntityNotFoundException(f"Faculty with ID {payload.faculty_id} not found.")
        allocation.faculty_id = payload.faculty_id

    if payload.subject_id is not None:
        if not db.query(Subject).filter(Subject.id == payload.subject_id).first():
            raise EntityNotFoundException(f"Subject with ID {payload.subject_id} not found.")
        allocation.subject_id = payload.subject_id

    if payload.section_id is not None:
        if not db.query(Section).filter(Section.id == payload.section_id).first():
            raise EntityNotFoundException(f"Section with ID {payload.section_id} not found.")
        allocation.section_id = payload.section_id

    if payload.academic_session_id is not None:
        if not db.query(AcademicSession).filter(AcademicSession.id == payload.academic_session_id).first():
            raise EntityNotFoundException(f"Academic session with ID {payload.academic_session_id} not found.")
        allocation.academic_session_id = payload.academic_session_id

    if payload.is_active is not None:
        allocation.is_active = payload.is_active

    db.commit()
    db.refresh(allocation)
    return allocation


@router.delete("/{allocation_id}", summary="Delete allocation (Admin only)")
def delete_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == allocation_id).first()
    if not allocation:
        raise EntityNotFoundException(f"Subject allocation with ID {allocation_id} not found.")

    db.delete(allocation)
    db.commit()
    return {"message": f"Subject allocation {allocation_id} deleted successfully."}
