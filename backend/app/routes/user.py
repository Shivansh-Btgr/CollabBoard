from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from uuid import UUID

from app.database import get_db
from app.schemas.user import UserCreate, User as UserSchema, UserResponse
from app.models.user import User
from app.utils.password import get_password_hash
from app.utils.jwt import jwt_service
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """Create a new user"""
    # Hash password
    hashed_password = get_password_hash(user_data.password)
    
    # Create user
    db_user = User(
        name=user_data.name,
        email=user_data.email,
        password=hashed_password,
        is_guest=False
    )
    
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists"
        )
    
    # Generate JWT token
    jwt_token = jwt_service.generate_token(str(db_user.id))
    
    # Return user without password
    user_response = UserSchema.from_orm(db_user)
    
    return UserResponse(user=user_response, jwt_token=jwt_token)


@router.get("/me", response_model=UserSchema)
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get current authenticated user"""
    user = db.query(User).filter(User.id == UUID(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserSchema.from_orm(user)
