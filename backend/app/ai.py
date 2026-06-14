"""OpenAI client and helpers."""

from openai import OpenAI

from app.config import get_openai_api_key
from app.models import AIStructuredResponse, BoardData, ChatMessage

MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = (
    "You are a project management assistant for a single Kanban board. "
    "Answer the user's questions and, when they ask to change the board "
    "(add, edit, move, or remove cards, or rename columns), return the complete "
    "updated board in the 'board' field; otherwise set 'board' to null. "
    "Keep existing card and column ids stable and only invent new ids for new "
    "cards. Always include a short 'reply' for the user."
)


def get_client() -> OpenAI:
    """Build an OpenAI client, failing clearly if the API key is missing."""
    api_key = get_openai_api_key()
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    return OpenAI(api_key=api_key)


def ask(prompt: str) -> str:
    """Send a single user prompt and return the assistant's text reply."""
    client = get_client()
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content


def chat_about_board(
    board: BoardData, history: list[ChatMessage], message: str
) -> AIStructuredResponse:
    """Ask the model about the board, returning a reply and optional board update."""
    client = get_client()
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"Current board JSON:\n{board.model_dump_json()}"},
    ]
    messages.extend({"role": item.role, "content": item.content} for item in history)
    messages.append({"role": "user", "content": message})
    completion = client.chat.completions.parse(
        model=MODEL,
        messages=messages,
        response_format=AIStructuredResponse,
    )
    return completion.choices[0].message.parsed
