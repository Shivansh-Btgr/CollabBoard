from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
import secrets

from app.database import Base


def generate_share_code():
    """Generate a unique 8-character share code"""
    return secrets.token_urlsafe(6)[:8].upper()


class Board(Base):
    __tablename__ = "boards"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255))
    description = Column(Text)
    share_code = Column(String(20), unique=True, nullable=False, default=generate_share_code)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="boards")
    memberships = relationship("BoardMembership", back_populates="board")
    invites = relationship("BoardInvite", back_populates="board")
    posts = relationship("Post", back_populates="board")


class BoardMembershipRole(str, enum.Enum):
    MEMBER = "MEMBER"
    ADMIN = "ADMIN"


class BoardMembership(Base):
    __tablename__ = "board_memberships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"))
    role = Column(String(20))
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="board_memberships")
    board = relationship("Board", back_populates="memberships")


class BoardInviteStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    IGNORED = "IGNORED"


class BoardInvite(Base):
    __tablename__ = "board_invites"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"))
    status = Column(String(20), default="PENDING")
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="board_invites")
    board = relationship("Board", back_populates="invites")
