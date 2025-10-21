'use client';

import update from 'immutability-helper';
import { FC, useEffect, useRef } from 'react';
import { useState } from 'react';
import { useDrop } from 'react-dnd';
import html2canvas from 'html2canvas';

import { DraggablePost } from './draggablePost';
import type { DragItem } from './interfaces';
import { ItemTypes } from './itemTypes';
import { snapToGrid as doSnapToGrid } from './snapToGrid';
import { Post } from '@/api/post';
import {
  BOARD_SPACE_ADD,
  COOKIE_NAME_JWT_TOKEN,
  EVENT_BOARD_CONNECT,
  EVENT_BOARD_DISCONNECT,
  EVENT_POST_CREATE,
  EVENT_POST_DELETE,
  EVENT_POST_DRAG,
  EVENT_POST_FOCUS,
  EVENT_POST_UPDATE,
  EVENT_USER_AUTHENTICATE,
  EVENT_VOICE_OFFER,
  EVENT_VOICE_ANSWER,
  EVENT_VOICE_ICE_CANDIDATE,
  EVENT_VOICE_MUTE,
  NAVBAR_HEIGHT,
  POST_COLORS,
  POST_HEIGHT,
  POST_WIDTH,
  SIDEBAR_WIDTH,
  WS_URL,
} from '@/constants';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import Cookies from 'universal-cookie';
import {
  authenticateUser as authenticateUserWS,
  connectBoard as connectBoardWS,
  createPost as createPostWS,
  disconnectBoard as disconnectBoardWS,
  updatePost as updatePostWS,
} from '@/ws/events';
import { Overlay } from '../overlay';
import { getMaxFieldFromObj } from '@/utils';
import toast from 'react-hot-toast';
import { BoardWithMembers } from '@/api/board';
import Sidebar from '../sidebar';
import { User } from '@/api';

export type PostUI = {
  typingBy: User | null;
} & Post;

export type PostMap = {
  [key: string]: Partial<PostUI>;
};
export interface BoardProps {
  snapToGrid: boolean;
  board: BoardWithMembers;
  posts: PostMap;
}

