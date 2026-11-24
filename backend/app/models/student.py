import enum
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Text, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class StudentStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PASSED_OUT = "PASSED_OUT"
    SUSPENDED = "SUSPENDED"
    DROPPED = "DROPPED"


class EnrollmentStatus(str, enum.Enum):
    ENROLLED = "ENROLLED"
    COMPLETED = "COMPLETED"
    DETAINED = "DETAINED"


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="RESTRICT"), nullable=False)
    admission_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="RESTRICT"), nullable=False)
    
    enrollment_number = Column(String(50), unique=True, index=True, nullable=False)
    roll_number = Column(String(50), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    gender = Column(String(20), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String(10), nullable=True)
    phone = Column(String(20), nullable=True)
    guardian_name = Column(String(150), nullable=True)
    guardian_phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    admission_date = Column(Date, nullable=False)
    
    current_semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="RESTRICT"), nullable=True)
    current_section_id = Column(Integer, ForeignKey("sections.id", ondelete="RESTRICT"), nullable=True)
    status = Column(Enum(StudentStatus), default=StudentStatus.ACTIVE, nullable=False)

    # Relationships
    user = relationship("User", back_populates="student_profile")
    department = relationship("Department", back_populates="students")
    course = relationship("Course", back_populates="students")
    admission_session = relationship("AcademicSession", back_populates="admitted_students")
    current_semester = relationship("Semester", foreign_keys=[current_semester_id])
    current_section = relationship("Section", foreign_keys=[current_section_id])
    
    enrollments = relationship("Enrollment", back_populates="student", cascade="all, delete-orphan")
    attendance_records = relationship("AttendanceRecord", back_populates="student", cascade="all, delete-orphan")
    marks = relationship("Mark", back_populates="student", cascade="all, delete-orphan")
    assignment_submissions = relationship("AssignmentSubmission", back_populates="student", cascade="all, delete-orphan")
    fee_structures = relationship("FeeStructure", back_populates="student", cascade="all, delete-orphan")


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("student_id", "semester_id", name="uq_student_semester_enrollment"),
    )

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="RESTRICT"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="RESTRICT"), nullable=False)
    enrolled_date = Column(Date, nullable=False)
    status = Column(Enum(EnrollmentStatus), default=EnrollmentStatus.ENROLLED, nullable=False)

    # Relationships
    student = relationship("Student", back_populates="enrollments")
    semester = relationship("Semester", back_populates="enrollments")
    section = relationship("Section", back_populates="enrollments")
