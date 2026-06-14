"""Tests for login, logout, and session-protected access."""

from fastapi.testclient import TestClient


def test_login_success(client: TestClient) -> None:
    response = client.post(
        "/api/login", json={"username": "user", "password": "password"}
    )
    assert response.status_code == 200
    assert response.json() == {"user": "user"}
    assert "session" in response.cookies


def test_login_bad_password(client: TestClient) -> None:
    response = client.post(
        "/api/login", json={"username": "user", "password": "wrong"}
    )
    assert response.status_code == 401


def test_login_bad_user(client: TestClient) -> None:
    response = client.post(
        "/api/login", json={"username": "nobody", "password": "password"}
    )
    assert response.status_code == 401


def test_me_requires_session(client: TestClient) -> None:
    response = client.get("/api/me")
    assert response.status_code == 401


def test_me_after_login(client: TestClient) -> None:
    client.post("/api/login", json={"username": "user", "password": "password"})
    response = client.get("/api/me")
    assert response.status_code == 200
    assert response.json() == {"user": "user"}


def test_logout_clears_session(client: TestClient) -> None:
    client.post("/api/login", json={"username": "user", "password": "password"})
    client.post("/api/logout")
    response = client.get("/api/me")
    assert response.status_code == 401
