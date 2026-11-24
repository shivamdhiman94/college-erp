from datetime import date, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.exam import ExamType, ExamStatus
from app.schemas.academic import SubjectResponse, SemesterResponse, AcademicSessionResponse
from app.schemas.student import StudentResponse


# Exam Schemas
class ExamBase(BaseModel):
    academic_session_id: int
    semester_id: int
    name: str
    exam_type: ExamType = ExamType.MID_TERM
    status: ExamStatus = ExamStatus.DRAFT
    start_date: date
    end_date: date
    is_published: bool = False
    description: Optional[str] = None


class ExamCreate(ExamBase):
    pass


class ExamUpdate(BaseModel):
    name: Optional[str] = None
    exam_type: Optional[ExamType] = None
    status: Optional[ExamStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_published: Optional[bool] = None
    description: Optional[str] = None


# Exam Schedule Schemas
class ExamScheduleBase(BaseModel):
    exam_id: int
    subject_id: int
    exam_date: date
    start_time: time
    end_time: time
    max_marks: int = 100
    passing_marks: int = 40
    room_number: Optional[str] = None


class ExamScheduleCreate(ExamScheduleBase):
    pass


class ExamScheduleUpdate(BaseModel):
    exam_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    max_marks: Optional[int] = None
    passing_marks: Optional[int] = None
    room_number: Optional[str] = None


class ExamScheduleResponse(ExamScheduleBase):
    id: int
    subject: Optional[SubjectResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ExamResponse(ExamBase):
    id: int
    academic_session: Optional[AcademicSessionResponse] = None
    semester: Optional[SemesterResponse] = None
    schedules: List[ExamScheduleResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Marks Schemas
class MarkEntryItem(BaseModel):
    student_id: int
    marks_obtained: float
    remarks: Optional[str] = None


class MarkBulkSubmitPayload(BaseModel):
    exam_schedule_id: int
    is_finalized: bool = False
    marks: List[MarkEntryItem]


class MarkResponse(BaseModel):
    id: int
    exam_schedule_id: int
    student_id: int
    marks_obtained: float
    grade: Optional[str] = None
    grade_point: float = 0.0
    is_finalized: bool = False
    remarks: Optional[str] = None
    student: Optional[StudentResponse] = None

    model_config = ConfigDict(from_attributes=True)


# Student Report Card & Result Schemas
class SubjectResultDetail(BaseModel):
    subject_code: str
    subject_name: str
    credits: float
    max_marks: int
    passing_marks: int
    marks_obtained: float
    percentage: float
    grade: str
    grade_point: float
    status: str  # PASS / FAIL


class StudentExamCardResponse(BaseModel):
    exam_id: int
    exam_name: str
    exam_type: str
    session_name: str
    semester_name: str
    student_id: int
    student_name: str
    roll_number: str
    enrollment_number: str
    total_max_marks: float
    total_obtained_marks: float
    overall_percentage: float
    sgpa: float
    result_status: str  # PASS / FAIL
    is_published: bool
    subjects: List[SubjectResultDetail] = []