export const Board: FC<BoardProps> = ({ board, snapToGrid, posts: initialPosts }) => {
  const TEXT_CONNECTING = 'Connecting to board';
  const TEXT_NOT_CONNECTED = 'Not connected, try refreshing';
  const [posts, setPosts] = useState<PostMap>(initialPosts);
  const [overlayText, setOverlayText] = useState(TEXT_CONNECTING);
  const [showOverlay, setShowOverlay] = useState(true);
  const [user, setUser] = useState<User>();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [boardDimension, setBoardDimension] = useState({ height: 0, width: 0 });
  const [highestZ, setHighestZ] = useState(getMaxFieldFromObj(initialPosts, 'z_index'));
  const [colorSetting, setColorSetting] = useState(pickColor(posts));
  const { data, error, send, readyState } = useWebSocket(WS_URL);
  const cookies = new Cookies();
  const boardRef = useRef<HTMLDivElement>(null);
  
  // Voice chat hook
  const voiceChat = useVoiceChat(
    board.id,
    user?.id || '',
    send,
    connectedUsers
  );

  useEffect(() => {
    // Scroll to the top left portion of the page
    window.scrollTo(0, 0);

    // Cleanup: Send disconnect message when leaving the board
    return () => {
      if (readyState === WebSocket.OPEN) {
        disconnectBoardWS({ board_id: board.id }, send);
      }
    };
  }, [board.id, send, readyState]);

  // Expands the board based on post locations
  useEffect(() => {
    const newWidth = getMaxFieldFromObj(posts, 'pos_x') + POST_WIDTH + BOARD_SPACE_ADD;
    const newHeight = getMaxFieldFromObj(posts, 'pos_y') + POST_HEIGHT + BOARD_SPACE_ADD;
    setBoardDimension({ height: newHeight, width: newWidth });
  }, [posts]);

  // Handles the different connection states. Will authenticate the user if connection is established
  // or will show an error overlay if trouble connecting.
  useEffect(() => {
    if (readyState == WebSocket.OPEN) {
      setOverlayText(TEXT_CONNECTING);
      setShowOverlay(true);
      const jwtToken = cookies.get(COOKIE_NAME_JWT_TOKEN);
      authenticateUserWS(jwtToken, send);
    }
    if (readyState == WebSocket.CLOSED || readyState == WebSocket.CLOSING) {
      setOverlayText(TEXT_NOT_CONNECTED);
      setShowOverlay(true);
    }
  }, [readyState]);

  // Handles all the different post events
  useEffect(() => {
    if (data == null) {
      return;
    }
    const { event, result, success, error_message } = JSON.parse(data);
    switch (event) {
      case EVENT_USER_AUTHENTICATE:
        setUser(result.user);
        connectBoardWS(board.id, send);
        break;
      case EVENT_BOARD_CONNECT:
        if (success) {
          setShowOverlay(false);
          setConnectedUsers(result.connected_users.concat([result.new_user]));
        } else {
          toast.error(error_message);
        }
        break;
      case EVENT_POST_CREATE:
        if (success) {
          addPost(result.post);
        } else {
          toast.error(error_message);
        }
        break;
      case EVENT_POST_UPDATE:
        if (success) {
          updatePost({ ...result.post, typingBy: null });
        } else {
          toast.error(error_message);
        }
        break;
      case EVENT_POST_DELETE:
        if (success) {
          deletePost(result.post_id);
        } else {
          toast.error(error_message);
        }
        break;
      case EVENT_POST_FOCUS:
        if (success) {
          if (result.user.id != user?.id) {
            updatePost({ id: result.post_id, typingBy: result.user });
          }
        } else {
          toast.error(error_message);
        }
        break;
      case EVENT_POST_DRAG:
        if (success) {
          // Update position temporarily while dragging (from other users)
          if (result.user.id != user?.id) {
            updatePost({ id: result.post_id, pos_x: result.pos_x, pos_y: result.pos_y });
          }
        }
        break;
      case EVENT_BOARD_DISCONNECT:
        if (success) {
          setConnectedUsers((prev) => prev.filter((u: any) => u.id !== result.user.id));
        }
        break;
      case EVENT_VOICE_OFFER:
        if (success) {
          voiceChat.handleOffer(result.from_user_id, result.offer);
        }
        break;
      case EVENT_VOICE_ANSWER:
        if (success) {
          voiceChat.handleAnswer(result.from_user_id, result.answer);
        }
        break;
      case EVENT_VOICE_ICE_CANDIDATE:
        if (success) {
          voiceChat.handleIceCandidate(result.from_user_id, result.candidate);
        }
        break;
      case EVENT_VOICE_MUTE:
        if (success) {
          if (result.user_id !== user?.id) {
            voiceChat.setMutedUsers((prev) => {
              const newSet = new Set(prev);
              if (result.is_muted) {
                newSet.add(result.user_id);
              } else {
                newSet.delete(result.user_id);
              }
              return newSet;
            });
          }
        }
        break;

      default:
        break;
    }
  }, [data]);

  // handleDoubleClick creates a new post
  const handleDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      const { offsetX, offsetY } = event.nativeEvent;
      const newZIndex = highestZ + 1;
      const params = {
        board_id: board.id,
        content: '',
        pos_x: offsetX,
        pos_y: offsetY,
        color: colorSetting,
        height: POST_HEIGHT,
        z_index: highestZ + 1,
      };
      createPostWS(params, send);
      setHighestZ(newZIndex);
    }
  };

  // handleCreatePost creates a post at a default position (for button click)
  const handleCreatePost = () => {
    const defaultX = 100 + (Object.keys(posts).length * 50) % 500;
    const defaultY = 100 + Math.floor(Object.keys(posts).length / 10) * 150;
    const newZIndex = highestZ + 1;
    const params = {
      board_id: board.id,
      content: '',
      pos_x: defaultX,
      pos_y: defaultY,
      color: colorSetting,
      height: POST_HEIGHT,
      z_index: newZIndex,
    };
    createPostWS(params, send);
    setHighestZ(newZIndex);
  };

  // handleExportBoard exports the board as PNG
  const handleExportBoard = async () => {
    if (!boardRef.current) return;
    
    try {
      toast.loading('Exporting board...');
      
      // Capture the board element
      const canvas = await html2canvas(boardRef.current, {
        logging: false,
        useCORS: true,
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `board-${board.name || board.id}-${new Date().toISOString().split('T')[0]}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          toast.dismiss();
          toast.success('Board exported successfully!');
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast.dismiss();
      toast.error('Failed to export board');
    }
  };

  const addPost = (post: PostUI) => {
    setPosts(
      update(posts, {
        [post.id]: {
          $set: post,
        },
      })
    );
  };

  const updatePost = (post: { id: string } & Partial<PostUI>) => {
    setPosts(
      update(posts, {
        [post.id]: {
          $merge: post,
        },
      })
    );
  };

  const deletePost = (id: string) => {
    setPosts(
      update(posts, {
        $unset: [id],
      })
    );
  };

  const sendUpdatePost = (post: Partial<PostUI>) => {
    updatePostWS(post, send);
  };

  const [, drop] = useDrop(
    () => ({
      accept: ItemTypes.POST,
      drop(item: DragItem, monitor) {
        const delta = monitor.getDifferenceFromInitialOffset() as {
          x: number;
          y: number;
        };

        let pos_x = Math.max(item.pos_x + delta.x, 0);
        let pos_y = Math.max(item.pos_y + delta.y, 0);
        if (snapToGrid) {
          [pos_x, pos_y] = doSnapToGrid(pos_x, pos_y);
        }
        const newZIndex = getMaxFieldFromObj(posts, 'z_index') + 1;
        const newParams = { id: item.id, board_id: board.id, z_index: newZIndex, pos_x, pos_y };
        // pre-emptively update post on frontend before waiting on websocket to smoothen out experience
        updatePost({ id: item.id, z_index: newZIndex, pos_x, pos_y });
        sendUpdatePost(newParams);
        return undefined;
      },
    }),
    [updatePost]
  );

  return (
    <div className="flex">
      <Overlay show={showOverlay || !user} text={overlayText} />
      {user ? (
        <Sidebar 
          board={board} 
          width={SIDEBAR_WIDTH} 
          user={user} 
          connectedUsers={connectedUsers}
          voiceChat={voiceChat}
        />
      ) : null}
      
      {/* Action Buttons */}
      {user && !showOverlay && (
        <div className="fixed bottom-8 right-8 flex flex-col gap-3" style={{ zIndex: 10001 }}>
          {/* Export Board Button */}
          <button
            onClick={handleExportBoard}
            className="btn btn-secondary btn-lg btn-circle shadow-xl hover:scale-110 transition-transform"
            title="Export board as PNG"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          
          {/* Create Post Button */}
          <button
            onClick={handleCreatePost}
            className="btn btn-primary btn-lg btn-circle shadow-xl hover:scale-110 transition-transform"
            title="Create new post"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      )}
      
      <div
        ref={(node) => {
          drop(node);
          (boardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        }}
        className="relative sketchbook-bg"
        style={{
          minHeight: `calc(100vh - ${NAVBAR_HEIGHT})`,
          minWidth: `calc(100vw - ${SIDEBAR_WIDTH})`,
          height: boardDimension.height,
          width: boardDimension.width,
        }}
        onDoubleClick={handleDoubleClick}
      >
        {user
          ? Object.keys(posts).map((key) => (
              <DraggablePost
                key={key}
                user={user}
                board={board}
                {...(posts[key] as PostUI)}
                send={send}
                setColorSetting={setColorSetting}
              />
            ))
          : null}
      </div>
    </div>
  );
};

// pickColor returns the first color that hasn't been picked yet among the board. If no
// colors are available, return a random color
const pickColor = (posts: PostMap) => {
  const chosenColors = Object.values(posts).map(({ color }) => color);
  const availableColors = Object.values(POST_COLORS);
  availableColors.forEach((color) => {
    if (!chosenColors.includes(color)) {
      return color;
    }
  });
  const randIndex = Math.floor(Math.random() * availableColors.length);
  return availableColors[randIndex];
};
