from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    departments,
    courses,
    sessions,
    semesters,
    sections,
    subjects,
    students,
    faculty,
    allocations,
    attendance,
    rooms,
    timetable,
    exams,
    marks,
    assignments,
    notices,
    dashboard,
    ws,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(departments.router, prefix="/departments", tags=["Departments"])
api_router.include_router(courses.router, prefix="/courses", tags=["Courses"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["Academic Sessions"])
api_router.include_router(semesters.router, prefix="/semesters", tags=["Semesters"])
api_router.include_router(sections.router, prefix="/sections", tags=["Sections"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["Subjects"])
api_router.include_router(students.router, prefix="/students", tags=["Students"])
api_router.include_router(faculty.router, prefix="/faculty", tags=["Faculty"])
api_router.include_router(allocations.router, prefix="/allocations", tags=["Subject Allocations"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(rooms.router, prefix="/rooms", tags=["Rooms"])
api_router.include_router(timetable.router, prefix="/timetable", tags=["Timetable & Scheduling"])
api_router.include_router(exams.router, prefix="/exams", tags=["Examinations"])
api_router.include_router(marks.router, prefix="/marks", tags=["Marks & Results"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["Assignments & Coursework"])
api_router.include_router(notices.router, prefix="/notices", tags=["Notice Board"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(ws.router, tags=["Real-Time WebSockets"])
