from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.config import settings


class JWTService:
    def __init__(self):
        self.secret_key = settings.JWT_SECRET_KEY
        self.algorithm = settings.JWT_ALGORITHM
        self.expiration_hours = settings.JWT_EXPIRATION

    def generate_token(self, user_id: str) -> str:
        """Generate JWT token for a user"""
        expire = datetime.utcnow() + timedelta(hours=self.expiration_hours)
        to_encode = {
            "userId": user_id,
            "exp": expire
        }
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[str]:
        """Verify JWT token and return user ID"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id: str = payload.get("userId")
            if user_id is None:
                return None
            return user_id
        except JWTError:
            return None


# Singleton instance
jwt_service = JWTService()
