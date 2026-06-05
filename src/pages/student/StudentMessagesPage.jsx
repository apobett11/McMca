import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PageShell } from '../../components/PageShell.jsx';
import { Icon } from '../../components/Icon.jsx';
import { useAuth } from '../../context/AuthContext';
import { useSecureData } from '../../lib/useSecureData';
import { fetchConversations, fetchMessages, sendMessage } from '../../lib/queries';
import { supabase } from '../../lib/supabase';
import { STUDENT_SHELL } from '../studentShell.js';

const CHANNEL_CONFIG = [
  { id: 'bursary', title: 'Bursary Office', icon: 'applications', desc: 'Application status and bursary inquiries' },
  { id: 'support', title: 'Technical Support', icon: 'support', desc: 'Platform and account help' },
  { id: 'chief', title: 'Chief Office', icon: 'shield', desc: 'Local verification and chief office queries' }
];

function ConversationList({ conversations, activeId, onSelect }) {
  return (
    <div className="stitch-messages-channels">
      {conversations.length > 0 ? conversations.map((conv) => (
        <button
          key={conv.id}
          type="button"
          className={`stitch-message-channel ${activeId === conv.id ? 'stitch-message-channel--active' : ''}`}
          onClick={() => onSelect(conv)}
        >
          <div className={`stitch-message-channel__icon stitch-message-channel__icon--primary`}>
            <Icon name="support" size={22} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <span className="stitch-message-channel__title">{conv.title || conv.subject}</span>
            <span className="stitch-message-channel__desc">
              {conv.last_message?.content ? conv.last_message.content.slice(0, 60) : 'No messages yet'}
            </span>
          </div>
        </button>
      )) : CHANNEL_CONFIG.map((ch) => (
        <button
          key={ch.id}
          type="button"
          className={`stitch-message-channel ${activeId === ch.id ? 'stitch-message-channel--active' : ''}`}
          onClick={() => onSelect({ id: ch.id, title: ch.title, isDefault: true })}
        >
          <div className={`stitch-message-channel__icon stitch-message-channel__icon--primary`}>
            <Icon name={ch.icon} size={22} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <span className="stitch-message-channel__title">{ch.title}</span>
            <span className="stitch-message-channel__desc">{ch.desc}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function MessageBubble({ msg, isOwn }) {
  return (
    <div style={{
      display: 'flex', gap: 12, maxWidth: '80%',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      marginLeft: isOwn ? 'auto' : undefined,
      marginBottom: 16
    }}>
      <div style={{
        background: isOwn ? '#004ac6' : '#f1f3ff',
        color: isOwn ? 'white' : '#141b2b',
        borderRadius: 16,
        borderBottomRightRadius: isOwn ? 4 : 16,
        borderBottomLeftRadius: isOwn ? 16 : 4,
        padding: '12px 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
      }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>{msg.content}</p>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          gap: 4, marginTop: 6
        }}>
          <span style={{ fontSize: 10, opacity: 0.7 }}>
            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

export function StudentMessagesPage() {
  const { user, userId } = useAuth();
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const chatEndRef = useRef(null);

  const { data: conversations, loading: convsLoading } = useSecureData(fetchConversations);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!activeConv?.id || activeConv?.isDefault) return;
    setMsgsLoading(true);
    fetchMessages(activeConv.id).then(setMessages).catch(() => {}).finally(() => setMsgsLoading(false));
  }, [activeConv?.id]);

  useEffect(() => {
    if (!activeConv?.id || activeConv?.isDefault) return;
    const channel = supabase.channel(`messages_${activeConv.id}`).on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConv.id}` },
      (payload) => {
        setMessages(prev => [...prev, payload.new]);
      }
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv?.id]);

  const handleSend = useCallback(async () => {
    const text = messageText.trim();
    if (!text || !activeConv?.id || activeConv?.isDefault || !userId) return;
    setSending(true);
    try {
      await sendMessage(activeConv.id, userId, text);
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }, [messageText, activeConv, userId]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <PageShell pageTitle="Messages" layout="dashboard" showBottomNav={false} {...STUDENT_SHELL}>
      <div className="stitch-messages-layout">
        <ConversationList
          conversations={conversations || []}
          activeId={activeConv?.id}
          onSelect={(conv) => setActiveConv(conv)}
        />

        {activeConv ? (
          <>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f9f9ff 100%)',
              border: '1px solid rgba(241, 228, 193, 0.3)',
              borderRadius: 12, padding: 24,
              minHeight: 300, maxHeight: 420,
              overflowY: 'auto', marginBottom: 16
            }}>
              <div className="stitch-chat-window__header">
                <Icon name="support" size={20} />
                {activeConv.title}
              </div>
              {msgsLoading ? (
                <div className="skeleton-wrap">
                  <div className="skeleton skeleton--line" />
                  <div className="skeleton skeleton--line-short" />
                </div>
              ) : messages.length > 0 ? (
                messages.map((msg, idx) => (
                  <MessageBubble key={msg.id || idx} msg={msg} isOwn={msg.sender_id === userId} />
                ))
              ) : (
                <p className="stitch-chat-window__placeholder">
                  No messages yet. Start the conversation above.
                </p>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{
              background: '#f1f3ff', borderRadius: 24, padding: 8,
              display: 'flex', alignItems: 'flex-end', gap: 12
            }}>
              <textarea
                style={{
                  flex: 1, background: 'transparent', border: 'none',
                  outline: 'none', fontFamily: 'inherit', fontSize: 14,
                  padding: '12px 8px', maxHeight: 120, resize: 'none',
                  color: '#141b2b'
                }}
                placeholder={activeConv.isDefault ? 'Select a conversation to start messaging' : 'Type a message...'}
                rows={1}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={activeConv.isDefault}
              />
              <button
                onClick={handleSend}
                disabled={sending || activeConv.isDefault || !messageText.trim()}
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: 'none', background: activeConv.isDefault ? '#c3c6d6' : '#003594',
                  color: 'white', cursor: activeConv.isDefault ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, marginBottom: 4
                }}
              >
                <Icon name="arrowRight" size={18} />
              </button>
            </div>
          </>
        ) : (
          <div className="stitch-message-notice">
            <strong>Secure Messaging</strong>
            Select a conversation above to view messages. All communications are encrypted.
          </div>
        )}
      </div>
    </PageShell>
  );
}