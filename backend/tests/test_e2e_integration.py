import pytest
from datetime import datetime, date, time, timedelta
from fastapi.testclient import TestClient


def test_complete_college_erp_e2e_workflow_and_security_audit(client: TestClient, admin_auth_headers: dict):
    # =========================================================================
    # 1. ADMIN INITIAL SETUP & HIERARCHY WORKFLOW
    # =========================================================================
    # Verify Admin Dashboard Metrics
    admin_dash = client.get("/api/v1/dashboard/admin", headers=admin_auth_headers).json()
    assert "total_students" in admin_dash
    assert "total_faculty" in admin_dash

    # Create new department & course
    dept = client.post("/api/v1/departments", json={"code": "AI_DS", "name": "Artificial Intelligence & Data Science"}, headers=admin_auth_headers).json()
    assert dept["code"] == "AI_DS"

    course = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_AIDS", "name": "B.Tech in AI & Data Science", "duration_years": 4, "total_semesters": 8}, headers=admin_auth_headers).json()
    session = client.post("/api/v1/sessions", json={"name": "2025-2026-AIDS", "start_date": "2025-08-01", "end_date": "2026-06-30", "is_current": False}, headers=admin_auth_headers).json()
    sem = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Semester 1"}, headers=admin_auth_headers).json()
    sec = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers).json()
    sub = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "AI101", "name": "Foundations of AI", "credits": 4.0, "semester_number": 1}, headers=admin_auth_headers).json()

    # Create Faculty & Student
    fac = client.post("/api/v1/faculty", json={
        "email": "prof.turing@college.edu", "username": "profturing", "password": "FacultyPassword@123",
        "department_id": dept["id"], "employee_code": "FAC-AI-001", "first_name": "Alan",
        "last_name": "Turing", "designation": "Distinguished Professor", "joining_date": "2020-01-01"
    }, headers=admin_auth_headers).json()

    stu = client.post("/api/v1/students", json={
        "email": "john.vonneumann@student.college.edu", "username": "vonneumann", "password": "StudentPassword@123",
        "department_id": dept["id"], "course_id": course["id"], "admission_session_id": session["id"],
        "enrollment_number": "ENR2025AI001", "roll_number": "25AI01", "first_name": "John",
        "last_name": "von Neumann", "admission_date": "2025-08-10",
        "current_semester_id": sem["id"], "current_section_id": sec["id"]
    }, headers=admin_auth_headers).json()

    alloc = client.post("/api/v1/allocations", json={
        "faculty_id": fac["id"], "subject_id": sub["id"], "section_id": sec["id"], "academic_session_id": session["id"]
    }, headers=admin_auth_headers).json()

    # =========================================================================
    # 2. FACULTY WORKFLOW (Alan Turing)
    # =========================================================================
    login_fac = client.post("/api/v1/auth/login", json={
        "username_or_email": "profturing",
        "password": "FacultyPassword@123"
    }).json()
    fac_headers = {"Authorization": f"Bearer {login_fac['access_token']}"}

    # Faculty Profile & Allocations
    fac_profile = client.get("/api/v1/faculty/me/profile", headers=fac_headers).json()
    assert fac_profile["employee_code"] == "FAC-AI-001"

    my_allocs = client.get("/api/v1/allocations/my-allocations", headers=fac_headers).json()
    assert len(my_allocs) == 1
    assert my_allocs[0]["subject"]["code"] == "AI101"

    # Mark Attendance
    att_res = client.post("/api/v1/attendance/sessions", json={
        "subject_allocation_id": alloc["id"],
        "session_date": "2025-09-02",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "topic_covered": "Turing Machines & Computability",
        "records": [{"student_id": stu["id"], "status": "PRESENT"}]
    }, headers=fac_headers)
    assert att_res.status_code == 201

    # Create Coursework Assignment
    due_dt = (datetime.utcnow() + timedelta(days=5)).isoformat()
    asg = client.post("/api/v1/assignments", json={
        "subject_allocation_id": alloc["id"],
        "title": "Problem Set 1: Universal Turing Machine",
        "description": "Design a state transition table for unary addition.",
        "due_date": due_dt,
        "max_points": 50,
        "status": "PUBLISHED",
        "allow_late_submission": True,
        "max_attempts": 2
    }, headers=fac_headers).json()
    asg_id = asg["id"]

    # =========================================================================
    # 3. STUDENT WORKFLOW (John von Neumann)
    # =========================================================================
    login_stu = client.post("/api/v1/auth/login", json={
        "username_or_email": "vonneumann",
        "password": "StudentPassword@123"
    }).json()
    stu_headers = {"Authorization": f"Bearer {login_stu['access_token']}"}

    # Student Profile & Attendance
    stu_profile = client.get("/api/v1/students/me/profile", headers=stu_headers).json()
    assert stu_profile["roll_number"] == "25AI01"

    stu_att = client.get("/api/v1/attendance/my-attendance", headers=stu_headers).json()
    assert stu_att["overall_percentage"] == 100.0
    assert stu_att["is_below_threshold"] is False

    # Student views & turns in assignment
    my_asgs = client.get("/api/v1/assignments/student/my-assignments", headers=stu_headers).json()
    assert len(my_asgs) == 1
    assert my_asgs[0]["title"] == "Problem Set 1: Universal Turing Machine"

    submit_res = client.post(f"/api/v1/assignments/{asg_id}/submit", json={
        "submission_text": "Universal Turing Machine state transitions and proof.",
        "file_name": "von_neumann_utm.pdf",
        "file_url": "/uploads/assignments/utm.pdf"
    }, headers=stu_headers).json()
    assert submit_res["status"] == "SUBMITTED"
    submission_id = submit_res["id"]

    # =========================================================================
    # 4. FACULTY GRADES & EVALUATES SUBMISSION
    # =========================================================================
    grade_res = client.post(f"/api/v1/assignments/submissions/{submission_id}/grade", json={
        "obtained_marks": 50.0,
        "feedback": "Flawless state transition formulation.",
        "status": "GRADED"
    }, headers=fac_headers).json()
    assert grade_res["obtained_marks"] == 50.0

    # Student checks graded assignment
    my_asgs_after = client.get("/api/v1/assignments/student/my-assignments", headers=stu_headers).json()
    assert my_asgs_after[0]["submission_status"] == "GRADED"
    assert my_asgs_after[0]["obtained_marks"] == 50.0

    # =========================================================================
    # 5. EXAMINATION, MARKS & OFFICIAL SGPA REPORT
    # =========================================================================
    exam = client.post("/api/v1/exams", json={
        "academic_session_id": session["id"],
        "semester_id": sem["id"],
        "name": "End Semester Exam Spring 2026",
        "exam_type": "END_TERM",
        "status": "DRAFT",
        "start_date": "2026-05-01",
        "end_date": "2026-05-15",
        "is_published": False
    }, headers=admin_auth_headers).json()

    sch = client.post(f"/api/v1/exams/{exam['id']}/schedules", json={
        "exam_id": exam["id"],
        "subject_id": sub["id"],
        "exam_date": "2026-05-05",
        "start_time": "10:00:00",
        "end_time": "13:00:00",
        "max_marks": 100,
        "passing_marks": 40
    }, headers=admin_auth_headers).json()

    # Faculty enters marks: 98 marks -> A+ (10.0 GP)
    client.post("/api/v1/marks/bulk-save", json={
        "exam_schedule_id": sch["id"],
        "is_finalized": True,
        "marks": [{"student_id": stu["id"], "marks_obtained": 98.0, "remarks": "Outstanding performance"}]
    }, headers=fac_headers)

    # Publish Exam
    client.post(f"/api/v1/exams/{exam['id']}/publish", headers=admin_auth_headers)

    # Student views official published report card
    results = client.get("/api/v1/marks/my-results", headers=stu_headers).json()
    assert len(results) == 1
    assert results[0]["sgpa"] == 10.0
    assert results[0]["overall_percentage"] == 98.0
    assert results[0]["result_status"] == "PASS"

    # =========================================================================
    # 6. NOTICE BROADCAST & READ STATUS
    # =========================================================================
    notice = client.post("/api/v1/notices", json={
        "title": "Campus AI Symposium 2026",
        "summary": "Keynote on Neural Architectures.",
        "content": "Join us in the auditorium for the annual AI symposium.",
        "notice_type": "EVENT",
        "priority": "HIGH",
        "status": "PUBLISHED",
        "target_type": "ALL",
        "is_pinned": True
    }, headers=admin_auth_headers).json()

    # Student reads notice
    stu_notices = client.get("/api/v1/notices", headers=stu_headers).json()
    assert any(n["title"] == "Campus AI Symposium 2026" for n in stu_notices)

    # =========================================================================
    # 7. SECURITY & RBAC ISOLATION AUDIT
    # =========================================================================
    # Student CANNOT access Admin User Management
    user_mgmt_res = client.get("/api/v1/users", headers=stu_headers)
    assert user_mgmt_res.status_code == 403

    # Student CANNOT create departments
    create_dept_res = client.post("/api/v1/departments", json={"code": "HACK", "name": "Hacked"}, headers=stu_headers)
    assert create_dept_res.status_code == 403

    # Student CANNOT grade assignments
    hack_grade_res = client.post(f"/api/v1/assignments/submissions/{submission_id}/grade", json={"obtained_marks": 100.0}, headers=stu_headers)
    assert hack_grade_res.status_code == 403

    # Unauthenticated request MUST be rejected
    unauth_res = client.get("/api/v1/students")
    assert unauth_res.status_code == 401
