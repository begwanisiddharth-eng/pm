"""Pydantic models for boards. BoardData matches the frontend type."""

from pydantic import BaseModel


class Card(BaseModel):
    id: str
    title: str
    details: str


class Column(BaseModel):
    id: str
    title: str
    cardIds: list[str]


class BoardData(BaseModel):
    columns: list[Column]
    cards: dict[str, Card]


class BoardSummary(BaseModel):
    id: int
    title: str


class Board(BaseModel):
    id: int
    title: str
    data: BoardData


class BoardCreate(BaseModel):
    title: str
    data: BoardData | None = None
