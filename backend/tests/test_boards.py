"""Tests for the board CRUD API."""

import sqlite3

from fastapi.testclient import TestClient

from app import db as db_module


def first_board_id(client: TestClient) -> int:
    return client.get("/api/boards").json()[0]["id"]


def test_list_boards(auth_client: TestClient) -> None:
    response = auth_client.get("/api/boards")
    assert response.status_code == 200
    boards = response.json()
    assert len(boards) == 1
    assert boards[0]["title"] == "Kanban Studio"


def test_get_board(auth_client: TestClient) -> None:
    board_id = first_board_id(auth_client)
    response = auth_client.get(f"/api/boards/{board_id}")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == board_id
    assert len(body["data"]["columns"]) == 5


def test_get_board_unknown_404(auth_client: TestClient) -> None:
    response = auth_client.get("/api/boards/9999")
    assert response.status_code == 404


def test_create_board(auth_client: TestClient) -> None:
    response = auth_client.post("/api/boards", json={"title": "Second board"})
    assert response.status_code == 201
    assert response.json()["title"] == "Second board"
    assert len(auth_client.get("/api/boards").json()) == 2


def test_update_board_roundtrips(auth_client: TestClient) -> None:
    board_id = first_board_id(auth_client)
    data = auth_client.get(f"/api/boards/{board_id}").json()["data"]
    data["columns"][0]["title"] = "To Do"

    put = auth_client.put(f"/api/boards/{board_id}", json=data)
    assert put.status_code == 200

    reloaded = auth_client.get(f"/api/boards/{board_id}").json()
    assert reloaded["data"]["columns"][0]["title"] == "To Do"


def test_update_board_rejects_unknown_card(auth_client: TestClient) -> None:
    board_id = first_board_id(auth_client)
    bad = {
        "columns": [{"id": "c1", "title": "C1", "cardIds": ["ghost"]}],
        "cards": {},
    }
    response = auth_client.put(f"/api/boards/{board_id}", json=bad)
    assert response.status_code == 400


def test_update_board_unknown_404(auth_client: TestClient) -> None:
    body = {"columns": [], "cards": {}}
    response = auth_client.put("/api/boards/9999", json=body)
    assert response.status_code == 404


def test_delete_board(auth_client: TestClient) -> None:
    created = auth_client.post("/api/boards", json={"title": "Temp"}).json()
    response = auth_client.delete(f"/api/boards/{created['id']}")
    assert response.status_code == 204
    assert auth_client.get(f"/api/boards/{created['id']}").status_code == 404


def test_cross_user_board_404(
    auth_client: TestClient, db_conn: sqlite3.Connection
) -> None:
    timestamp = db_module.now()
    cursor = db_conn.execute(
        "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
        ("other", "x$y", timestamp),
    )
    other_board = db_conn.execute(
        "INSERT INTO boards (user_id, title, data, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?)",
        (cursor.lastrowid, "Other", '{"columns": [], "cards": {}}', timestamp, timestamp),
    )
    db_conn.commit()
    response = auth_client.get(f"/api/boards/{other_board.lastrowid}")
    assert response.status_code == 404


def test_board_routes_require_auth(client: TestClient) -> None:
    assert client.get("/api/boards").status_code == 401
    assert client.get("/api/boards/1").status_code == 401
    assert client.put("/api/boards/1", json={"columns": [], "cards": {}}).status_code == 401
    assert client.delete("/api/boards/1").status_code == 401
