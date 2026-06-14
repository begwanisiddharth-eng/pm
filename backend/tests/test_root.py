"""Tests for serving the static site at the root."""

from fastapi.testclient import TestClient


def test_root_serves_html(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Hello from FastAPI" in response.text
