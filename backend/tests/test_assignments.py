import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient


def test_assignment_workflow_submission_and_grading(client: TestClient, admin_auth_headers: dict):
    # 1. Setup Hierarchy
    dept = client.post("/api/v1/departments", json={"code": "ASG_DEPT", "name": "Assignment Dept"}, headers=admin_auth_headers).json()
    course = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_ASG", "name": "B.Tech Assignment"}, headers=admin_auth_headers).json()
    session = client.post("/api/v1/sessions", json={"name": "2025-2026-ASG", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers).json()
    sem = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Sem 1"}, headers=admin_auth_headers).json()
    sec = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers).json()
    sub = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "ASG101", "name": "Data Structures", "credits": 4.0, "semester_number": 1}, headers=admin_auth_headers).json()

    # 2. Setup Faculty
    fac = client.post("/api/v1/faculty", json={
        "email": "prof.dijkstra@college.edu", "username": "dijkstra", "password": "FacultyPass@123",
        "department_id": dept["id"], "employee_code": "FAC-ASG-01", "first_name": "Edsger",
        "last_name": "Dijkstra", "designation": "Professor", "joining_date": "2020-01-01"
    }, headers=admin_auth_headers).json()

    # 3. Setup Student
    stu = client.post("/api/v1/students", json={
        "email": "linus@student.college.edu", "username": "linustorvalds", "password": "StudentPass@123",
        "department_id": dept["id"], "course_id": course["id"], "admission_session_id": session["id"],
        "enrollment_number": "ENR2025ASG01", "roll_number": "25ASG01", "first_name": "Linus",
        "last_name": "Torvalds", "admission_date": "2025-08-10",
        "current_semester_id": sem["id"], "current_section_id": sec["id"]
    }, headers=admin_auth_headers).json()

    # 4. Allocate Subject to Faculty
    alloc = client.post("/api/v1/allocations", json={"faculty_id": fac["id"], "subject_id": sub["id"], "section_id": sec["id"], "academic_session_id": session["id"]}, headers=admin_auth_headers).json()
    alloc_id = alloc["id"]

    # 5. Faculty Log in
    login_fac = client.post("/api/v1/auth/login", json={"username_or_email": "dijkstra", "password": "FacultyPass@123"}).json()
    fac_headers = {"Authorization": f"Bearer {login_fac['access_token']}"}

    # 6. Faculty creates Assignment
    future_due = (datetime.utcnow() + timedelta(days=7)).isoformat()
    asg_payload = {
        "subject_allocation_id": alloc_id,
        "title": "Lab Assignment 1: Binary Search Trees",
        "description": "Implement an AVL self-balancing search tree in C++ or Python.",
        "instructions": "Submit zip archive containing source code and benchmarks.",
        "due_date": future_due,
        "max_points": 50,
        "status": "PUBLISHED",
        "allow_late_submission": True,
        "max_attempts": 2
    }
    asg_res = client.post("/api/v1/assignments", json=asg_payload, headers=fac_headers)
    assert asg_res.status_code == 201
    asg_id = asg_res.json()["id"]

    # 7. Student logs in & views coursework
    login_stu = client.post("/api/v1/auth/login", json={"username_or_email": "linustorvalds", "password": "StudentPass@123"}).json()
    stu_headers = {"Authorization": f"Bearer {login_stu['access_token']}"}

    my_asgs = client.get("/api/v1/assignments/student/my-assignments", headers=stu_headers).json()
    assert len(my_asgs) == 1
    assert my_asgs[0]["title"] == "Lab Assignment 1: Binary Search Trees"
    assert my_asgs[0]["is_submitted"] is False

    # 8. Student submits coursework
    submit_payload = {
        "submission_text": "Implemented AVL Tree with O(log n) rotations and unit tests.",
        "file_name": "bst_solution.zip",
        "file_url": "/uploads/assignments/bst_solution.zip",
        "file_size": 24000
    }
    sub_res = client.post(f"/api/v1/assignments/{asg_id}/submit", json=submit_payload, headers=stu_headers)
    assert sub_res.status_code == 201
    submission_id = sub_res.json()["id"]
    assert sub_res.json()["status"] == "SUBMITTED"

    # 9. Faculty reviews submissions & grades student
    subs_list = client.get(f"/api/v1/assignments/{asg_id}/submissions", headers=fac_headers).json()
    assert len(subs_list) == 1

    grade_payload = {
        "obtained_marks": 48.5,
        "feedback": "Flawless rotation implementations and clean complexity analysis.",
        "status": "GRADED"
    }
    grade_res = client.post(f"/api/v1/assignments/submissions/{submission_id}/grade", json=grade_payload, headers=fac_headers)
    assert grade_res.status_code == 200
    assert float(grade_res.json()["obtained_marks"]) == 48.5

    # 10. Student checks graded assignment
    my_asgs_after = client.get("/api/v1/assignments/student/my-assignments", headers=stu_headers).json()
    assert my_asgs_after[0]["is_submitted"] is True
    assert my_asgs_after[0]["submission_status"] == "GRADED"
    assert my_asgs_after[0]["obtained_marks"] == 48.5
    assert my_asgs_after[0]["feedback"] == "Flawless rotation implementations and clean complexity analysis."

    # 11. Assignment statistics check
    stats_res = client.get(f"/api/v1/assignments/{asg_id}/statistics", headers=fac_headers).json()
    assert stats_res["submitted_count"] == 1
    assert stats_res["graded_count"] == 1
    assert stats_res["average_marks"] == 48.5
