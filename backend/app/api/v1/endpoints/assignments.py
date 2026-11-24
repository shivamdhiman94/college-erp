from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.core.exceptions import EntityNotFoundException, PermissionDeniedException, BadRequestException
from app.models.user import User, UserRole
from app.models.faculty import Faculty
from app.models.student import Student, Enrollment, EnrollmentStatus, StudentStatus
from app.models.academic import SubjectAllocation
from app.models.assignment import Assignment, AssignmentSubmission, AssignmentStatus, SubmissionStatus
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    AssignmentSubmissionCreate,
    AssignmentSubmissionGrade,
    AssignmentSubmissionResponse,
    StudentAssignmentItemResponse,
    AssignmentStatisticsResponse,
)

router = APIRouter()


@router.get("", response_model=List[AssignmentResponse], summary="List assignments (Admin or Faculty)")
def list_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    subject_allocation_id: Optional[int] = None,
    status_filter: Optional[AssignmentStatus] = None,
    section_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    query = db.query(Assignment).join(SubjectAllocation, SubjectAllocation.id == Assignment.subject_allocation_id)

    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if faculty:
            query = query.filter(SubjectAllocation.faculty_id == faculty.id)

    if subject_allocation_id:
        query = query.filter(Assignment.subject_allocation_id == subject_allocation_id)
    if status_filter:
        query = query.filter(Assignment.status == status_filter)
    if section_id:
        query = query.filter(SubjectAllocation.section_id == section_id)

    assignments = query.order_by(Assignment.due_date.desc()).offset(skip).limit(limit).all()

    result = []
    for a in assignments:
        total_sub = len(a.submissions)
        graded_sub = sum(1 for s in a.submissions if s.status == SubmissionStatus.GRADED)
        res_item = AssignmentResponse.model_validate(a)
        res_item.total_submissions_count = total_sub
        res_item.graded_submissions_count = graded_sub
        result.append(res_item)

    return result


