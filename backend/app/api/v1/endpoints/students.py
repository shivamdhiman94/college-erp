from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.security import get_password_hash
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException
from app.models.user import User, UserRole
from app.models.student import Student, Enrollment, StudentStatus, EnrollmentStatus
from app.models.academic import Department, Course, AcademicSession, Semester, Section
from app.schemas.student import (
    StudentCreateWithUser,
    StudentUpdate,
    StudentResponse,
    StudentDetailResponse,
    EnrollmentCreate,
    EnrollmentResponse,
)

router = APIRouter()


@router.get("", response_model=List[StudentResponse], summary="List students (Admin or Faculty)")
def list_students(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    department_id: Optional[int] = None,
    course_id: Optional[int] = None,
    current_semester_id: Optional[int] = None,
    current_section_id: Optional[int] = None,
    status: Optional[StudentStatus] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    query = db.query(Student)
    if department_id:
        query = query.filter(Student.department_id == department_id)
    if course_id:
        query = query.filter(Student.course_id == course_id)
    if current_semester_id:
        query = query.filter(Student.current_semester_id == current_semester_id)
    if current_section_id:
        query = query.filter(Student.current_section_id == current_section_id)
    if status:
        query = query.filter(Student.status == status)
    if search:
        query = query.filter(
            (Student.first_name.ilike(f"%{search}%")) |
            (Student.last_name.ilike(f"%{search}%")) |
            (Student.enrollment_number.ilike(f"%{search}%")) |
            (Student.roll_number.ilike(f"%{search}%"))
        )
    return query.order_by(Student.roll_number.asc()).offset(skip).limit(limit).all()


@router.get("/me/profile", response_model=StudentDetailResponse, summary="Get current logged-in student profile")
def get_my_student_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise EntityNotFoundException("Student profile not found for this user account.")
    return student


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED, summary="Create student & user account (Admin only)")
def create_student(
    payload: StudentCreateWithUser,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    # Verify academic hierarchy foreign keys
    if not db.query(Department).filter(Department.id == payload.department_id).first():
        raise EntityNotFoundException(f"Department with ID {payload.department_id} not found.")
    if not db.query(Course).filter(Course.id == payload.course_id).first():
        raise EntityNotFoundException(f"Course with ID {payload.course_id} not found.")
    if not db.query(AcademicSession).filter(AcademicSession.id == payload.admission_session_id).first():
        raise EntityNotFoundException(f"Academic session with ID {payload.admission_session_id} not found.")

    if payload.current_semester_id and not db.query(Semester).filter(Semester.id == payload.current_semester_id).first():
        raise EntityNotFoundException(f"Semester with ID {payload.current_semester_id} not found.")
    if payload.current_section_id and not db.query(Section).filter(Section.id == payload.current_section_id).first():
        raise EntityNotFoundException(f"Section with ID {payload.current_section_id} not found.")

    # Unique check for User email and username
    if db.query(User).filter(User.email == payload.email).first():
        raise EntityAlreadyExistsException(f"User with email '{payload.email}' already exists.")
    if db.query(User).filter(User.username == payload.username).first():
        raise EntityAlreadyExistsException(f"User with username '{payload.username}' already exists.")

    # Unique check for Student enrollment number and roll number
    if db.query(Student).filter(Student.enrollment_number == payload.enrollment_number).first():
        raise EntityAlreadyExistsException(f"Student with enrollment number '{payload.enrollment_number}' already exists.")
    if db.query(Student).filter(
        Student.roll_number == payload.roll_number,
        Student.course_id == payload.course_id,
        Student.admission_session_id == payload.admission_session_id
    ).first():
        raise EntityAlreadyExistsException(f"Student with roll number '{payload.roll_number}' already exists for this course and session.")

    # 1. Create User account
    user = User(
        email=payload.email,
        username=payload.username,
        hashed_password=get_password_hash(payload.password),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    db.flush()

    # 2. Create Student profile
    student = Student(
        user_id=user.id,
        department_id=payload.department_id,
        course_id=payload.course_id,
        admission_session_id=payload.admission_session_id,
        enrollment_number=payload.enrollment_number,
        roll_number=payload.roll_number,
        first_name=payload.first_name,
        last_name=payload.last_name,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        blood_group=payload.blood_group,
        phone=payload.phone,
        guardian_name=payload.guardian_name,
        guardian_phone=payload.guardian_phone,
        address=payload.address,
        admission_date=payload.admission_date,
        current_semester_id=payload.current_semester_id,
        current_section_id=payload.current_section_id,
        status=payload.status
    )
    db.add(student)
    db.flush()

    # 3. Create initial enrollment if semester and section provided
    if payload.current_semester_id and payload.current_section_id:
        enrollment = Enrollment(
            student_id=student.id,
            semester_id=payload.current_semester_id,
            section_id=payload.current_section_id,
            enrolled_date=payload.admission_date,
            status=EnrollmentStatus.ENROLLED
        )
        db.add(enrollment)

    db.commit()
    db.refresh(student)
    return student


@router.get("/{student_id}", response_model=StudentDetailResponse, summary="Get student details by ID")
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise EntityNotFoundException(f"Student with ID {student_id} not found.")
    return student


@router.put("/{student_id}", response_model=StudentResponse, summary="Update student profile (Admin only)")
def update_student(
    student_id: int,
    payload: StudentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise EntityNotFoundException(f"Student with ID {student_id} not found.")

    if payload.department_id is not None:
        if not db.query(Department).filter(Department.id == payload.department_id).first():
            raise EntityNotFoundException(f"Department with ID {payload.department_id} not found.")
        student.department_id = payload.department_id

    if payload.course_id is not None:
        if not db.query(Course).filter(Course.id == payload.course_id).first():
            raise EntityNotFoundException(f"Course with ID {payload.course_id} not found.")
        student.course_id = payload.course_id

    if payload.admission_session_id is not None:
        if not db.query(AcademicSession).filter(AcademicSession.id == payload.admission_session_id).first():
            raise EntityNotFoundException(f"Academic session with ID {payload.admission_session_id} not found.")
        student.admission_session_id = payload.admission_session_id

    if payload.current_semester_id is not None:
        if not db.query(Semester).filter(Semester.id == payload.current_semester_id).first():
            raise EntityNotFoundException(f"Semester with ID {payload.current_semester_id} not found.")
        student.current_semester_id = payload.current_semester_id

    if payload.current_section_id is not None:
        if not db.query(Section).filter(Section.id == payload.current_section_id).first():
            raise EntityNotFoundException(f"Section with ID {payload.current_section_id} not found.")
        student.current_section_id = payload.current_section_id

    if payload.enrollment_number is not None and payload.enrollment_number != student.enrollment_number:
        if db.query(Student).filter(Student.enrollment_number == payload.enrollment_number, Student.id != student_id).first():
            raise EntityAlreadyExistsException(f"Enrollment number '{payload.enrollment_number}' already in use.")
        student.enrollment_number = payload.enrollment_number

    if payload.roll_number is not None:
        student.roll_number = payload.roll_number
    if payload.first_name is not None:
        student.first_name = payload.first_name
    if payload.last_name is not None:
        student.last_name = payload.last_name
    if payload.gender is not None:
        student.gender = payload.gender
    if payload.date_of_birth is not None:
        student.date_of_birth = payload.date_of_birth
    if payload.blood_group is not None:
        student.blood_group = payload.blood_group
    if payload.phone is not None:
        student.phone = payload.phone
    if payload.guardian_name is not None:
        student.guardian_name = payload.guardian_name
    if payload.guardian_phone is not None:
        student.guardian_phone = payload.guardian_phone
    if payload.address is not None:
        student.address = payload.address
    if payload.status is not None:
        student.status = payload.status

    db.commit()
    db.refresh(student)
    return student


@router.post("/{student_id}/enroll", response_model=EnrollmentResponse, status_code=status.HTTP_201_CREATED, summary="Enroll student into semester/section (Admin only)")
def enroll_student(
    student_id: int,
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise EntityNotFoundException(f"Student with ID {student_id} not found.")

    if not db.query(Semester).filter(Semester.id == payload.semester_id).first():
        raise EntityNotFoundException(f"Semester with ID {payload.semester_id} not found.")
    if not db.query(Section).filter(Section.id == payload.section_id).first():
        raise EntityNotFoundException(f"Section with ID {payload.section_id} not found.")

    # Check if already enrolled in this semester
    existing = db.query(Enrollment).filter(
        Enrollment.student_id == student_id,
        Enrollment.semester_id == payload.semester_id
    ).first()
    if existing:
        existing.section_id = payload.section_id
        existing.status = payload.status
        db.commit()
        db.refresh(existing)
        return existing

    enrollment = Enrollment(
        student_id=student_id,
        semester_id=payload.semester_id,
        section_id=payload.section_id,
        enrolled_date=payload.enrolled_date or date.today(),
        status=payload.status
    )
    student.current_semester_id = payload.semester_id
    student.current_section_id = payload.section_id
    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)
    return enrollment


@router.delete("/{student_id}", summary="Delete or deactivate student (Admin only)")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise EntityNotFoundException(f"Student with ID {student_id} not found.")

    user = db.query(User).filter(User.id == student.user_id).first()
    if user:
        user.is_active = False

    student.status = StudentStatus.DROPPED
    db.delete(student)
    if user:
        db.delete(user)
    db.commit()
    return {"message": f"Student {student_id} and associated user account deleted successfully."}
