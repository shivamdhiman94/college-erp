from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, EntityAlreadyExistsException, PermissionDeniedException
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.student import Student, Enrollment, StudentStatus, EnrollmentStatus
from app.models.academic import SubjectAllocation, Subject, Section, Semester
from app.models.attendance import AttendanceSession, AttendanceRecord, AttendanceStatus
from app.schemas.attendance import (
    AttendanceSessionCreate,
    AttendanceSessionResponse,
    AttendanceRecordResponse,
    StudentOverallAttendanceResponse,
    StudentSubjectAttendanceSummary,
    StudentAttendanceHistoryItem,
    SectionSubjectReportItem,
)
from app.core.events import dispatch_event, EventMessage, EventType, EventScope

router = APIRouter()

DEFAULT_ATTENDANCE_THRESHOLD = 75.0


def calculate_student_percentage(present: int, absent: int, late: int, excused: int) -> float:
    total = present + absent + late + excused
    if total == 0:
        return 100.0
    effective_present = present + excused + (late * 0.5)
    return round((effective_present / total) * 100.0, 1)


@router.get("/students-for-allocation/{allocation_id}", summary="Get student roster for marking attendance")
def get_students_for_allocation(
    allocation_id: int,
    session_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    """
    Returns list of students in the section for this subject allocation,
    along with existing attendance status for the given date if already recorded.
    """
    allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == allocation_id).first()
    if not allocation:
        raise EntityNotFoundException(f"Subject allocation with ID {allocation_id} not found.")

    # Faculty authorization check
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or allocation.faculty_id != faculty.id:
            raise PermissionDeniedException("You are not authorized to mark attendance for this subject allocation.")

    # Find students enrolled in this section
    enrolled_students = (
        db.query(Student)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .filter(
            Enrollment.section_id == allocation.section_id,
            Enrollment.status == EnrollmentStatus.ENROLLED,
            Student.status == StudentStatus.ACTIVE
        )
        .order_by(Student.roll_number.asc())
        .all()
    )

    # If date provided, check if session already exists
    existing_records = {}
    topic_covered = ""
    if session_date:
        att_session = db.query(AttendanceSession).filter(
            AttendanceSession.subject_allocation_id == allocation_id,
            AttendanceSession.session_date == session_date
        ).first()
        if att_session:
            topic_covered = att_session.topic_covered or ""
            for rec in att_session.records:
                existing_records[rec.student_id] = {
                    "status": rec.status,
                    "remarks": rec.remarks or ""
                }

    roster = []
    for s in enrolled_students:
        rec_data = existing_records.get(s.id, {"status": AttendanceStatus.PRESENT, "remarks": ""})
        roster.append({
            "student_id": s.id,
            "enrollment_number": s.enrollment_number,
            "roll_number": s.roll_number,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "status": rec_data["status"],
            "remarks": rec_data["remarks"],
        })

    return {
        "allocation_id": allocation.id,
        "subject_code": allocation.subject.code if allocation.subject else "",
        "subject_name": allocation.subject.name if allocation.subject else "",
        "section_name": allocation.section.name if allocation.section else "",
        "session_date": session_date or date.today(),
        "topic_covered": topic_covered,
        "is_already_marked": bool(existing_records),
        "students": roster,
    }


