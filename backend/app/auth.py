"""User registration and login backed by a signed session cookie."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app import db as db_module
from app.db import get_db
from app.security import hash_password, verify_password

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


@router.post("/register", status_code=201)
def register(
    creds: Credentials,
    request: Request,
    conn: sqlite3.Connection = Depends(get_db),
) -> dict[str, str]:
    if db_module.get_user(conn, creds.username):
        raise HTTPException(status_code=409, detail="Username already taken")
    db_module.create_user(conn, creds.username, hash_password(creds.password))
    conn.commit()
    request.session["user"] = creds.username
    return {"user": creds.username}


@router.post("/login")
def login(
    creds: Credentials,
    request: Request,
    conn: sqlite3.Connection = Depends(get_db),
) -> dict[str, str]:
    user = db_module.get_user(conn, creds.username)
    if not user or not verify_password(creds.password, user["password_hash"]):
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
