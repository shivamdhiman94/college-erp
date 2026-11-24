from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.academic import Section, Semester
from app.schemas.academic import SectionCreate, SectionUpdate, SectionResponse

router = APIRouter()


@router.get("", response_model=List[SectionResponse], summary="List all sections")
def list_sections(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    semester_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Section)
    if semester_id:
        query = query.filter(Section.semester_id == semester_id)
    if search:
        query = query.filter(Section.name.ilike(f"%{search}%"))
    return query.order_by(Section.name.asc()).offset(skip).limit(limit).all()


@router.post("", response_model=SectionResponse, status_code=status.HTTP_201_CREATED, summary="Create section (Admin only)")
def create_section(
    payload: SectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Verify semester
    semester = db.query(Semester).filter(Semester.id == payload.semester_id).first()
    if not semester:
        raise EntityNotFoundException(f"Semester with ID {payload.semester_id} does not exist.")

    # Check duplicate
    existing = db.query(Section).filter(
        Section.semester_id == payload.semester_id,
        Section.name == payload.name
    ).first()
    if existing:
        raise EntityAlreadyExistsException(f"Section '{payload.name}' already exists for this semester.")

    sec = Section(
        semester_id=payload.semester_id,
        name=payload.name,
        capacity=payload.capacity
    )
    db.add(sec)
    db.commit()
    db.refresh(sec)
    return sec


@router.get("/{section_id}", response_model=SectionResponse, summary="Get section by ID")
def get_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    sec = db.query(Section).filter(Section.id == section_id).first()
    if not sec:
        raise EntityNotFoundException(f"Section with ID {section_id} not found.")
    return sec


@router.put("/{section_id}", response_model=SectionResponse, summary="Update section (Admin only)")
def update_section(
    section_id: int,
    payload: SectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    sec = db.query(Section).filter(Section.id == section_id).first()
    if not sec:
        raise EntityNotFoundException(f"Section with ID {section_id} not found.")

    new_sem_id = payload.semester_id if payload.semester_id is not None else sec.semester_id
    new_name = payload.name if payload.name is not None else sec.name

    if payload.semester_id is not None:
        if not db.query(Semester).filter(Semester.id == payload.semester_id).first():
            raise EntityNotFoundException(f"Semester with ID {payload.semester_id} does not exist.")

    if new_sem_id != sec.semester_id or new_name != sec.name:
        conflict = db.query(Section).filter(
            Section.semester_id == new_sem_id,
            Section.name == new_name,
            Section.id != section_id
        ).first()
        if conflict:
            raise EntityAlreadyExistsException(f"Section '{new_name}' already exists in this semester.")

    if payload.semester_id is not None:
        sec.semester_id = payload.semester_id
    if payload.name is not None:
        sec.name = payload.name
    if payload.capacity is not None:
        sec.capacity = payload.capacity

    db.commit()
    db.refresh(sec)
    return sec


@router.delete("/{section_id}", summary="Delete section (Admin only)")
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    sec = db.query(Section).filter(Section.id == section_id).first()
    if not sec:
        raise EntityNotFoundException(f"Section with ID {section_id} not found.")

    db.delete(sec)
    db.commit()
    return {"message": f"Section {section_id} deleted successfully"}
