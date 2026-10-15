import React, { useState, useEffect } from 'react';
import { MCALayout } from '../components/MCALayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { getMCAMessages, saveMCAMessages } from '../utils/mcaData.js';

export function MCAMessagesPage() {
  const [messages, setMessages] = useState(() => getMCAMessages());
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [filterPriority, setFilterPriority] = useState('ALL');

  useEffect(() => {
    function refresh() {
      setMessages(getMCAMessages());
    }
    window.addEventListener('mcmca_mca_messages_updated', refresh);
    return () => {
      window.removeEventListener('mcmca_mca_messages_updated', refresh);
    };
  }, []);

  const filteredMessages = messages.filter((m) => {
    if (filterPriority === 'ALL') return true;
    return m.priority.toLowerCase() === filterPriority.toLowerCase();
  });

  function handleMarkReviewed(msgId) {
    const updated = messages.map((m) => {
      if (m.id === msgId) {
        return { ...m, status: 'Reviewed' };
      }
      return m;
    });
    saveMCAMessages(updated);
    if (selectedMessage && selectedMessage.id === msgId) {
      setSelectedMessage({ ...selectedMessage, status: 'Reviewed' });
    }
  }

  function handleSendReply(e) {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    const updated = messages.map((m) => {
      if (m.id === selectedMessage.id) {
        return {
          ...m,
          status: 'Replied to Help Desk',
          mcaReply: replyText.trim(),
          repliedAt: new Date().toLocaleString()
        };
      }
      return m;
    });

    saveMCAMessages(updated);
    setReplyText('');
    setSelectedMessage(null);
  }

  return (
    <MCALayout pageTitle="Help Desk Forwarded Messages">
      {/* HEADER */}
      <section className="mca-section" style={{ marginBottom: 24 }}>
        <div className="mca-section__header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h1 className="mca-section__title" style={{ fontSize: '1.6rem' }}>
              <Icon name="bell" size={24} />
              Help Desk Escalated Messages & Petitions
            </h1>
            <p className="mca-section__desc">
              All resident queries and grievances forwarded by the Tendeno / Sorget Help Desk team.
            </p>
          </div>

          {/* PRIORITY FILTER PILLS */}
          <div className="mca-filter-pills">
            <button
              type="button"
              className={`mca-filter-pill ${filterPriority === 'ALL' ? 'mca-filter-pill--active' : ''}`}
              onClick={() => setFilterPriority('ALL')}
            >
              All Messages ({messages.length})
            </button>
            <button
              type="button"
              className={`mca-filter-pill ${filterPriority === 'Urgent' ? 'mca-filter-pill--active' : ''}`}
              onClick={() => setFilterPriority('Urgent')}
            >
              Urgent ({messages.filter(m => m.priority === 'Urgent').length})
            </button>
            <button
              type="button"
              className={`mca-filter-pill ${filterPriority === 'Normal' ? 'mca-filter-pill--active' : ''}`}
              onClick={() => setFilterPriority('Normal')}
            >
              Normal ({messages.filter(m => m.priority === 'Normal').length})
            </button>
            <button
              type="button"
              className={`mca-filter-pill ${filterPriority === 'Info' ? 'mca-filter-pill--active' : ''}`}
              onClick={() => setFilterPriority('Info')}
            >
              Information ({messages.filter(m => m.priority === 'Info').length})
            </button>
          </div>
        </div>
      </section>

      {/* MESSAGES LIST */}
      <section className="mca-section" aria-label="Messages List">
        {filteredMessages.length === 0 ? (
          <div className="mca-card" style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <p>No forwarded messages found in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredMessages.map((msg) => (
              <article
                key={msg.id}
                className="mca-card mca-card--clickable"
                onClick={() => setSelectedMessage(msg)}
                style={{
                  borderLeft: msg.priority === 'Urgent' ? '4px solid #ef4444' : '4px solid #3b82f6',
                  padding: 18
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        className="mca-badge"
                        style={{
                          background: msg.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: msg.priority === 'Urgent' ? '#f87171' : '#60a5fa',
                          border: `1px solid ${msg.priority === 'Urgent' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                        }}
                      >
                        {msg.priority}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Forwarded by: <strong>{msg.forwardedBy}</strong>
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>• {msg.forwardedAt}</span>
                    </div>

                    <h3 style={{ fontSize: '1.08rem', fontWeight: 700, margin: '8px 0 4px', color: '#ffffff' }}>
                      {msg.subject}
                    </h3>
                  </div>

                  <span
                    className="mca-badge"
                    style={{
                      background: msg.status === 'Reviewed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: msg.status === 'Reviewed' ? '#34d399' : '#fbbf24',
                      border: `1px solid ${msg.status === 'Reviewed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                    }}
                  >
                    {msg.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0 0 12px' }}>
                  {msg.message}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--mca-border)', paddingTop: 10, fontSize: '0.78rem', color: '#94a3b8', flexWrap: 'wrap', gap: 8 }}>
                  <span>
                    <strong>From:</strong> {msg.senderName} ({msg.village}) • {msg.phone}
                  </span>
                  <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                    Click to Open & Respond →
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MESSAGE DETAIL & REPLY MODAL */}
      {selectedMessage && (
        <div className="mca-modal-overlay" onClick={() => setSelectedMessage(null)} role="dialog" aria-modal="true">
          <div className="mca-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mca-modal-header">
              <div>
                <h3 className="mca-modal-title">{selectedMessage.subject}</h3>
                <span style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                  From: {selectedMessage.senderName} ({selectedMessage.village})
                </span>
              </div>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setSelectedMessage(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--mca-surface)', padding: 14, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Forwarded by {selectedMessage.forwardedBy}</span>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{selectedMessage.forwardedAt}</span>
                </div>
                <p style={{ fontSize: '0.9rem', color: '#fff', lineHeight: 1.6, margin: 0 }}>
                  {selectedMessage.message}
                </p>
              </div>

              {selectedMessage.mcaReply && (
                <div style={{ background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700, marginBottom: 4 }}>
                    MCA Action / Response ({selectedMessage.repliedAt}):
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#cbd5e1' }}>
                    {selectedMessage.mcaReply}
                  </div>
                </div>
              )}

              <form onSubmit={handleSendReply}>
                <div className="mca-form-group">
                  <label className="mca-form-label">MCA Directive / Reply to Help Desk</label>
                  <textarea
                    className="mca-textarea"
                    rows={3}
                    placeholder="Enter directive for Help Desk officer to relay to resident or schedule for office follow-up..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <button
                    type="button"
                    className="mca-btn mca-btn--sm mca-btn--done"
                    onClick={() => handleMarkReviewed(selectedMessage.id)}
                  >
                    Mark as Reviewed
                  </button>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="mca-btn mca-btn--cancel"
                      onClick={() => setSelectedMessage(null)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="mca-btn mca-btn--schedule"
                    >
                      Send Directive
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MCALayout>
  );
}
