"""Hardcoded-credential login backed by a signed session cookie."""

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

USERNAME = "user"
PASSWORD = "password"

router = APIRouter(prefix="/api")


class Credentials(BaseModel):
    username: str
    password: str


def get_current_user(request: Request) -> str:
    """Dependency that returns the logged-in user or raises 401."""
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.post("/login")
def login(creds: Credentials, request: Request) -> dict[str, str]:
    if creds.username != USERNAME or creds.password != PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    request.session["user"] = creds.username
    return {"user": creds.username}


@router.post("/logout")
def logout(request: Request) -> dict[str, bool]:
    request.session.clear()
    return {"ok": True}


@router.get("/me")
def me(request: Request) -> dict[str, str]:
    return {"user": get_current_user(request)}
