from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json
import logging
from uuid import UUID

from app.ws.hub import Hub, Client
from app.ws.types import (
    WSRequest, WSResponse,
    ParamsUserAuthenticate, ParamsBoardConnect, ParamsBoardDisconnect, ParamsPostCreate,
    ParamsPostUpdate, ParamsPostDelete, ParamsPostFocus, ParamsPostDrag,
    ParamsVoiceOffer, ParamsVoiceAnswer, ParamsVoiceIceCandidate, ParamsVoiceMute,
    ResultUserAuthenticate, ResultBoardConnect, ResultBoardDisconnect, ResultPostCreate,
    ResultPostUpdate, ResultPostDelete, ResultPostFocus, ResultPostDrag,
    ResultVoiceOffer, ResultVoiceAnswer, ResultVoiceIceCandidate, ResultVoiceMute,
    EVENT_USER_AUTHENTICATE, EVENT_BOARD_CONNECT, EVENT_BOARD_DISCONNECT,
    EVENT_POST_CREATE, EVENT_POST_UPDATE, EVENT_POST_DELETE, EVENT_POST_FOCUS, EVENT_POST_DRAG,
    EVENT_VOICE_OFFER, EVENT_VOICE_ANSWER, EVENT_VOICE_ICE_CANDIDATE, EVENT_VOICE_MUTE,
    CLOSE_REASON_BAD_EVENT, CLOSE_REASON_BAD_PARAMS,
    CLOSE_REASON_UNAUTHORIZED, CLOSE_REASON_INTERNAL_SERVER,
    ERR_MSG_INVALID_JWT, ERR_MSG_BOARD_NOT_FOUND, ERR_MSG_UNAUTHORIZED
)
from app.utils.jwt import jwt_service
from app.database import SessionLocal
from app.models.user import User
from app.models.post import Post
from app.routes.board import get_board_with_members, has_board_access

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages all WebSocket connections and hubs"""
    
    def __init__(self):
        self.board_hubs: Dict[str, Hub] = {}
    
    def get_or_create_hub(self, board_id: str) -> Hub:
        """Get existing hub or create new one for a board"""
        if board_id not in self.board_hubs:
            self.board_hubs[board_id] = Hub(board_id)
        return self.board_hubs[board_id]
    
    def remove_hub_if_empty(self, board_id: str):
        """Remove hub if it has no clients"""
        if board_id in self.board_hubs:
            hub = self.board_hubs[board_id]
            if hub.is_empty():
                del self.board_hubs[board_id]
    
    async def handle_connection(self, websocket: WebSocket):
        """Handle a new WebSocket connection"""
        await websocket.accept()
        client = Client(websocket)
        
        try:
            while True:
                # Receive message
                data = await websocket.receive_text()
                await self.handle_message(client, data)
        except WebSocketDisconnect:
            logger.info("Client disconnected")
            await self.cleanup_client(client)
        except Exception as e:
            logger.error(f"Error handling connection: {e}")
            await self.cleanup_client(client)
    
    async def cleanup_client(self, client: Client):
        """Clean up client from all hubs"""
        for board_id in list(client.boards.keys()):
            if board_id in self.board_hubs:
                hub = self.board_hubs[board_id]
                await hub.unregister(client)
                self.remove_hub_if_empty(board_id)
    
    async def handle_message(self, client: Client, message: str):
        """Route and handle WebSocket messages"""
        try:
            request = WSRequest(**json.loads(message))
        except Exception as e:
            logger.error(f"Failed to parse message: {e}")
            await client.close(code=1003, reason=CLOSE_REASON_BAD_EVENT)
            return
        
        # Route to appropriate handler
        if request.event == EVENT_USER_AUTHENTICATE:
            await self.handle_user_authenticate(client, request)
        elif request.event == EVENT_BOARD_CONNECT:
            await self.handle_board_connect(client, request)
        elif request.event == EVENT_BOARD_DISCONNECT:
            await self.handle_board_disconnect(client, request)
        elif request.event == EVENT_POST_CREATE:
            await self.handle_post_create(client, request)
        elif request.event == EVENT_POST_UPDATE:
            await self.handle_post_update(client, request)
        elif request.event == EVENT_POST_DELETE:
            await self.handle_post_delete(client, request)
        elif request.event == EVENT_POST_FOCUS:
            await self.handle_post_focus(client, request)
        elif request.event == EVENT_POST_DRAG:
            await self.handle_post_drag(client, request)
        elif request.event == EVENT_VOICE_OFFER:
            await self.handle_voice_offer(client, request)
        elif request.event == EVENT_VOICE_ANSWER:
            await self.handle_voice_answer(client, request)
        elif request.event == EVENT_VOICE_ICE_CANDIDATE:
            await self.handle_voice_ice_candidate(client, request)
        elif request.event == EVENT_VOICE_MUTE:
            await self.handle_voice_mute(client, request)
        else:
            logger.warning(f"Unsupported event: {request.event}")
    
    async def handle_user_authenticate(self, client: Client, request: WSRequest):
        """Authenticate user via JWT"""
        try:
            params = ParamsUserAuthenticate(**request.params)
        except Exception:
            await client.close(code=1003, reason=CLOSE_REASON_BAD_PARAMS)
            return
        
        # Verify token
        user_id = jwt_service.verify_token(params.jwt)
        
        if not user_id:
            response = WSResponse(
                event=EVENT_USER_AUTHENTICATE,
                success=False,
                error_message=ERR_MSG_INVALID_JWT
            )
            await client.send(response.json())
            return
        
        # Get user from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.id == UUID(user_id)).first()
            if not user:
                response = WSResponse(
                    event=EVENT_USER_AUTHENTICATE,
                    success=False,
                    error_message=ERR_MSG_INVALID_JWT
                )
                await client.send(response.json())
                return
            
            # Store user in client
            client.user = {
                "id": str(user.id),
                "name": user.name,
                "email": user.email,
                "is_guest": user.is_guest
            }
            
            # Send success response
            response = WSResponse(
                event=EVENT_USER_AUTHENTICATE,
                success=True,
                result=ResultUserAuthenticate(user=client.user).dict()
            )
            await client.send(response.json())
        finally:
            db.close()
    
    async def handle_board_connect(self, client: Client, request: WSRequest):
        """Connect user to a board hub"""
        if not client.user:
            await client.close(code=1008, reason=CLOSE_REASON_UNAUTHORIZED)
            return
        
        try:
            params = ParamsBoardConnect(**request.params)
        except Exception:
            await client.close(code=1003, reason=CLOSE_REASON_BAD_PARAMS)
            return
        
        board_id = params.board_id
        
        # Verify board access
        db = SessionLocal()
        try:
            board_with_members = get_board_with_members(db, board_id)
            
            if not has_board_access(board_with_members, client.user["id"]):
                response = WSResponse(
                    event=EVENT_BOARD_CONNECT,
                    success=False,
                    error_message=ERR_MSG_BOARD_NOT_FOUND
                )
                await client.send(response.json())
                return
            
            # Get or create hub
            hub = self.get_or_create_hub(board_id)
            
            # Get existing users before registering new client
            existing_users = hub.list_connected_users()
            
            # Register client
            await hub.register(client)
            client.boards[board_id] = True  # can_write
            
            # Broadcast to all clients
            response = WSResponse(
                event=EVENT_BOARD_CONNECT,
                success=True,
                result=ResultBoardConnect(
                    board_id=board_id,
                    new_user=client.user,
                    connected_users=existing_users
                ).dict()
            )
            await hub.broadcast(response.json())
        except Exception as e:
            logger.error(f"Error connecting to board: {e}")
            response = WSResponse(
                event=EVENT_BOARD_CONNECT,
                success=False,
                error_message=ERR_MSG_BOARD_NOT_FOUND
            )
            await client.send(response.json())
        finally:
            db.close()
    
    async def handle_board_disconnect(self, client: Client, request: WSRequest):
        """Handle user disconnecting from a board"""
        if not client.user:
            return
        
        try:
            params = ParamsBoardDisconnect(**request.params)
        except Exception:
            return
        
        board_id = params.board_id
        
        # Remove client from hub
        if board_id in self.board_hubs:
            hub = self.board_hubs[board_id]
            await hub.unregister(client)
            
            # Broadcast disconnect to remaining clients
            response = WSResponse(
                event=EVENT_BOARD_DISCONNECT,
                success=True,
                result=ResultBoardDisconnect(
                    board_id=board_id,
                    user=client.user
                ).dict()
            )
            await hub.broadcast(response.json())
            
            # Remove board from client's boards
            if board_id in client.boards:
                del client.boards[board_id]
            
            # Clean up empty hub
            self.remove_hub_if_empty(board_id)
    
    async def handle_post_create(self, client: Client, request: WSRequest):
        """Handle post creation"""
        if not client.user:
            await client.close(code=1008, reason=CLOSE_REASON_UNAUTHORIZED)
            return
        
        try:
            params = ParamsPostCreate(**request.params)
        except Exception as e:
            logger.error(f"Invalid post create params: {e}")
            return
        
        board_id = params.board_id
        
        if board_id not in client.boards or not client.boards[board_id]:
            response = WSResponse(
                event=EVENT_POST_CREATE,
                success=False,
                error_message=ERR_MSG_UNAUTHORIZED
            )
            await client.send(response.json())
            return
        
        # Create post in database
        db = SessionLocal()
        try:
            post = Post(
                board_id=UUID(board_id),
                user_id=UUID(client.user["id"]),
                content=params.content,
                pos_x=params.pos_x,
                pos_y=params.pos_y,
                color=params.color,
                height=params.height,
                z_index=params.z_index
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            
            # Broadcast to all clients in the board
            post_dict = {
                "id": str(post.id),
                "board_id": str(post.board_id),
                "user_id": str(post.user_id),
                "content": post.content,
                "pos_x": post.pos_x,
                "pos_y": post.pos_y,
                "color": post.color,
                "height": post.height,
                "z_index": post.z_index,
                "created_at": post.created_at.isoformat(),
                "updated_at": post.updated_at.isoformat()
            }
            
            response = WSResponse(
                event=EVENT_POST_CREATE,
                success=True,
                result=ResultPostCreate(post=post_dict, user=client.user).dict()
            )
            
            hub = self.board_hubs.get(board_id)
            if hub:
                await hub.broadcast(response.json())
        except Exception as e:
            logger.error(f"Error creating post: {e}")
        finally:
            db.close()
    
    async def handle_post_update(self, client: Client, request: WSRequest):
        """Handle post update"""
        if not client.user:
            await client.close(code=1008, reason=CLOSE_REASON_UNAUTHORIZED)
            return
        
        try:
            params = ParamsPostUpdate(**request.params)
        except Exception as e:
            logger.error(f"Invalid post update params: {e}")
            return
        
        board_id = params.board_id
        
        if board_id not in client.boards or not client.boards[board_id]:
            response = WSResponse(
                event=EVENT_POST_UPDATE,
                success=False,
                error_message=ERR_MSG_UNAUTHORIZED
            )
            await client.send(response.json())
            return
        
        # Update post in database
        db = SessionLocal()
        try:
            post = db.query(Post).filter(Post.id == params.id).first()
            if not post:
                return
            
            # Update fields
            if params.content is not None:
                post.content = params.content
            if params.pos_x is not None:
                post.pos_x = params.pos_x
            if params.pos_y is not None:
                post.pos_y = params.pos_y
            if params.color is not None:
                post.color = params.color
            if params.height is not None:
                post.height = params.height
            if params.z_index is not None:
                post.z_index = params.z_index
            
            db.commit()
            db.refresh(post)
            
            # Broadcast to all clients
            post_dict = {
                "id": str(post.id),
                "board_id": str(post.board_id),
                "user_id": str(post.user_id),
                "content": post.content,
                "pos_x": post.pos_x,
                "pos_y": post.pos_y,
                "color": post.color,
                "height": post.height,
                "z_index": post.z_index,
                "created_at": post.created_at.isoformat(),
                "updated_at": post.updated_at.isoformat()
            }
            
            response = WSResponse(
                event=EVENT_POST_UPDATE,
                success=True,
                result=ResultPostUpdate(post=post_dict, user=client.user).dict()
            )
            
            hub = self.board_hubs.get(board_id)
            if hub:
                await hub.broadcast(response.json())
        except Exception as e:
            logger.error(f"Error updating post: {e}")
        finally:
            db.close()
    
    async def handle_post_delete(self, client: Client, request: WSRequest):
        """Handle post deletion"""
        if not client.user:
            await client.close(code=1008, reason=CLOSE_REASON_UNAUTHORIZED)
            return
        
        try:
            params = ParamsPostDelete(**request.params)
        except Exception as e:
            logger.error(f"Invalid post delete params: {e}")
            return
        
        board_id = params.board_id
        
        if board_id not in client.boards or not client.boards[board_id]:
            response = WSResponse(
                event=EVENT_POST_DELETE,
                success=False,
                error_message=ERR_MSG_UNAUTHORIZED
            )
            await client.send(response.json())
            return
        
        # Delete post from database
        db = SessionLocal()
        try:
            post = db.query(Post).filter(Post.id == UUID(params.post_id)).first()
            if post:
                db.delete(post)
                db.commit()
                
                # Broadcast to all clients
                response = WSResponse(
                    event=EVENT_POST_DELETE,
                    success=True,
                    result=ResultPostDelete(
                        post_id=params.post_id,
                        board_id=board_id,
                        user=client.user
                    ).dict()
                )
                
                hub = self.board_hubs.get(board_id)
                if hub:
                    await hub.broadcast(response.json())
        except Exception as e:
            logger.error(f"Error deleting post: {e}")
        finally:
            db.close()
    
    async def handle_post_focus(self, client: Client, request: WSRequest):
        """Handle post focus (user is editing a post)"""
        if not client.user:
            await client.close(code=1008, reason=CLOSE_REASON_UNAUTHORIZED)
            return
        
        try:
            params = ParamsPostFocus(**request.params)
        except Exception:
            return
        
        board_id = params.board_id
        
        # Broadcast focus event to other clients
        response = WSResponse(
            event=EVENT_POST_FOCUS,
            success=True,
            result=ResultPostFocus(
                post_id=params.post_id,
                user=client.user
            ).dict()
        )
        
        hub = self.board_hubs.get(board_id)
        if hub:
            await hub.broadcast(response.json(), exclude=client.websocket)
    
    async def handle_post_drag(self, client: Client, request: WSRequest):
        """Handle post drag (real-time position updates while dragging)"""
        if not client.user:
            await client.close(code=1008, reason=CLOSE_REASON_UNAUTHORIZED)
            return
        
        try:
            params = ParamsPostDrag(**request.params)
        except Exception as e:
            logger.error(f"Invalid post drag params: {e}")
            return
        
        board_id = params.board_id
        
        if board_id not in client.boards or not client.boards[board_id]:
            return
        
        # Broadcast drag event to other clients (no database write)
        response = WSResponse(
            event=EVENT_POST_DRAG,
            success=True,
            result=ResultPostDrag(
                post_id=params.post_id,
                pos_x=params.pos_x,
                pos_y=params.pos_y,
                user=client.user
            ).dict()
        )
        
        hub = self.board_hubs.get(board_id)
        if hub:
            await hub.broadcast(response.json(), exclude=client.websocket)
    
    async def handle_voice_offer(self, client: Client, request: WSRequest):
        """Relay WebRTC offer to target user"""
        if not client.user:
            return
        
        try:
            params = ParamsVoiceOffer(**request.params)
        except Exception as e:
            logger.error(f"Invalid voice offer params: {e}")
            return
        
        board_id = params.board_id
        hub = self.board_hubs.get(board_id)
        if not hub:
            return
        
        # Find target client and send offer
        for websocket, target_client in hub.clients.items():
            if target_client.user and target_client.user["id"] == params.target_user_id:
                response = WSResponse(
                    event=EVENT_VOICE_OFFER,
                    success=True,
                    result=ResultVoiceOffer(
                        from_user_id=client.user["id"],
                        offer=params.offer
                    ).dict()
                )
                await target_client.send(response.json())
                break
    
    async def handle_voice_answer(self, client: Client, request: WSRequest):
        """Relay WebRTC answer to target user"""
        if not client.user:
            return
        
        try:
            params = ParamsVoiceAnswer(**request.params)
        except Exception as e:
            logger.error(f"Invalid voice answer params: {e}")
            return
        
        board_id = params.board_id
        hub = self.board_hubs.get(board_id)
        if not hub:
            return
        
        # Find target client and send answer
        for websocket, target_client in hub.clients.items():
            if target_client.user and target_client.user["id"] == params.target_user_id:
                response = WSResponse(
                    event=EVENT_VOICE_ANSWER,
                    success=True,
                    result=ResultVoiceAnswer(
                        from_user_id=client.user["id"],
                        answer=params.answer
                    ).dict()
                )
                await target_client.send(response.json())
                break
    
    async def handle_voice_ice_candidate(self, client: Client, request: WSRequest):
        """Relay ICE candidate to target user"""
        if not client.user:
            return
        
        try:
            params = ParamsVoiceIceCandidate(**request.params)
        except Exception as e:
            logger.error(f"Invalid ICE candidate params: {e}")
            return
        
        board_id = params.board_id
        hub = self.board_hubs.get(board_id)
        if not hub:
            return
        
        # Find target client and send ICE candidate
        for websocket, target_client in hub.clients.items():
            if target_client.user and target_client.user["id"] == params.target_user_id:
                response = WSResponse(
                    event=EVENT_VOICE_ICE_CANDIDATE,
                    success=True,
                    result=ResultVoiceIceCandidate(
                        from_user_id=client.user["id"],
                        candidate=params.candidate
                    ).dict()
                )
                await target_client.send(response.json())
                break
    
    async def handle_voice_mute(self, client: Client, request: WSRequest):
        """Broadcast mute status to all users in board"""
        if not client.user:
            return
        
        try:
            params = ParamsVoiceMute(**request.params)
        except Exception as e:
            logger.error(f"Invalid voice mute params: {e}")
            return
        
        board_id = params.board_id
        hub = self.board_hubs.get(board_id)
        if not hub:
            return
        
        # Broadcast mute status
        response = WSResponse(
            event=EVENT_VOICE_MUTE,
            success=True,
            result=ResultVoiceMute(
                user_id=client.user["id"],
                is_muted=params.is_muted
            ).dict()
        )
        await hub.broadcast(response.json())


# Global WebSocket manager instance
ws_manager = WebSocketManager()
