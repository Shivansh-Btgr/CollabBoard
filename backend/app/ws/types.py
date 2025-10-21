from pydantic import BaseModel, Field
from typing import Optional, Any, List
from uuid import UUID


# Event constants
EVENT_USER_AUTHENTICATE = "user.authenticate"
EVENT_BOARD_CONNECT = "board.connect"
EVENT_POST_CREATE = "post.create"
EVENT_POST_UPDATE = "post.update"
EVENT_POST_DELETE = "post.delete"
EVENT_POST_FOCUS = "post.focus"

# Close reasons
CLOSE_REASON_MISSING_EVENT = "The event field is missing."
CLOSE_REASON_UNSUPPORTED_EVENT = "The event is unsupported."
CLOSE_REASON_BAD_EVENT = "The event field is an incorrect type."
CLOSE_REASON_BAD_PARAMS = "The params have incorrect field types."
CLOSE_REASON_INTERNAL_SERVER = "Internal server error."
CLOSE_REASON_UNAUTHORIZED = "Unauthorized."

# Error messages
ERR_MSG_INVALID_JWT = "Invalid JWT token supplied."
ERR_MSG_BOARD_NOT_FOUND = "Board not found."
ERR_MSG_UNAUTHORIZED = "Unauthorized."
ERR_MSG_INTERNAL_SERVER = "Internal server error."


# Request schemas
class WSRequest(BaseModel):
    event: str
    params: dict


class ParamsUserAuthenticate(BaseModel):
    jwt: str


class ParamsBoardConnect(BaseModel):
    board_id: str


class ParamsPostCreate(BaseModel):
    board_id: str = Field(..., description="Board ID")
    content: str = ""
    pos_x: int = Field(..., ge=0)
    pos_y: int = Field(..., ge=0)
    color: str = Field(..., min_length=7, max_length=7)
    height: int = Field(..., ge=0)
    z_index: int = Field(..., ge=1)


class ParamsPostUpdate(BaseModel):
    board_id: str
    id: UUID
    content: Optional[str] = None
    pos_x: Optional[int] = Field(None, ge=0)
    pos_y: Optional[int] = Field(None, ge=0)
    color: Optional[str] = Field(None, min_length=7, max_length=7)
    height: Optional[int] = Field(None, ge=0)
    z_index: Optional[int] = Field(None, ge=1)


class ParamsPostDelete(BaseModel):
    post_id: str
    board_id: str


class ParamsPostFocus(BaseModel):
    post_id: str
    board_id: str


# Response schemas
class WSResponse(BaseModel):
    event: str
    success: bool
    result: Optional[Any] = None
    error_message: Optional[str] = None


class ResultUserAuthenticate(BaseModel):
    user: dict


class ResultBoardConnect(BaseModel):
    board_id: str
    new_user: dict
    connected_users: List[dict]


class ResultPostCreate(BaseModel):
    post: dict
    user: dict


class ResultPostUpdate(BaseModel):
    post: dict
    user: dict


class ResultPostDelete(BaseModel):
    post_id: str
    board_id: str
    user: dict


class ResultPostFocus(BaseModel):
    post_id: str
    user: dict
