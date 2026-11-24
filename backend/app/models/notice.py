import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class NoticeType(str, enum.Enum):
    GENERAL = "GENERAL"
    ACADEMIC = "ACADEMIC"
    EXAMINATION = "EXAMINATION"
    ATTENDANCE = "ATTENDANCE"
    ASSIGNMENT = "ASSIGNMENT"
    EVENT = "EVENT"
    FEE = "FEE"
    HOLIDAY = "HOLIDAY"
    PLACEMENT = "PLACEMENT"
    ADMINISTRATIVE = "ADMINISTRATIVE"
    EMERGENCY = "EMERGENCY"
    OTHER = "OTHER"


class NoticePriority(str, enum.Enum):
    LOW = "LOW"
    NORMAL = "NORMAL"
    HIGH = "HIGH"
    URGENT = "URGENT"


class NoticeStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    EXPIRED = "EXPIRED"
    ARCHIVED = "ARCHIVED"


class NoticeTargetType(str, enum.Enum):
    ALL = "ALL"
    STUDENTS = "STUDENTS"
    FACULTY = "FACULTY"
    DEPARTMENT = "DEPARTMENT"
    COURSE = "COURSE"
    SEMESTER = "SEMESTER"
    SECTION = "SECTION"


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    summary = Column(String(500), nullable=True)
    content = Column(Text, nullable=False)
    notice_type = Column(Enum(NoticeType), default=NoticeType.GENERAL, nullable=False)
    priority = Column(Enum(NoticePriority), default=NoticePriority.NORMAL, nullable=False)
    status = Column(Enum(NoticeStatus), default=NoticeStatus.PUBLISHED, nullable=False)
    target_type = Column(Enum(NoticeTargetType), default=NoticeTargetType.ALL, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Scoping relations
    academic_session_id = Column(Integer, ForeignKey("academic_sessions.id", ondelete="SET NULL"), nullable=True)
    department_id = Column(Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), nullable=True)
    semester_id = Column(Integer, ForeignKey("semesters.id", ondelete="CASCADE"), nullable=True)
    section_id = Column(Integer, ForeignKey("sections.id", ondelete="CASCADE"), nullable=True)

    publish_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)

    attachment_url = Column(String(500), nullable=True)
    attachment_name = Column(String(255), nullable=True)
    attachment_size = Column(Integer, nullable=True)

    # Relationships
    author = relationship("User", back_populates="notices_posted")
    department = relationship("Department", back_populates="notices")
    course = relationship("Course")
    semester = relationship("Semester")
    section = relationship("Section")
    reads = relationship("NoticeRead", back_populates="notice", cascade="all, delete-orphan")


class NoticeRead(Base):
    __tablename__ = "notice_reads"
    __table_args__ = (
        UniqueConstraint("notice_id", "user_id", name="uq_notice_user_read"),
    )

    id = Column(Integer, primary_key=True, index=True)
    notice_id = Column(Integer, ForeignKey("notices.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    read_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    notice = relationship("Notice", back_populates="reads")
    user = relationship("User")
