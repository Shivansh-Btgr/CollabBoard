from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    avatar_seed: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None
    is_guest: bool = False


class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_seed: Optional[str] = None


class User(UserBase):
    id: UUID
    is_guest: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    user: User
    jwt_token: str


class UserInDB(User):
    password: str

    class Config:
        from_attributes = True
