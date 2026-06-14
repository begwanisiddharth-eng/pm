"""Tests for registration, login, logout, and session-protected access."""

import sqlite3

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


def test_register_creates_user_and_logs_in(client: TestClient) -> None:
    response = client.post(
        "/api/register", json={"username": "alice", "password": "wonderland"}
    )
    assert response.status_code == 201
    assert response.json() == {"user": "alice"}
    assert client.get("/api/me").json() == {"user": "alice"}


def test_register_seeds_a_board(client: TestClient) -> None:
    client.post("/api/register", json={"username": "alice", "password": "pw"})
    boards = client.get("/api/boards").json()
    assert len(boards) == 1
    assert boards[0]["title"] == "Kanban Studio"


def test_register_duplicate_username_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/register", json={"username": "user", "password": "x"}
    )
    assert response.status_code == 409


def test_registered_user_can_log_in(client: TestClient) -> None:
    client.post("/api/register", json={"username": "bob", "password": "builder"})
    client.post("/api/logout")
    ok = client.post(
        "/api/login", json={"username": "bob", "password": "builder"}
    )
    assert ok.status_code == 200
    bad = client.post(
        "/api/login", json={"username": "bob", "password": "wrong"}
    )
    assert bad.status_code == 401


def test_password_stored_hashed(
    client: TestClient, db_conn: sqlite3.Connection
) -> None:
    client.post("/api/register", json={"username": "carol", "password": "plaintext"})
    row = db_conn.execute(
        "SELECT password_hash FROM users WHERE username = ?", ("carol",)
    ).fetchone()
    assert row["password_hash"] != "plaintext"
    assert "$" in row["password_hash"]
