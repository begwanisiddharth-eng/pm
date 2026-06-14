"""Board CRUD routes, scoped to the authenticated user."""

import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app import db as db_module
from app.ai import chat_about_board
from app.auth import get_current_user
from app.db import get_db
from app.models import (
    Board,
    BoardCreate,
    BoardData,
    BoardSummary,
    ChatRequest,
    ChatResponse,
)

router = APIRouter(prefix="/api/boards")

EMPTY_BOARD = BoardData(columns=[], cards={})


def validate_board_data(data: BoardData) -> None:
    """Reject a board whose columns reference cards that do not exist."""
    for column in data.columns:
        for card_id in column.cardIds:
            if card_id not in data.cards:
                raise HTTPException(
                    status_code=400,
                    detail=f"Column '{column.id}' references unknown card '{card_id}'",
                )


def _owned_board(conn: sqlite3.Connection, board_id: int, user: str) -> sqlite3.Row:
    """Return the board row if it belongs to the user, else raise 404."""
    user_id = db_module.get_user_id(conn, user)
    row = conn.execute(
        "SELECT id, title, data FROM boards WHERE id = ? AND user_id = ?",
        (board_id, user_id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Board not found")
    return row


def _write_board(conn: sqlite3.Connection, board_id: int, data: BoardData) -> None:
    """Validate and persist board data for an already-owned board."""
    validate_board_data(data)
    conn.execute(
        "UPDATE boards SET data = ?, updated_at = ? WHERE id = ?",
        (data.model_dump_json(), db_module.now(), board_id),
    )
    conn.commit()


@router.get("")
def list_boards(
    user: str = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> list[BoardSummary]:
    user_id = db_module.get_user_id(conn, user)
    rows = conn.execute(
        "SELECT id, title FROM boards WHERE user_id = ? ORDER BY id", (user_id,)
    ).fetchall()
    return [BoardSummary(id=row["id"], title=row["title"]) for row in rows]


@router.post("", status_code=201)
def create_board(
    payload: BoardCreate,
    user: str = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> Board:
    data = payload.data or EMPTY_BOARD
    validate_board_data(data)
    user_id = db_module.get_user_id(conn, user)
    timestamp = db_module.now()
    cursor = conn.execute(
        "INSERT INTO boards (user_id, title, data, created_at, updated_at)"
        " VALUES (?, ?, ?, ?, ?)",
        (user_id, payload.title, data.model_dump_json(), timestamp, timestamp),
    )
    conn.commit()
    return Board(id=cursor.lastrowid, title=payload.title, data=data)


@router.get("/{board_id}")
def get_board(
    board_id: int,
    user: str = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> Board:
    row = _owned_board(conn, board_id, user)
    return Board(
        id=row["id"],
        title=row["title"],
        data=BoardData.model_validate_json(row["data"]),
    )


@router.put("/{board_id}")
def update_board(
    board_id: int,
    data: BoardData,
    user: str = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> Board:
    row = _owned_board(conn, board_id, user)
    _write_board(conn, board_id, data)
    return Board(id=board_id, title=row["title"], data=data)


@router.delete("/{board_id}", status_code=204)
def delete_board(
    board_id: int,
    user: str = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> None:
    _owned_board(conn, board_id, user)
    conn.execute("DELETE FROM boards WHERE id = ?", (board_id,))
    conn.commit()


@router.post("/{board_id}/chat")
def chat(
    board_id: int,
    payload: ChatRequest,
    user: str = Depends(get_current_user),
    conn: sqlite3.Connection = Depends(get_db),
) -> ChatResponse:
    row = _owned_board(conn, board_id, user)
    board = BoardData.model_validate_json(row["data"])

    result = chat_about_board(board, payload.history, payload.message)
    if result.board is None:
        return ChatResponse(reply=result.reply, board=None)

    updated = result.board.to_board_data()
    _write_board(conn, board_id, updated)
    return ChatResponse(reply=result.reply, board=updated)
