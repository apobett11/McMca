import React, { useState } from 'react';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { fetchStudentOfficeMessages, fetchStudentProfile, sendStudentOfficeMessage } from '../../../lib/queries';

const OFFICES = [
  {
    id: 'chief',
    title: 'Area chief',
    desc: 'Verification and local questions about your ward.',
    icon: 'shield',
    tone: 'primary'
  },
  {
    id: 'mca',
    title: 'MCA office',
    desc: 'Bursary status and committee questions.',
    icon: 'applications',
    tone: 'secondary'
  },
  {
    id: 'help',
    title: 'Help desk',
    desc: 'Account and portal support.',
    icon: 'support',
    tone: 'tertiary'
  }
];

export function StudentMessagesPage() {
  const { user } = useAuth();
  const [targetOffice, setTargetOffice] = useState(OFFICES[0]);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitOffice, setLimitOffice] = useState(null);
  const [heading, setHeading] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentNotice, setSentNotice] = useState('');

  const { data, loading, refreshing, error: loadError, refresh, update } = useCachedQuery(
    user?.id ? `${user.id}:student-messages` : null,
    async () => {
      const [profile, history] = await Promise.all([
        fetchStudentProfile(user.id),
        fetchStudentOfficeMessages(user.id)
      ]);
      const name = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ');
      return { studentName: name, messages: history || [] };
    },
    { enabled: Boolean(user?.id) }
  );
  const studentName = data?.studentName || '';
  const messages = data?.messages || [];

  function getMonthlyCount(officeId) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return messages.filter((msg) => {
      if (!msg.created_at) return false;
      const d = new Date(msg.created_at);
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
      const label = (msg.metadata?.office_label || '').toLowerCase();
      if (officeId === 'mca') return label.includes('mca');
      if (officeId === 'chief') return label.includes('chief');
      if (officeId === 'help') return label.includes('help') || label.includes('desk') || label.includes('support');
      return false;
    }).length;
  }

  function handleCardClick(item) {
    const limits = { mca: 1, chief: 2, help: 3 };
    const limit = limits[item.id] || 3;
    const sentCount = getMonthlyCount(item.id);

    if (sentCount >= limit) {
      setLimitOffice(item);
      setLimitModalOpen(true);
      return;
    }

    setTargetOffice(item);
    setHeading('');
    setBody('');
    setError('');
    setComposeModalOpen(true);
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!user?.id || !targetOffice) return;

    const limits = { mca: 1, chief: 2, help: 3 };
    const limit = limits[targetOffice.id] || 3;
    const sentCount = getMonthlyCount(targetOffice.id);

    if (sentCount >= limit) {
      setComposeModalOpen(false);
      setLimitOffice(targetOffice);
      setLimitModalOpen(true);
      return;
    }

    setSending(true);
    setError('');
    try {
      const result = await sendStudentOfficeMessage(user.id, {
        office: targetOffice.id,
        heading,
        body
      });
      const text = body.trim();
      const head = heading.trim();
      const displayDesc = head ? `${head} — ${text}` : text;
      update((prev) => ({
        studentName: prev?.studentName || '',
        messages: [
          {
            id: `local-${Date.now()}`,
            metadata: { office_label: result.label || targetOffice.title, heading: head },
            activity_description: displayDesc,
            created_at: new Date().toISOString()
          },
          ...(prev?.messages || [])
        ]
      }));
      setHeading('');
      setBody('');
      setComposeModalOpen(false);
      setSentNotice(`Message sent to the ${targetOffice.title.toLowerCase()}.`);
      setTimeout(() => setSentNotice(''), 5000);
    } catch (err) {
      setError(err.message || 'Could not send this message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <StudentLayout pageTitle="Contact" layout="dashboard" studentName={studentName}>
      <div className="stitch-support-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="stitch-support-hero__title">Contact</h1>
          <p className="stitch-support-hero__desc">
            Send a message to the area chief, the MCA office, or the help desk.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => handleCardClick(OFFICES[0])}
            style={{ borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 14 }}
          >
            <Icon name="support" size={18} />
            <span>Send message</span>
          </button>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            title="Refresh messages"
            aria-label="Refresh"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--glass-border, rgba(148, 163, 184, 0.2))',
              borderRadius: '50%',
              width: 38,
              height: 38,
              padding: 0,
              cursor: refreshing ? 'default' : 'pointer',
              color: refreshing ? 'var(--primary, #3B82F6)' : 'var(--text-muted, #94A3B8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: refreshing ? 0.7 : 1
            }}
          >
            <Icon name="refresh" size={16} />
          </button>
        </div>
      </div>

      {sentNotice ? (
        <div className="notice" style={{ marginBottom: 16 }}>
          <p className="student-inline-note student-inline-note--ok" style={{ margin: 0 }}>{sentNotice}</p>
        </div>
      ) : null}

      <div style={{ marginTop: 22, marginBottom: 14 }}>
        <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.15rem' }}>
          Select who to message
        </h2>
      </div>

      <div className="stitch-support-grid">
        {OFFICES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="stitch-support-card stitch-support-card--compact"
            onClick={() => handleCardClick(item)}
            title={`Message ${item.title}`}
          >
            <div className={`stitch-support-card__icon stitch-support-card__icon--${item.tone}`}>
              <Icon name={item.icon} size={22} />
            </div>
            <h3 className="stitch-support-card__title">{item.title}</h3>
            <p className="stitch-support-card__desc">{item.desc}</p>
          </button>
        ))}
      </div>

      {composeModalOpen && targetOffice ? (
        <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="compose-modal-title">
          <button type="button" className="modal-root__backdrop" onClick={() => setComposeModalOpen(false)} aria-label="Close" />
          <div className="modal-panel modal-panel--prompt" style={{ maxWidth: 540 }}>
            <div className="modal-panel__header">
              <h2 id="compose-modal-title" className="modal-panel__title">
                Send Message
              </h2>
              <button type="button" className="modal-panel__close" onClick={() => setComposeModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-panel__body">
              <form onSubmit={handleSend}>
                <p className="field__help" style={{ marginTop: 0, marginBottom: 14 }}>
                  {studentName ? `Sending as ${studentName}. ` : ''}
                  The selected office will receive this directly on your student profile.
                </p>

                {/* Recipient Dropdown */}
                <div className="field">
                  <label htmlFor="recipient-dropdown" style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>Recipient</label>
                  <select
                    id="recipient-dropdown"
                    value={targetOffice.id}
                    onChange={(e) => {
                      const selected = OFFICES.find((o) => o.id === e.target.value);
                      if (selected) {
                        setTargetOffice(selected);
                        setError('');
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--surface-container, #1e293b)',
                      color: 'var(--text, #f8fafc)',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                      fontSize: 14
                    }}
                  >
                    <option value="mca">Member of County Assembly (MCA Office)</option>
                    <option value="chief">Area Chief</option>
                    <option value="help">Help Desk</option>
                  </select>
                </div>

                {/* Heading (capped at 80 characters, one sentence) */}
                <div className="field" style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label htmlFor="message-heading" style={{ fontWeight: 600 }}>
                      Heading <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-secondary, #94a3b8)' }}>(one sentence)</span>
                    </label>
                    <span style={{ fontSize: 12, fontWeight: 600, color: heading.length >= 80 ? '#ef4444' : 'var(--text-secondary, #94a3b8)' }}>
                      {heading.length} / 80
                    </span>
                  </div>
                  <input
                    id="message-heading"
                    type="text"
                    maxLength={80}
                    value={heading}
                    onChange={(e) => setHeading(e.target.value.slice(0, 80))}
                    placeholder="Brief summary in one sentence..."
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--surface-container, #1e293b)',
                      color: 'var(--text, #f8fafc)',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                      fontSize: 14
                    }}
                  />
                </div>

                {/* Message (capped at 500 characters) */}
                <div className="field" style={{ marginTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label htmlFor="office-message" style={{ fontWeight: 600 }}>Message</label>
                    <span style={{ fontSize: 12, fontWeight: 600, color: body.length >= 500 ? '#ef4444' : 'var(--text-secondary, #94a3b8)' }}>
                      {body.length} / 500
                    </span>
                  </div>
                  <textarea
                    id="office-message"
                    rows={4}
                    maxLength={500}
                    value={body}
                    onChange={(event) => setBody(event.target.value.slice(0, 500))}
                    placeholder={`Write your message to the ${targetOffice.title.toLowerCase()}...`}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      background: 'var(--surface-container, #1e293b)',
                      color: 'var(--text, #f8fafc)',
                      border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
                      fontSize: 14,
                      resize: 'vertical'
                    }}
                  />
                </div>
                {error ? <p className="field__help" style={{ color: '#f87171', marginTop: 10 }}>{error}</p> : null}
                <div className="btn-row" style={{ marginTop: 18 }}>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => setComposeModalOpen(false)}
                    disabled={sending}
                    style={{ borderRadius: 999, width: 'auto' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={sending || !body.trim() || !heading.trim()}
                    style={{ borderRadius: 999, width: 'auto' }}
                  >
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {limitModalOpen ? (
        <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="limit-modal-title">
          <button type="button" className="modal-root__backdrop" onClick={() => setLimitModalOpen(false)} aria-label="Close" />
          <div className="modal-panel modal-panel--prompt">
            <div className="modal-panel__header">
              <h2 id="limit-modal-title" className="modal-panel__title">Limit Reached</h2>
              <button type="button" className="modal-panel__close" onClick={() => setLimitModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-panel__body">
              <p className="field__help" style={{ marginTop: 0 }}>
                You have reached your message limit for the {limitOffice?.title?.toLowerCase() || 'office'} for this month.
              </p>
              <div className="btn-row" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setLimitModalOpen(false)}
                  style={{ borderRadius: 999, width: 'auto' }}
                >
                  Okay
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="dash-activity">
        <h2 className="stitch-section-title">Sent messages</h2>
        {loading && !data ? <p className="field__help">Loading saved messages…</p> : null}
        {loadError ? <p className="field__help">{loadError}</p> : null}
        {!loading && messages.length === 0 ? (
          <p className="field__help">Messages you send will appear here.</p>
        ) : (
          <div className="dash-activity__list">
            {messages.map((item) => (
              <article key={item.id} className="dash-activity__item">
                <div className="dash-activity__item-body">
                  <p className="dash-activity__item-title">{item.metadata?.office_label || 'Office'}</p>
                  <p className="stitch-body-text">{item.activity_description}</p>
                </div>
                {item.created_at ? (
                  <span className="stitch-label stitch-label--muted">{new Date(item.created_at).toLocaleString()}</span>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </StudentLayout>
  );
}
