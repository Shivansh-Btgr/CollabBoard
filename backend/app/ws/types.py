from pydantic import BaseModel, Field
from typing import Optional, Any, List
from uuid import UUID


# Event constants
EVENT_USER_AUTHENTICATE = "user.authenticate"
EVENT_BOARD_CONNECT = "board.connect"
EVENT_BOARD_DISCONNECT = "board.disconnect"
EVENT_POST_CREATE = "post.create"
EVENT_POST_UPDATE = "post.update"
EVENT_POST_DELETE = "post.delete"
EVENT_POST_FOCUS = "post.focus"
EVENT_POST_DRAG = "post.drag"
EVENT_VOICE_OFFER = "voice.offer"
EVENT_VOICE_ANSWER = "voice.answer"
EVENT_VOICE_ICE_CANDIDATE = "voice.ice_candidate"
EVENT_VOICE_MUTE = "voice.mute"

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


class ParamsBoardDisconnect(BaseModel):
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


class ParamsPostDrag(BaseModel):
    post_id: str
    board_id: str
    pos_x: int = Field(..., ge=0)
    pos_y: int = Field(..., ge=0)


class ParamsVoiceOffer(BaseModel):
    board_id: str
    target_user_id: str
    offer: dict  # SDP offer


class ParamsVoiceAnswer(BaseModel):
    board_id: str
    target_user_id: str
    answer: dict  # SDP answer


class ParamsVoiceIceCandidate(BaseModel):
    board_id: str
    target_user_id: str
    candidate: dict  # ICE candidate


class ParamsVoiceMute(BaseModel):
    board_id: str
    is_muted: bool


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


class ResultBoardDisconnect(BaseModel):
    board_id: str
    user: dict


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


class ResultPostDrag(BaseModel):
    post_id: str
    pos_x: int
    pos_y: int
    user: dict


class ResultVoiceOffer(BaseModel):
    from_user_id: str
    offer: dict


class ResultVoiceAnswer(BaseModel):
    from_user_id: str
    answer: dict


class ResultVoiceIceCandidate(BaseModel):
    from_user_id: str
    candidate: dict


class ResultVoiceMute(BaseModel):
    user_id: str
    is_muted: bool
