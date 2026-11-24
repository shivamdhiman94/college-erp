from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.exceptions import (
    InvalidCredentialsException,
    TokenExpiredOrInvalidException,
    EntityNotFoundException
)
from app.models.user import User, UserRole, Admin
from app.models.faculty import Faculty
from app.models.student import Student
from app.schemas.token import Token


class AuthService:
    @staticmethod
    def authenticate_user(db: Session, username_or_email: str, password: str) -> Optional[User]:
        """Authenticate user by username OR email."""
        user = db.query(User).filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def get_user_display_name(db: Session, user: User) -> str:
        """Fetch full name of user based on their specific profile table."""
        if user.role == UserRole.ADMIN:
            admin = db.query(Admin).filter(Admin.user_id == user.id).first()
            if admin:
                return f"{admin.first_name} {admin.last_name}"
        elif user.role == UserRole.FACULTY:
            faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
            if faculty:
                return f"{faculty.first_name} {faculty.last_name}"
        elif user.role == UserRole.STUDENT:
            student = db.query(Student).filter(Student.user_id == user.id).first()
            if student:
                return f"{student.first_name} {student.last_name}"
        return user.username

    @classmethod
    def create_user_tokens(cls, db: Session, user: User) -> Token:
        """Create token pair and return full auth token payload."""
        full_name = cls.get_user_display_name(db, user)
        extra_claims = {
            "email": user.email,
            "role": user.role.value,
            "username": user.username,
            "full_name": full_name
        }
        
        access_token = create_access_token(subject=user.id, extra_claims=extra_claims)
        refresh_token = create_refresh_token(subject=user.id)
        
        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            role=user.role,
            user_id=user.id,
            email=user.email,
            username=user.username,
            full_name=full_name
        )

    @classmethod
    def refresh_access_token(cls, db: Session, refresh_token_str: str) -> str:
        """Validate refresh token and issue a new access token."""
        payload = decode_token(refresh_token_str)
        if not payload:
            raise TokenExpiredOrInvalidException(detail="Refresh token is invalid or expired")
        
        if payload.get("type") != "refresh":
            raise TokenExpiredOrInvalidException(detail="Invalid token type, refresh token required")
            
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise TokenExpiredOrInvalidException(detail="Invalid token subject")
            
        user = db.query(User).filter(User.id == int(user_id_str)).first()
        if not user or not user.is_active:
            raise InvalidCredentialsException(detail="User no longer active or exists")
            
        full_name = cls.get_user_display_name(db, user)
        extra_claims = {
            "email": user.email,
            "role": user.role.value,
            "username": user.username,
            "full_name": full_name
        }
        return create_access_token(subject=user.id, extra_claims=extra_claims)

    @staticmethod
    def change_password(db: Session, user: User, old_password: str, new_password: str) -> bool:
        """Verify old password and set new hashed password."""
        if not verify_password(old_password, user.hashed_password):
            raise InvalidCredentialsException(detail="Incorrect current password")
        
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        db.refresh(user)
        return True

    @staticmethod
    def get_user_profile_details(db: Session, user: User) -> Dict[str, Any]:
        """Fetch rich profile dictionary according to user role."""
        profile_data = {}
        if user.role == UserRole.ADMIN:
            admin = db.query(Admin).filter(Admin.user_id == user.id).first()
            if admin:
                profile_data = {
                    "admin_id": admin.id,
                    "first_name": admin.first_name,
                    "last_name": admin.last_name,
                    "phone": admin.phone,
                    "designation": admin.designation
                }
        elif user.role == UserRole.FACULTY:
            faculty = db.query(Faculty).filter(Faculty.user_id == user.id).first()
            if faculty:
                profile_data = {
                    "faculty_id": faculty.id,
                    "employee_code": faculty.employee_code,
                    "first_name": faculty.first_name,
                    "last_name": faculty.last_name,
                    "department_id": faculty.department_id,
                    "department_name": faculty.department.name if faculty.department else None,
                    "designation": faculty.designation,
                    "phone": faculty.phone
                }
        elif user.role == UserRole.STUDENT:
            student = db.query(Student).filter(Student.user_id == user.id).first()
            if student:
                profile_data = {
                    "student_id": student.id,
                    "enrollment_number": student.enrollment_number,
                    "roll_number": student.roll_number,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "department_id": student.department_id,
                    "department_name": student.department.name if student.department else None,
                    "course_id": student.course_id,
                    "course_name": student.course.name if student.course else None,
                    "current_semester_id": student.current_semester_id,
                    "current_section_id": student.current_section_id,
                    "phone": student.phone
                }
        return profile_data
