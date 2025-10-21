from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255))
    email = Column(String(255), unique=True, nullable=True)
    password = Column(String(255), nullable=True)
    avatar_seed = Column(String(255), nullable=True)
    is_guest = Column(Boolean, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    boards = relationship("Board", back_populates="owner")
    board_memberships = relationship("BoardMembership", back_populates="user")
    board_invites = relationship("BoardInvite", back_populates="user")
    posts = relationship("Post", back_populates="user")
