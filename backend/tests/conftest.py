"""Shared pytest fixtures."""

import pytest
from fastapi.testclient import TestClient

from app.db import connect, get_db, init_db
from app.main import app


@pytest.fixture
def db_conn(tmp_path):
    """A fresh, seeded SQLite connection backed by a temp file."""
    conn = connect(tmp_path / "test.db")
    init_db(conn)
    yield conn
    conn.close()


@pytest.fixture
def client(db_conn) -> TestClient:
    """A test client whose routes use the temp database."""

    def override_get_db():
        yield db_conn

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(client) -> TestClient:
    """A test client already logged in as the default user."""
    client.post("/api/login", json={"username": "user", "password": "password"})
    return client
