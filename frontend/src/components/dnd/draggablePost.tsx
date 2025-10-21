'use client';

import { CSSProperties, FC, useState, useRef, useEffect } from 'react';
import { memo } from 'react';
import type { DragSourceMonitor } from 'react-dnd';
import { useDrag } from 'react-dnd';

import { Post } from './post';
import { ItemTypes } from './itemTypes';
import { Send } from '@/ws/types';
import { BoardWithMembers, User } from '@/api';
import { PostUI } from './board';
import { dragPost } from '@/ws/events';

type DraggablePostProps = {
  user: User;
  board: BoardWithMembers;
  send: Send;
  setColorSetting: (color: string) => void;
} & PostUI;

export const DraggablePost: FC<DraggablePostProps> = memo(function DraggablePost(props) {
  const { id, content, pos_x, pos_y, z_index, typingBy, board, send } = props;
  const [isHovered, setIsHovered] = useState(false);
  const dragIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: ItemTypes.POST,
      item: { id, pos_x, pos_y, content },
      collect: (monitor: DragSourceMonitor) => {
        const isDragging = monitor.isDragging();
        
        // Send drag updates while dragging
        if (isDragging && !dragIntervalRef.current) {
          dragIntervalRef.current = setInterval(() => {
            const offset = monitor.getDifferenceFromInitialOffset();
            if (offset) {
              const newPosX = Math.max(pos_x + offset.x, 0);
              const newPosY = Math.max(pos_y + offset.y, 0);
              dragPost({ 
                post_id: id, 
                board_id: board.id, 
                pos_x: Math.round(newPosX), 
                pos_y: Math.round(newPosY) 
              }, send);
            }
          }, 50); // Send updates every 50ms
        } else if (!isDragging && dragIntervalRef.current) {
          clearInterval(dragIntervalRef.current);
          dragIntervalRef.current = null;
        }
        
        return { isDragging };
      },
      canDrag: !typingBy,
    }),
    [id, pos_x, pos_y, content, board.id, send]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dragIntervalRef.current) {
        clearInterval(dragIntervalRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={drag}
      style={getStyles(pos_x, pos_y, z_index, isHovered, isDragging)}
      role="DraggablePost"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Post {...props} />
    </div>
  );
});

function getStyles(
  pos_x: number,
  pos_y: number,
  z_index: number,
  isHovered: boolean,
  isDragging: boolean
): CSSProperties {
  const transform = `translate3d(${pos_x}px, ${pos_y}px, 0)`;
  return {
    position: 'absolute',
    transform,
    WebkitTransform: transform,
    // IE fallback: hide the real node using CSS when dragging
    // because IE will ignore our custom "empty image" drag preview.
    opacity: isDragging ? 0 : 1,
    height: isDragging ? 0 : '',
    zIndex: isHovered ? '10000' : z_index,
  };
}
