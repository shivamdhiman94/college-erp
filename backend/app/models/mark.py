from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Mark(Base):
    __tablename__ = "marks"
    __table_args__ = (
        UniqueConstraint("exam_schedule_id", "student_id", name="uq_schedule_student_mark"),
    )

    id = Column(Integer, primary_key=True, index=True)
    exam_schedule_id = Column(Integer, ForeignKey("exam_schedules.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    marks_obtained = Column(Numeric(5, 2), nullable=False)
    grade = Column(String(5), nullable=True)
    grade_point = Column(Numeric(4, 2), default=0.0, nullable=False)
    is_finalized = Column(Boolean, default=False, nullable=False)
    remarks = Column(String(200), nullable=True)
    uploaded_by_faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="RESTRICT"), nullable=False)

    # Relationships
    exam_schedule = relationship("ExamSchedule", back_populates="marks")
    student = relationship("Student", back_populates="marks")
    uploaded_by_faculty = relationship("Faculty", back_populates="marks_uploaded")
