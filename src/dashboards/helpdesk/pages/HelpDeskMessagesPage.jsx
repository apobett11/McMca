import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HelpDeskLayout } from '../components/HelpDeskLayout.jsx';
import { TableSubpage } from '../components/TableSubpage.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import {
  PREDETERMINED_LOCATIONS,
  getHelpDeskMessages,
  replyToMessage,
  forwardMessageToMca,
  getChiefMessagesAnalytics
} from '../utils/helpDeskData.js';

export function HelpDeskMessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subpageParam = searchParams.get('table'); // null | 'desk' | 'analytics_table'

  const [activeSubpage, setActiveSubpage] = useState(subpageParam || null);
  const [messages, setMessages] = useState(() => getHelpDeskMessages());
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const feedbackTimerRef = useRef(null);

  function triggerFeedback(msg, duration = 4000) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback('');
    }, duration);
  }

  // Selected message for viewing/replying in Messages Desk subpage
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [mobileChatViewActive, setMobileChatViewActive] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [mcaNoteText, setMcaNoteText] = useState('');
  const [showMcaForwardBox, setShowMcaForwardBox] = useState(false);

  // Filters for subpages
  const [selectedOffice, setSelectedOffice] = useState('all'); // all | helpdesk | mca | chief
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // all | to_be_replied | replied
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');

  // Analytics table sorts
  const [tableSortField, setTableSortField] = useState('rate'); // rate | total | location | office
  const [tableSortDir, setTableSortDir] = useState('desc');

  useEffect(() => {
    if (subpageParam) {
      setActiveSubpage(subpageParam);
    }
  }, [subpageParam]);

  function openSubpage(name) {
    setActiveSubpage(name);
    setMobileChatViewActive(false);
    setSearchParams({ table: name });
  }

  function closeSubpage() {
    setActiveSubpage(null);
    setMobileChatViewActive(false);
    setSearchParams({});
  }

  function reloadData() {
    setRefreshing(true);
    setMessages(getHelpDeskMessages());
    setTimeout(() => {
      setRefreshing(false);
      triggerFeedback('Communications and text metrics refreshed.');
    }, 200);
  }

  useEffect(() => {
    function onMsgUpdate(e) {
      if (e.detail) setMessages(e.detail);
    }
    window.addEventListener('mcmca_helpdesk_messages_updated', onMsgUpdate);
    return () => window.removeEventListener('mcmca_helpdesk_messages_updated', onMsgUpdate);
  }, []);

  // Compute analytics
  function calcStats(list) {
    const total = list.length;
    const replied = list.filter((m) => m.status === 'replied').length;
    const pending = total - replied;
    const rate = total > 0 ? Math.round((replied / total) * 100) : 0;
    return { total, replied, pending, rate };
  }

  const overallStats = useMemo(() => calcStats(messages), [messages]);
  const helpdeskStats = useMemo(
    () => calcStats(messages.filter((m) => m.destinationOffice === 'helpdesk')),
    [messages]
  );
  const mcaStats = useMemo(
    () => calcStats(messages.filter((m) => m.destinationOffice === 'mca')),
    [messages]
  );
  const chiefStats = useMemo(
    () => calcStats(messages.filter((m) => m.destinationOffice === 'chief')),
    [messages]
  );

  const chiefAnalytics = useMemo(() => getChiefMessagesAnalytics(), [messages]);

  // Breakdown by location
  const locationBreakdown = useMemo(() => {
    return PREDETERMINED_LOCATIONS.map((loc) => {
      const locMsgs = messages.filter((m) => m.location?.toLowerCase() === loc.toLowerCase());
      const stats = calcStats(locMsgs);
      const toMca = locMsgs.filter((m) => m.destinationOffice === 'mca').length;
      const toHelp = locMsgs.filter((m) => m.destinationOffice === 'helpdesk').length;
      const toChief = locMsgs.filter((m) => m.destinationOffice === 'chief').length;
      return {
        location: loc,
        ...stats,
        toMca,
        toHelp,
        toChief
      };
    });
  }, [messages]);

  // Granular rows for the analytics sub-table (Location x Office)
  const granularAnalyticsRows = useMemo(() => {
    const rows = [];
    const offices = [
      { id: 'mca', label: 'MCA Dashboard' },
      { id: 'helpdesk', label: 'Help Desk (Them)' },
      { id: 'chief', label: 'Area Chiefs' }
    ];

    PREDETERMINED_LOCATIONS.forEach((loc) => {
      offices.forEach((off) => {
        const matches = messages.filter(
          (m) =>
            m.location?.toLowerCase() === loc.toLowerCase() &&
            m.destinationOffice === off.id
        );
        const stats = calcStats(matches);
        rows.push({
          id: `${loc}-${off.id}`,
          location: loc,
          office: off.label,
          officeId: off.id,
          ...stats
        });
      });
    });

    return rows.sort((a, b) => {
      let valA = a[tableSortField];
      let valB = b[tableSortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }
      if (valA < valB) return tableSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return tableSortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [messages, tableSortField, tableSortDir]);

  // Filter messages for Desk subpage
  const filteredMessages = useMemo(() => {
    return messages
      .filter((m) => {
        if (selectedOffice !== 'all' && m.destinationOffice !== selectedOffice) {
          return false;
        }
        if (selectedLocation !== 'all' && m.location?.toLowerCase() !== selectedLocation.toLowerCase()) {
          return false;
        }
        if (statusFilter === 'replied' && m.status !== 'replied') return false;
        if (statusFilter === 'to_be_replied' && m.status === 'replied') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSender = m.senderName?.toLowerCase().includes(q);
          const matchStudent = m.studentName?.toLowerCase().includes(q);
          const matchSubj = m.subject?.toLowerCase().includes(q);
          const matchBody = m.body?.toLowerCase().includes(q);
          if (!matchSender && !matchStudent && !matchSubj && !matchBody) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.sentDate).getTime();
        const timeB = new Date(b.sentDate).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [messages, selectedOffice, selectedLocation, statusFilter, searchQuery, sortOrder]);

  // Selected message object
  const activeMessage = useMemo(() => {
    if (!selectedMessageId) {
      return filteredMessages[0] || null;
    }
    return messages.find((m) => m.id === selectedMessageId) || filteredMessages[0] || null;
  }, [selectedMessageId, filteredMessages, messages]);

  // Handlers
  function handleSendReply(e) {
    e.preventDefault();
    if (!activeMessage || !replyText.trim()) return;
    replyToMessage(activeMessage.id, replyText);
    setMessages(getHelpDeskMessages());
    setReplyText('');
    triggerFeedback(`Official reply sent to ${activeMessage.senderName}.`, 5000);
  }

  function handleForwardMca(e) {
    e.preventDefault();
    if (!activeMessage || !mcaNoteText.trim()) return;
    forwardMessageToMca(activeMessage.id, mcaNoteText);
    setMessages(getHelpDeskMessages());
    setMcaNoteText('');
    setShowMcaForwardBox(false);
    triggerFeedback(`Message from ${activeMessage.senderName} forwarded directly to MCA with assessment note.`, 5000);
  }

  return (
    <HelpDeskLayout pageTitle="Communications &amp; Texts" layout="dashboard">
      <div className="stitch-dashboard">
        {/* Floating Screen Feedback Toast */}
        {feedback && (
          <div className="hd-toast notice" role="alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="check" size={18} />
              <span>{feedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: '1.1rem',
                padding: '0 4px',
                lineHeight: 1
              }}
              aria-label="Dismiss feedback"
            >
              ×
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUBPAGE 1: MESSAGES DESK (WhatsApp Styled Communications) */}
        {/* ========================================================= */}
        {activeSubpage === 'desk' && (
          <TableSubpage
            title="Messages Management Desk"
            category="Communications"
            onClose={closeSubpage}
            badgeText={`${filteredMessages.length} Messages`}
            badgeTone="review"
            toolbar={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Inline Row 1: Filters & Sort */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Destination Office Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="msg-office-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Office:</label>
                      <select
                        id="msg-office-sel"
                        value={selectedOffice}
                        onChange={(e) => setSelectedOffice(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.84rem' }}
                      >
                        <option value="all">All Destinations ({messages.length})</option>
                        <option value="helpdesk">Help Desk ({helpdeskStats.total})</option>
                        <option value="mca">MCA Office ({mcaStats.total})</option>
                        <option value="chief">Area Chiefs ({chiefStats.total})</option>
                      </select>
                    </div>

                    {/* Pre-determined Location Select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="msg-loc-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Location:</label>
                      <select
                        id="msg-loc-sel"
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.84rem' }}
                      >
                        <option value="all">All Locations</option>
                        {PREDETERMINED_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status Select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="msg-status-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Status:</label>
                      <select
                        id="msg-status-sel"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.84rem' }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="to_be_replied">Pending ({overallStats.pending})</option>
                        <option value="replied">Replied ({overallStats.replied})</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSortOrder(o => o === 'desc' ? 'asc' : 'desc')}
                    className="btn btn--secondary"
                    style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  >
                    {sortOrder === 'desc' ? '▼ Newest' : '▲ Oldest'}
                  </button>
                </div>

                {/* Inline Row 2: Search */}
                <div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by sender, student, or subject keywords..."
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: '#0b1422',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontSize: '0.86rem'
                    }}
                  />
                </div>
              </div>
            }
          >
            {/* Split Screen WhatsApp Styled Message View (Mobile: Tap opens chat) */}
            <div className={`wa-split-layout ${mobileChatViewActive ? 'is-chat-active' : ''}`}>
              {/* Left Column: Messages List (Dark Theme) */}
              <div
                className="hd-card wa-list-col"
                style={{
                  maxHeight: 620,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0
                }}
              >
                {filteredMessages.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                    No messages match current filters.
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isSelected = activeMessage?.id === msg.id;
                    const isReplied = msg.status === 'replied';
                    const officeColor = msg.destinationOffice === 'mca' ? 'var(--gold-champagne, #ddbb6a)' : msg.destinationOffice === 'helpdesk' ? '#22C55E' : '#38BDF8';
                    const officeLabel = msg.destinationOffice === 'mca' ? 'MCA' : msg.destinationOffice === 'helpdesk' ? 'HD' : 'CH';

                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          setSelectedMessageId(msg.id);
                          setMobileChatViewActive(true);
                        }}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(221, 187, 106, 0.1)' : 'transparent',
                          borderLeft: isSelected ? '3px solid var(--gold-champagne, #ddbb6a)' : '3px solid transparent',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 12,
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {/* Avatar Initials */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: `${officeColor}20`,
                            border: `1px solid ${officeColor}50`,
                            color: officeColor,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: 2
                          }}
                        >
                          {officeLabel}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontWeight: 600, fontSize: '0.86rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {msg.senderName}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', flexShrink: 0 }}>
                              {new Date(msg.sentDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--gold-champagne, #ddbb6a)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {msg.subject}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className="badge badge--neutral" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>{msg.location}</span>
                            <span className={`badge ${msg.destinationOffice === 'mca' ? 'badge--info' : 'badge--neutral'}`} style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                              To: {msg.destinationOffice.toUpperCase()}
                            </span>
                            <span className={`badge ${isReplied ? 'badge--success' : 'badge--warning'}`} style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                              {isReplied ? 'Replied' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: WhatsApp Theme Chat View */}
              <div className="wa-container wa-chat-col" style={{ height: 620 }}>
                {activeMessage ? (
                  <>
                    {/* WhatsApp Chat Header */}
                    <div className="wa-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Mobile Back Button */}
                        <button
                          type="button"
                          onClick={() => setMobileChatViewActive(false)}
                          className="wa-back-btn"
                          aria-label="Back to messages list"
                        >
                          ← Back
                        </button>

                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: '50%',
                            background: activeMessage.destinationOffice === 'mca' ? 'rgba(221, 187, 106, 0.2)' : activeMessage.destinationOffice === 'helpdesk' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                            color: activeMessage.destinationOffice === 'mca' ? '#ddbb6a' : activeMessage.destinationOffice === 'helpdesk' ? '#22C55E' : '#38BDF8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem'
                          }}
                        >
                          {activeMessage.destinationOffice === 'mca' ? 'MCA' : activeMessage.destinationOffice === 'helpdesk' ? 'HD' : 'CH'}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ color: '#e9edef', fontSize: '0.92rem' }}>{activeMessage.senderName}</strong>
                            <span style={{ fontSize: '0.72rem', color: '#8696a0' }}>({activeMessage.senderRole})</span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#8696a0' }}>
                            {activeMessage.location} &bull; Student: {activeMessage.studentName}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className={`stitch-status-badge ${activeMessage.status === 'replied' ? 'stitch-status-badge--admitted' : 'stitch-status-badge--review'}`} style={{ fontSize: '0.7rem' }}>
                          {activeMessage.status === 'replied' ? 'Replied' : 'Pending'}
                        </span>

                        {/* Forward to MCA button if message is to MCA */}
                        {activeMessage.destinationOffice === 'mca' && !activeMessage.forwardedToMca && (
                          <button
                            type="button"
                            onClick={() => setShowMcaForwardBox(b => !b)}
                            className="btn btn--secondary"
                            style={{ fontSize: '0.74rem', padding: '4px 10px' }}
                            title="Forward directly to MCA"
                          >
                            ↪ Forward to MCA
                          </button>
                        )}
                        {activeMessage.forwardedToMca && (
                          <span className="badge badge--info" style={{ fontSize: '0.7rem' }}>
                            Forwarded to MCA
                          </span>
                        )}
                      </div>
                    </div>

                    {/* WhatsApp Messages Scroll Area */}
                    <div className="wa-messages-area">
                      {/* Incoming Applicant Message Bubble */}
                      <div className="wa-bubble wa-bubble--incoming">
                        <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#53bdeb', marginBottom: 2 }}>
                          {activeMessage.senderName} &bull; To: {activeMessage.destinationOffice.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--gold-champagne, #ddbb6a)', marginBottom: 6 }}>
                          {activeMessage.subject}
                        </div>
                        <div>{activeMessage.body}</div>
                        <div className="wa-bubble__meta">
                          <span>{new Date(activeMessage.sentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Forward to MCA Note Bubble (if forwarded) */}
                      {activeMessage.forwardedToMca && (
                        <div
                          style={{
                            alignSelf: 'center',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            color: '#93C5FD',
                            borderRadius: 8,
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            maxWidth: '90%',
                            textAlign: 'center'
                          }}
                        >
                          <strong>Forwarded to MCA Desk:</strong> {activeMessage.forwardedToMcaNote}
                        </div>
                      )}

                      {/* Outgoing Replies (WhatsApp Green Bubbles with Double Checkmarks) */}
                      {activeMessage.replies?.map((r, idx) => (
                        <div key={idx} className="wa-bubble wa-bubble--outgoing">
                          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(233, 237, 239, 0.8)', marginBottom: 2 }}>
                            {r.sender}
                          </div>
                          <div>{r.body}</div>
                          <div className="wa-bubble__meta">
                            <span>{new Date(r.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span style={{ color: '#53bdeb', fontWeight: 700, marginLeft: 3 }}>✓✓</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Inline Forward to MCA Drawer (for MCA messages) */}
                    {activeMessage.destinationOffice === 'mca' && showMcaForwardBox && !activeMessage.forwardedToMca && (
                      <div style={{ background: '#1c272e', borderTop: '1px solid #2f3b43', padding: '10px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          id="mca-note-input"
                          type="text"
                          value={mcaNoteText}
                          onChange={(e) => setMcaNoteText(e.target.value)}
                          placeholder="Add Help Desk assessment note for the MCA..."
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, background: '#2a3942', border: '1px solid transparent', color: '#fff', fontSize: '0.84rem' }}
                        />
                        <button
                          type="button"
                          onClick={handleForwardMca}
                          disabled={!mcaNoteText.trim()}
                          className="btn btn--primary"
                          style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                        >
                          Confirm Forward
                        </button>
                      </div>
                    )}

                    {/* Chat Action Footer: Chief Messages are READ-ONLY! */}
                    {activeMessage.destinationOffice === 'chief' ? (
                      <div
                        style={{
                          background: '#182229',
                          borderTop: '1px solid #222e35',
                          padding: '12px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          color: '#38BDF8',
                          fontSize: '0.82rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon name="lock" size={16} />
                          <span><strong>Read-Only Channel:</strong> Chief verification texts are managed directly by Area Chiefs. Help Desk monitors answer rates.</span>
                        </div>
                        <span className="badge badge--info" style={{ fontSize: '0.7rem' }}>
                          {activeMessage.status === 'replied' ? 'Chief Replied' : 'Pending Chief'}
                        </span>
                      </div>
                    ) : (
                      /* WhatsApp Input Bar for Help Desk and MCA texts */
                      <form onSubmit={handleSendReply} className="wa-input-bar">
                        <input
                          id="desk-reply-input"
                          type="text"
                          className="wa-input"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={`Type official reply to ${activeMessage.senderName}...`}
                          aria-label="Official reply input"
                        />
                        <button
                          type="submit"
                          disabled={!replyText.trim()}
                          className="btn btn--primary"
                          aria-label="Send Official Reply"
                          style={{
                            padding: '8px 16px',
                            borderRadius: 20,
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <Icon name="support" size={15} />
                          <span>Send Official Reply</span>
                        </button>
                      </form>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 48, color: '#8696a0' }}>
                    Select a conversation from the left to start messaging.
                  </div>
                )}
              </div>
            </div>
          </TableSubpage>
        )}

        {/* ========================================================= */}
        {/* SUBPAGE 2: MESSAGES ANALYTICS TABLE */}
        {/* ========================================================= */}
        {activeSubpage === 'analytics_table' && (
          <TableSubpage
            title="Messages Analytics by Location &amp; Destination"
            category="Communications"
            onClose={closeSubpage}
            badgeText={`${overallStats.rate}% Overall Reply Rate`}
            badgeTone="review"
            toolbar={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label htmlFor="analytics-sort-sel" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>Sort By:</label>
                  <select
                    id="analytics-sort-sel"
                    value={tableSortField}
                    onChange={(e) => setTableSortField(e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontSize: '0.84rem' }}
                  >
                    <option value="rate">Reply Rate (%)</option>
                    <option value="total">Total Messages Sent</option>
                    <option value="location">Location</option>
                    <option value="office">Destination Office</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setTableSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    className="btn btn--secondary"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  >
                    {tableSortDir === 'asc' ? '▲ Asc' : '▼ Desc'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => openSubpage('desk')}
                  className="btn btn--primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Icon name="support" size={16} />
                  Open Message Management Desk
                </button>
              </div>
            }
          >
            <div className="data-table-wrap">
              <table className="data-table" aria-label="Messages analytics table">
                <thead>
                  <tr>
                    <th scope="col">Location</th>
                    <th scope="col">Destination Office</th>
                    <th scope="col">Total Sent</th>
                    <th scope="col">Replies Sent (Replied)</th>
                    <th scope="col">Pending Replies</th>
                    <th scope="col">Reply Rate (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {granularAnalyticsRows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong style={{ color: '#fff' }}>{row.location}</strong>
                      </td>
                      <td>
                        <span className={`badge ${row.officeId === 'mca' ? 'badge--info' : 'badge--neutral'}`}>
                          {row.office}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: '#fff' }}>{row.total}</strong>
                      </td>
                      <td>
                        <span style={{ color: '#22C55E', fontWeight: 600 }}>{row.replied}</span>
                      </td>
                      <td>
                        <span style={{ color: row.pending > 0 ? '#F87171' : '#94a3b8' }}>{row.pending}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 80, height: 6, borderRadius: 999, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${row.rate}%`,
                                background: row.rate >= 75 ? '#22C55E' : 'var(--gold-champagne, #ddbb6a)',
                                borderRadius: 999
                              }}
                            />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{row.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableSubpage>
        )}

        {/* ========================================================= */}
        {/* DEFAULT OVERVIEW VIEW (4 Distinct Dark Minimal Cards) */}
        {/* ========================================================= */}
        {!activeSubpage && (
          <section className="dash-single-card" style={{ background: '#0b1322', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            {/* Header: Minimal, with top-right refresh icon */}
            <div className="dash-single-card__head" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div>
                <h2 className="stitch-section-title" style={{ margin: 0, color: '#fff', fontSize: '1.25rem' }}>
                  Communications &amp; Texts
                </h2>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 4 }}>
                  Monitor messages sent to MCA, Help Desk, and Chiefs across locations.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Top-Right Refresh Icon Button */}
                <button
                  type="button"
                  onClick={reloadData}
                  disabled={refreshing}
                  className="hd-icon-btn hd-icon-btn--gold"
                  title="Refresh Communications"
                  aria-label="Refresh Communications"
                >
                  <Icon name="refresh" size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => openSubpage('desk')}
                  className="btn btn--primary"
                  style={{ fontSize: '0.85rem' }}
                >
                  <Icon name="support" size={16} />
                  Open Messages Desk
                </button>
              </div>
            </div>

            {/* 4 DISTINCT CARDS: Help Desk, MCA, Chiefs, Communications Command */}
            <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
                {/* CARD 1: Help Desk Messages */}
                <div
                  className="hd-card hd-card--interactive"
                  onClick={() => {
                    setSelectedOffice('helpdesk');
                    openSubpage('desk');
                  }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px 22px',
                    borderRadius: 14,
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
                        <strong style={{ fontSize: '0.98rem', color: '#fff' }}>Help Desk Messages</strong>
                      </div>
                      <span className="badge badge--success" style={{ fontSize: '0.72rem' }}>
                        {helpdeskStats.rate}% Replied
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>
                      Direct applicant inquiries &amp; queries
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                      {helpdeskStats.total} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8' }}>Total</span> &bull; {helpdeskStats.replied} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#22C55E' }}>Replied</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{helpdeskStats.pending} Pending</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOffice('helpdesk');
                        openSubpage('desk');
                      }}
                      className="btn btn--primary"
                      style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    >
                      <Icon name="support" size={14} />
                      Manage Desk Texts
                    </button>
                  </div>
                </div>

                {/* CARD 2: MCA Messages */}
                <div
                  className="hd-card hd-card--interactive"
                  onClick={() => {
                    setSelectedOffice('mca');
                    openSubpage('desk');
                  }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px 22px',
                    borderRadius: 14,
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--gold-champagne, #ddbb6a)' }} />
                        <strong style={{ fontSize: '0.98rem', color: '#fff' }}>MCA Messages</strong>
                      </div>
                      <span className="badge badge--warning" style={{ fontSize: '0.72rem' }}>
                        {mcaStats.rate}% Replied
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>
                      Ward escalations &bull; Answer or Forward
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                      {mcaStats.total} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8' }}>Total</span> &bull; {mcaStats.replied} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: 'var(--gold-champagne, #ddbb6a)' }}>Replied</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>{mcaStats.pending} Pending</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOffice('mca');
                        openSubpage('desk');
                      }}
                      className="btn btn--secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    >
                      Manage MCA Texts
                    </button>
                  </div>
                </div>

                {/* CARD 3: Chief Messages (Answered vs Sent Analysis) */}
                <div
                  className="hd-card hd-card--interactive"
                  onClick={() => {
                    setSelectedOffice('chief');
                    openSubpage('desk');
                  }}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px 22px',
                    borderRadius: 14,
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38BDF8' }} />
                        <strong style={{ fontSize: '0.98rem', color: '#fff' }}>Chief Messages</strong>
                      </div>
                      <span className="badge badge--info" style={{ fontSize: '0.72rem' }}>
                        {chiefAnalytics.replyRate}% Answered
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 8 }}>
                      Verification Sign-offs &bull; Read-Only
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                      {chiefAnalytics.totalSent} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8' }}>Sent</span> &bull; {chiefAnalytics.answered} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#38BDF8' }}>Answered</span>
                    </div>
                    {/* Micro breakdown per chief */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(255, 255, 255, 0.03)', padding: '6px 8px', borderRadius: 6, fontSize: '0.74rem' }}>
                      {chiefAnalytics.chiefs.map((c) => (
                        <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
                          <span>{c.name.replace('Chief ', '')}:</span>
                          <span style={{ fontWeight: 600, color: c.rate >= 80 ? '#22C55E' : c.rate > 0 ? '#ddbb6a' : '#F87171' }}>
                            {c.answered}/{c.total} ({c.rate}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Chief-managed</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOffice('chief');
                        openSubpage('desk');
                      }}
                      className="btn btn--secondary"
                      style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                    >
                      View Chief Texts
                    </button>
                  </div>
                </div>

                {/* CARD 4: Communications Command & Analytics */}
                <div
                  className="hd-card hd-card--interactive"
                  onClick={() => openSubpage('analytics_table')}
                  style={{
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '24px 22px',
                    borderRadius: 14,
                    gap: 16
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#A855F7' }} />
                        <strong style={{ fontSize: '0.98rem', color: '#fff' }}>Communications Command</strong>
                      </div>
                      <span className="badge badge--neutral" style={{ fontSize: '0.72rem' }}>
                        {overallStats.rate}% Overall
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>
                      Cross-desk volume &amp; location analytics
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                      {overallStats.total} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#94a3b8' }}>Messages</span> &bull; {overallStats.replied} <span style={{ fontSize: '0.82rem', fontWeight: 400, color: '#A855F7' }}>Replied</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSubpage('desk');
                      }}
                      className="btn btn--primary"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', justifyContent: 'center' }}
                    >
                      <Icon name="support" size={14} />
                      Open Messages Desk
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openSubpage('analytics_table');
                      }}
                      className="btn btn--secondary"
                      style={{ flex: 1, fontSize: '0.78rem', padding: '6px 10px', justifyContent: 'center' }}
                    >
                      Open Full Analytics Table (Sub-page)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Location Analytics Breakdown Cards (Dark Minimal) */}
            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <strong style={{ fontSize: '1rem', color: '#fff' }}>
                  Location Breakdown (Tendeno, Sorget, Parklands, Westlands)
                </strong>
                <button
                  type="button"
                  onClick={() => openSubpage('analytics_table')}
                  className="btn btn--secondary"
                  style={{ fontSize: '0.8rem', padding: '5px 12px' }}
                >
                  View Full Analytics Table
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {locationBreakdown.map((loc) => (
                  <div
                    key={loc.location}
                    className="hd-card hd-card--interactive"
                    onClick={() => {
                      setSelectedLocation(loc.location);
                      openSubpage('desk');
                    }}
                    style={{
                      cursor: 'pointer',
                      padding: '20px 22px',
                      borderRadius: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.96rem', color: '#fff' }}>{loc.location}</strong>
                      <span className="badge badge--neutral" style={{ fontSize: '0.7rem' }}>{loc.total} Messages</span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 4, color: '#94a3b8' }}>
                        <span>Reply Rate: <strong style={{ color: '#fff' }}>{loc.rate}%</strong></span>
                        <span>{loc.replied} of {loc.total}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${loc.rate}%`,
                            background: loc.rate >= 75 ? '#22C55E' : 'var(--gold-champagne, #ddbb6a)',
                            borderRadius: 999
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>MCA: {loc.toMca}</span>
                      <span>Desk: {loc.toHelp}</span>
                      <span>Chief: {loc.toChief}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLocation(loc.location);
                        openSubpage('desk');
                      }}
                      className="btn btn--secondary"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '5px' }}
                    >
                      Manage {loc.location} Texts
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </HelpDeskLayout>
  );
}