@router.post("/sessions", response_model=AttendanceSessionResponse, status_code=status.HTTP_201_CREATED, summary="Mark or update attendance session")
def save_attendance_session(
    payload: AttendanceSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == payload.subject_allocation_id).first()
    if not allocation:
        raise EntityNotFoundException(f"Subject allocation with ID {payload.subject_allocation_id} not found.")

    # Faculty check
    faculty_id = allocation.faculty_id
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or allocation.faculty_id != faculty.id:
            raise PermissionDeniedException("You are not assigned to teach this subject and section.")
        faculty_id = faculty.id

    # Check if attendance session already exists for this allocation and date
    att_session = db.query(AttendanceSession).filter(
        AttendanceSession.subject_allocation_id == payload.subject_allocation_id,
        AttendanceSession.session_date == payload.session_date
    ).first()

    if not att_session:
        # Create new session
        att_session = AttendanceSession(
            subject_allocation_id=payload.subject_allocation_id,
            session_date=payload.session_date,
            start_time=payload.start_time,
            end_time=payload.end_time,
            topic_covered=payload.topic_covered,
            taken_by_faculty_id=faculty_id
        )
        db.add(att_session)
        db.flush()
    else:
        # Update existing session metadata
        att_session.topic_covered = payload.topic_covered
        att_session.taken_by_faculty_id = faculty_id
        if payload.start_time:
            att_session.start_time = payload.start_time
        if payload.end_time:
            att_session.end_time = payload.end_time

    # Upsert attendance records
    existing_records_map = {r.student_id: r for r in att_session.records}
    for item in payload.records:
        if item.student_id in existing_records_map:
            rec = existing_records_map[item.student_id]
            rec.status = item.status
            rec.remarks = item.remarks
        else:
            rec = AttendanceRecord(
                attendance_session_id=att_session.id,
                student_id=item.student_id,
                status=item.status,
                remarks=item.remarks
            )
            db.add(rec)

    db.commit()
    db.refresh(att_session)

    # Centralized Real-Time Event Dispatching
    student_ids = [item.student_id for item in payload.records]
    student_user_ids = [
        uid[0] for uid in db.query(Student.user_id).filter(Student.id.in_(student_ids)).all() if uid[0]
    ]

    dispatch_event(
        EventMessage(
            event_type=EventType.ATTENDANCE_MARKED,
            payload={
                "session_id": att_session.id,
                "allocation_id": allocation.id,
                "subject_code": allocation.subject.code if allocation.subject else "",
                "subject_name": allocation.subject.name if allocation.subject else "",
                "session_date": str(att_session.session_date),
                "topic_covered": att_session.topic_covered,
                "records_count": len(payload.records),
            },
            target_scope=EventScope.USERS,
            target_user_ids=student_user_ids + [current_user.id],
            actor={"id": current_user.id, "username": current_user.username, "role": current_user.role.value}
        )
    )

    return att_session


@router.get("/sessions", response_model=List[AttendanceSessionResponse], summary="List attendance sessions (Admin or Faculty)")
def list_attendance_sessions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    subject_allocation_id: Optional[int] = None,
    subject_id: Optional[int] = None,
    section_id: Optional[int] = None,
    session_date: Optional[date] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    query = db.query(AttendanceSession)
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            query = query.filter(AttendanceSession.taken_by_faculty_id == faculty.id)

    if subject_allocation_id:
        query = query.filter(AttendanceSession.subject_allocation_id == subject_allocation_id)
    if session_date:
        query = query.filter(AttendanceSession.session_date == session_date)
    if start_date:
        query = query.filter(AttendanceSession.session_date >= start_date)
    if end_date:
        query = query.filter(AttendanceSession.session_date <= end_date)

    return query.order_by(AttendanceSession.session_date.desc()).offset(skip).limit(limit).all()