@router.post("", response_model=AssignmentResponse, status_code=status.HTTP_201_CREATED, summary="Create assignment (Faculty or Admin)")
def create_assignment(
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    allocation = db.query(SubjectAllocation).filter(SubjectAllocation.id == payload.subject_allocation_id).first()
    if not allocation:
        raise EntityNotFoundException(f"Subject allocation with ID {payload.subject_allocation_id} not found.")

    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or allocation.faculty_id != faculty.id:
            raise PermissionDeniedException("You are not assigned to teach this subject and section.")

    issue_date = payload.issue_date or datetime.utcnow()
    if payload.due_date <= issue_date:
        raise BadRequestException("Due date must be later than the issue date.")

    assignment = Assignment(
        subject_allocation_id=payload.subject_allocation_id,
        title=payload.title.strip(),
        description=payload.description.strip(),
        instructions=payload.instructions.strip() if payload.instructions else None,
        attachment_url=payload.attachment_url,
        attachment_name=payload.attachment_name,
        attachment_size=payload.attachment_size,
        issue_date=issue_date,
        due_date=payload.due_date,
        max_points=payload.max_points,
        status=payload.status,
        allow_late_submission=payload.allow_late_submission,
        max_attempts=payload.max_attempts,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    res = AssignmentResponse.model_validate(assignment)
    res.total_submissions_count = 0
    res.graded_submissions_count = 0
    return res


@router.get("/student/my-assignments", response_model=List[StudentAssignmentItemResponse], summary="Get logged-in student's coursework assignments")
def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student or not student.current_section_id:
        return []

    # Find active assignments for student's section
    assignments = (
        db.query(Assignment)
        .join(SubjectAllocation, SubjectAllocation.id == Assignment.subject_allocation_id)
        .filter(
            SubjectAllocation.section_id == student.current_section_id,
            Assignment.status == AssignmentStatus.PUBLISHED
        )
        .order_by(Assignment.due_date.asc())
        .all()
    )

    result = []
    for a in assignments:
        alloc = a.allocation
        sub = alloc.subject if alloc else None
        fac = alloc.faculty if alloc else None
        sec = alloc.section if alloc else None

        # Check if student submitted
        submission = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == a.id,
            AssignmentSubmission.student_id == student.id
        ).first()

        result.append(StudentAssignmentItemResponse(
            id=a.id,
            title=a.title,
            description=a.description,
            instructions=a.instructions,
            subject_code=sub.code if sub else "",
            subject_name=sub.name if sub else "",
            faculty_name=f"{fac.first_name} {fac.last_name}" if fac else "Staff",
            section_name=sec.name if sec else "",
            due_date=a.due_date,
            max_points=a.max_points,
            status=a.status,
            allow_late_submission=a.allow_late_submission,
            max_attempts=a.max_attempts,
            attachment_url=a.attachment_url,
            attachment_name=a.attachment_name,
            is_submitted=submission is not None,
            submission_status=submission.status if submission else None,
            submitted_at=submission.submitted_at if submission else None,
            obtained_marks=float(submission.obtained_marks) if submission and submission.obtained_marks is not None else None,
            feedback=submission.feedback if submission else None,
            attempt_number=submission.attempt_number if submission else 0,
        ))

    return result


@router.get("/{assignment_id}", response_model=AssignmentResponse, summary="Get assignment details")
def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    if current_user.role == UserRole.STUDENT and assignment.status != AssignmentStatus.PUBLISHED:
        raise PermissionDeniedException("This assignment is not accessible.")

    res = AssignmentResponse.model_validate(assignment)
    res.total_submissions_count = len(assignment.submissions)
    res.graded_submissions_count = sum(1 for s in assignment.submissions if s.status == SubmissionStatus.GRADED)
    return res


@router.put("/{assignment_id}", response_model=AssignmentResponse, summary="Update assignment")
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or assignment.allocation.faculty_id != faculty.id:
            raise PermissionDeniedException("You are not authorized to modify this assignment.")

    if payload.title is not None:
        assignment.title = payload.title.strip()
    if payload.description is not None:
        assignment.description = payload.description.strip()
    if payload.instructions is not None:
        assignment.instructions = payload.instructions.strip()
    if payload.attachment_url is not None:
        assignment.attachment_url = payload.attachment_url
    if payload.attachment_name is not None:
        assignment.attachment_name = payload.attachment_name
    if payload.due_date is not None:
        assignment.due_date = payload.due_date
    if payload.max_points is not None:
        assignment.max_points = payload.max_points
    if payload.status is not None:
        assignment.status = payload.status
    if payload.allow_late_submission is not None:
        assignment.allow_late_submission = payload.allow_late_submission
    if payload.max_attempts is not None:
        assignment.max_attempts = payload.max_attempts

    db.commit()
    db.refresh(assignment)

    res = AssignmentResponse.model_validate(assignment)
    res.total_submissions_count = len(assignment.submissions)
    res.graded_submissions_count = sum(1 for s in assignment.submissions if s.status == SubmissionStatus.GRADED)
    return res


@router.post("/{assignment_id}/publish", response_model=AssignmentResponse, summary="Publish assignment")
def publish_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    assignment.status = AssignmentStatus.PUBLISHED
    db.commit()
    db.refresh(assignment)
    return assignment


@router.post("/{assignment_id}/close", response_model=AssignmentResponse, summary="Close assignment")
def close_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    assignment.status = AssignmentStatus.CLOSED
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{assignment_id}", summary="Delete assignment")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or assignment.allocation.faculty_id != faculty.id:
            raise PermissionDeniedException("You are not authorized to delete this assignment.")

    db.delete(assignment)
    db.commit()
    return {"message": f"Assignment '{assignment.title}' deleted successfully."}


@router.get("/{assignment_id}/submissions", response_model=List[AssignmentSubmissionResponse], summary="Get assignment submissions (Faculty or Admin)")
def get_assignment_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or assignment.allocation.faculty_id != faculty.id:
            raise PermissionDeniedException("You are not authorized to view submissions for this assignment.")

    return assignment.submissions


@router.get("/{assignment_id}/statistics", response_model=AssignmentStatisticsResponse, summary="Get assignment submission statistics")
def get_assignment_statistics(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    alloc = assignment.allocation

    # Count total enrolled students in this section
    enrolled_count = (
        db.query(Student)
        .join(Enrollment, Enrollment.student_id == Student.id)
        .filter(Enrollment.section_id == alloc.section_id, Enrollment.status == EnrollmentStatus.ENROLLED)
        .count()
    )

    submissions = assignment.submissions
    submitted_count = len(submissions)
    late_count = sum(1 for s in submissions if s.status == SubmissionStatus.LATE)
    graded_count = sum(1 for s in submissions if s.status == SubmissionStatus.GRADED)
    pending_count = max(0, enrolled_count - submitted_count)

    graded_marks = [float(s.obtained_marks) for s in submissions if s.obtained_marks is not None]
    avg_marks = round(sum(graded_marks) / len(graded_marks), 1) if graded_marks else 0.0
    highest = max(graded_marks) if graded_marks else 0.0
    lowest = min(graded_marks) if graded_marks else 0.0

    return AssignmentStatisticsResponse(
        assignment_id=assignment.id,
        title=assignment.title,
        total_enrolled=enrolled_count,
        submitted_count=submitted_count,
        pending_count=pending_count,
        late_count=late_count,
        graded_count=graded_count,
        average_marks=avg_marks,
        highest_marks=highest,
        lowest_marks=lowest,
    )


@router.post("/{assignment_id}/submit", response_model=AssignmentSubmissionResponse, status_code=status.HTTP_201_CREATED, summary="Submit assignment (Student only)")
def submit_assignment(
    assignment_id: int,
    payload: AssignmentSubmissionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.STUDENT, UserRole.ADMIN]))
):
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise EntityNotFoundException("Student profile not found.")

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise EntityNotFoundException(f"Assignment with ID {assignment_id} not found.")

    if assignment.status != AssignmentStatus.PUBLISHED:
        raise BadRequestException("This assignment is not currently open for submissions.")

    # Check student section enrollment
    if student.current_section_id != assignment.allocation.section_id:
        raise PermissionDeniedException("You are not enrolled in the section for this assignment.")

    now = datetime.utcnow()
    is_late = now > assignment.due_date

    if is_late and not assignment.allow_late_submission:
        raise BadRequestException("Late submissions are not permitted for this assignment.")

    # Check existing submission
    existing = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == student.id
    ).first()

    submission_status = SubmissionStatus.LATE if is_late else SubmissionStatus.SUBMITTED

    if existing:
        if existing.attempt_number >= assignment.max_attempts:
            raise BadRequestException(f"Maximum attempt limit ({assignment.max_attempts}) reached.")
        existing.attempt_number += 1
        existing.submission_text = payload.submission_text
        existing.file_url = payload.file_url
        existing.file_name = payload.file_name
        existing.file_size = payload.file_size
        existing.status = submission_status
        existing.submitted_at = now
        existing.obtained_marks = None
        existing.feedback = None
        db.commit()
        db.refresh(existing)
        return existing
    else:
        submission = AssignmentSubmission(
            assignment_id=assignment_id,
            student_id=student.id,
            attempt_number=1,
            submission_text=payload.submission_text,
            file_url=payload.file_url,
            file_name=payload.file_name,
            file_size=payload.file_size,
            status=submission_status,
            submitted_at=now,
        )
        db.add(submission)
        db.commit()
        db.refresh(submission)
        return submission


