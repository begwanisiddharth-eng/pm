"""Tests for serving the static site at the root."""

from fastapi.testclient import TestClient

from app.config import FRONTEND_OUT


def test_root_serves_html(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_root_serves_spa(client: TestClient) -> None:
    """When the frontend is built, / serves the exported Kanban app."""
    if not FRONTEND_OUT.exists():
        import pytest

        pytest.skip("frontend not built; run scripts/build-frontend first")
    response = client.get("/")
    assert response.status_code == 200
    assert "Kanban Studio" in response.text
