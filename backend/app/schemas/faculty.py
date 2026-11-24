from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.user import UserResponse
from app.schemas.academic import DepartmentResponse, SubjectAllocationResponse


class FacultyBase(BaseModel):
    department_id: int
    employee_code: str
    first_name: str
    last_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    joining_date: date
    qualification: Optional[str] = None
    designation: str
    phone: Optional[str] = None
    address: Optional[str] = None


class FacultyCreate(FacultyBase):
    user_id: int


class FacultyCreateWithUser(FacultyBase):
    email: EmailStr
    username: str
    password: str


class FacultyUpdate(BaseModel):
    department_id: Optional[int] = None
    employee_code: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    joining_date: Optional[date] = None
    qualification: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class FacultyResponse(FacultyBase):
    id: int
    user_id: int
    department: Optional[DepartmentResponse] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class FacultyDetailResponse(FacultyResponse):
    allocations: List[SubjectAllocationResponse] = []

    model_config = ConfigDict(from_attributes=True)
