"""FastAPI application: serves the static site at / and the API under /api."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware

from app import auth, boards
from app.config import get_session_secret, get_static_dir
from app.db import connect, init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create and seed the database on startup if it does not exist."""
    conn = connect()
    init_db(conn)
    conn.close()
    yield


app = FastAPI(title="Project Management MVP", lifespan=lifespan)

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
app.include_router(boards.router)

app.mount("/", StaticFiles(directory=get_static_dir(), html=True), name="static")
