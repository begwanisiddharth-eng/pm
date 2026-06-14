"""Tests for database creation and seeding."""

import json
import sqlite3

from app.db import connect, init_db


def test_db_created_when_absent(tmp_path) -> None:
    db_path = tmp_path / "fresh.db"
    assert not db_path.exists()
    conn = connect(db_path)
    init_db(conn)
    assert db_path.exists()
    conn.close()


def test_seeds_default_user_and_board(db_conn: sqlite3.Connection) -> None:
    users = db_conn.execute("SELECT username FROM users").fetchall()
    assert [u["username"] for u in users] == ["user"]
    boards = db_conn.execute("SELECT title, data FROM boards").fetchall()
    assert len(boards) == 1
    assert boards[0]["title"] == "Kanban Studio"
    data = json.loads(boards[0]["data"])
    assert len(data["columns"]) == 5


def test_seed_is_idempotent(db_conn: sqlite3.Connection) -> None:
    init_db(db_conn)
    assert db_conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"] == 1
    assert db_conn.execute("SELECT COUNT(*) AS n FROM boards").fetchone()["n"] == 1
