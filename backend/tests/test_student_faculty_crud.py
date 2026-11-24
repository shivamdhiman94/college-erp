import pytest
from fastapi.testclient import TestClient


def test_student_lifecycle_and_user_link(client: TestClient, admin_auth_headers: dict, student_auth_headers: dict):
    # Setup hierarchy with unique codes
    dept_res = client.post("/api/v1/departments", json={"code": "CSE_STU_LC", "name": "CSE Students Dept"}, headers=admin_auth_headers)
    assert dept_res.status_code == 201
    dept = dept_res.json()

    course_res = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BTECH_CS_LC", "name": "B.Tech CS"}, headers=admin_auth_headers)
    assert course_res.status_code == 201
    course = course_res.json()

    session_res = client.post("/api/v1/sessions", json={"name": "2025-2026-STU-LC", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers)
    assert session_res.status_code == 201
    session = session_res.json()

    sem_res = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Sem 1"}, headers=admin_auth_headers)
    assert sem_res.status_code == 201
    sem = sem_res.json()

    sec_res = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers)
    assert sec_res.status_code == 201
    sec = sec_res.json()

    # 1. Create Student
    student_payload = {
        "email": "john.doe.unique@student.college.edu",
        "username": "johndoeunique",
        "password": "SecureStudentPass@123",
        "department_id": dept["id"],
        "course_id": course["id"],
        "admission_session_id": session["id"],
        "enrollment_number": "ENR2025CS999",
        "roll_number": "25CS999",
        "first_name": "John",
        "last_name": "Doe",
        "gender": "Male",
        "date_of_birth": "2004-05-15",
        "blood_group": "O+",
        "phone": "+15550192834",
        "admission_date": "2025-08-10",
        "current_semester_id": sem["id"],
        "current_section_id": sec["id"],
        "status": "ACTIVE"
    }

    create_res = client.post("/api/v1/students", json=student_payload, headers=admin_auth_headers)
    assert create_res.status_code == 201
    stu_data = create_res.json()
    assert stu_data["enrollment_number"] == "ENR2025CS999"
    assert stu_data["first_name"] == "John"
    student_id = stu_data["id"]

    # 2. Duplicate Enrollment Number Rejection
    dup_res = client.post(
        "/api/v1/students",
        json={**student_payload, "email": "other.stu@student.college.edu", "username": "otheruserstu"},
        headers=admin_auth_headers
    )
    assert dup_res.status_code == 400

    # 3. RBAC Student cannot create student
    forbidden_res = client.post("/api/v1/students", json=student_payload, headers=student_auth_headers)
    assert forbidden_res.status_code == 403

    # 4. Get Student Details
    get_res = client.get(f"/api/v1/students/{student_id}", headers=admin_auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["department"]["code"] == "CSE_STU_LC"
    assert get_res.json()["user"]["email"] == "john.doe.unique@student.college.edu"

    # 5. Update Student
    update_res = client.put(
        f"/api/v1/students/{student_id}",
        json={"phone": "+15559998888", "guardian_name": "Robert Doe"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["phone"] == "+15559998888"

    # 6. Test Login with New Student Credentials
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "johndoeunique", "password": "SecureStudentPass@123"}
    )
    assert login_res.status_code == 200
    new_stu_token = login_res.json()["access_token"]
    new_stu_headers = {"Authorization": f"Bearer {new_stu_token}"}

    # 7. Student can access their own profile
    me_res = client.get("/api/v1/students/me/profile", headers=new_stu_headers)
    assert me_res.status_code == 200
    assert me_res.json()["enrollment_number"] == "ENR2025CS999"


def test_faculty_lifecycle_and_allocations(client: TestClient, admin_auth_headers: dict):
    # Setup hierarchy with unique codes
    dept_res = client.post("/api/v1/departments", json={"code": "MATH_LC", "name": "Mathematics Dept"}, headers=admin_auth_headers)
    assert dept_res.status_code == 201
    dept = dept_res.json()

    course_res = client.post("/api/v1/courses", json={"department_id": dept["id"], "code": "BSC_MATH_LC", "name": "B.Sc Mathematics"}, headers=admin_auth_headers)
    assert course_res.status_code == 201
    course = course_res.json()

    session_res = client.post("/api/v1/sessions", json={"name": "2025-2026-MATH-LC", "start_date": "2025-08-01", "end_date": "2026-06-30"}, headers=admin_auth_headers)
    assert session_res.status_code == 201
    session = session_res.json()

    sem_res = client.post("/api/v1/semesters", json={"course_id": course["id"], "academic_session_id": session["id"], "semester_number": 1, "name": "Sem 1"}, headers=admin_auth_headers)
    assert sem_res.status_code == 201
    sem = sem_res.json()

    sec_res = client.post("/api/v1/sections", json={"semester_id": sem["id"], "name": "A", "capacity": 60}, headers=admin_auth_headers)
    assert sec_res.status_code == 201
    sec = sec_res.json()

    sub_res = client.post("/api/v1/subjects", json={"course_id": course["id"], "department_id": dept["id"], "code": "MTH101_LC", "name": "Calculus I", "semester_number": 1}, headers=admin_auth_headers)
    assert sub_res.status_code == 201
    sub = sub_res.json()

    # 1. Create Faculty
    faculty_payload = {
        "email": "prof.euler.unique@college.edu",
        "username": "profeulerunique",
        "password": "FacultyPassword@123",
        "department_id": dept["id"],
        "employee_code": "FAC-MTH-99",
        "first_name": "Leonhard",
        "last_name": "Euler",
        "designation": "Professor & Chair",
        "qualification": "Ph.D. Mathematics",
        "joining_date": "2020-01-15",
        "phone": "+15553334444"
    }
    create_res = client.post("/api/v1/faculty", json=faculty_payload, headers=admin_auth_headers)
    assert create_res.status_code == 201
    fac_data = create_res.json()
    assert fac_data["employee_code"] == "FAC-MTH-99"
    faculty_id = fac_data["id"]

    # 2. Duplicate employee code rejection
    dup_res = client.post(
        "/api/v1/faculty",
        json={**faculty_payload, "email": "other.fac@college.edu", "username": "otherfacultyfac"},
        headers=admin_auth_headers
    )
    assert dup_res.status_code == 400

    # 3. Create Subject Allocation
    alloc_payload = {
        "faculty_id": faculty_id,
        "subject_id": sub["id"],
        "section_id": sec["id"],
        "academic_session_id": session["id"],
        "is_active": True
    }
    alloc_res = client.post("/api/v1/allocations", json=alloc_payload, headers=admin_auth_headers)
    assert alloc_res.status_code == 201
    alloc_id = alloc_res.json()["id"]

    # 4. Duplicate Subject Allocation Rejection
    dup_alloc_res = client.post("/api/v1/allocations", json=alloc_payload, headers=admin_auth_headers)
    assert dup_alloc_res.status_code == 400

    # 5. Faculty logs in and views their allocations
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "profeulerunique", "password": "FacultyPassword@123"}
    )
    assert login_res.status_code == 200
    fac_token = login_res.json()["access_token"]
    fac_headers = {"Authorization": f"Bearer {fac_token}"}

    my_allocs = client.get("/api/v1/allocations/my-allocations", headers=fac_headers)
    assert my_allocs.status_code == 200
    assert len(my_allocs.json()) == 1
    assert my_allocs.json()[0]["subject_id"] == sub["id"]
