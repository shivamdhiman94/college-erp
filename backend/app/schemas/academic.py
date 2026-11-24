from datetime import date
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.academic import SubjectType


# Department Schemas
class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    head_of_department_id: Optional[int] = None


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    head_of_department_id: Optional[int] = None


class DepartmentResponse(DepartmentBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Course Schemas
class CourseBase(BaseModel):
    department_id: int
    code: str
    name: str
    duration_years: int = 4
    total_semesters: int = 8
    is_active: bool = True


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    department_id: Optional[int] = None
    code: Optional[str] = None
    name: Optional[str] = None
    duration_years: Optional[int] = None
    total_semesters: Optional[int] = None
    is_active: Optional[bool] = None


class CourseResponse(CourseBase):
    id: int
    department: Optional[DepartmentResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Academic Session Schemas
class AcademicSessionBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    is_current: bool = False


class AcademicSessionCreate(AcademicSessionBase):
    pass


class AcademicSessionUpdate(BaseModel):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_current: Optional[bool] = None


class AcademicSessionResponse(AcademicSessionBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# Semester Schemas
class SemesterBase(BaseModel):
    course_id: int
    academic_session_id: int
    semester_number: int
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool = True


class SemesterCreate(SemesterBase):
    pass


class SemesterUpdate(BaseModel):
    course_id: Optional[int] = None
    academic_session_id: Optional[int] = None
    semester_number: Optional[int] = None
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None


class SemesterResponse(SemesterBase):
    id: int
    course: Optional[CourseResponse] = None
    academic_session: Optional[AcademicSessionResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Section Schemas
class SectionBase(BaseModel):
    semester_id: int
    name: str
    capacity: int = 60


class SectionCreate(SectionBase):
    pass


class SectionUpdate(BaseModel):
    semester_id: Optional[int] = None
    name: Optional[str] = None
    capacity: Optional[int] = None


class SectionResponse(SectionBase):
    id: int
    semester: Optional[SemesterResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Subject Schemas
class SubjectBase(BaseModel):
    course_id: int
    department_id: int
    code: str
    name: str
    semester_number: int
    type: SubjectType = SubjectType.THEORY
    credits: float = 4.0
    max_marks: int = 100
    passing_marks: int = 40


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    course_id: Optional[int] = None
    department_id: Optional[int] = None
    code: Optional[str] = None
    name: Optional[str] = None
    semester_number: Optional[int] = None
    type: Optional[SubjectType] = None
    credits: Optional[float] = None
    max_marks: Optional[int] = None
    passing_marks: Optional[int] = None


class SubjectResponse(SubjectBase):
    id: int
    course: Optional[CourseResponse] = None
    department: Optional[DepartmentResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Subject Allocation Schemas
class SubjectAllocationBase(BaseModel):
    faculty_id: int
    subject_id: int
    section_id: int
    academic_session_id: int
    is_active: bool = True


class SubjectAllocationCreate(SubjectAllocationBase):
    pass


class SubjectAllocationUpdate(BaseModel):
    faculty_id: Optional[int] = None
    subject_id: Optional[int] = None
    section_id: Optional[int] = None
    academic_session_id: Optional[int] = None
    is_active: Optional[bool] = None


class SubjectAllocationResponse(SubjectAllocationBase):
    id: int
    subject: Optional[SubjectResponse] = None
    section: Optional[SectionResponse] = None
    academic_session: Optional[AcademicSessionResponse] = None

    model_config = ConfigDict(from_attributes=True)
