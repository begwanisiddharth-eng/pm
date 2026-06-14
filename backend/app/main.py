"""FastAPI application: serves the static site at / and the API under /api."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app import auth
from app.config import get_session_secret, get_static_dir

app = FastAPI(title="Project Management MVP")

app.add_middleware(
    SessionMiddleware,
    secret_key=get_session_secret(),
    same_site="lax",
)


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness check."""
    return {"status": "ok"}


app.include_router(auth.router)

app.mount("/", StaticFiles(directory=get_static_dir(), html=True), name="static")
