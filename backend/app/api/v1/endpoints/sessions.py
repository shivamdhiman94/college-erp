from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.academic import AcademicSession
from app.schemas.academic import AcademicSessionCreate, AcademicSessionUpdate, AcademicSessionResponse

router = APIRouter()


@router.get("", response_model=List[AcademicSessionResponse], summary="List all academic sessions")
def list_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    is_current: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(AcademicSession)
    if is_current is not None:
        query = query.filter(AcademicSession.is_current == is_current)
    if search:
        query = query.filter(AcademicSession.name.ilike(f"%{search}%"))
    return query.order_by(AcademicSession.start_date.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=AcademicSessionResponse, status_code=status.HTTP_201_CREATED, summary="Create academic session (Admin only)")
def create_session(
    payload: AcademicSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    existing = db.query(AcademicSession).filter(AcademicSession.name == payload.name).first()
    if existing:
        raise EntityAlreadyExistsException(f"Academic session '{payload.name}' already exists.")

    if payload.is_current:
        # Deactivate all other sessions to maintain single active session invariant
        db.query(AcademicSession).update({"is_current": False})

    session = AcademicSession(
        name=payload.name,
        start_date=payload.start_date,
        end_date=payload.end_date,
        is_current=payload.is_current
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=AcademicSessionResponse, summary="Get session by ID")
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    session = db.query(AcademicSession).filter(AcademicSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException(f"Academic session with ID {session_id} not found.")
    return session


@router.put("/{session_id}", response_model=AcademicSessionResponse, summary="Update session (Admin only)")
def update_session(
    session_id: int,
    payload: AcademicSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    session = db.query(AcademicSession).filter(AcademicSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException(f"Academic session with ID {session_id} not found.")

    if payload.name is not None:
        conflict = db.query(AcademicSession).filter(
            AcademicSession.name == payload.name, AcademicSession.id != session_id
        ).first()
        if conflict:
            raise EntityAlreadyExistsException(f"Academic session '{payload.name}' already exists.")
        session.name = payload.name

    if payload.start_date is not None:
        session.start_date = payload.start_date
    if payload.end_date is not None:
        session.end_date = payload.end_date

    if payload.is_current is True:
        db.query(AcademicSession).filter(AcademicSession.id != session_id).update({"is_current": False})
        session.is_current = True
    elif payload.is_current is False:
        session.is_current = False

    db.commit()
    db.refresh(session)
    return session


@router.post("/{session_id}/set-current", response_model=AcademicSessionResponse, summary="Set active academic session (Admin only)")
def set_current_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    session = db.query(AcademicSession).filter(AcademicSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException(f"Academic session with ID {session_id} not found.")

    # Deactivate all others
    db.query(AcademicSession).filter(AcademicSession.id != session_id).update({"is_current": False})
    session.is_current = True
    db.commit()
    db.refresh(session)
    return session


@router.delete("/{session_id}", summary="Delete academic session (Admin only)")
def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    session = db.query(AcademicSession).filter(AcademicSession.id == session_id).first()
    if not session:
        raise EntityNotFoundException(f"Academic session with ID {session_id} not found.")

    db.delete(session)
    db.commit()
    return {"message": f"Academic session {session_id} deleted successfully"}
