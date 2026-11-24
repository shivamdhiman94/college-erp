import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient


def test_notice_creation_targeting_and_read_status(client: TestClient, admin_auth_headers: dict):
    # 1. Setup Department & Student
    dept_cs = client.post("/api/v1/departments", json={"code": "NOTICE_CS", "name": "Computer Science Notice"}, headers=admin_auth_headers).json()
    dept_ee = client.post("/api/v1/departments", json={"code": "NOTICE_EE", "name": "Electrical Dept"}, headers=admin_auth_headers).json()
    course = client.post("/api/v1/courses", json={"department_id": dept_cs["id"], "code": "BTECH_NTC", "name": "B.Tech CS"}, headers=admin_auth_headers).json()
    session = client.post("/api/v1/sessions", json={"name": "2025-2026-NTC", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers).json()
    sem = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Sem 1"}, headers=admin_auth_headers).json()
    sec = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers).json()

    stu = client.post("/api/v1/students", json={
        "email": "grace@student.college.edu", "username": "gracehopper", "password": "StudentPass@123",
        "department_id": dept_cs["id"], "course_id": course["id"], "admission_session_id": session["id"],
        "enrollment_number": "ENR2025NTC01", "roll_number": "25NTC01", "first_name": "Grace",
        "last_name": "Hopper", "admission_date": "2025-08-10",
        "current_semester_id": sem["id"], "current_section_id": sec["id"]
    }, headers=admin_auth_headers).json()

    # 2. Admin creates Campus-wide Urgent Notice
    n1 = client.post("/api/v1/notices", json={
        "title": "Campus Closed Tomorrow for National Holiday",
        "summary": "All academic classes and offices will remain closed.",
        "content": "Due to the national holiday, all lectures, lab sessions, and administrative offices are suspended for tomorrow.",
        "notice_type": "HOLIDAY",
        "priority": "URGENT",
        "status": "PUBLISHED",
        "target_type": "ALL",
        "is_pinned": True
    }, headers=admin_auth_headers).json()

    # 3. Admin creates CS-Department specific notice
    n2 = client.post("/api/v1/notices", json={
        "title": "Annual CS Hackathon Registration Open",
        "summary": "Join the 48-hour coding hackathon.",
        "content": "CS students are invited to register teams for HackApex 2025.",
        "notice_type": "EVENT",
        "priority": "HIGH",
        "status": "PUBLISHED",
        "target_type": "DEPARTMENT",
        "department_id": dept_cs["id"]
    }, headers=admin_auth_headers).json()

    # 4. Admin creates EE-Department specific notice (Grace in CS should NOT see this)
    n3 = client.post("/api/v1/notices", json={
        "title": "EE Lab Equipment Upgrade",
        "summary": "Power systems lab maintenance.",
        "content": "Electrical engineering lab is closed for maintenance.",
        "notice_type": "ACADEMIC",
        "priority": "NORMAL",
        "status": "PUBLISHED",
        "target_type": "DEPARTMENT",
        "department_id": dept_ee["id"]
    }, headers=admin_auth_headers).json()

    # 5. Admin creates Draft notice (Grace should NOT see this)
    n4 = client.post("/api/v1/notices", json={
        "title": "Upcoming Fee Revision Draft",
        "summary": "Draft proposal for committee.",
        "content": "Confidential proposal.",
        "notice_type": "FEE",
        "priority": "NORMAL",
        "status": "DRAFT",
        "target_type": "ALL"
    }, headers=admin_auth_headers).json()

    # 6. Student logs in & retrieves targeted notices
    login_stu = client.post("/api/v1/auth/login", json={"username_or_email": "gracehopper", "password": "StudentPass@123"}).json()
    stu_headers = {"Authorization": f"Bearer {login_stu['access_token']}"}

    stu_notices = client.get("/api/v1/notices", headers=stu_headers).json()
    # Student should see n1 (ALL) and n2 (CS Dept), but NOT n3 (EE Dept) or n4 (DRAFT)
    titles = [n["title"] for n in stu_notices]
    assert "Campus Closed Tomorrow for National Holiday" in titles
    assert "Annual CS Hackathon Registration Open" in titles
    assert "EE Lab Equipment Upgrade" not in titles
    assert "Upcoming Fee Revision Draft" not in titles
    assert len(stu_notices) == 2

    # 7. Check unread count
    unread_res = client.get("/api/v1/notices/unread-count", headers=stu_headers).json()
    assert unread_res["unread_count"] == 2

    # 8. Mark one notice as read
    client.post(f"/api/v1/notices/{n1['id']}/read", headers=stu_headers)
    unread_res2 = client.get("/api/v1/notices/unread-count", headers=stu_headers).json()
    assert unread_res2["unread_count"] == 1

    # 9. Mark all as read
    client.post("/api/v1/notices/mark-all-read", headers=stu_headers)
    unread_res3 = client.get("/api/v1/notices/unread-count", headers=stu_headers).json()
    assert unread_res3["unread_count"] == 0

    # 10. Notice Statistics (Admin)
    stats_res = client.get("/api/v1/notices/statistics", headers=admin_auth_headers).json()
    assert stats_res["total_notices"] >= 4
    assert stats_res["pinned_count"] >= 1
