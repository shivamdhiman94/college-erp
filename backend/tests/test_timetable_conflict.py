import pytest
from fastapi.testclient import TestClient


def test_room_crud_and_uniqueness(client: TestClient, admin_auth_headers: dict):
    # 1. Create Room
    room_payload = {
        "room_number": "LH-101",
        "building": "Engineering Block A",
        "floor": 1,
        "capacity": 75,
        "type": "CLASSROOM",
        "is_active": True
    }
    create_res = client.post("/api/v1/rooms", json=room_payload, headers=admin_auth_headers)
    assert create_res.status_code == 201
    room_id = create_res.json()["id"]

    # 2. Duplicate Room Number Rejection
    dup_res = client.post("/api/v1/rooms", json=room_payload, headers=admin_auth_headers)
    assert dup_res.status_code == 400

    # 3. Update Room
    update_res = client.put(f"/api/v1/rooms/{room_id}", json={"capacity": 80}, headers=admin_auth_headers)
    assert update_res.status_code == 200
    assert update_res.json()["capacity"] == 80


def test_timetable_conflict_engine_and_scheduling(client: TestClient, admin_auth_headers: dict):
    # 1. Setup Hierarchy
    dept = client.post("/api/v1/departments", json={"code": "TT_DEPT", "name": "Timetable Dept"}, headers=admin_auth_headers).json()
    course = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_TT", "name": "B.Tech TT"}, headers=admin_auth_headers).json()
    session = client.post("/api/v1/sessions", json={"name": "2025-2026-TT", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers).json()
    sem = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Sem 1"}, headers=admin_auth_headers).json()
    sec_a = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers).json()
    sec_b = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "B", "capacity": 60}, headers=admin_auth_headers).json()
    sub_1 = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "TT101", "name": "Physics", "semester_number": 1}, headers=admin_auth_headers).json()
    sub_2 = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "TT102", "name": "Chemistry", "semester_number": 1}, headers=admin_auth_headers).json()

    # 2. Setup 2 Faculty members
    fac_1 = client.post("/api/v1/faculty", json={
        "email": "dr.feynman@college.edu", "username": "feynman", "password": "Pass@123",
        "department_id": dept["id"], "employee_code": "FAC-TT-01", "first_name": "Richard",
        "last_name": "Feynman", "designation": "Professor", "joining_date": "2020-01-01"
    }, headers=admin_auth_headers).json()

    fac_2 = client.post("/api/v1/faculty", json={
        "email": "dr.curie@college.edu", "username": "mariecurie", "password": "Pass@123",
        "department_id": dept["id"], "employee_code": "FAC-TT-02", "first_name": "Marie",
        "last_name": "Curie", "designation": "Professor", "joining_date": "2020-01-01"
    }, headers=admin_auth_headers).json()

    # 3. Setup Rooms
    room_1 = client.post("/api/v1/rooms", json={"room_number": "TT-R101", "building": "Main", "floor": 1, "capacity": 60, "type": "CLASSROOM"}, headers=admin_auth_headers).json()
    room_2 = client.post("/api/v1/rooms", json={"room_number": "TT-R102", "building": "Main", "floor": 1, "capacity": 60, "type": "CLASSROOM"}, headers=admin_auth_headers).json()

    # 4. Allocations
    alloc_1 = client.post("/api/v1/allocations", json={"faculty_id": fac_1["id"], "subject_id": sub_1["id"], "section_id": sec_a["id"], "academic_session_id": session["id"]}, headers=admin_auth_headers).json()
    alloc_2 = client.post("/api/v1/allocations", json={"faculty_id": fac_1["id"], "subject_id": sub_1["id"], "section_id": sec_b["id"], "academic_session_id": session["id"]}, headers=admin_auth_headers).json()
    alloc_3 = client.post("/api/v1/allocations", json={"faculty_id": fac_2["id"], "subject_id": sub_2["id"], "section_id": sec_a["id"], "academic_session_id": session["id"]}, headers=admin_auth_headers).json()

    # 5. Create valid timetable entry for Feynman in Sec A on Monday 09:00 - 10:00 in Room 1
    t1_res = client.post("/api/v1/timetable", json={
        "subject_allocation_id": alloc_1["id"],
        "day_of_week": "MONDAY",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "room_id": room_1["id"]
    }, headers=admin_auth_headers)
    assert t1_res.status_code == 201

    # 6. Invalid time range rejection (09:00 >= 08:00)
    inv_time_res = client.post("/api/v1/timetable", json={
        "subject_allocation_id": alloc_1["id"],
        "day_of_week": "TUESDAY",
        "start_time": "09:00:00",
        "end_time": "08:00:00",
        "room_id": room_1["id"]
    }, headers=admin_auth_headers)
    assert inv_time_res.status_code == 400

    # 7. Test Faculty Conflict: Feynman trying to teach Sec B on Monday 09:30 - 10:30 (Overlaps 09:00 - 10:00!)
    fac_conflict_res = client.post("/api/v1/timetable", json={
        "subject_allocation_id": alloc_2["id"],
        "day_of_week": "MONDAY",
        "start_time": "09:30:00",
        "end_time": "10:30:00",
        "room_id": room_2["id"]
    }, headers=admin_auth_headers)
    assert fac_conflict_res.status_code == 409
    assert "Faculty Conflict" in fac_conflict_res.json()["detail"]

    # 8. Test Section Conflict: Marie Curie trying to teach Sec A on Monday 09:00 - 10:00 (Sec A already has Physics with Feynman!)
    sec_conflict_res = client.post("/api/v1/timetable", json={
        "subject_allocation_id": alloc_3["id"],
        "day_of_week": "MONDAY",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "room_id": room_2["id"]
    }, headers=admin_auth_headers)
    assert sec_conflict_res.status_code == 409
    assert "Section Conflict" in sec_conflict_res.json()["detail"]

    # 9. Test Room Conflict: Marie Curie trying to teach Sec B in Room 1 on Monday 09:00 - 10:00 (Room 1 already booked!)
    alloc_4 = client.post("/api/v1/allocations", json={"faculty_id": fac_2["id"], "subject_id": sub_2["id"], "section_id": sec_b["id"], "academic_session_id": session["id"]}, headers=admin_auth_headers).json()
    room_conflict_res = client.post("/api/v1/timetable", json={
        "subject_allocation_id": alloc_4["id"],
        "day_of_week": "MONDAY",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "room_id": room_1["id"]
    }, headers=admin_auth_headers)
    assert room_conflict_res.status_code == 409
    assert "Room Conflict" in room_conflict_res.json()["detail"]

    # 10. Test Weekly Section Schedule endpoint
    weekly_res = client.get(f"/api/v1/timetable/section/{sec_a['id']}/weekly", headers=admin_auth_headers)
    assert weekly_res.status_code == 200
    mon_slots = next(d for d in weekly_res.json()["days"] if d["day"] == "MONDAY")
    assert len(mon_slots["slots"]) == 1
    assert mon_slots["slots"][0]["subject_code"] == "TT101"
