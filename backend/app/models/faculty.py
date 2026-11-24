from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    joining_date = Column(Date, nullable=False)
    qualification = Column(String(200), nullable=True)
    designation = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)

    # Relationships
    user = relationship("User", back_populates="faculty_profile")
    department = relationship("Department", back_populates="faculty_members")
    allocations = relationship("SubjectAllocation", back_populates="faculty", cascade="all, delete-orphan")
    attendance_taken = relationship("AttendanceSession", back_populates="taken_by_faculty")
    marks_uploaded = relationship("Mark", back_populates="uploaded_by_faculty")
    assignments_graded = relationship("AssignmentSubmission", back_populates="graded_by_faculty")
