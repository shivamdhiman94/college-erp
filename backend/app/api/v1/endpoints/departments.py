from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.academic import Department
from app.schemas.academic import DepartmentCreate, DepartmentUpdate, DepartmentResponse

router = APIRouter()


@router.get("", response_model=List[DepartmentResponse], summary="List all departments")
def list_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Department)
    if search:
        query = query.filter(
            (Department.name.ilike(f"%{search}%")) | (Department.code.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED, summary="Create department (Admin only)")
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    existing = db.query(Department).filter(Department.code == payload.code).first()
    if existing:
        raise EntityAlreadyExistsException(f"Department with code '{payload.code}' already exists.")

    dept = Department(
        code=payload.code,
        name=payload.name,
        description=payload.description,
        head_of_department_id=payload.head_of_department_id
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.get("/{dept_id}", response_model=DepartmentResponse, summary="Get department by ID")
def get_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise EntityNotFoundException(f"Department with ID {dept_id} not found")
    return dept


@router.put("/{dept_id}", response_model=DepartmentResponse, summary="Update department (Admin only)")
def update_department(
    dept_id: int,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise EntityNotFoundException(f"Department with ID {dept_id} not found")

    if payload.code is not None:
        # Check code collision
        other = db.query(Department).filter(Department.code == payload.code, Department.id != dept_id).first()
        if other:
            raise EntityAlreadyExistsException(f"Department with code '{payload.code}' already exists.")
        dept.code = payload.code
    if payload.name is not None:
        dept.name = payload.name
    if payload.description is not None:
        dept.description = payload.description
    if payload.head_of_department_id is not None:
        dept.head_of_department_id = payload.head_of_department_id

    db.commit()
    db.refresh(dept)
    return dept


@router.delete("/{dept_id}", summary="Delete department (Admin only)")
def delete_department(
    dept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise EntityNotFoundException(f"Department with ID {dept_id} not found")

    db.delete(dept)
    db.commit()
    return {"message": f"Department {dept_id} deleted successfully"}
