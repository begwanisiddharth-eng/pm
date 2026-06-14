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


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class AIBoard(BaseModel):
    """Board shape the model emits. Cards are a list (Structured Outputs has no
    open-ended maps); converted to the keyed BoardData server-side."""

    columns: list[Column]
    cards: list[Card]

    def to_board_data(self) -> BoardData:
        return BoardData(columns=self.columns, cards={c.id: c for c in self.cards})


class AIStructuredResponse(BaseModel):
    reply: str
    board: AIBoard | None


class ChatResponse(BaseModel):
    reply: str
    board: BoardData | None = None
