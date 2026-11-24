import pytest
from fastapi.testclient import TestClient


def test_exam_lifecycle_marks_and_sgpa_calculation(client: TestClient, admin_auth_headers: dict):
    # 1. Setup Hierarchy
    dept = client.post("/api/v1/departments", json={"code": "EXAM_DEPT", "name": "Exam Dept"}, headers=admin_auth_headers).json()
    course = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_EX", "name": "B.Tech Exams"}, headers=admin_auth_headers).json()
    session = client.post("/api/v1/sessions", json={"name": "2025-2026-EX", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers).json()
    sem = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Sem 1"}, headers=admin_auth_headers).json()
    sec = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers).json()

    sub_cs = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "CS101", "name": "Computer Programming", "credits": 4.0, "semester_number": 1}, headers=admin_auth_headers).json()
    sub_ma = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "MA101", "name": "Engineering Mathematics", "credits": 4.0, "semester_number": 1}, headers=admin_auth_headers).json()

    # 2. Setup Faculty
    fac = client.post("/api/v1/faculty", json={
        "email": "prof.knuth@college.edu", "username": "knuth", "password": "FacultyPass@123",
        "department_id": dept["id"], "employee_code": "FAC-EX-01", "first_name": "Donald",
        "last_name": "Knuth", "designation": "Professor", "joining_date": "2020-01-01"
    }, headers=admin_auth_headers).json()

    # 3. Setup Student
    stu = client.post("/api/v1/students", json={
        "email": "ada@student.college.edu", "username": "adalovelace", "password": "StudentPass@123",
        "department_id": dept["id"], "course_id": course["id"], "admission_session_id": session["id"],
        "enrollment_number": "ENR2025EX01", "roll_number": "25EX01", "first_name": "Ada",
        "last_name": "Lovelace", "admission_date": "2025-08-10",
        "current_semester_id": sem["id"], "current_section_id": sec["id"]
    }, headers=admin_auth_headers).json()

    # 4. Allocate Subjects
    client.post("/api/v1/allocations", json={"faculty_id": fac["id"], "subject_id": sub_cs["id"], "section_id": sec["id"], "academic_session_id": session["id"]}, headers=admin_auth_headers)
    client.post("/api/v1/allocations", json={"faculty_id": fac["id"], "subject_id": sub_ma["id"], "section_id": sec["id"], "academic_session_id": session["id"]}, headers=admin_auth_headers)

    # 5. Create Examination (Admin)
    exam_payload = {
        "academic_session_id": session["id"],
        "semester_id": sem["id"],
        "name": "Mid-Term Examination Fall 2025",
        "exam_type": "MID_TERM",
        "status": "DRAFT",
        "start_date": "2025-10-15",
        "end_date": "2025-10-25",
        "is_published": False
    }
    exam = client.post("/api/v1/exams", json=exam_payload, headers=admin_auth_headers).json()
    exam_id = exam["id"]

    # 6. Add Exam Subject Schedules
    sch_cs = client.post(f"/api/v1/exams/{exam_id}/schedules", json={
        "exam_id": exam_id,
        "subject_id": sub_cs["id"],
        "exam_date": "2025-10-16",
        "start_time": "10:00:00",
        "end_time": "13:00:00",
        "max_marks": 100,
        "passing_marks": 40
    }, headers=admin_auth_headers).json()

    sch_ma = client.post(f"/api/v1/exams/{exam_id}/schedules", json={
        "exam_id": exam_id,
        "subject_id": sub_ma["id"],
        "exam_date": "2025-10-18",
        "start_time": "10:00:00",
        "end_time": "13:00:00",
        "max_marks": 100,
        "passing_marks": 40
    }, headers=admin_auth_headers).json()

    # 7. Faculty enters marks
    login_fac = client.post("/api/v1/auth/login", json={"username_or_email": "knuth", "password": "FacultyPass@123"}).json()
    fac_headers = {"Authorization": f"Bearer {login_fac['access_token']}"}

    # CS101: 95 marks -> Grade A+ (10.0 GP)
    client.post("/api/v1/marks/bulk-save", json={
        "exam_schedule_id": sch_cs["id"],
        "is_finalized": True,
        "marks": [{"student_id": stu["id"], "marks_obtained": 95.0, "remarks": "Outstanding code"}]
    }, headers=fac_headers)

    # MA101: 85 marks -> Grade A (9.0 GP)
    client.post("/api/v1/marks/bulk-save", json={
        "exam_schedule_id": sch_ma["id"],
        "is_finalized": True,
        "marks": [{"student_id": stu["id"], "marks_obtained": 85.0, "remarks": "Excellent proofs"}]
    }, headers=fac_headers)

    # 8. Test Student cannot view results while UNPUBLISHED
    login_stu = client.post("/api/v1/auth/login", json={"username_or_email": "adalovelace", "password": "StudentPass@123"}).json()
    stu_headers = {"Authorization": f"Bearer {login_stu['access_token']}"}

    unpub_results = client.get("/api/v1/marks/my-results", headers=stu_headers).json()
    assert len(unpub_results) == 0

    # 9. Admin Publishes Results
    publish_res = client.post(f"/api/v1/exams/{exam_id}/publish", headers=admin_auth_headers)
    assert publish_res.status_code == 200
    assert publish_res.json()["is_published"] is True

    # 10. Student now views published report card
    pub_results = client.get("/api/v1/marks/my-results", headers=stu_headers).json()
    assert len(pub_results) == 1
    report = pub_results[0]
    assert report["exam_name"] == "Mid-Term Examination Fall 2025"
    assert report["total_obtained_marks"] == 180.0
    assert report["total_max_marks"] == 200.0
    assert report["overall_percentage"] == 90.0
    # SGPA: (4*10 + 4*9) / 8 = 76 / 8 = 9.5
    assert report["sgpa"] == 9.5
    assert report["result_status"] == "PASS"
    assert len(report["subjects"]) == 2

    # 11. Test Marks Validation (cannot exceed max_marks)
    exceed_res = client.post("/api/v1/marks/bulk-save", json={
        "exam_schedule_id": sch_cs["id"],
        "marks": [{"student_id": stu["id"], "marks_obtained": 150.0}]
    }, headers=admin_auth_headers)
    assert exceed_res.status_code == 400
