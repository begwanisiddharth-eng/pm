"""Tests for OpenAI connectivity."""

from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app import ai


def _fake_response(text: str) -> SimpleNamespace:
    message = SimpleNamespace(content=text)
    return SimpleNamespace(choices=[SimpleNamespace(message=message)])


def test_ask_builds_request_and_returns_text(monkeypatch) -> None:
    client = MagicMock()
    client.chat.completions.create.return_value = _fake_response("4")
    monkeypatch.setattr(ai, "get_client", lambda: client)

    answer = ai.ask("What is 2+2?")

    assert answer == "4"
    kwargs = client.chat.completions.create.call_args.kwargs
    assert kwargs["model"] == "gpt-4o-mini"
    assert kwargs["messages"] == [{"role": "user", "content": "What is 2+2?"}]


def test_get_client_requires_key(monkeypatch) -> None:
    monkeypatch.setattr(ai, "get_openai_api_key", lambda: None)
    with pytest.raises(RuntimeError, match="OPENAI_API_KEY"):
        ai.get_client()


@pytest.mark.live
def test_ask_live_two_plus_two() -> None:
    """Real OpenAI call; run explicitly with: pytest -m live"""
    answer = ai.ask("What is 2+2? Reply with just the number.")
    assert "4" in answer
