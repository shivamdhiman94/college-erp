from datetime import date
from typing import Optional, List
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.student import StudentStatus, EnrollmentStatus
from app.schemas.user import UserResponse
from app.schemas.academic import (
    DepartmentResponse,
    CourseResponse,
    AcademicSessionResponse,
    SemesterResponse,
    SectionResponse,
)


class StudentBase(BaseModel):
    department_id: int
    course_id: int
    admission_session_id: int
    enrollment_number: str
    roll_number: str
    first_name: str
    last_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    address: Optional[str] = None
    admission_date: date
    current_semester_id: Optional[int] = None
    current_section_id: Optional[int] = None
    status: StudentStatus = StudentStatus.ACTIVE


class StudentCreate(StudentBase):
    user_id: int


class StudentCreateWithUser(StudentBase):
    email: EmailStr
    username: str
    password: str


class StudentUpdate(BaseModel):
    department_id: Optional[int] = None
    course_id: Optional[int] = None
    admission_session_id: Optional[int] = None
    enrollment_number: Optional[str] = None
    roll_number: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None
    phone: Optional[str] = None
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None
    address: Optional[str] = None
    admission_date: Optional[date] = None
    current_semester_id: Optional[int] = None
    current_section_id: Optional[int] = None
    status: Optional[StudentStatus] = None


class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    semester_id: int
    section_id: int
    enrolled_date: date
    status: EnrollmentStatus
    semester: Optional[SemesterResponse] = None
    section: Optional[SectionResponse] = None

    model_config = ConfigDict(from_attributes=True)


class EnrollmentCreate(BaseModel):
    student_id: int
    semester_id: int
    section_id: int
    enrolled_date: Optional[date] = None
    status: EnrollmentStatus = EnrollmentStatus.ENROLLED


class StudentResponse(StudentBase):
    id: int
    user_id: int
    department: Optional[DepartmentResponse] = None
    course: Optional[CourseResponse] = None
    admission_session: Optional[AcademicSessionResponse] = None
    current_semester: Optional[SemesterResponse] = None
    current_section: Optional[SectionResponse] = None
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class StudentDetailResponse(StudentResponse):
    enrollments: List[EnrollmentResponse] = []

    model_config = ConfigDict(from_attributes=True)
