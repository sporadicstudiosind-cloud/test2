import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Hash, Volume2, MessageSquare, Users } from 'lucide-react';
import { useStore } from '../../store';
import { channelApi, messageApi } from '../../api';
import { messageApi as mApi } from '../../api';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import VoiceChannel from '../voice/VoiceChannel';

export default function ChatArea() {
  const { activeChannel, activeDM, messages, setMessages, user, typingUsers } = useStore();
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const chatKey = activeChannel
    ? `channel:${activeChannel.id}`
    : activeDM
    ? `dm:${activeDM.id}`
    : null;

  const chatMessages = chatKey ? (messages[chatKey] || []) : [];
  const typing = chatKey ? typingUsers[chatKey] || {} : {};
  const typingList = Object.values(typing);

  const loadMessages = useCallback(async () => {
    if (!chatKey) return;
    try {
      if (activeChannel) {
        const res = await channelApi.getMessages(activeChannel.id);
        setMessages(chatKey, res.data.messages);
      } else if (activeDM) {
        const res = await mApi.getDMs(activeDM.id);
        setMessages(chatKey, res.data.messages);
      }
    } catch {}
  }, [chatKey]);

  useEffect(() => {
    if (chatKey) loadMessages();
  }, [chatKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  if (!activeChannel && !activeDM) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4"
           style={{ background: 'var(--nexus-bg)' }}>
        <motion.div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: 'color-mix(in srgb, var(--nexus-accent) 15%, transparent)' }}
          animate={{ scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <MessageSquare className="w-10 h-10" style={{ color: 'var(--nexus-accent)' }} />
        </motion.div>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--nexus-text)' }}>
            Welcome to Nexus
          </h2>
          <p style={{ color: 'var(--nexus-muted)' }}>
            Select a channel or start a conversation
          </p>
        </div>
      </div>
    );
  }

  if (activeChannel?.isVoice) {
    return <VoiceChannel channel={activeChannel} />;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--nexus-bg)' }}>
      {/* Channel Header */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
           style={{ borderBottom: '1px solid var(--nexus-border)', background: 'var(--nexus-surface)' }}>
        {activeChannel ? (
          <>
            <Hash className="w-5 h-5" style={{ color: 'var(--nexus-muted)' }} />
            <h2 className="font-bold text-base" style={{ color: 'var(--nexus-text)' }}>
              {activeChannel.name}
            </h2>
            {activeChannel.description && (
              <>
                <div className="w-px h-5 mx-1" style={{ background: 'var(--nexus-border)' }} />
                <p className="text-sm truncate" style={{ color: 'var(--nexus-muted)' }}>
                  {activeChannel.description}
                </p>
              </>
            )}
          </>
        ) : activeDM ? (
          <>
            <div className="relative">
              <div className="w-7 h-7 rounded-full overflow-hidden">
                {activeDM.pfpUrl ? (
                  <img src={activeDM.pfpUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                       style={{ background: 'var(--nexus-accent)' }}>
                    {activeDM.username[0].toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <h2 className="font-bold text-base" style={{ color: 'var(--nexus-text)' }}>
              {activeDM.username}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'color-mix(in srgb, var(--nexus-online) 15%, transparent)', color: 'var(--nexus-online)' }}>
              online
            </span>
          </>
        ) : null}
      </div>

      {/* Messages */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
      >
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                 style={{ background: 'color-mix(in srgb, var(--nexus-accent) 10%, transparent)' }}>
              {activeChannel ? (
                <Hash className="w-8 h-8" style={{ color: 'var(--nexus-accent)' }} />
              ) : (
                <MessageSquare className="w-8 h-8" style={{ color: 'var(--nexus-accent)' }} />
              )}
            </div>
            <div>
              <p className="font-bold text-lg" style={{ color: 'var(--nexus-text)' }}>
                {activeChannel ? `Welcome to #${activeChannel.name}` : `Chat with ${activeDM?.username}`}
              </p>
              <p className="text-sm" style={{ color: 'var(--nexus-muted)' }}>
                {activeChannel ? 'This is the beginning of the channel.' : 'Start your conversation!'}
              </p>
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => {
          const prev = chatMessages[i - 1];
          const showAvatar = !prev || prev.user?.id !== msg.user?.id ||
            (msg.createdAt && prev.createdAt &&
             new Date(msg.createdAt) - new Date(prev.createdAt) > 5 * 60 * 1000);

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              showAvatar={showAvatar}
              isOwn={msg.user?.id === user?.id || msg.senderId === user?.id}
              chatKey={chatKey}
            />
          );
        })}

        {typingList.length > 0 && <TypingIndicator users={typingList} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput chatKey={chatKey} />
    </div>
  );
}
