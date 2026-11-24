import pytest
from fastapi.testclient import TestClient


def test_attendance_marking_updating_and_calculations(client: TestClient, admin_auth_headers: dict):
    # 1. Setup Hierarchy
    dept = client.post("/api/v1/departments", json={"code": "ATT_DEPT", "name": "Attendance Dept"}, headers=admin_auth_headers).json()
    course = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_ATT", "name": "B.Tech Attendance"}, headers=admin_auth_headers).json()
    session = client.post("/api/v1/sessions", json={"name": "2025-2026-ATT", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers).json()
    sem = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Sem 1"}, headers=admin_auth_headers).json()
    sec = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers).json()
    sub = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "ATT101", "name": "Algorithms", "semester_number": 1}, headers=admin_auth_headers).json()

    # 2. Setup Faculty
    faculty_payload = {
        "email": "prof.alan@college.edu",
        "username": "profalan",
        "password": "FacultyPassword@123",
        "department_id": dept["id"],
        "employee_code": "FAC-ATT-01",
        "first_name": "Alan",
        "last_name": "Turing",
        "designation": "Professor",
        "joining_date": "2021-01-01"
    }
    fac = client.post("/api/v1/faculty", json=faculty_payload, headers=admin_auth_headers).json()
    faculty_id = fac["id"]

    # 3. Setup 2 Students
    stu1_payload = {
        "email": "alice@student.college.edu",
        "username": "alicestu",
        "password": "StudentPass@123",
        "department_id": dept["id"],
        "course_id": course["id"],
        "admission_session_id": session["id"],
        "enrollment_number": "ENR2025ATT01",
        "roll_number": "25ATT01",
        "first_name": "Alice",
        "last_name": "Wonder",
        "admission_date": "2025-08-10",
        "current_semester_id": sem["id"],
        "current_section_id": sec["id"],
    }
    stu1 = client.post("/api/v1/students", json=stu1_payload, headers=admin_auth_headers).json()

    stu2_payload = {
        "email": "bob@student.college.edu",
        "username": "bobstu",
        "password": "StudentPass@123",
        "department_id": dept["id"],
        "course_id": course["id"],
        "admission_session_id": session["id"],
        "enrollment_number": "ENR2025ATT02",
        "roll_number": "25ATT02",
        "first_name": "Bob",
        "last_name": "Builder",
        "admission_date": "2025-08-10",
        "current_semester_id": sem["id"],
        "current_section_id": sec["id"],
    }
    stu2 = client.post("/api/v1/students", json=stu2_payload, headers=admin_auth_headers).json()

    # 4. Allocate Subject to Faculty
    alloc_payload = {
        "faculty_id": faculty_id,
        "subject_id": sub["id"],
        "section_id": sec["id"],
        "academic_session_id": session["id"],
        "is_active": True
    }
    alloc = client.post("/api/v1/allocations", json=alloc_payload, headers=admin_auth_headers).json()
    alloc_id = alloc["id"]

    # 5. Log in as Faculty
    login_fac = client.post("/api/v1/auth/login", json={"username_or_email": "profalan", "password": "FacultyPassword@123"}).json()
    fac_headers = {"Authorization": f"Bearer {login_fac['access_token']}"}

    # 6. Faculty gets roster for marking
    roster_res = client.get(f"/api/v1/attendance/students-for-allocation/{alloc_id}?session_date=2025-09-01", headers=fac_headers)
    assert roster_res.status_code == 200
    assert len(roster_res.json()["students"]) == 2

    # 7. Faculty marks attendance for 2025-09-01 (Alice = PRESENT, Bob = ABSENT)
    session_payload = {
        "subject_allocation_id": alloc_id,
        "session_date": "2025-09-01",
        "topic_covered": "Introduction to Graphs",
        "records": [
            {"student_id": stu1["id"], "status": "PRESENT", "remarks": "Active in class"},
            {"student_id": stu2["id"], "status": "ABSENT", "remarks": "Unexcused"}
        ]
    }
    save_res = client.post("/api/v1/attendance/sessions", json=session_payload, headers=fac_headers)
    assert save_res.status_code == 201
    assert len(save_res.json()["records"]) == 2

    # 8. Faculty marks 2nd session on 2025-09-02 (Alice = PRESENT, Bob = LATE)
    session_payload_2 = {
        "subject_allocation_id": alloc_id,
        "session_date": "2025-09-02",
        "topic_covered": "Graph Traversals BFS/DFS",
        "records": [
            {"student_id": stu1["id"], "status": "PRESENT"},
            {"student_id": stu2["id"], "status": "LATE", "remarks": "15 mins late"}
        ]
    }
    client.post("/api/v1/attendance/sessions", json=session_payload_2, headers=fac_headers)

    # 9. Test Student 1 (Alice) views own attendance (2/2 Present = 100.0%)
    login_alice = client.post("/api/v1/auth/login", json={"username_or_email": "alicestu", "password": "StudentPass@123"}).json()
    alice_headers = {"Authorization": f"Bearer {login_alice['access_token']}"}

    alice_att = client.get("/api/v1/attendance/my-attendance", headers=alice_headers).json()
    assert alice_att["overall_percentage"] == 100.0
    assert alice_att["is_below_threshold"] is False

    # 10. Test Student 2 (Bob) views own attendance (0 Present, 1 Absent, 1 Late = (0.5)/2 = 25.0% -> Below 75% threshold!)
    login_bob = client.post("/api/v1/auth/login", json={"username_or_email": "bobstu", "password": "StudentPass@123"}).json()
    bob_headers = {"Authorization": f"Bearer {login_bob['access_token']}"}

    bob_att = client.get("/api/v1/attendance/my-attendance", headers=bob_headers).json()
    assert bob_att["overall_percentage"] == 25.0
    assert bob_att["is_below_threshold"] is True

    # 11. Test Section Attendance Compliance Report
    sec_report = client.get(f"/api/v1/attendance/reports/section/{sec['id']}", headers=admin_auth_headers).json()
    assert len(sec_report) == 1
    assert sec_report[0]["total_sessions_held"] == 2
    assert sec_report[0]["students_below_threshold_count"] == 1  # Bob is below threshold
