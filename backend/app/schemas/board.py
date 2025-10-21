from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from uuid import UUID


class BoardMember(BaseModel):
    id: UUID
    name: str
    email: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


class BoardBase(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class BoardCreate(BoardBase):
    pass


class BoardImport(BaseModel):
    share_code: str


class Board(BoardBase):
    id: UUID
    user_id: UUID
    share_code: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BoardWithMembers(Board):
    members: List[BoardMember] = []

    class Config:
        from_attributes = True


class BoardsResponse(BaseModel):
    owned: List[BoardWithMembers]
    shared: List[BoardWithMembers]
