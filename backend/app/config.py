"""Application configuration loaded from the project-root .env file."""

from pathlib import Path

from dotenv import load_dotenv
import os

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
STATIC_DIR = BACKEND_DIR / "static"

load_dotenv(PROJECT_ROOT / ".env")


def get_openai_api_key() -> str | None:
    """Return the OpenAI API key from the environment, or None if unset."""
    return os.getenv("OPENAI_API_KEY")
