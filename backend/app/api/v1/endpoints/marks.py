from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BadRequestException
from app.core.grading import calculate_grade, calculate_sgpa, GRADE_SCALE
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.student import Student, Enrollment, EnrollmentStatus, StudentStatus
from app.models.academic import SubjectAllocation, Subject, Semester
from app.models.exam import Exam, ExamSchedule, ExamStatus
from app.models.mark import Mark
from app.schemas.exam import (
    MarkBulkSubmitPayload,
    MarkResponse,
    StudentExamCardResponse,
    SubjectResultDetail,
)

router = APIRouter()


@router.get("/grades-scale", summary="Get standard institutional grading scale")
def get_grades_scale(current_user: User = Depends(get_current_active_user)):
    return GRADE_SCALE


@router.get("/students-for-schedule/{schedule_id}", summary="Get student list for entering marks")
def get_students_for_schedule(
    schedule_id: int,
    section_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    schedule = db.query(ExamSchedule).filter(ExamSchedule.id == schedule_id).first()
    if not schedule:
        raise EntityNotFoundException(f"Exam schedule with ID {schedule_id} not found.")

    exam = schedule.exam

    # Check faculty subject authorization
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty:
            raise PermissionDeniedException("Faculty profile not found.")
        allocations = db.query(SubjectAllocation).filter(
            SubjectAllocation.faculty_id == faculty.id,
            SubjectAllocation.subject_id == schedule.subject_id
        ).all()
        if not allocations:
            raise PermissionDeniedException("You are not assigned to teach this subject.")

    # Find enrolled students in this semester
    students_query = (
        db.query(Student)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .filter(
            Enrollment.semester_id == exam.semester_id,
            Enrollment.status == EnrollmentStatus.ENROLLED,
            Student.status == StudentStatus.ACTIVE
        )
    )
    if section_id:
        students_query = students_query.filter(Enrollment.section_id == section_id)

    students = students_query.order_by(Student.roll_number.asc()).all()

    # Load existing marks
    marks_map = {}
    is_finalized = False
    existing_marks = db.query(Mark).filter(Mark.exam_schedule_id == schedule_id).all()
    for m in existing_marks:
        marks_map[m.student_id] = {
            "marks_obtained": float(m.marks_obtained),
            "grade": m.grade,
            "grade_point": float(m.grade_point),
            "remarks": m.remarks or "",
            "is_finalized": m.is_finalized,
        }
        if m.is_finalized:
            is_finalized = True

    roster = []
    for s in students:
        m_info = marks_map.get(s.id, {
            "marks_obtained": 0.0,
            "grade": "F",
            "grade_point": 0.0,
            "remarks": "",
            "is_finalized": False
        })
        roster.append({
            "student_id": s.id,
            "roll_number": s.roll_number,
            "enrollment_number": s.enrollment_number,
            "first_name": s.first_name,
            "last_name": s.last_name,
            "marks_obtained": m_info["marks_obtained"],
            "grade": m_info["grade"],
            "grade_point": m_info["grade_point"],
            "remarks": m_info["remarks"],
            "is_finalized": m_info["is_finalized"],
        })

    return {
        "schedule_id": schedule.id,
        "exam_name": exam.name,
        "subject_code": schedule.subject.code if schedule.subject else "",
        "subject_name": schedule.subject.name if schedule.subject else "",
        "max_marks": schedule.max_marks,
        "passing_marks": schedule.passing_marks,
        "is_finalized": is_finalized,
        "students": roster,
    }


@router.post("/bulk-save", summary="Save or finalize student marks")
def bulk_save_marks(
    payload: MarkBulkSubmitPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    schedule = db.query(ExamSchedule).filter(ExamSchedule.id == payload.exam_schedule_id).first()
    if not schedule:
        raise EntityNotFoundException(f"Exam schedule with ID {payload.exam_schedule_id} not found.")

    # Faculty check
    faculty_id = 1
    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty:
            raise PermissionDeniedException("Faculty profile not found.")
        faculty_id = faculty.id
    elif current_user.role == UserRole.ADMIN:
        admin_faculty = db.query(Faculty).first()
        faculty_id = admin_faculty.id if admin_faculty else 1

    existing_marks = {m.student_id: m for m in schedule.marks}

    for item in payload.marks:
        if item.marks_obtained < 0:
            raise BadRequestException("Marks obtained cannot be negative.")
        if item.marks_obtained > schedule.max_marks:
            raise BadRequestException(f"Marks obtained ({item.marks_obtained}) exceeds maximum marks ({schedule.max_marks}).")

        grade, grade_point, status_str = calculate_grade(item.marks_obtained, schedule.max_marks)

        if item.student_id in existing_marks:
            mark_rec = existing_marks[item.student_id]
            if mark_rec.is_finalized and current_user.role != UserRole.ADMIN:
                raise PermissionDeniedException("Marks for this student have been finalized and cannot be modified.")
            mark_rec.marks_obtained = item.marks_obtained
            mark_rec.grade = grade
            mark_rec.grade_point = grade_point
            mark_rec.remarks = item.remarks
            mark_rec.is_finalized = payload.is_finalized
            mark_rec.uploaded_by_faculty_id = faculty_id
        else:
            mark_rec = Mark(
                exam_schedule_id=payload.exam_schedule_id,
                student_id=item.student_id,
                marks_obtained=item.marks_obtained,
                grade=grade,
                grade_point=grade_point,
                remarks=item.remarks,
                is_finalized=payload.is_finalized,
                uploaded_by_faculty_id=faculty_id
            )
            db.add(mark_rec)

    db.commit()
    return {"message": f"Successfully {'finalized' if payload.is_finalized else 'saved'} marks for {len(payload.marks)} students."}


def build_student_exam_report(db: Session, student: Student, exam: Exam) -> StudentExamCardResponse:
    schedules = db.query(ExamSchedule).filter(ExamSchedule.exam_id == exam.id).all()

    subject_results = []
    total_max = 0.0
    total_obtained = 0.0
    has_failed_subject = False

    for sch in schedules:
        sub = sch.subject
        mark_rec = db.query(Mark).filter(
            Mark.exam_schedule_id == sch.id,
            Mark.student_id == student.id
        ).first()

        obtained = float(mark_rec.marks_obtained) if mark_rec else 0.0
        pct = round((obtained / sch.max_marks) * 100.0, 1) if sch.max_marks > 0 else 0.0
        grade, gp, stat = calculate_grade(obtained, sch.max_marks)
        if obtained < sch.passing_marks:
            stat = "FAIL"
            has_failed_subject = True

        total_max += sch.max_marks
        total_obtained += obtained

        subject_results.append({
            "subject_code": sub.code if sub else "",
            "subject_name": sub.name if sub else "",
            "credits": float(sub.credits) if sub else 3.0,
            "max_marks": sch.max_marks,
            "passing_marks": sch.passing_marks,
            "marks_obtained": obtained,
            "percentage": pct,
            "grade": grade,
            "grade_point": gp,
            "status": stat
        })

    overall_pct = round((total_obtained / total_max) * 100.0, 2) if total_max > 0 else 0.0
    sgpa = calculate_sgpa(subject_results)
    result_status = "FAIL" if has_failed_subject or overall_pct < 40.0 else "PASS"

    return StudentExamCardResponse(
        exam_id=exam.id,
        exam_name=exam.name,
        exam_type=exam.exam_type.value,
        session_name=exam.academic_session.name if exam.academic_session else "",
        semester_name=exam.semester.name if exam.semester else "",
        student_id=student.id,
        student_name=f"{student.first_name} {student.last_name}",
        roll_number=student.roll_number,
        enrollment_number=student.enrollment_number,
        total_max_marks=total_max,
        total_obtained_marks=total_obtained,
        overall_percentage=overall_pct,
        sgpa=sgpa,
        result_status=result_status,
        is_published=exam.is_published,
        subjects=[SubjectResultDetail(**s) for s in subject_results]
    )


@router.get("/my-results", response_model=List[StudentExamCardResponse], summary="Get logged-in student's published report cards")
def get_my_results(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise EntityNotFoundException("Student profile not found.")

    # Find published exams for student's semester or course
    published_exams = (
        db.query(Exam)
        .filter(
            Exam.is_published == True,
            Exam.semester_id == student.current_semester_id
        )
        .order_by(Exam.end_date.desc())
        .all()
    )

    cards = []
    for ex in published_exams:
        cards.append(build_student_exam_report(db, student, ex))

    return cards


@router.get("/student/{student_id}/exam/{exam_id}", response_model=StudentExamCardResponse, summary="Get student exam report card (Admin or Faculty)")
def get_student_exam_card(
    student_id: int,
    exam_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.FACULTY]))
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise EntityNotFoundException(f"Student with ID {student_id} not found.")

    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise EntityNotFoundException(f"Exam with ID {exam_id} not found.")

    return build_student_exam_report(db, student, exam)
