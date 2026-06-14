"""Application configuration loaded from the project-root .env file."""

from pathlib import Path

from dotenv import load_dotenv
import os

PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
PLACEHOLDER_DIR = BACKEND_DIR / "static"
FRONTEND_OUT = PROJECT_ROOT / "frontend" / "out"

load_dotenv(PROJECT_ROOT / ".env")


def get_static_dir() -> Path:
    """Directory served at /. The built frontend if present, else the placeholder."""
    return FRONTEND_OUT if FRONTEND_OUT.exists() else PLACEHOLDER_DIR


def get_session_secret() -> str:
    """Secret used to sign the session cookie."""
    return os.getenv("SESSION_SECRET", "dev-secret-change-me")


def get_openai_api_key() -> str | None:
    """Return the OpenAI API key from the environment, or None if unset."""
    return os.getenv("OPENAI_API_KEY")
