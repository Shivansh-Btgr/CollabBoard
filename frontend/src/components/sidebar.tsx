'use client';
import { NAVBAR_HEIGHT } from '@/constants';
import Avatar from './avatar';
import { User, BoardWithMembers } from '@/api';
import { mergeArrays } from '@/utils';
import { FaMicrophone, FaMicrophoneSlash, FaPhone, FaPhoneSlash } from 'react-icons/fa';

interface SidebarProps {
  width: string;
  board: BoardWithMembers;
  user: User;
  connectedUsers: User[];
  voiceChat?: {
    isMuted: boolean;
    isConnecting: boolean;
    mutedUsers: Set<string>;
    toggleMute: () => void;
    connectToAllUsers: () => void;
  };
}

const Sidebar = ({ width, board, user, connectedUsers, voiceChat }: SidebarProps) => {
  const allUsers = mergeArrays('id', [user], connectedUsers, board.members);
  connectedUsers = mergeArrays('id', [user], connectedUsers);
  const onlineFraction = `${connectedUsers.length} / ${allUsers.length}`;

  return (
    <div
      className="fixed top-h-16 left-0 bg-base-100 shadow-md"
      style={{ height: `calc(100vh - ${NAVBAR_HEIGHT})`, width, zIndex: 10001 }}
    >
      <div className="flex flex-col items-center justify-between h-full py-8">
        <div className="flex flex-col items-center w-full">
          <p className="text-gray-700 text-md font-bold">Members</p>
          
          {/* Voice Chat Controls */}
          {voiceChat && (
            <div className="flex flex-col items-center w-full px-4 py-3 space-y-2">
              <button
                onClick={voiceChat.connectToAllUsers}
                disabled={voiceChat.isConnecting}
                className={`btn btn-sm ${voiceChat.isConnecting ? 'btn-disabled' : 'btn-success'} gap-2`}
                title="Join voice chat"
              >
                {voiceChat.isConnecting ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <FaPhone />
                )}
                Join Voice
              </button>
              
              <button
                onClick={voiceChat.toggleMute}
                className={`btn btn-sm ${voiceChat.isMuted ? 'btn-error' : 'btn-primary'} gap-2`}
                title={voiceChat.isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {voiceChat.isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                {voiceChat.isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          )}
          
          <div className="divider" />
          
          <div
            className="overflow-y-auto max-h-[500px] w-full p-6"
            style={{ background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 1))' }}
          >
            <div className="flex flex-col items-start space-y-4">
              {allUsers.map((u) => (
                <SidebarMember 
                  key={u.id} 
                  user={u} 
                  isConnected={isConnected(u.id, connectedUsers)}
                  isMuted={voiceChat?.mutedUsers.has(u.id)}
                  isSelf={u.id === user.id}
                />
              ))}
            </div>
          </div>
          <div className="divider" />
        </div>
        <div className="flex flex-col justify-center items-center space-y-1">
          <div className="badge badge-primary rounded-md p-3">{onlineFraction}</div>
          <span className="text-sm text-gray-700">Online</span>
        </div>
      </div>
    </div>
  );
};

function SidebarMember({ user, isConnected, isMuted, isSelf }: { user: User; isConnected: boolean; isMuted?: boolean; isSelf?: boolean }) {
  return (
    <div key={user.id} className="flex space-x-2 items-center justify-between w-full">
      <div className="flex space-x-2 items-center">
        <Avatar id={user.avatar_seed || user.id} />
        <span className="text-sm" style={{ fontWeight: isConnected ? 700 : 300, color: isConnected ? 'black' : 'gray' }}>
          {user.name} {isSelf && '(You)'}
        </span>
      </div>
      {isConnected && isMuted !== undefined && (
        <span title={isMuted ? 'Muted' : 'Speaking'}>
          {isMuted ? <FaMicrophoneSlash className="text-error" /> : <FaMicrophone className="text-success" />}
        </span>
      )}
    </div>
  );
}

function isConnected(userId: string, connectedUsers: User[]): boolean {
  let connected = false;
  connectedUsers.some((user) => {
    if (user.id == userId) {
      connected = true;
      return;
    }
  });
  return connected;
}

export default Sidebar;
