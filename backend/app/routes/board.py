from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from uuid import UUID
from typing import List

from app.database import get_db
from app.schemas.board import BoardCreate, Board, BoardWithMembers, BoardsResponse, BoardMember, BoardImport
from app.models.board import Board as BoardModel, BoardMembership
from app.models.user import User
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/boards", tags=["boards"])


def has_board_access(board_with_members: BoardWithMembers, user_id: str) -> bool:
    """Check if user has access to board"""
    if board_with_members.user_id and str(board_with_members.user_id) == user_id:
        return True
    
    for member in board_with_members.members:
        if str(member.id) == user_id:
            return True
    
    return False


def get_board_with_members(db: Session, board_id: str) -> BoardWithMembers:
    """Get board with its members"""
    board = db.query(BoardModel).filter(BoardModel.id == UUID(board_id)).first()
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    # Get members
    memberships = db.query(BoardMembership, User).join(
        User, BoardMembership.user_id == User.id
    ).filter(BoardMembership.board_id == board.id).all()
    
    members = []
    for membership, user in memberships:
        members.append(BoardMember(
            id=user.id,
            name=user.name,
            email=user.email,
            role=membership.role
        ))
    
    board_dict = {
        "id": board.id,
        "name": board.name,
        "description": board.description,
        "share_code": board.share_code,
        "user_id": board.user_id,
        "created_at": board.created_at,
        "updated_at": board.updated_at,
        "members": members
    }
    
    return BoardWithMembers(**board_dict)


@router.post("/", response_model=Board, status_code=status.HTTP_201_CREATED)
async def create_board(
    board_data: BoardCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Create a new board"""
    db_board = BoardModel(
        name=board_data.name,
        description=board_data.description,
        user_id=UUID(user_id)
    )
    
    db.add(db_board)
    db.commit()
    db.refresh(db_board)
    
    return Board.from_orm(db_board)


@router.get("/{board_id}", response_model=BoardWithMembers)
async def get_board(
    board_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get a single board with members"""
    try:
        board_with_members = get_board_with_members(db, board_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid board ID. Please ensure board ID is in UUID format"
        )
    
    # Check access
    if not has_board_access(board_with_members, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    return board_with_members


@router.get("/", response_model=BoardsResponse)
async def get_boards(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all boards for current user (owned and shared)"""
    user_uuid = UUID(user_id)
    
    # Get owned boards
    owned_boards = db.query(BoardModel).filter(BoardModel.user_id == user_uuid).all()
    owned_with_members = []
    for board in owned_boards:
        board_with_members = get_board_with_members(db, str(board.id))
        owned_with_members.append(board_with_members)
    
    # Get shared boards (where user is a member)
    shared_board_ids = db.query(BoardMembership.board_id).filter(
        BoardMembership.user_id == user_uuid
    ).all()
    
    shared_with_members = []
    for (board_id,) in shared_board_ids:
        board_with_members = get_board_with_members(db, str(board_id))
        shared_with_members.append(board_with_members)
    
    return BoardsResponse(owned=owned_with_members, shared=shared_with_members)


@router.post("/import", response_model=BoardWithMembers)
async def import_board(
    import_data: BoardImport,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Import a board using share code"""
    # Find board by share code
    board = db.query(BoardModel).filter(BoardModel.share_code == import_data.share_code.upper()).first()
    
    if not board:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid share code"
        )
    
    user_uuid = UUID(user_id)
    
    # Check if user is already the owner (only if board has an owner)
    if board.user_id and board.user_id == user_uuid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already own this board. You can access it from 'My Boards' section."
        )
    
    # Check if user is already a member
    existing_membership = db.query(BoardMembership).filter(
        BoardMembership.board_id == board.id,
        BoardMembership.user_id == user_uuid
    ).first()
    
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this board. You can access it from 'Shared With Me' section."
        )
    
    # Add user as a member
    membership = BoardMembership(
        board_id=board.id,
        user_id=user_uuid,
        role="MEMBER"
    )
    
    db.add(membership)
    db.commit()
    
    # Return the board with members
    return get_board_with_members(db, str(board.id))
