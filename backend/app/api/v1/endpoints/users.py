from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.security import get_password_hash
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole, Admin
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()


@router.get("", response_model=List[UserResponse], summary="List all users (Admin only)")
def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) | (User.username.ilike(f"%{search}%"))
        )
    return query.offset(skip).limit(limit).all()


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Create user (Admin only)")
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Check duplicate
    existing = db.query(User).filter(
        (User.email == payload.email) | (User.username == payload.username)
    ).first()
    if existing:
        raise EntityAlreadyExistsException("A user with this email or username already exists.")

    new_user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        is_active=payload.is_active if payload.is_active is not None else True,
        avatar_url=payload.avatar_url
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # If role is ADMIN, create basic Admin record
    if new_user.role == UserRole.ADMIN:
        admin_rec = Admin(
            user_id=new_user.id,
            first_name=new_user.username.capitalize(),
            last_name="Admin",
            designation="Administrator"
        )
        db.add(admin_rec)
        db.commit()

    return new_user


@router.get("/{user_id}", response_model=UserResponse, summary="Get user by ID")
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own user account"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise EntityNotFoundException(f"User with ID {user_id} not found")
    return user


@router.put("/{user_id}", response_model=UserResponse, summary="Update user (Admin only)")
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise EntityNotFoundException(f"User with ID {user_id} not found")

    if payload.email is not None:
        user.email = payload.email
    if payload.username is not None:
        user.username = payload.username
    if payload.is_active is not None:
        user.is_active = payload.is_active
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    if payload.password:
        user.hashed_password = get_password_hash(payload.password)

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", summary="Delete user (Admin only)")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own admin account"
        )
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise EntityNotFoundException(f"User with ID {user_id} not found")

    db.delete(user)
    db.commit()
    return {"message": f"User {user_id} deleted successfully"}
