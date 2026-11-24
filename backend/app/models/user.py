import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base_class import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    FACULTY = "FACULTY"
    STUDENT = "STUDENT"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(String(500), nullable=True)

    # Relationships
    admin_profile = relationship("Admin", back_populates="user", uselist=False, cascade="all, delete-orphan")
    faculty_profile = relationship("Faculty", back_populates="user", uselist=False, cascade="all, delete-orphan")
    student_profile = relationship("Student", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notices_posted = relationship("Notice", back_populates="author")
    library_issues = relationship("LibraryIssue", back_populates="user", foreign_keys="LibraryIssue.user_id")


class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    designation = Column(String(100), default="System Administrator", nullable=False)

    # Relationships
    user = relationship("User", back_populates="admin_profile")
