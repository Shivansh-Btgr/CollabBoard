from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class PostBase(BaseModel):
    content: str = ""
    pos_x: int = Field(..., ge=0)
    pos_y: int = Field(..., ge=0)
    color: str = Field(..., min_length=7, max_length=7)
    height: int = Field(..., ge=0)
    z_index: int = Field(..., ge=1)


class PostCreate(PostBase):
    board_id: UUID


class PostUpdate(BaseModel):
    id: UUID
    content: Optional[str] = None
    pos_x: Optional[int] = Field(None, ge=0)
    pos_y: Optional[int] = Field(None, ge=0)
    color: Optional[str] = Field(None, min_length=7, max_length=7)
    height: Optional[int] = Field(None, ge=0)
    z_index: Optional[int] = Field(None, ge=1)


class Post(PostBase):
    id: UUID
    board_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PostsResponse(BaseModel):
    data: list[Post]
