import React, { useState, useEffect, useMemo } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getChiefProfile,
  getChiefMessages,
  openChiefMessage,
  replyToChiefMessage
} from '../utils/chiefData.js';

function formatChatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getInitials(name) {
  if (!name) return 'U';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function ChiefMessagesPage() {
  const profile = getChiefProfile();
  const chiefName = profile?.fullName || 'Chief';

  const [messages, setMessages] = useState(() => getChiefMessages());
  const [activeTab, setActiveTab] = useState('all'); // all | unread | to_be_replied | replied
  const [sortOrder, setSortOrder] = useState('newest'); // newest | oldest
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    function onUpdated() {
      const refreshed = getChiefMessages();
      setMessages(refreshed);
      if (selectedMessage) {
        const found = refreshed.find((m) => m.id === selectedMessage.id);
        if (found) setSelectedMessage(found);
      }
    }
    window.addEventListener('mcmca_chief_messages_updated', onUpdated);
    return () => window.removeEventListener('mcmca_chief_messages_updated', onUpdated);
  }, [selectedMessage]);

  const counts = useMemo(() => {
    return {
      all: messages.length,
      unread: messages.filter((m) => m.status === 'unread').length,
      to_be_replied: messages.filter((m) => m.status === 'to_be_replied').length,
      replied: messages.filter((m) => m.status === 'replied').length
    };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages
      .filter((m) => {
        if (activeTab === 'unread' && m.status !== 'unread') return false;
        if (activeTab === 'to_be_replied' && m.status !== 'to_be_replied') return false;
        if (activeTab === 'replied' && m.status !== 'replied') return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchesName = m.senderName?.toLowerCase().includes(q);
          const matchesStudent = m.studentName?.toLowerCase().includes(q);
          const matchesSubject = m.subject?.toLowerCase().includes(q);
          const matchesBody = m.body?.toLowerCase().includes(q);
          if (!matchesName && !matchesStudent && !matchesSubject && !matchesBody) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.submittedDate).getTime();
        const timeB = new Date(b.submittedDate).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [messages, activeTab, search, sortOrder]);

  function handleSelectMessage(msg) {
    // When opened, if unread it transitions to "to_be_replied". It is NOT marked read until replied!
    const updatedList = openChiefMessage(msg.id);
    setMessages(updatedList);
    const refreshed = updatedList.find((m) => m.id === msg.id) || msg;
    setSelectedMessage(refreshed);
    setReplyText('');
    setFeedback('');
  }

  function handleSendReply(e) {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    const updatedList = replyToChiefMessage(selectedMessage.id, replyText, chiefName);
    setMessages(updatedList);
    const refreshed = updatedList.find((m) => m.id === selectedMessage.id);
    setSelectedMessage(refreshed);
    setReplyText('');
    setFeedback('Reply sent! Inquiry marked as answered.');
    setTimeout(() => setFeedback(''), 4000);
  }

  function insertQuickReply(text) {
    setReplyText((prev) => (prev ? `${prev} ${text}` : text));
  }

  return (
    <ChiefLayout pageTitle="Messages" layout="dashboard" chiefName={chiefName}>
      <div className="chief-messages-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* WhatsApp-Style Top Bar: Search & Filter Tabs */}
        <section className="dash-single-card" style={{ padding: '16px 20px', background: 'var(--surface-elevated)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            {/* Search Input */}
            <div style={{ flex: '1 1 260px', maxWidth: 420, position: 'relative' }}>
              <input
                type="text"
                className="field__input"
                placeholder="Search chats, senders, students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '9px 14px', borderRadius: 999, fontSize: '0.88rem' }}
              />
            </div>

            {/* Sort Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Sort:</label>
              <select
                className="field__input"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: 8 }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* WhatsApp Pill Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14, borderTop: '1px solid var(--glass-border)', paddingTop: 12 }}>
            <button
              type="button"
              className={`btn ${activeTab === 'all' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('all')}
              style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: 999 }}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'unread' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('unread')}
              style={{
                fontSize: '0.82rem',
                padding: '6px 14px',
                borderRadius: 999,
                color: activeTab === 'unread' ? undefined : '#3b82f6',
                borderColor: counts.unread > 0 ? '#3b82f6' : undefined
              }}
            >
              Unread ({counts.unread})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'to_be_replied' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('to_be_replied')}
              style={{
                fontSize: '0.82rem',
                padding: '6px 14px',
                borderRadius: 999,
                color: activeTab === 'to_be_replied' ? undefined : '#f59e0b',
                borderColor: counts.to_be_replied > 0 ? '#f59e0b' : undefined
              }}
            >
              To be replied ({counts.to_be_replied})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'replied' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('replied')}
              style={{ fontSize: '0.82rem', padding: '6px 14px', borderRadius: 999 }}
            >
              Answered ({counts.replied})
            </button>
          </div>
        </section>

        {/* WhatsApp Layout: Left Chat List & Right Conversation Workspace */}
        <div className={`chief-messages-layout ${selectedMessage ? 'chief-messages-layout--active' : ''}`}>

          {/* LEFT: WhatsApp Chat List (One-line previews) */}
          <div
            className={`dash-single-card chief-whatsapp-list ${selectedMessage ? 'chief-whatsapp-list--hidden-mobile' : ''}`}
            style={{ padding: 0, overflow: 'hidden', background: 'var(--surface-elevated)' }}
          >
            <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                Chats ({filteredMessages.length})
              </span>
              {counts.to_be_replied > 0 && (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.72rem' }}>
                  {counts.to_be_replied} Pending Reply
                </span>
              )}
            </div>

            {filteredMessages.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <Icon name="bell" size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.88rem' }}>No conversations match your filter.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {filteredMessages.map((msg) => {
                  const isSelected = selectedMessage?.id === msg.id;
                  const isToBeReplied = msg.status === 'to_be_replied';
                  const isUnread = msg.status === 'unread';
                  const isReplied = msg.status === 'replied';

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '12px 16px',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--glass-border)',
                        background: isSelected
                          ? 'rgba(217, 119, 6, 0.14)'
                          : isToBeReplied
                            ? 'rgba(245, 158, 11, 0.04)'
                            : isUnread
                              ? 'rgba(59, 130, 246, 0.04)'
                              : 'transparent',
                        borderLeft: isSelected
                          ? '4px solid #d97706'
                          : isToBeReplied
                            ? '4px solid #f59e0b'
                            : isUnread
                              ? '4px solid #3b82f6'
                              : '4px solid transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* WhatsApp Round Avatar */}
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isToBeReplied
                            ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                            : isUnread
                              ? 'linear-gradient(135deg, #2563eb, #3b82f6)'
                              : 'linear-gradient(135deg, #334155, #475569)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          flexShrink: 0
                        }}
                      >
                        {getInitials(msg.senderName)}
                      </div>

                      {/* WhatsApp Details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                            <span
                              style={{
                                fontWeight: isUnread || isToBeReplied ? 700 : 600,
                                fontSize: '0.92rem',
                                color: 'var(--text)',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {msg.senderName}
                            </span>
                            <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
                              {msg.senderRole}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.72rem', color: isUnread ? '#3b82f6' : isToBeReplied ? '#f59e0b' : '#94a3b8', flexShrink: 0, fontWeight: isUnread ? 600 : 400 }}>
                            {formatChatTime(msg.submittedDate)}
                          </span>
                        </div>

                        {/* One-line preview with WhatsApp status indicators */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, minWidth: 0, flex: 1 }}>
                            {isReplied && (
                              <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                                ✓✓
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: '0.82rem',
                                color: isUnread ? 'var(--text)' : 'var(--text-2, #94a3b8)',
                                fontWeight: isUnread ? 600 : 400,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: 'block'
                              }}
                            >
                              {msg.body}
                            </span>
                          </div>

                          {/* WhatsApp Badges on right */}
                          {isUnread && (
                            <span style={{ background: '#3b82f6', color: '#fff', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>
                              New
                            </span>
                          )}
                          {isToBeReplied && (
                            <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 10, flexShrink: 0 }}>
                              To reply
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: Active WhatsApp Chat Conversation Pane */}
          {selectedMessage ? (
            <div
              className="dash-single-card chief-whatsapp-chat"
              style={{ padding: 0, overflow: 'hidden', background: 'var(--surface-elevated)', display: 'flex', flexDirection: 'column' }}
            >
              {/* WhatsApp Chat Header */}
              <div style={{
                padding: '14px 18px',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(255,255,255,0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {/* Back button for mobile view */}
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setSelectedMessage(null)}
                    style={{ padding: '6px 10px', fontSize: '0.8rem', borderRadius: 999 }}
                    title="Back to chat list"
                  >
                    ← Chats
                  </button>

                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      flexShrink: 0
                    }}
                  >
                    {getInitials(selectedMessage.senderName)}
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--text)' }}>
                        {selectedMessage.senderName}
                      </strong>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        ({selectedMessage.senderRole})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Student: <strong style={{ color: 'var(--text)' }}>{selectedMessage.studentName}</strong>
                    </div>
                  </div>
                </div>

                {/* Status indicator badge */}
                <div style={{ flexShrink: 0 }}>
                  {selectedMessage.status === 'replied' ? (
                    <span className="badge badge--success" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                      ✓✓ Answered
                    </span>
                  ) : (
                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontSize: '0.75rem', padding: '4px 10px' }}>
                      To be replied
                    </span>
                  )}
                </div>
              </div>

              {/* Status Notice Banner if Pending Reply */}
              {selectedMessage.status !== 'replied' && (
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
                  fontSize: '0.78rem',
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Icon name="clock" size={14} />
                  <span>This message will remain active under <strong>To be replied</strong> until you send an official reply.</span>
                </div>
              )}

              {/* WhatsApp Message Bubbles Thread */}
              <div style={{ padding: 20, minHeight: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Incoming Message Bubble (from applicant / parent) */}
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    maxWidth: '82%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '12px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-champagne, #ddbb6a)', marginBottom: 4 }}>
                      Subject: {selectedMessage.subject}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text)' }}>
                      {selectedMessage.body}
                    </p>
                    <div style={{ textAlign: 'right', fontSize: '0.7rem', color: '#94a3b8', marginTop: 6 }}>
                      {new Date(selectedMessage.submittedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                {/* Outgoing Replies (from Chief) */}
                {selectedMessage.replies?.map((reply, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{
                      maxWidth: '82%',
                      background: 'rgba(217, 119, 6, 0.16)',
                      border: '1px solid rgba(217, 119, 6, 0.35)',
                      borderRadius: '16px 16px 4px 16px',
                      padding: '12px 16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>
                        {reply.sender} (Official Answer)
                      </div>
                      <p style={{ margin: 0, fontSize: '0.92rem', lineHeight: 1.5, color: 'var(--text)' }}>
                        {reply.body}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, fontSize: '0.7rem', color: '#10b981', marginTop: 6 }}>
                        <span>{new Date(reply.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>✓✓</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Reply Suggestions */}
              <div style={{ padding: '8px 18px', borderTop: '1px solid var(--glass-border)', display: 'flex', flexWrap: 'wrap', gap: 6, background: 'rgba(0,0,0,0.05)' }}>
                <button
                  type="button"
                  className="btn btn--table"
                  style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                  onClick={() => insertQuickReply('Please visit the Chief\'s office with original ID cards for verification.')}
                >
                  + Require in-person ID
                </button>
                <button
                  type="button"
                  className="btn btn--table"
                  style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                  onClick={() => insertQuickReply('Your application has been verified and forwarded to the Ward Bursary Committee.')}
                >
                  + Verified & Forwarded
                </button>
                <button
                  type="button"
                  className="btn btn--table"
                  style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                  onClick={() => insertQuickReply('Please provide updated utility bill or tenancy agreement as proof of residence.')}
                >
                  + Request proof of residence
                </button>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div style={{ margin: '8px 18px 0', padding: '8px 12px', borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.82rem' }}>
                  ✓ {feedback}
                </div>
              )}

              {/* WhatsApp Reply Bar */}
              <form onSubmit={handleSendReply} style={{ padding: '12px 18px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10, alignItems: 'center', background: 'var(--surface-elevated)' }}>
                <input
                  type="text"
                  className="field__input"
                  placeholder="Type an official answer..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 999, fontSize: '0.88rem' }}
                  required
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ borderRadius: 999, padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
                  disabled={!replyText.trim()}
                >
                  <span>Send</span>
                  <Icon name="arrowRight" size={16} />
                </button>
              </form>
            </div>
          ) : (
            <div
              className="dash-single-card"
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: '#94a3b8',
                background: 'var(--surface-elevated)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
            >
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(217, 119, 6, 0.12)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bell" size={28} />
              </div>
              <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.15rem' }}>Select a chat</h3>
              <p style={{ margin: 0, fontSize: '0.88rem', maxWidth: 320 }}>
                Select a message preview from the list to open the conversation, read full details, and reply.
              </p>
            </div>
          )}

        </div>

      </div>
    </ChiefLayout>
  );
}
