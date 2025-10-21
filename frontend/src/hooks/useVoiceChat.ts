import { useEffect, useRef, useState, useCallback } from 'react';
import { Send } from '@/ws/types';
import {
  EVENT_VOICE_OFFER,
  EVENT_VOICE_ANSWER,
  EVENT_VOICE_ICE_CANDIDATE,
  EVENT_VOICE_MUTE,
} from '@/constants';

interface PeerConnection {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

export const useVoiceChat = (
  boardId: string,
  userId: string,
  send: Send | null,
  connectedUsers: any[]
) => {
  const [isMuted, setIsMuted] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, PeerConnection>>(new Map());

  const ICE_SERVERS = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

  // Initialize local audio stream
  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      // Start muted
      stream.getAudioTracks().forEach((track) => (track.enabled = false));
      return stream;
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw error;
    }
  }, []);

  // Create peer connection for a specific user
  const createPeerConnection = useCallback(
    (targetUserId: string): RTCPeerConnection => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Add local stream tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current!);
        });
      }

      // Handle incoming stream
      pc.ontrack = (event) => {
        const remoteStream = event.streams[0];
        
        // Store the stream
        const existingConnection = peerConnectionsRef.current.get(targetUserId);
        if (existingConnection) {
          existingConnection.stream = remoteStream;
          peerConnectionsRef.current.set(targetUserId, existingConnection);
        }

        // Play the audio
        const audio = new Audio();
        audio.srcObject = remoteStream;
        audio.play().catch((e) => console.error('Error playing audio:', e));
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && send) {
          const message = JSON.stringify({
            event: EVENT_VOICE_ICE_CANDIDATE,
            params: {
              board_id: boardId,
              target_user_id: targetUserId,
              candidate: event.candidate.toJSON(),
            },
          });
          send(message);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peerConnectionsRef.current.delete(targetUserId);
        }
      };

      return pc;
    },
    [boardId, send]
  );

  // Create and send offer to a peer
  const createOffer = useCallback(
    async (targetUserId: string) => {
      if (!send) return;

      try {
        const pc = createPeerConnection(targetUserId);
        peerConnectionsRef.current.set(targetUserId, { connection: pc });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        const message = JSON.stringify({
          event: EVENT_VOICE_OFFER,
          params: {
            board_id: boardId,
            target_user_id: targetUserId,
            offer: {
              type: offer.type,
              sdp: offer.sdp,
            },
          },
        });
        send(message);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    },
    [boardId, send, createPeerConnection]
  );

  // Handle incoming offer
  const handleOffer = useCallback(
    async (fromUserId: string, offer: RTCSessionDescriptionInit) => {
      if (!send) return;

      try {
        const pc = createPeerConnection(fromUserId);
        peerConnectionsRef.current.set(fromUserId, { connection: pc });

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const message = JSON.stringify({
          event: EVENT_VOICE_ANSWER,
          params: {
            board_id: boardId,
            target_user_id: fromUserId,
            answer: {
              type: answer.type,
              sdp: answer.sdp,
            },
          },
        });
        send(message);
      } catch (error) {
        console.error('Error handling offer:', error);
      }
    },
    [boardId, send, createPeerConnection]
  );

  // Handle incoming answer
  const handleAnswer = useCallback(
    async (fromUserId: string, answer: RTCSessionDescriptionInit) => {
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection) {
        try {
          await peerConnection.connection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error handling answer:', error);
        }
      }
    },
    []
  );

  // Handle incoming ICE candidate
  const handleIceCandidate = useCallback(
    async (fromUserId: string, candidate: RTCIceCandidateInit) => {
      const peerConnection = peerConnectionsRef.current.get(fromUserId);
      if (peerConnection) {
        try {
          await peerConnection.connection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    },
    []
  );

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);

        // Broadcast mute status
        if (send) {
          const message = JSON.stringify({
            event: EVENT_VOICE_MUTE,
            params: {
              board_id: boardId,
              is_muted: !audioTrack.enabled,
            },
          });
          send(message);
        }
      }
    }
  }, [boardId, send]);

  // Connect to all users in the room
  const connectToAllUsers = useCallback(async () => {
    if (!send || isConnecting) return;

    try {
      setIsConnecting(true);
      await initializeLocalStream();

      // Create offers for all connected users except self
      for (const user of connectedUsers) {
        if (user.id !== userId) {
          await createOffer(user.id);
        }
      }
    } catch (error) {
      console.error('Failed to connect to users:', error);
    } finally {
      setIsConnecting(false);
    }
  }, [send, isConnecting, connectedUsers, userId, initializeLocalStream, createOffer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop local stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Close all peer connections
      peerConnectionsRef.current.forEach((peer) => {
        peer.connection.close();
      });
      peerConnectionsRef.current.clear();
    };
  }, []);

  return {
    isMuted,
    isConnecting,
    mutedUsers,
    toggleMute,
    connectToAllUsers,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    setMutedUsers,
  };
};