@router.get("/my-attendance", response_model=StudentOverallAttendanceResponse, summary="Get student's own subject-wise attendance summary")
def get_my_attendance(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise EntityNotFoundException("Student profile not found for this account.")

    return build_student_attendance_summary(db, student)


@router.get("/student/{student_id}", response_model=StudentOverallAttendanceResponse, summary="Get specific student attendance (Admin or Faculty)")
def get_student_attendance(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise EntityNotFoundException(f"Student with ID {student_id} not found.")

    return build_student_attendance_summary(db, student)


def build_student_attendance_summary(db: Session, student: Student) -> StudentOverallAttendanceResponse:
    # Find all subjects for student's course & semester
    subjects = []
    if student.course_id and student.current_semester:
        subjects = db.query(Subject).filter(
            Subject.course_id == student.course_id,
            Subject.semester_number == student.current_semester.semester_number
        ).all()
    elif student.course_id:
        subjects = db.query(Subject).filter(Subject.course_id == student.course_id).all()

    subject_summaries: List[StudentSubjectAttendanceSummary] = []
    total_present_overall = 0
    total_absent_overall = 0
    total_late_overall = 0
    total_excused_overall = 0

    for sub in subjects:
        records = (
            db.query(AttendanceRecord)
            .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.attendance_session_id)
            .join(SubjectAllocation, SubjectAllocation.id == AttendanceSession.subject_allocation_id)
            .filter(
                AttendanceRecord.student_id == student.id,
                SubjectAllocation.subject_id == sub.id
            )
            .all()
        )

        p = sum(1 for r in records if r.status == AttendanceStatus.PRESENT)
        a = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
        l = sum(1 for r in records if r.status == AttendanceStatus.LATE)
        e = sum(1 for r in records if r.status == AttendanceStatus.EXCUSED)

        total_classes = p + a + l + e
        pct = calculate_student_percentage(p, a, l, e)

        total_present_overall += p
        total_absent_overall += a
        total_late_overall += l
        total_excused_overall += e

        subject_summaries.append(StudentSubjectAttendanceSummary(
            subject_id=sub.id,
            subject_code=sub.code,
            subject_name=sub.name,
            credits=float(sub.credits),
            total_classes=total_classes,
            present_count=p,
            absent_count=a,
            late_count=l,
            excused_count=e,
            percentage=pct,
            is_below_threshold=pct < DEFAULT_ATTENDANCE_THRESHOLD and total_classes > 0
        ))

    overall_pct = calculate_student_percentage(
        total_present_overall, total_absent_overall, total_late_overall, total_excused_overall
    )
    total_all_classes = total_present_overall + total_absent_overall + total_late_overall + total_excused_overall

    return StudentOverallAttendanceResponse(
        student_id=student.id,
        student_name=f"{student.first_name} {student.last_name}",
        enrollment_number=student.enrollment_number,
        overall_percentage=overall_pct,
        threshold_percentage=DEFAULT_ATTENDANCE_THRESHOLD,
        is_below_threshold=overall_pct < DEFAULT_ATTENDANCE_THRESHOLD and total_all_classes > 0,
        subjects=subject_summaries
    )


@router.get("/my-history", response_model=List[StudentAttendanceHistoryItem], summary="Get student's daily attendance history")
def get_my_attendance_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise EntityNotFoundException("Student profile not found.")

    records = (
        db.query(AttendanceRecord)
        .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.attendance_session_id)
        .join(SubjectAllocation, SubjectAllocation.id == AttendanceSession.subject_allocation_id)
        .join(Subject, Subject.id == SubjectAllocation.subject_id)
        .join(Faculty, Faculty.id == AttendanceSession.taken_by_faculty_id)
        .filter(AttendanceRecord.student_id == student.id)
        .order_by(AttendanceSession.session_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    history = []
    for r in records:
        sess = r.attendance_session
        fac = sess.taken_by_faculty if sess else None
        sub = sess.allocation.subject if sess and sess.allocation else None
        history.append(StudentAttendanceHistoryItem(
            record_id=r.id,
            session_date=sess.session_date,
            subject_code=sub.code if sub else "",
            subject_name=sub.name if sub else "",
            status=r.status,
            topic_covered=sess.topic_covered,
            remarks=r.remarks,
            faculty_name=f"{fac.first_name} {fac.last_name}" if fac else "Instructor"
        ))
    return history


@router.get("/reports/section/{section_id}", response_model=List[SectionSubjectReportItem], summary="Section-wise attendance compliance report")
def get_section_attendance_report(
    section_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    section = db.query(Section).filter(Section.id == section_id).first()
    if not section:
        raise EntityNotFoundException(f"Section with ID {section_id} not found.")

    # Find all subject allocations for this section
    allocations = db.query(SubjectAllocation).filter(
        SubjectAllocation.section_id == section_id,
        SubjectAllocation.is_active == True
    ).all()

    # Enrolled students count
    enrolled_students = (
        db.query(Student)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .filter(Enrollment.section_id == section_id, Enrollment.status == EnrollmentStatus.ENROLLED)
        .all()
    )
    total_students = len(enrolled_students)

    reports = []
    for alloc in allocations:
        sessions = db.query(AttendanceSession).filter(AttendanceSession.subject_allocation_id == alloc.id).all()
        session_count = len(sessions)

        # Calculate student percentage per subject
        below_count = 0
        sum_percentages = 0.0

        for stu in enrolled_students:
            recs = (
                db.query(AttendanceRecord)
                .join(AttendanceSession, AttendanceSession.id == AttendanceRecord.attendance_session_id)
                .filter(
                    AttendanceSession.subject_allocation_id == alloc.id,
                    AttendanceRecord.student_id == stu.id
                )
                .all()
            )
            p = sum(1 for r in recs if r.status == AttendanceStatus.PRESENT)
            a = sum(1 for r in recs if r.status == AttendanceStatus.ABSENT)
            l = sum(1 for r in recs if r.status == AttendanceStatus.LATE)
            e = sum(1 for r in recs if r.status == AttendanceStatus.EXCUSED)
            pct = calculate_student_percentage(p, a, l, e)
            sum_percentages += pct
            if pct < DEFAULT_ATTENDANCE_THRESHOLD and session_count > 0:
                below_count += 1

        avg_pct = round(sum_percentages / total_students, 1) if total_students > 0 else 100.0

        reports.append(SectionSubjectReportItem(
            subject_id=alloc.subject_id,
            subject_code=alloc.subject.code if alloc.subject else "",
            subject_name=alloc.subject.name if alloc.subject else "",
            total_sessions_held=session_count,
            total_students_enrolled=total_students,
            average_attendance_percentage=avg_pct,
            students_below_threshold_count=below_count
        ))

    return reports
