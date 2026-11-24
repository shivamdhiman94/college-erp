import enum
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Numeric, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class SubjectType(str, enum.Enum):
    THEORY = "THEORY"
    PRACTICAL = "PRACTICAL"
    ELECTIVE = "ELECTIVE"


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    head_of_department_id = Column(Integer, nullable=True)

    # Relationships
    courses = relationship("Course", back_populates="department", cascade="all, delete-orphan")
    faculty_members = relationship("Faculty", back_populates="department")
    students = relationship("Student", back_populates="department")
    subjects = relationship("Subject", back_populates="department")
    notices = relationship("Notice", back_populates="department")


class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    duration_years = Column(Integer, default=4, nullable=False)
    total_semesters = Column(Integer, default=8, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    department = relationship("Department", back_populates="courses")
    semesters = relationship("Semester", back_populates="course", cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="course", cascade="all, delete-orphan")
    students = relationship("Student", back_populates="course")


class AcademicSession(Base):
    __tablename__ = "academic_sessions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_current = Column(Boolean, default=False, nullable=False)

    # Relationships
    semesters = relationship("Semester", back_populates="academic_session", cascade="all, delete-orphan")
    admitted_students = relationship("Student", back_populates="admission_session")
    allocations = relationship("SubjectAllocation", back_populates="academic_session")
    exams = relationship("Exam", back_populates="academic_session")


class Semester(Base):
    __tablename__ = "semesters"
    __table_args__ = (
        UniqueConstraint("course_id", "academic_session_id", "semester_number", name="uq_course_session_semester"),
    )

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    name = Column(String(100), nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="semesters")
    academic_session = relationship("AcademicSession", back_populates="semesters")
    sections = relationship("Section", back_populates="semester", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="semester")
    exams = relationship("Exam", back_populates="semester")
    fee_structures = relationship("FeeStructure", back_populates="semester")


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("semester_id", "name", name="uq_semester_section_name"),
    )

    id = Column(Integer, primary_key=True, index=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(20), nullable=False)
    capacity = Column(Integer, default=60, nullable=False)

    # Relationships
    semester = relationship("Semester", back_populates="sections")
    enrollments = relationship("Enrollment", back_populates="section")
    allocations = relationship("SubjectAllocation", back_populates="section")


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="RESTRICT"), nullable=False)
    code = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(150), nullable=False)
    semester_number = Column(Integer, nullable=False)
    type = Column(Enum(SubjectType), default=SubjectType.THEORY, nullable=False)
    credits = Column(Numeric(3, 1), default=4.0, nullable=False)
    max_marks = Column(Integer, default=100, nullable=False)
    passing_marks = Column(Integer, default=40, nullable=False)

    # Relationships
    course = relationship("Course", back_populates="subjects")
    department = relationship("Department", back_populates="subjects")
    allocations = relationship("SubjectAllocation", back_populates="subject", cascade="all, delete-orphan")
    exam_schedules = relationship("ExamSchedule", back_populates="subject")


class SubjectAllocation(Base):
    __tablename__ = "subject_allocations"
    __table_args__ = (
        UniqueConstraint("faculty_id", "subject_id", "section_id", "academic_session_id", name="uq_faculty_allocation"),
    )

    id = Column(Integer, primary_key=True, index=True)
    faculty_id = Column(Integer, ForeignKey("faculty.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=False)
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="CASCADE"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    faculty = relationship("Faculty", back_populates="allocations")
    subject = relationship("Subject", back_populates="allocations")
    section = relationship("Section", back_populates="allocations")
    academic_session = relationship("AcademicSession", back_populates="allocations")
    timetables = relationship("Timetable", back_populates="allocation", cascade="all, delete-orphan")
    attendance_sessions = relationship("AttendanceSession", back_populates="allocation", cascade="all, delete-orphan")
    assignments = relationship("Assignment", back_populates="allocation", cascade="all, delete-orphan")
