from datetime import date, time, datetime, timezone
from sqlalchemy.orm import Session
from app.models.user import User, Admin, UserRole
from app.models.academic import (
    Department, Course, AcademicSession, Semester, Section, Subject, SubjectType, SubjectAllocation
)
from app.models.faculty import Faculty
from app.models.student import Student, StudentStatus, Enrollment, EnrollmentStatus
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceStatus
from app.models.timetable import Timetable, DayOfWeek
from app.models.exam import Exam, ExamSchedule, ExamType
from app.models.mark import Mark
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.fee import FeeStructure, FeePayment, FeeStatus, PaymentMode
from app.models.library import Book, LibraryIssue, IssueStatus
from app.models.notice import Notice, NoticeTargetType


def test_complete_erp_relational_pipeline(db: Session):
    # 1. Create Department & Course
    dept = Department(code="ECE", name="Electronics and Communication", description="Dept of ECE")
    db.add(dept)
    db.commit()
    db.refresh(dept)
    assert dept.id is not None

    course = Course(department_id=dept.id, code="BTECH_ECE", name="B.Tech ECE", duration_years=4, total_semesters=8)
    db.add(course)
    db.commit()
    db.refresh(course)

    # 2. Create Academic Session, Semester, Section, Subject
    session = AcademicSession(name="2025-2026-ECE", start_date=date(2025, 8, 1), end_date=date(2026, 6, 30), is_current=True)
    db.add(session)
    db.commit()
    db.refresh(session)

    semester = Semester(course_id=course.id, academic_session_id=session.id, semester_number=1, name="ECE Sem 1")
    db.add(semester)
    db.commit()
    db.refresh(semester)

    section = Section(semester_id=semester.id, name="A", capacity=60)
    subject = Subject(
        course_id=course.id,
        department_id=dept.id,
        code="EC101",
        name="Basic Electronics",
        semester_number=1,
        type=SubjectType.THEORY,
        credits=4.0
    )
    db.add_all([section, subject])
    db.commit()
    db.refresh(section)
    db.refresh(subject)

    # 3. Create Faculty & Subject Allocation
    faculty_user = User(email="prof.sharma@college.edu", username="profsharma", hashed_password="hashed_dummy_password", role=UserRole.FACULTY)
    db.add(faculty_user)
    db.commit()
    db.refresh(faculty_user)

    faculty = Faculty(
        user_id=faculty_user.id,
        department_id=dept.id,
        employee_code="FAC-ECE-01",
        first_name="Rajesh",
        last_name="Sharma",
        designation="Associate Professor",
        joining_date=date(2020, 7, 1)
    )
    db.add(faculty)
    db.commit()
    db.refresh(faculty)

    allocation = SubjectAllocation(
        faculty_id=faculty.id,
        subject_id=subject.id,
        section_id=section.id,
        academic_session_id=session.id
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    # 4. Create Student & Enrollment
    student_user = User(email="student.rahul@college.edu", username="studentrahul", hashed_password="hashed_dummy_password", role=UserRole.STUDENT)
    db.add(student_user)
    db.commit()
    db.refresh(student_user)

    student = Student(
        user_id=student_user.id,
        department_id=dept.id,
        course_id=course.id,
        admission_session_id=session.id,
        enrollment_number="ENR-ECE-001",
        roll_number="25ECE01",
        first_name="Rahul",
        last_name="Verma",
        admission_date=date(2025, 8, 1),
        current_semester_id=semester.id,
        current_section_id=section.id,
        status=StudentStatus.ACTIVE
    )
    db.add(student)
    db.commit()
    db.refresh(student)

    enrollment = Enrollment(student_id=student.id, semester_id=semester.id, section_id=section.id, enrolled_date=date(2025, 8, 1))
    db.add(enrollment)
    db.commit()

    # 5. Create Timetable slot
    tt = Timetable(
        subject_allocation_id=allocation.id,
        day_of_week=DayOfWeek.MONDAY,
        start_time=time(9, 0),
        end_time=time(10, 0),
        room_number="Room 101"
    )
    db.add(tt)
    db.commit()

    # 6. Create Attendance Session and Record
    att_session = AttendanceSession(
        subject_allocation_id=allocation.id,
        session_date=date(2025, 8, 15),
        start_time=time(9, 0),
        end_time=time(10, 0),
        topic_covered="Semiconductor Physics",
        taken_by_faculty_id=faculty.id
    )
    db.add(att_session)
    db.commit()
    db.refresh(att_session)

    att_record = AttendanceRecord(
        attendance_session_id=att_session.id,
        student_id=student.id,
        status=AttendanceStatus.PRESENT
    )
    db.add(att_record)
    db.commit()

    # 7. Create Exam, Schedule, and Marks
    exam = Exam(
        academic_session_id=session.id,
        semester_id=semester.id,
        name="ECE Mid Term 2025",
        exam_type=ExamType.MID_TERM,
        start_date=date(2025, 10, 1),
        end_date=date(2025, 10, 10),
        is_published=True
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)

    schedule = ExamSchedule(
        exam_id=exam.id,
        subject_id=subject.id,
        exam_date=date(2025, 10, 5),
        start_time=time(10, 0),
        end_time=time(12, 0),
        max_marks=100,
        passing_marks=40
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    mark = Mark(
        exam_schedule_id=schedule.id,
        student_id=student.id,
        marks_obtained=88.5,
        grade="A",
        uploaded_by_faculty_id=faculty.id
    )
    db.add(mark)
    db.commit()

    # 8. Create Fee Structure and Payment
    fee_struct = FeeStructure(
        student_id=student.id,
        semester_id=semester.id,
        tuition_fee=45000.00,
        lab_fee=5000.00,
        library_fee=2000.00,
        other_charges=1000.00,
        total_amount=53000.00,
        due_date=date(2025, 8, 30),
        status=FeeStatus.PARTIALLY_PAID
    )
    db.add(fee_struct)
    db.commit()
    db.refresh(fee_struct)

    payment = FeePayment(
        fee_structure_id=fee_struct.id,
        transaction_id="TXN-2025-0001",
        amount_paid=25000.00,
        payment_mode=PaymentMode.ONLINE,
        payment_date=datetime.now(timezone.utc),
        receipt_number="REC-2025-0001"
    )
    db.add(payment)
    db.commit()

    # 9. Create Library Book and Issue
    book = Book(
        isbn="978-0131103627",
        title="Electronic Devices and Circuit Theory",
        author="Robert Boylestad",
        total_copies=5,
        available_copies=4
    )
    db.add(book)
    db.commit()
    db.refresh(book)

    issue = LibraryIssue(
        book_id=book.id,
        user_id=student_user.id,
        issue_date=date(2025, 8, 10),
        due_date=date(2025, 8, 24),
        status=IssueStatus.ISSUED
    )
    db.add(issue)
    db.commit()

    # 10. Verify cascading & relationship integrity
    assert len(student.attendance_records) == 1
    assert student.attendance_records[0].status == AttendanceStatus.PRESENT
    assert len(student.marks) == 1
    assert float(student.marks[0].marks_obtained) == 88.5
    assert len(fee_struct.payments) == 1
    assert float(fee_struct.payments[0].amount_paid) == 25000.0
    assert len(faculty.allocations) == 1
    assert faculty.allocations[0].subject.name == "Basic Electronics"
