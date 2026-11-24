import enum
from sqlalchemy import Column, Integer, String, Date, Time, Boolean, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class ExamType(str, enum.Enum):
    MID_TERM = "MID_TERM"
    END_TERM = "END_TERM"
    INTERNAL = "INTERNAL"
    PRACTICAL = "PRACTICAL"
    VIVA = "VIVA"
    OTHER = "OTHER"


class ExamStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    FINALIZED = "FINALIZED"
    PUBLISHED = "PUBLISHED"


class Exam(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="RESTRICT"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="RESTRICT"), nullable=False)
    name = Column(String(150), nullable=False)
    exam_type = Column(Enum(ExamType), default=ExamType.MID_TERM, nullable=False)
    status = Column(Enum(ExamStatus), default=ExamStatus.DRAFT, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_published = Column(Boolean, default=False, nullable=False)
    description = Column(String(255), nullable=True)

    # Relationships
    academic_session = relationship("AcademicSession", back_populates="exams")
    semester = relationship("Semester", back_populates="exams")
    schedules = relationship("ExamSchedule", back_populates="exam", cascade="all, delete-orphan")


class ExamSchedule(Base):
    __tablename__ = "exam_schedules"
    __table_args__ = (
        UniqueConstraint("exam_id", "subject_id", name="uq_exam_subject_schedule"),
    )

    id = Column(Integer, primary_key=True, index=True)
    exam_id = Column(Integer, ForeignKey("exams.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False)
    exam_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    max_marks = Column(Integer, default=100, nullable=False)
    passing_marks = Column(Integer, default=40, nullable=False)
    room_number = Column(String(50), nullable=True)

    # Relationships
    exam = relationship("Exam", back_populates="schedules")
    subject = relationship("Subject", back_populates="exam_schedules")
    marks = relationship("Mark", back_populates="exam_schedule", cascade="all, delete-orphan")
