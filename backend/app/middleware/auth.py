from fastapi import Request, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.utils.jwt import jwt_service

security = HTTPBearer(auto_error=False)  # Don't auto-error, we'll handle it manually


async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract and verify JWT token from request, return user ID"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"get_current_user_id called, credentials object: {credentials}")
    logger.info(f"credentials is None: {credentials is None}")
    
    if not credentials:
        logger.error("Credentials object is None or empty - HTTPBearer failed to extract token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    token = credentials.credentials
    # Temporary debug log: do not log token value
    if token:
        logger.info(f'Auth token received (first 20 chars): {token[:20]}...')
    else:
        logger.error('Auth token missing in credentials object')

    user_id = jwt_service.verify_token(token)

    if user_id:
        logger.info(f'JWT verified successfully, user_id: {user_id}')
    else:
        logger.error('JWT verification failed - verify_token returned None')
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    return user_id


def get_user_id_from_request(request: Request) -> Optional[str]:
    """Extract user ID from request state (set by dependency)"""
    return getattr(request.state, "user_id", None)
