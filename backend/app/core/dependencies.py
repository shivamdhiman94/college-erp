from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.security import decode_token
from app.core.exceptions import (
    InvalidCredentialsException,
    TokenExpiredOrInvalidException,
    PermissionDeniedException
)
from app.db.session import get_db
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not token:
        raise TokenExpiredOrInvalidException(detail="Authentication token is missing")

    payload = decode_token(token)
    if not payload:
        raise TokenExpiredOrInvalidException(detail="Could not validate credentials / token expired")

    token_type = payload.get("type")
    if token_type != "access":
        raise TokenExpiredOrInvalidException(detail="Invalid token type provided for authentication")

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise TokenExpiredOrInvalidException(detail="Token subject missing")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise TokenExpiredOrInvalidException(detail="Invalid token subject format")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise InvalidCredentialsException(detail="User corresponding to token does not exist")

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    return current_user


def require_roles(allowed_roles: List[UserRole]):
    """
    Dependency factory to check if the current user has any of the specified roles.
    Example: Depends(require_roles([UserRole.ADMIN]))
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise PermissionDeniedException(
                detail=f"Operation not permitted. Required roles: {[r.value for r in allowed_roles]}. Current role: {current_user.role.value}"
            )
        return current_user
    return role_checker
