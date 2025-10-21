from typing import Dict, Set, List
from fastapi import WebSocket
from app.models.user import User
from app.schemas.user import User as UserSchema


class Hub:
    """Manages WebSocket connections for a specific board"""
    
    def __init__(self, board_id: str):
        self.board_id = board_id
        self.clients: Dict[WebSocket, "Client"] = {}
    
    async def register(self, client: "Client"):
        """Register a new client to this hub"""
        self.clients[client.websocket] = client
    
    async def unregister(self, client: "Client"):
        """Unregister a client from this hub"""
        if client.websocket in self.clients:
            del self.clients[client.websocket]
    
    async def broadcast(self, message: str, exclude: WebSocket = None):
        """Broadcast message to all connected clients except excluded one"""
        for websocket, client in list(self.clients.items()):
            if websocket != exclude:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    print(f"Error broadcasting to client: {e}")
                    await self.unregister(client)
    
    def list_connected_users(self) -> List[dict]:
        """Get list of all connected users"""
        users = []
        for client in self.clients.values():
            if client.user:
                users.append({
                    "id": str(client.user["id"]),
                    "name": client.user["name"],
                    "email": client.user.get("email"),
                    "is_guest": client.user.get("is_guest", False)
                })
        return users
    
    def is_empty(self) -> bool:
        """Check if hub has no clients"""
        return len(self.clients) == 0


class Client:
    """Represents a WebSocket client connection"""
    
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket
        self.user: dict = None
        self.boards: Dict[str, bool] = {}  # board_id -> can_write
    
    async def send(self, message: str):
        """Send message to this client"""
        try:
            await self.websocket.send_text(message)
        except Exception as e:
            print(f"Error sending message to client: {e}")
    
    async def close(self, code: int = 1000, reason: str = ""):
        """Close the WebSocket connection"""
        try:
            await self.websocket.close(code=code, reason=reason)
        except Exception as e:
            print(f"Error closing connection: {e}")
