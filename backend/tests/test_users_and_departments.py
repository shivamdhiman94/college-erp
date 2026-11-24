import pytest
from fastapi.testclient import TestClient
from app.models.user import User


def test_create_and_get_user(client: TestClient, admin_auth_headers: dict):
    # Admin creates new student user
    payload = {
        "email": "new.student@college.edu",
        "username": "newstudent",
        "password": "SecurePass123!",
        "role": "STUDENT"
    }
    create_res = client.post("/api/v1/users", json=payload, headers=admin_auth_headers)
    assert create_res.status_code == 201
    created_user = create_res.json()
    assert created_user["email"] == "new.student@college.edu"
    assert created_user["username"] == "newstudent"
    assert created_user["role"] == "STUDENT"
    user_id = created_user["id"]

    # Get user by ID
    get_res = client.get(f"/api/v1/users/{user_id}", headers=admin_auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["username"] == "newstudent"

    # Update user
    update_res = client.put(
        f"/api/v1/users/{user_id}",
        json={"username": "updatedstudent"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["username"] == "updatedstudent"

    # Delete user
    delete_res = client.delete(f"/api/v1/users/{user_id}", headers=admin_auth_headers)
    assert delete_res.status_code == 200

    # Verify not found
    get_deleted = client.get(f"/api/v1/users/{user_id}", headers=admin_auth_headers)
    assert get_deleted.status_code == 404


def test_duplicate_user_creation_rejected(client: TestClient, admin_auth_headers: dict):
    payload = {
        "email": "dup@college.edu",
        "username": "dupuser",
        "password": "SecurePass123!",
        "role": "FACULTY"
    }
    first_res = client.post("/api/v1/users", json=payload, headers=admin_auth_headers)
    assert first_res.status_code == 201

    # Attempt second creation with same email
    dup_res = client.post("/api/v1/users", json=payload, headers=admin_auth_headers)
    assert dup_res.status_code == 400


def test_department_crud_lifecycle(client: TestClient, admin_auth_headers: dict, student_auth_headers: dict):
    # Admin creates department
    dept_payload = {
        "code": "MECH",
        "name": "Mechanical Engineering",
        "description": "Department of Mechanical Engineering"
    }
    create_res = client.post("/api/v1/departments", json=dept_payload, headers=admin_auth_headers)
    assert create_res.status_code == 201
    dept_id = create_res.json()["id"]
    assert create_res.json()["code"] == "MECH"

    # Student cannot create department (RBAC test)
    student_create_res = client.post("/api/v1/departments", json=dept_payload, headers=student_auth_headers)
    assert student_create_res.status_code == 403

    # Student CAN view department list (read access allowed)
    list_res = client.get("/api/v1/departments", headers=student_auth_headers)
    assert list_res.status_code == 200
    assert any(d["code"] == "MECH" for d in list_res.json())

    # Admin updates department
    update_res = client.put(
        f"/api/v1/departments/{dept_id}",
        json={"name": "Dept. of Mechanical and Automation Engineering"},
        headers=admin_auth_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Dept. of Mechanical and Automation Engineering"

    # Admin deletes department
    delete_res = client.delete(f"/api/v1/departments/{dept_id}", headers=admin_auth_headers)
    assert delete_res.status_code == 200


def test_change_password_endpoint(client: TestClient, test_admin_user: User):
    # Login with original password
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admintest", "password": "AdminPass123!"}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Change password
    change_res = client.post(
        "/api/v1/auth/change-password",
        json={"old_password": "AdminPass123!", "new_password": "NewAdminPass456#"},
        headers=headers
    )
    assert change_res.status_code == 200

    # Old password no longer works
    old_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admintest", "password": "AdminPass123!"}
    )
    assert old_login.status_code == 401

    # New password works
    new_login = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admintest", "password": "NewAdminPass456#"}
    )
    assert new_login.status_code == 200
