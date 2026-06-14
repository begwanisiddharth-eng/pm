"""SQLite access: connection, schema creation, and seeding."""

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from app.config import BACKEND_DIR
from app.seed import SEED_BOARD

DB_PATH = Path(os.getenv("PM_DB_PATH", BACKEND_DIR / "app.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


def now() -> str:
    """Current UTC timestamp as ISO 8601."""
    return datetime.now(timezone.utc).isoformat()


def connect(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """Open a SQLite connection with row access by name and foreign keys on."""
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    """Create tables if missing and seed the default user and board."""
    conn.executescript(SCHEMA)
    seed(conn)
    conn.commit()


def seed(conn: sqlite3.Connection) -> None:
    """Insert the default user and starter board if not already present."""
    if conn.execute("SELECT 1 FROM users WHERE username = ?", ("user",)).fetchone():
        return
    timestamp = now()
    cursor = conn.execute(
        "INSERT INTO users (username, created_at) VALUES (?, ?)", ("user", timestamp)
    )
    conn.execute(
        "INSERT INTO boards (user_id, title, data, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?)",
        (cursor.lastrowid, "Kanban Studio", json.dumps(SEED_BOARD), timestamp, timestamp),
    )


def get_user_id(conn: sqlite3.Connection, username: str) -> int:
    """Return the id of the user with the given username."""
    row = conn.execute(
        "SELECT id FROM users WHERE username = ?", (username,)
    ).fetchone()
    return row["id"]


def get_db():
    """FastAPI dependency yielding a request-scoped connection."""
    conn = connect()
    try:
        yield conn
    finally:
        conn.close()
