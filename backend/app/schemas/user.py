from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: UserRole
    is_active: Optional[bool] = True
    avatar_url: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str


class AdminProfileResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    phone: Optional[str] = None
    designation: str

    model_config = ConfigDict(from_attributes=True)


class UserProfileResponse(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole
    is_active: bool
    avatar_url: Optional[str] = None
    full_name: Optional[str] = None
    profile_details: Optional[dict] = None

    model_config = ConfigDict(from_attributes=True)
