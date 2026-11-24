from typing import Optional
from pydantic import BaseModel
from app.models.user import UserRole


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int
    email: str
    username: str
    full_name: Optional[str] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    email: Optional[str] = None
    role: Optional[UserRole] = None
    type: Optional[str] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    username_or_email: str
    password: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
