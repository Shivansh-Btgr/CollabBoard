from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    token: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
