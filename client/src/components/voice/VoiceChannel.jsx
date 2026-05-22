import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Phone, Users } from 'lucide-react';
import { getSocket } from '../../hooks/useSocket';
import { useStore } from '../../store';
import toast from 'react-hot-toast';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function VoiceChannel({ channel }) {
  const { user } = useStore();
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [peers, setPeers] = useState([]); // [{ socketId, userId, username, stream }]

  const localStreamRef = useRef(null);
  const peerConnections = useRef({}); // socketId -> RTCPeerConnection
  const audioRefs = useRef({});

  const socket = getSocket();

  const cleanup = useCallback(() => {
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setPeers([]);
  }, []);

  const createPeerConnection = useCallback((socketId, userId, username, isInitiator) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[socketId] = pc;

    // Add local tracks
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      setPeers(prev => {
        const existing = prev.find(p => p.socketId === socketId);
        if (existing) {
          existing.stream = event.streams[0];
          return [...prev];
        }
        return prev.map(p => p.socketId === socketId ? { ...p, stream: event.streams[0] } : p);
      });

      if (audioRefs.current[socketId]) {
        audioRefs.current[socketId].srcObject = event.streams[0];
      }
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('voiceIceCandidate', { targetUserId: userId, candidate: event.candidate });
      }
    };

    // Offer (initiator)
    if (isInitiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        socket?.emit('voiceOffer', { targetUserId: userId, offer, channelId: channel.id });
      });
    }

    return pc;
  }, [socket, channel.id]);

  const joinVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      socket?.emit('joinVoiceChannel', { channelId: channel.id });
      setJoined(true);
      toast.success(`Joined ${channel.name} voice channel`);
    } catch (err) {
      toast.error('Could not access microphone');
    }
  };

  const leaveVoice = () => {
    socket?.emit('leaveVoiceChannel', { channelId: channel.id });
    cleanup();
    setJoined(false);
    toast.success('Left voice channel');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = muted; });
      setMuted(m => !m);
    }
  };

  const toggleDeafen = () => {
    Object.values(audioRefs.current).forEach(el => {
      if (el) el.muted = !deafened;
    });
    setDeafened(d => !d);
  };

  useEffect(() => {
    if (!socket || !joined) return;

    const handlePeers = ({ peers: peerList }) => {
      peerList.forEach(peer => {
        setPeers(prev => [...prev.filter(p => p.socketId !== peer.socketId), peer]);
        createPeerConnection(peer.socketId, peer.userId, peer.username, true);
      });
    };

    const handlePeerJoined = ({ socketId, userId, username }) => {
      setPeers(prev => [...prev.filter(p => p.socketId !== socketId), { socketId, userId, username }]);
      createPeerConnection(socketId, userId, username, false);
    };

    const handlePeerLeft = ({ socketId }) => {
      peerConnections.current[socketId]?.close();
      delete peerConnections.current[socketId];
      setPeers(prev => prev.filter(p => p.socketId !== socketId));
    };

    const handleOffer = async ({ from, offer }) => {
      const socket_id = Object.keys(peerConnections.current).find(s =>
        peers.find(p => p.socketId === s && p.userId === from)
      ) || from;
      const peer = peers.find(p => p.userId === from);
      const pc = peerConnections.current[from] || createPeerConnection(from, from, peer?.username || from, false);
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket?.emit('voiceAnswer', { targetUserId: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.setRemoteDescription(answer);
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peerConnections.current[from];
      if (pc) await pc.addIceCandidate(candidate);
    };

    socket.on('voicePeers', handlePeers);
    socket.on('voicePeerJoined', handlePeerJoined);
    socket.on('voicePeerLeft', handlePeerLeft);
    socket.on('voiceOffer', handleOffer);
    socket.on('voiceAnswer', handleAnswer);
    socket.on('voiceIceCandidate', handleIce);

    return () => {
      socket.off('voicePeers', handlePeers);
      socket.off('voicePeerJoined', handlePeerJoined);
      socket.off('voicePeerLeft', handlePeerLeft);
      socket.off('voiceOffer', handleOffer);
      socket.off('voiceAnswer', handleAnswer);
      socket.off('voiceIceCandidate', handleIce);
    };
  }, [socket, joined, peers, createPeerConnection]);

  useEffect(() => () => cleanup(), []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8"
         style={{ background: 'var(--nexus-bg)' }}>
      {/* Channel header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Volume2 className="w-6 h-6" style={{ color: 'var(--nexus-accent)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--nexus-text)' }}>{channel.name}</h2>
        </div>
        <p style={{ color: 'var(--nexus-muted)' }}>Voice Channel</p>
      </div>

      {!joined ? (
        <motion.button
          onClick={joinVoice}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold transition-all"
          style={{ background: 'var(--nexus-online)', color: 'white' }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <Phone className="w-6 h-6" />
          Join Voice
        </motion.button>
      ) : (
        <>
          {/* Peers */}
          <div className="flex flex-wrap gap-4 justify-center">
            {/* Self */}
            <VoicePeerCard username={user?.username} pfpUrl={user?.pfpUrl} muted={muted} isSelf />

            {/* Remote peers */}
            {peers.map(peer => (
              <VoicePeerCard key={peer.socketId} username={peer.username} isSelf={false}>
                <audio
                  ref={el => { audioRefs.current[peer.socketId] = el; }}
                  autoPlay
                  playsInline
                />
              </VoicePeerCard>
            ))}

            {peers.length === 0 && (
              <div className="text-center py-8" style={{ color: 'var(--nexus-muted)' }}>
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Waiting for others to join...</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <VoiceControlBtn
              icon={muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              onClick={toggleMute}
              active={muted}
              label={muted ? 'Unmute' : 'Mute'}
              danger={muted}
            />
            <VoiceControlBtn
              icon={deafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              onClick={toggleDeafen}
              active={deafened}
              label={deafened ? 'Undeafen' : 'Deafen'}
              danger={deafened}
            />
            <VoiceControlBtn
              icon={<PhoneOff className="w-5 h-5" />}
              onClick={leaveVoice}
              label="Leave"
              isLeave
            />
          </div>
        </>
      )}
    </div>
  );
}

function VoicePeerCard({ username, pfpUrl, muted, isSelf, children }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative w-20 h-20">
        <div className="w-full h-full rounded-full overflow-hidden ring-4"
             style={{ ringColor: 'var(--nexus-accent)', border: '4px solid var(--nexus-accent)' }}>
          {pfpUrl ? (
            <img src={pfpUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                 style={{ background: 'var(--nexus-accent)' }}>
              {username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
        {muted && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
               style={{ background: 'var(--nexus-danger)', border: '2px solid var(--nexus-bg)' }}>
            <MicOff className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        {/* Speaking indicator */}
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 pointer-events-none"
             style={{ border: '3px solid var(--nexus-online)' }} />
      </div>
      <p className="text-sm font-semibold" style={{ color: 'var(--nexus-text)' }}>
        {username} {isSelf && '(You)'}
      </p>
      {children}
    </motion.div>
  );
}

function VoiceControlBtn({ icon, onClick, active, label, danger, isLeave }) {
  return (
    <motion.button
      onClick={onClick}
      title={label}
      className="flex flex-col items-center gap-1.5"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <div className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
           style={{
             background: isLeave ? 'var(--nexus-danger)' : danger ? 'color-mix(in srgb, var(--nexus-danger) 15%, var(--nexus-elevated))' : 'var(--nexus-elevated)',
             color: isLeave ? 'white' : danger ? 'var(--nexus-danger)' : 'var(--nexus-muted)',
             border: `1px solid ${isLeave ? 'var(--nexus-danger)' : 'var(--nexus-border)'}`,
           }}>
        {icon}
      </div>
      <span className="text-xs" style={{ color: 'var(--nexus-muted)' }}>{label}</span>
    </motion.button>
  );
}
