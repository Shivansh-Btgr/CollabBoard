from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database import get_db
from app.schemas.post import Post, PostsResponse
from app.models.post import Post as PostModel
from app.routes.board import get_board_with_members, has_board_access
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/posts", tags=["posts"])


@router.get("/", response_model=PostsResponse)
async def list_posts(
    boardId: str = Query(..., alias="boardId", description="Board ID to fetch posts for"),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get all posts for a board"""
    # Verify board access
    try:
        board_with_members = get_board_with_members(db, boardId)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid board ID. Please pass in a boardId query param"
        )
    
    if not has_board_access(board_with_members, user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Board not found"
        )
    
    # Get posts
    posts = db.query(PostModel).filter(PostModel.board_id == UUID(boardId)).all()
    
    post_list = [Post.from_orm(post) for post in posts]
    
    return PostsResponse(data=post_list)
