from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_active_user, require_roles
from app.models.user import User, UserRole
from app.models.student import Student, StudentStatus
from app.models.faculty import Faculty
from app.models.academic import Department, Course, Subject, AcademicSession, Section, SubjectAllocation

router = APIRouter()


@router.get("/admin", summary="Get real-time database counts for Admin Dashboard")
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.ADMIN]))
):
    total_students = db.query(Student).count()
    active_students = db.query(Student).filter(Student.status == StudentStatus.ACTIVE).count()
    
    total_faculty = db.query(Faculty).count()
    active_faculty = total_faculty # all registered faculty in table

    total_departments = db.query(Department).count()
    total_courses = db.query(Course).count()
    total_subjects = db.query(Subject).count()
    total_sessions = db.query(AcademicSession).count()
    total_sections = db.query(Section).count()
    total_allocations = db.query(SubjectAllocation).filter(SubjectAllocation.is_active == True).count()

    current_session = db.query(AcademicSession).filter(AcademicSession.is_current == True).first()

    return {
        "total_students": total_students,
        "active_students": active_students,
        "total_faculty": total_faculty,
        "active_faculty": active_faculty,
        "total_departments": total_departments,
        "total_courses": total_courses,
        "total_subjects": total_subjects,
        "total_sessions": total_sessions,
        "total_sections": total_sections,
        "total_allocations": total_allocations,
        "current_session_name": current_session.name if current_session else "None configured",
    }
