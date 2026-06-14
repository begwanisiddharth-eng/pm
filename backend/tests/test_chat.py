"""Tests for the AI chat-over-board endpoint."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app import ai
from app.models import (
    AIBoard,
    AIStructuredResponse,
    BoardData,
    Card,
    ChatMessage,
    Column,
)


def first_board_id(client: TestClient) -> int:
    return client.get("/api/boards").json()[0]["id"]


def test_chat_about_board_builds_prompt(monkeypatch) -> None:
    captured = {}
    client = MagicMock()

    def fake_parse(**kwargs):
        captured.update(kwargs)
        parsed = AIStructuredResponse(reply="ok", board=None)
        message = SimpleNamespace(parsed=parsed)
        return SimpleNamespace(choices=[SimpleNamespace(message=message)])

    client.chat.completions.parse.side_effect = fake_parse
    monkeypatch.setattr(ai, "get_client", lambda: client)

    board = BoardData(
        columns=[Column(id="c1", title="T", cardIds=[])], cards={}
    )
    history = [
        ChatMessage(role="user", content="hi"),
        ChatMessage(role="assistant", content="hello"),
    ]

    result = ai.chat_about_board(board, history, "add a card")

    assert result.reply == "ok"
    assert captured["model"] == "gpt-4o-mini"
    assert captured["response_format"] is AIStructuredResponse
    messages = captured["messages"]
    assert any("Current board JSON" in m["content"] for m in messages)
    assert any('"c1"' in m["content"] for m in messages)
    assert {"role": "user", "content": "hi"} in messages
    assert {"role": "assistant", "content": "hello"} in messages
    assert messages[-1] == {"role": "user", "content": "add a card"}


def test_chat_reply_only_leaves_board_unchanged(auth_client, monkeypatch) -> None:
    board_id = first_board_id(auth_client)
    before = auth_client.get(f"/api/boards/{board_id}").json()["data"]

    monkeypatch.setattr(
        "app.boards.chat_about_board",
        lambda board, history, message: AIStructuredResponse(
            reply="The board has 5 columns.", board=None
        ),
    )

    response = auth_client.post(
        f"/api/boards/{board_id}/chat", json={"message": "How many columns?"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "The board has 5 columns."
    assert body["board"] is None
    after = auth_client.get(f"/api/boards/{board_id}").json()["data"]
    assert after == before


def test_chat_board_update_persists(auth_client, monkeypatch) -> None:
    board_id = first_board_id(auth_client)

    new_board = AIBoard(
        columns=[Column(id="c1", title="Todo", cardIds=["x1"])],
        cards=[Card(id="x1", title="New card", details="from ai")],
    )
    monkeypatch.setattr(
        "app.boards.chat_about_board",
        lambda board, history, message: AIStructuredResponse(
            reply="Added it.", board=new_board
        ),
    )

    response = auth_client.post(
        f"/api/boards/{board_id}/chat", json={"message": "Add a card"}
    )
    assert response.status_code == 200
    assert response.json()["board"]["cards"]["x1"]["title"] == "New card"

    reloaded = auth_client.get(f"/api/boards/{board_id}").json()["data"]
    assert reloaded["cards"]["x1"]["title"] == "New card"


def test_chat_invalid_board_update_rejected(auth_client, monkeypatch) -> None:
    board_id = first_board_id(auth_client)
    before = auth_client.get(f"/api/boards/{board_id}").json()["data"]

    bad_board = AIBoard(
        columns=[Column(id="c1", title="Todo", cardIds=["ghost"])],
        cards=[],
    )
    monkeypatch.setattr(
        "app.boards.chat_about_board",
        lambda board, history, message: AIStructuredResponse(
            reply="oops", board=bad_board
        ),
    )

    response = auth_client.post(
        f"/api/boards/{board_id}/chat", json={"message": "break it"}
    )
    assert response.status_code == 400
    after = auth_client.get(f"/api/boards/{board_id}").json()["data"]
    assert after == before


def test_chat_requires_auth(client: TestClient) -> None:
    response = client.post("/api/boards/1/chat", json={"message": "hi"})
    assert response.status_code == 401


def test_chat_unknown_board_404(auth_client, monkeypatch) -> None:
    monkeypatch.setattr(
        "app.boards.chat_about_board",
        lambda board, history, message: AIStructuredResponse(reply="x", board=None),
    )
    response = auth_client.post("/api/boards/9999/chat", json={"message": "hi"})
    assert response.status_code == 404


@pytest.mark.live
def test_chat_live_adds_card(auth_client) -> None:
    """Real OpenAI call: ask the model to add a card and confirm it appears."""
    board_id = first_board_id(auth_client)
    before = auth_client.get(f"/api/boards/{board_id}").json()["data"]

    response = auth_client.post(
        f"/api/boards/{board_id}/chat",
        json={
            "message": "Add a new card titled 'Write release notes' to the Backlog column.",
            "history": [],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["board"] is not None
    assert len(body["board"]["cards"]) > len(before["cards"])
