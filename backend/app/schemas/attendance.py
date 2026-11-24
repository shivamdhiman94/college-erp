from datetime import date, time
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.attendance import AttendanceStatus
from app.schemas.student import StudentResponse
from app.schemas.academic import SubjectAllocationResponse, SubjectResponse, SectionResponse


class AttendanceRecordBase(BaseModel):
    student_id: int
    status: AttendanceStatus = AttendanceStatus.PRESENT
    remarks: Optional[str] = None


class AttendanceRecordCreate(AttendanceRecordBase):
    pass


class AttendanceRecordResponse(AttendanceRecordBase):
    id: int
    attendance_session_id: int
    student: Optional[StudentResponse] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceSessionCreate(BaseModel):
    subject_allocation_id: int
    session_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    topic_covered: Optional[str] = None
    records: List[AttendanceRecordCreate]


class AttendanceSessionResponse(BaseModel):
    id: int
    subject_allocation_id: int
    session_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    topic_covered: Optional[str] = None
    taken_by_faculty_id: int
    allocation: Optional[SubjectAllocationResponse] = None
    records: List[AttendanceRecordResponse] = []

    model_config = ConfigDict(from_attributes=True)


# Dynamic Attendance Calculations & Reports
class StudentSubjectAttendanceSummary(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    credits: float
    total_classes: int
    present_count: int
    absent_count: int
    late_count: int
    excused_count: int
    percentage: float
    is_below_threshold: bool


class StudentOverallAttendanceResponse(BaseModel):
    student_id: int
    student_name: str
    enrollment_number: str
    overall_percentage: float
    threshold_percentage: float = 75.0
    is_below_threshold: bool
    subjects: List[StudentSubjectAttendanceSummary] = []


class StudentAttendanceHistoryItem(BaseModel):
    record_id: int
    session_date: date
    subject_code: str
    subject_name: str
    status: AttendanceStatus
    topic_covered: Optional[str] = None
    remarks: Optional[str] = None
    faculty_name: str


class SectionSubjectReportItem(BaseModel):
    subject_id: int
    subject_code: str
    subject_name: str
    total_sessions_held: int
    total_students_enrolled: int
    average_attendance_percentage: float
    students_below_threshold_count: int
