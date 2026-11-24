import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Numeric, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class AssignmentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    CLOSED = "CLOSED"
    ARCHIVED = "ARCHIVED"


class SubmissionStatus(str, enum.Enum):
    NOT_SUBMITTED = "NOT_SUBMITTED"
    SUBMITTED = "SUBMITTED"
    LATE = "LATE"
    GRADED = "GRADED"
    RETURNED = "RETURNED"


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    subject_allocation_id = Column(Integer, ForeignKey("subject_allocations.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    attachment_url = Column(String(500), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    attachment_size = Column(Integer, nullable=True)
    issue_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    due_date = Column(DateTime, nullable=False)
    max_points = Column(Integer, default=100, nullable=False)
    status = Column(Enum(AssignmentStatus), default=AssignmentStatus.PUBLISHED, nullable=False)
    allow_late_submission = Column(Boolean, default=True, nullable=False)
    max_attempts = Column(Integer, default=1, nullable=False)

    # Relationships
    allocation = relationship("SubjectAllocation", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    __table_args__ = (
        UniqueConstraint("assignment_id", "student_id", name="uq_assignment_student_submission"),
    )

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    attempt_number = Column(Integer, default=1, nullable=False)
    submission_text = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.SUBMITTED, nullable=False)
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    obtained_marks = Column(Numeric(5, 2), nullable=True)
    feedback = Column(Text, nullable=True)
    graded_by_faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="SET NULL"), nullable=True)
    graded_at = Column(DateTime, nullable=True)

    # Relationships
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="assignment_submissions")
    graded_by_faculty = relationship("Faculty", back_populates="assignments_graded")
