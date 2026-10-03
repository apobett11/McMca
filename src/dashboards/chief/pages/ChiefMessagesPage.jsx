import React, { useState, useEffect, useMemo } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import {
  getChiefProfile,
  getChiefMessages,
  openChiefMessage,
  replyToChiefMessage
} from '../utils/chiefData.js';

export function ChiefMessagesPage() {
  const profile = getChiefProfile();
  const chiefName = profile?.fullName || 'Chief';

  const [messages, setMessages] = useState(() => getChiefMessages());
  const [activeTab, setActiveTab] = useState('all'); // all | to_be_replied | unread | replied
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    function onUpdated() {
      setMessages(getChiefMessages());
    }
    window.addEventListener('mcmca_chief_messages_updated', onUpdated);
    return () => window.removeEventListener('mcmca_chief_messages_updated', onUpdated);
  }, []);

  const counts = useMemo(() => {
    return {
      all: messages.length,
      to_be_replied: messages.filter((m) => m.status === 'to_be_replied').length,
      unread: messages.filter((m) => m.status === 'unread').length,
      replied: messages.filter((m) => m.status === 'replied').length
    };
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((m) => {
      if (activeTab === 'to_be_replied' && m.status !== 'to_be_replied') return false;
      if (activeTab === 'unread' && m.status !== 'unread') return false;
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
    });
  }, [messages, activeTab, search]);

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
    setFeedback('Reply sent successfully! Message marked as replied.');
    setTimeout(() => setFeedback(''), 4000);
  }

  function insertQuickReply(text) {
    setReplyText((prev) => (prev ? `${prev} ${text}` : text));
  }

  return (
    <ChiefLayout pageTitle="Messages" layout="dashboard" chiefName={chiefName}>
      <div className="chief-messages-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Messages Header Card */}
        <section className="dash-single-card" style={{ padding: '20px 24px', background: 'var(--surface-elevated)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 className="stitch-section-title" style={{ margin: 0, fontSize: '1.4rem' }}>
                Ward Correspondence & Inquiries
              </h1>
              <p style={{ margin: '6px 0 0', color: 'var(--text-2, #94a3b8)', fontSize: '0.88rem' }}>
                Messages from applicants and parents directed to the Chief. Unopened messages move to <strong>To be replied</strong> when opened and remain active until answered.
              </p>
            </div>
            {/* Quick search input */}
            <div style={{ minWidth: 240, flex: '1 1 240px', maxWidth: 360 }}>
              <input
                type="text"
                className="field__input"
                placeholder="Search messages, applicants..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', padding: '10px 14px' }}
              />
            </div>
          </div>

          {/* Metric tabs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className={`btn ${activeTab === 'all' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('all')}
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              All Messages ({counts.all})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'to_be_replied' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('to_be_replied')}
              style={{
                fontSize: '0.85rem',
                padding: '8px 16px',
                borderColor: counts.to_be_replied > 0 ? '#f59e0b' : undefined,
                color: activeTab === 'to_be_replied' ? undefined : '#f59e0b'
              }}
            >
              <Icon name="clock" size={16} />
              To be replied ({counts.to_be_replied})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'unread' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('unread')}
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              <Icon name="bell" size={16} />
              Unread ({counts.unread})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'replied' ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => setActiveTab('replied')}
              style={{ fontSize: '0.85rem', padding: '8px 16px' }}
            >
              <Icon name="check" size={16} />
              Answered ({counts.replied})
            </button>
          </div>
        </section>

        {/* Master-Detail or Responsive Grid */}
        <div className={`chief-messages-layout ${selectedMessage ? 'chief-messages-layout--active' : ''}`}>
          {/* Message List */}
          <div className="dash-single-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                Showing {filteredMessages.length} {filteredMessages.length === 1 ? 'Message' : 'Messages'}
              </span>
              {counts.to_be_replied > 0 && (
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.75rem' }}>
                  {counts.to_be_replied} Pending Reply
                </span>
              )}
            </div>

            {filteredMessages.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8' }}>
                <p>No messages match your selected filter.</p>
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
                        padding: '16px 20px',
                        borderBottom: '1px solid var(--glass-border)',
                        cursor: 'pointer',
                        background: isSelected
                          ? 'rgba(217, 119, 6, 0.12)'
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
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
                          {msg.senderName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {new Date(msg.submittedDate).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: 'var(--text-2)' }}>
                          {msg.senderRole} · Student: {msg.studentName}
                        </span>
                        {isToBeReplied && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 600 }}>
                            To be replied
                          </span>
                        )}
                        {isUnread && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 600 }}>
                            New / Unread
                          </span>
                        )}
                        {isReplied && (
                          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: 600 }}>
                            Answered
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '8px 0 0', fontWeight: isUnread || isToBeReplied ? 600 : 400, fontSize: '0.88rem', color: 'var(--text)' }}>
                        {msg.subject}
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {msg.body}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Active Conversation / Reply Workspace */}
          {selectedMessage ? (
            <div className="dash-single-card" style={{ padding: 24, background: 'var(--surface-elevated)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--gold-champagne, #ddbb6a)', fontWeight: 700 }}>
                    Inquiry Details
                  </span>
                  <h2 style={{ margin: '4px 0 0', fontSize: '1.2rem', color: 'var(--text)' }}>
                    {selectedMessage.subject}
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                    From: <strong>{selectedMessage.senderName}</strong> ({selectedMessage.senderRole}) · Related Student: <strong>{selectedMessage.studentName}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => setSelectedMessage(null)}
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                >
                  ✕ Close
                </button>
              </div>

              {/* Status bar */}
              <div style={{
                margin: '16px 0',
                padding: '10px 14px',
                borderRadius: 8,
                background: selectedMessage.status === 'replied'
                  ? 'rgba(34, 197, 94, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.85rem',
                color: selectedMessage.status === 'replied' ? '#4ade80' : '#f59e0b'
              }}>
                <Icon name={selectedMessage.status === 'replied' ? 'check' : 'clock'} size={18} />
                <span>
                  {selectedMessage.status === 'replied'
                    ? 'This inquiry has been officially answered and resolved.'
                    : 'Status: To be replied. This message will not be marked as resolved until you submit your answer.'}
                </span>
              </div>

              {/* Original Message Bubble */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--glass-border)',
                borderRadius: 12,
                padding: 16,
                margin: '16px 0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>{selectedMessage.senderName}</span>
                  <span>{new Date(selectedMessage.submittedDate).toLocaleString('en-KE')}</span>
                </div>
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text)', fontSize: '0.92rem' }}>
                  {selectedMessage.body}
                </p>
              </div>

              {/* Prior Replies thread */}
              {selectedMessage.replies?.length > 0 && (
                <div style={{ margin: '20px 0' }}>
                  <h4 style={{ fontSize: '0.88rem', margin: '0 0 10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Chief Replies & Actions
                  </h4>
                  {selectedMessage.replies.map((reply, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(217, 119, 6, 0.08)',
                        borderLeft: '4px solid #d97706',
                        borderRadius: '0 8px 8px 0',
                        padding: 14,
                        marginBottom: 10
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#ddbb6a', marginBottom: 6 }}>
                        <strong>{reply.sender}</strong>
                        <span>{new Date(reply.sentAt).toLocaleString('en-KE')}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--text)' }}>
                        {reply.body}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Form */}
              <form onSubmit={handleSendReply} style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8, color: 'var(--text)' }}>
                  Compose Official Answer:
                </label>

                {/* Quick response helpers */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  <button
                    type="button"
                    className="btn btn--table"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => insertQuickReply('Please visit the Chief\'s office with original ID cards for verification.')}
                  >
                    + Require in-person ID
                  </button>
                  <button
                    type="button"
                    className="btn btn--table"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => insertQuickReply('Your application has been verified and forwarded to the Ward Bursary Committee.')}
                  >
                    + Verified & Forwarded
                  </button>
                  <button
                    type="button"
                    className="btn btn--table"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    onClick={() => insertQuickReply('Please provide updated utility bill or tenancy agreement as residence proof.')}
                  >
                    + Request residence proof
                  </button>
                </div>

                <textarea
                  className="field__input"
                  rows={4}
                  placeholder="Type your reply here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  style={{ width: '100%', padding: 12, resize: 'vertical', minHeight: 90 }}
                  required
                />

                {feedback && (
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', fontSize: '0.85rem' }}>
                    {feedback}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    style={{ padding: '10px 22px', display: 'flex', alignItems: 'center', gap: 8 }}
                    disabled={!replyText.trim()}
                  >
                    <Icon name="arrowRight" size={16} />
                    Send Answer & Mark Replied
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="dash-single-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
              <Icon name="bell" size={36} className="mx-auto" />
              <h3 style={{ margin: '12px 0 6px', color: 'var(--text)' }}>No message selected</h3>
              <p style={{ margin: 0, fontSize: '0.88rem' }}>
                Select an inquiry from the list on the left to review details and reply.
              </p>
            </div>
          )}
        </div>
      </div>
    </ChiefLayout>
  );
}
