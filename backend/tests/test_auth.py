import pytest
from fastapi.testclient import TestClient
from app.models.user import User


def test_health_check(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_root_endpoint(client: TestClient):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_login_success_username(client: TestClient, test_admin_user: User):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admintest", "password": "AdminPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "ADMIN"
    assert data["email"] == "admin.test@college.edu"


def test_login_success_email(client: TestClient, test_admin_user: User):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admin.test@college.edu", "password": "AdminPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admintest"


def test_login_invalid_password(client: TestClient, test_admin_user: User):
    response = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admintest", "password": "WrongPassword!"}
    )
    assert response.status_code == 401


def test_get_current_user_me(client: TestClient, admin_auth_headers: dict):
    response = client.get("/api/v1/auth/me", headers=admin_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "admintest"
    assert data["role"] == "ADMIN"
    assert data["full_name"] == "Admin Tester"


def test_refresh_token_flow(client: TestClient, test_admin_user: User):
    # First login to get refresh token
    login_res = client.post(
        "/api/v1/auth/login",
        json={"username_or_email": "admintest", "password": "AdminPass123!"}
    )
    refresh_token = login_res.json()["refresh_token"]

    # Use refresh token to obtain new access token
    refresh_res = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()


def test_rbac_admin_allowed_access_users(client: TestClient, admin_auth_headers: dict):
    response = client.get("/api/v1/users", headers=admin_auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_rbac_student_forbidden_access_users(client: TestClient, student_auth_headers: dict):
    response = client.get("/api/v1/users", headers=student_auth_headers)
    assert response.status_code == 403
    assert "Operation not permitted" in response.json()["detail"]


def test_unauthenticated_request_rejected(client: TestClient):
    response = client.get("/api/v1/users")
    assert response.status_code == 401
