"""FastAPI application: serves the static site at / and the API under /api."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import STATIC_DIR

app = FastAPI(title="Project Management MVP")


@app.get("/api/health")
def health() -> dict[str, str]:
    """Liveness check."""
    return {"status": "ok"}


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
