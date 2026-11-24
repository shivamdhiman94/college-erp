from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.models.assignment import AssignmentStatus, SubmissionStatus
from app.schemas.academic import SubjectAllocationResponse
from app.schemas.student import StudentResponse


# Assignment Schemas
class AssignmentBase(BaseModel):
    subject_allocation_id: int
    title: str
    description: str
    instructions: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    attachment_size: Optional[int] = None
    issue_date: Optional[datetime] = None
    due_date: datetime
    max_points: int = 100
    status: AssignmentStatus = AssignmentStatus.PUBLISHED
    allow_late_submission: bool = True
    max_attempts: int = 1


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    due_date: Optional[datetime] = None
    max_points: Optional[int] = None
    status: Optional[AssignmentStatus] = None
    allow_late_submission: Optional[bool] = None
    max_attempts: Optional[int] = None


class AssignmentResponse(AssignmentBase):
    id: int
    allocation: Optional[SubjectAllocationResponse] = None
    total_submissions_count: int = 0
    graded_submissions_count: int = 0

    model_config = ConfigDict(from_attributes=True)


# Submission Schemas
class AssignmentSubmissionCreate(BaseModel):
    submission_text: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None


class AssignmentSubmissionGrade(BaseModel):
    obtained_marks: float
    feedback: Optional[str] = None
    status: SubmissionStatus = SubmissionStatus.GRADED


class AssignmentSubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    attempt_number: int = 1
    submission_text: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    status: SubmissionStatus
    submitted_at: datetime
    obtained_marks: Optional[float] = None
    feedback: Optional[str] = None
    graded_by_faculty_id: Optional[int] = None
    graded_at: Optional[datetime] = None
    student: Optional[StudentResponse] = None

    model_config = ConfigDict(from_attributes=True)


class StudentAssignmentItemResponse(BaseModel):
    id: int
    title: str
    description: str
    instructions: Optional[str] = None
    subject_code: str
    subject_name: str
    faculty_name: str
    section_name: str
    due_date: datetime
    max_points: int
    status: AssignmentStatus
    allow_late_submission: bool
    max_attempts: int
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None
    is_submitted: bool
    submission_status: Optional[SubmissionStatus] = None
    submitted_at: Optional[datetime] = None
    obtained_marks: Optional[float] = None
    feedback: Optional[str] = None
    attempt_number: int = 0


class AssignmentStatisticsResponse(BaseModel):
    assignment_id: int
    title: str
    total_enrolled: int
    submitted_count: int
    pending_count: int
    late_count: int
    graded_count: int
    average_marks: float
    highest_marks: float
    lowest_marks: float