@router.post("/submissions/{submission_id}/grade", response_model=AssignmentSubmissionResponse, summary="Grade assignment submission (Faculty or Admin)")
def grade_submission(
    submission_id: int,
    payload: AssignmentSubmissionGrade,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not submission:
        raise EntityNotFoundException(f"Submission with ID {submission_id} not found.")

    assignment = submission.assignment
    faculty_id = 1

    if current_user.role == UserRole.FACULTY:
        faculty = db.query(Faculty).filter(Faculty.user_id == current_user.id).first()
        if not faculty or assignment.allocation.faculty_id != faculty.id:
            raise PermissionDeniedException("You are not authorized to grade this assignment.")
        faculty_id = faculty.id
    elif current_user.role == UserRole.ADMIN:
        admin_fac = db.query(Faculty).first()
        if admin_fac:
            faculty_id = admin_fac.id

    if payload.obtained_marks < 0 or payload.obtained_marks > assignment.max_points:
        raise BadRequestException(f"Marks must be between 0 and {assignment.max_points}.")

    submission.obtained_marks = payload.obtained_marks
    submission.feedback = payload.feedback.strip() if payload.feedback else None
    submission.status = payload.status
    submission.graded_by_faculty_id = faculty_id
    submission.graded_at = datetime.utcnow()

    db.commit()
    db.refresh(submission)
    return submission


@router.post("/submissions/{submission_id}/return", response_model=AssignmentSubmissionResponse, summary="Return submission for rework (Faculty or Admin)")
def return_submission(
    submission_id: int,
    feedback: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.FACULTY, UserRole.ADMIN]))
):
    submission = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not submission:
        raise EntityNotFoundException(f"Submission with ID {submission_id} not found.")

    submission.status = SubmissionStatus.RETURNED
    if feedback:
        submission.feedback = feedback.strip()

    db.commit()
    db.refresh(submission)
    return submission
