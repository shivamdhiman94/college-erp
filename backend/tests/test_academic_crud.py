import pytest
from fastapi.testclient import TestClient


def test_department_full_crud_and_validation(client: TestClient, admin_auth_headers: dict, student_auth_headers: dict):
    # 1. Create Department
    create_res = client.post(
        "/api/v1/departments",
        json={"code": "IT", "name": "Information Technology", "description": "Dept of IT"},
        headers=admin_auth_headers
    )
    assert create_res.status_code == 201
    dept_id = create_res.json()["id"]
    assert create_res.json()["code"] == "IT"

    # 2. Duplicate rejection
    dup_res = client.post(
        "/api/v1/departments",
        json={"code": "IT", "name": "Duplicate IT", "description": "Dup"},
        headers=admin_auth_headers
    )
    assert dup_res.status_code == 400

    # 3. RBAC Student cannot create
    student_res = client.post(
        "/api/v1/departments",
        json={"code": "EE", "name": "Electrical", "description": "EE"},
        headers=student_auth_headers
    )
    assert student_res.status_code == 403

    # 4. Update
    update_res = client.put(
        f"/api/v1/departments/{dept_id}",
        json={"name": "Information Technology & Analytics"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Information Technology & Analytics"

    # 5. Get
    get_res = client.get(f"/api/v1/departments/{dept_id}", headers=admin_auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Information Technology & Analytics"


def test_course_crud_and_department_link(client: TestClient, admin_auth_headers: dict):
    # Create Dept
    dept = client.post(
        "/api/v1/departments",
        json={"code": "CIVIL", "name": "Civil Engineering"},
        headers=admin_auth_headers
    ).json()

    # Create Course
    course_payload = {
        "department_id": dept["id"],
        "code": "BTECH_CIVIL",
        "name": "B.Tech Civil Engineering",
        "duration_years": 4,
        "total_semesters": 8,
        "is_active": True
    }
    create_res = client.post("/api/v1/courses", json=course_payload, headers=admin_auth_headers)
    assert create_res.status_code == 201
    course_id = create_res.json()["id"]
    assert create_res.json()["code"] == "BTECH_CIVIL"

    # Duplicate course code check
    dup_res = client.post("/api/v1/courses", json=course_payload, headers=admin_auth_headers)
    assert dup_res.status_code == 400

    # Invalid department foreign key check
    invalid_dept_res = client.post(
        "/api/v1/courses",
        json={**course_payload, "code": "BTECH_CIVIL_2", "department_id": 99999},
        headers=admin_auth_headers
    )
    assert invalid_dept_res.status_code == 404

    # Update course
    update_res = client.put(
        f"/api/v1/courses/{course_id}",
        json={"name": "Bachelor of Technology in Civil Engineering"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Bachelor of Technology in Civil Engineering"


def test_academic_session_exclusivity(client: TestClient, admin_auth_headers: dict):
    # Create Session 1 (Active)
    s1 = client.post(
        "/api/v1/sessions",
        json={"name": "2024-2025", "start_date": "2024-08-01", "end_date": "2025-06-30", "is_current": True},
        headers=admin_auth_headers
    ).json()
    assert s1["is_current"] is True

    # Create Session 2 (Active) -> Session 1 should become inactive
    s2 = client.post(
        "/api/v1/sessions",
        json={"name": "2025-2026-MAIN", "start_date": "2025-08-01", "end_date": "2026-06-30", "is_current": True},
        headers=admin_auth_headers
    ).json()
    assert s2["is_current"] is True

    # Verify Session 1 is now is_current=False
    s1_check = client.get(f"/api/v1/sessions/{s1['id']}", headers=admin_auth_headers).json()
    assert s1_check["is_current"] is False

    # Set Session 1 back to current via set-current endpoint
    client.post(f"/api/v1/sessions/{s1['id']}/set-current", headers=admin_auth_headers)
    s1_check_again = client.get(f"/api/v1/sessions/{s1['id']}", headers=admin_auth_headers).json()
    s2_check_again = client.get(f"/api/v1/sessions/{s2['id']}", headers=admin_auth_headers).json()
    assert s1_check_again["is_current"] is True
    assert s2_check_again["is_current"] is False


def test_semester_and_section_hierarchy(client: TestClient, admin_auth_headers: dict):
    # Setup Dept, Course, Session
    dept = client.post("/api/v1/departments", json={"code": "AI", "name": "Artificial Intelligence"}, headers=admin_auth_headers).json()
    course = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_AI", "name": "B.Tech AI"}, headers=admin_auth_headers).json()
    session = client.post("/api/v1/sessions", json={"name": "2025-2026-AI", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers).json()

    # Create Semester 1
    sem_payload = {
        "course_id": course["id"],
        "academic_session_id": session["id"],
        "semester_number": 1,
        "name": "AI Semester 1",
        "start_date": "2025-08-01",
        "end_date": "2025-12-31"
    }
    sem = client.post("/api/v1/semesters", json=sem_payload, headers=admin_auth_headers).json()
    assert sem["id"] is not None
    assert sem["semester_number"] == 1

    # Duplicate semester rejection
    dup_sem = client.post("/api/v1/semesters", json=sem_payload, headers=admin_auth_headers)
    assert dup_sem.status_code == 400

    # Create Section A
    sec_a = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers).json()
    assert sec_a["name"] == "A"

    # Duplicate section in same semester rejection
    dup_sec = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers)
    assert dup_sec.status_code == 400

    # Create Section B in same semester succeeds
    sec_b = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "B", "capacity": 60}, headers=admin_auth_headers)
    assert sec_b.status_code == 201


def test_subject_crud_and_filters(client: TestClient, admin_auth_headers: dict):
    # Setup Dept and Course
    dept = client.post("/api/v1/departments", json={"code": "BIO", "name": "Biotech"}, headers=admin_auth_headers).json()
    course = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_BIO", "name": "B.Tech Biotech"}, headers=admin_auth_headers).json()

    # Create Subject
    sub_payload = {
        "course_id": course["id"],
        "department_id": dept["id"],
        "code": "BT101",
        "name": "Cell Biology",
        "semester_number": 1,
        "type": "THEORY",
        "credits": 4.0,
        "max_marks": 100,
        "passing_marks": 40
    }
    sub = client.post("/api/v1/subjects", json=sub_payload, headers=admin_auth_headers).json()
    assert sub["id"] is not None
    assert sub["code"] == "BT101"

    # Filter subjects by course
    list_res = client.get(f"/api/v1/subjects?course_id={course['id']}", headers=admin_auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 1


def test_admin_dashboard_stats_api(client: TestClient, admin_auth_headers: dict):
    stats_res = client.get("/api/v1/dashboard/admin", headers=admin_auth_headers)
    assert stats_res.status_code == 200
    data = stats_res.json()
    assert "total_departments" in data
    assert "total_courses" in data
    assert "total_subjects" in data
    assert "total_sessions" in data
    assert "total_sections" in data
