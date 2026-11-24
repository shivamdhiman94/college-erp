from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user
from app.core.exceptions import InvalidCredentialsException
from app.models.user import User
from app.schemas.token import Token, LoginRequest, RefreshTokenRequest, TokenRefreshResponse
from app.schemas.user import PasswordChangeRequest, UserProfileResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/login", response_model=Token, summary="Authenticate user and issue JWT tokens")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates a user via email or username and password.
    Returns access_token, refresh_token, role, and identity metadata.
    """
    user = AuthService.authenticate_user(db, payload.username_or_email, payload.password)
    if not user:
        raise InvalidCredentialsException()
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Contact administration."
        )
    return AuthService.create_user_tokens(db, user)


@router.post("/refresh", response_model=TokenRefreshResponse, summary="Refresh access token")
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refreshes an expired access token using a valid refresh token.
    """
    new_access_token = AuthService.refresh_access_token(db, payload.refresh_token)
    return TokenRefreshResponse(access_token=new_access_token, token_type="bearer")


@router.get("/me", response_model=UserProfileResponse, summary="Get current logged in user profile")
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Returns the profile and role details of the currently authenticated user.
    """
    full_name = AuthService.get_user_display_name(db, current_user)
    profile_details = AuthService.get_user_profile_details(db, current_user)
    
    return UserProfileResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        avatar_url=current_user.avatar_url,
        full_name=full_name,
        profile_details=profile_details
    )


@router.post("/change-password", summary="Change current user password")
def change_password(
    payload: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Allows the logged-in user to change their password by verifying their old password.
    """
    AuthService.change_password(db, current_user, payload.old_password, payload.new_password)
    return {"message": "Password changed successfully"}
