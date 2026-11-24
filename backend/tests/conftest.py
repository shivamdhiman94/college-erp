import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from datetime import date

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User, Admin, UserRole
from app.models.academic import Department, Course, AcademicSession, Semester, Section, Subject, SubjectType
from app.models.faculty import Faculty
from app.models.student import Student, StudentStatus

# Use an isolated in-memory SQLite database with StaticPool for test suite
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Ensure app lifespan connects to test_engine during test suite execution
import app.main as main_module
main_module.engine = test_engine


@pytest.fixture(autouse=True)
def init_test_database():
    """Create all tables before each test and drop them after."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    """Provide a transactional test database session."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db: Session) -> Generator[TestClient, None, None]:
    """TestClient that uses the test in-memory database session."""
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_admin_user(db: Session) -> User:
    user = User(
        email="admin.test@college.edu",
        username="admintest",
        hashed_password=get_password_hash("AdminPass123!"),
        role=UserRole.ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    admin_profile = Admin(
        user_id=user.id,
        first_name="Admin",
        last_name="Tester",
        phone="555-0100",
        designation="Lead Admin"
    )
    db.add(admin_profile)
    db.commit()
    db.refresh(admin_profile)
    return user


@pytest.fixture
def test_faculty_user(db: Session) -> User:
    dept = Department(code="CSE", name="Computer Science")
    db.add(dept)
    db.commit()
    db.refresh(dept)

    user = User(
        email="faculty.test@college.edu",
        username="facultytest",
        hashed_password=get_password_hash("FacultyPass123!"),
        role=UserRole.FACULTY,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    faculty_profile = Faculty(
        user_id=user.id,
        department_id=dept.id,
        employee_code="FAC-TEST-01",
        first_name="John",
        last_name="Professor",
        designation="Assistant Professor",
        joining_date=date(2023, 1, 15)
    )
    db.add(faculty_profile)
    db.commit()
    return user


@pytest.fixture
def test_student_user(db: Session) -> User:
    dept = Department(code="CSE-STU", name="Computer Science")
    db.add(dept)
    db.commit()
    db.refresh(dept)

    course = Course(department_id=dept.id, code="BTECH_CSE_STU", name="B.Tech Computer Science")
    session = AcademicSession(name="2025-2026-STU", start_date=date(2025, 8, 1), end_date=date(2026, 6, 30), is_current=True)
    db.add_all([course, session])
    db.commit()
    db.refresh(course)
    db.refresh(session)

    user = User(
        email="student.test@college.edu",
        username="studenttest",
        hashed_password=get_password_hash("StudentPass123!"),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    student_profile = Student(
        user_id=user.id,
        department_id=dept.id,
        course_id=course.id,
        admission_session_id=session.id,
        enrollment_number="ENR-TEST-001",
        roll_number="25CS01",
        first_name="Alice",
        last_name="Student",
        admission_date=date(2025, 8, 1),
        status=StudentStatus.ACTIVE
    )
    db.add(student_profile)
    db.commit()
    return user


@pytest.fixture
def admin_auth_headers(test_admin_user: User) -> dict:
    token = create_access_token(
        subject=test_admin_user.id,
        extra_claims={
            "email": test_admin_user.email,
            "role": test_admin_user.role.value,
            "username": test_admin_user.username
        }
    )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def student_auth_headers(test_student_user: User) -> dict:
    token = create_access_token(
        subject=test_student_user.id,
        extra_claims={
            "email": test_student_user.email,
            "role": test_student_user.role.value,
            "username": test_student_user.username
        }
    )
    return {"Authorization": f"Bearer {token}"}
