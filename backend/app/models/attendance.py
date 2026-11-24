import enum
from sqlalchemy import Column, Integer, String, Date, Time, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    LATE = "LATE"
    EXCUSED = "EXCUSED"


class AttendanceSession(Base):
    __tablename__ = "attendance_sessions"
    __table_args__ = (
        UniqueConstraint("subject_allocation_id", "session_date", name="uq_allocation_date_attendance_session"),
    )

    id = Column(Integer, primary_key=True, index=True)
    subject_allocation_id = Column(Integer, ForeignKey("subject_allocations.id", ondelete="CASCADE"), nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    topic_covered = Column(String(255), nullable=True)
    taken_by_faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    allocation = relationship("SubjectAllocation", back_populates="attendance_sessions")
    taken_by_faculty = relationship("Faculty", back_populates="attendance_taken")
    records = relationship("AttendanceRecord", back_populates="attendance_session", cascade="all, delete-orphan")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"
    __table_args__ = (
        UniqueConstraint("attendance_session_id", "student_id", name="uq_session_student_attendance"),
    )

    id = Column(Integer, primary_key=True, index=True)
    attendance_session_id = Column(Integer, ForeignKey("attendance_sessions.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.PRESENT, nullable=False)
    remarks = Column(String(200), nullable=True)

    # Relationships
    attendance_session = relationship("AttendanceSession", back_populates="records")
    student = relationship("Student", back_populates="attendance_records")
