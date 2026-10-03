import React, { useState } from 'react';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useCachedQuery } from '../../../lib/useCachedQuery';
import { fetchParentAccount, fetchParentChildren } from '../../../lib/accountQueries';
import { fetchParentOfficeMessages, sendParentOfficeMessage } from '../../../lib/queries';
import { joinFullName } from '../../../lib/accountAllocation';

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

export function ParentMessagesPage() {
  const { user } = useAuth();
  const [targetOffice, setTargetOffice] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitOffice, setLimitOffice] = useState(null);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sentNotice, setSentNotice] = useState('');

  const { data, loading, refreshing, error: loadError, refresh, update } = useCachedQuery(
    user?.id ? `${user.id}:parent-messages` : null,
    async () => {
      const [parent, children] = await Promise.all([
        fetchParentAccount(user.id),
        fetchParentChildren(user.id)
      ]);
      const childIds = (children || []).map((c) => c.id);
      const messages = childIds.length ? await fetchParentOfficeMessages(childIds) : [];
      const parentName = parent
        ? joinFullName({ firstName: parent.first_name, middleName: parent.middle_name, lastName: parent.last_name })
        : 'Parent';
      return { parent, parentName, children: children || [], messages: messages || [] };
    },
    { enabled: Boolean(user?.id) }
  );

  const parentName = data?.parentName || 'Parent';
  const children = data?.children || [];
  const messages = data?.messages || [];

  function getMonthlyCount(officeId) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return messages.filter((msg) => {
      if (!msg.created_at) return false;
      const d = new Date(msg.created_at);
      if (d.getFullYear() !== currentYear || d.getMonth() !== currentMonth) return false;
      const label = (msg.metadata?.office_label || msg.metadata?.office || '').toLowerCase();
      if (officeId === 'mca') return label.includes('mca');
      if (officeId === 'chief') return label.includes('chief');
      if (officeId === 'help') return label.includes('help') || label.includes('desk') || label.includes('support');
      return false;
    }).length;
  }

  function handleOfficeClick(item) {
    const limits = { mca: 1, chief: 2, help: 3 };
    const limit = limits[item.id] || 3;
    const sentCount = getMonthlyCount(item.id);

    if (sentCount >= limit) {
      setLimitOffice(item);
      setLimitModalOpen(true);
      return;
    }

    setTargetOffice(item);
    setError('');

    if (children.length === 0) {
      setError('You must have at least one linked student to contact the office.');
      return;
    }

    // Always ask parent to choose which student has an issue before compose
    setStudentModalOpen(true);
  }

  function handleSelectStudentAndProceed(child) {
    setSelectedStudent(child);
    setStudentModalOpen(false);
    setBody('');
    setError('');
    setComposeModalOpen(true);
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!user?.id || !targetOffice || !selectedStudent) return;

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
    const childFullName = joinFullName({
      firstName: selectedStudent.first_name,
      middleName: selectedStudent.middle_name,
      lastName: selectedStudent.last_name
    });

    try {
      const result = await sendParentOfficeMessage({
        parentAuthUserId: user.id,
        studentProfileId: selectedStudent.id,
        studentName: childFullName,
        office: targetOffice.id,
        body
      });

      const text = body.trim();
      const newMsg = {
        id: `local-${Date.now()}`,
        student_profile_id: selectedStudent.id,
        metadata: {
          office: targetOffice.id,
          office_label: result.label || targetOffice.title,
          tagged_student_id: selectedStudent.id,
          tagged_student_name: childFullName,
          sent_by_parent: true
        },
        activity_description: text,
        created_at: new Date().toISOString()
      };

      update((prev) => ({
        ...(prev || {}),
        messages: [newMsg, ...(prev?.messages || [])]
      }));

      setBody('');
      setComposeModalOpen(false);
      setSelectedStudent(null);
      setSentNotice(`Message sent to the ${targetOffice.title.toLowerCase()} regarding ${childFullName}.`);
      setTimeout(() => setSentNotice(''), 5000);
    } catch (err) {
      setError(err.message || 'Could not send this message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <ParentLayout pageTitle="Contact" parentName={parentName} layout="dashboard">
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title">Contact Office</h1>
        <p className="stitch-support-hero__desc">
          Send a message to the area chief, the MCA office, or the help desk regarding your linked student.
        </p>
        <div className="btn-row" style={{ marginTop: 12 }}>
          <RefreshButton onClick={refresh} busy={refreshing} />
        </div>
      </div>

      {sentNotice ? (
        <div className="notice" style={{ marginBottom: 16 }}>
          <p className="student-inline-note student-inline-note--ok" style={{ margin: 0 }}>{sentNotice}</p>
        </div>
      ) : null}

      {error && !composeModalOpen && !studentModalOpen ? (
        <div className="notice" style={{ marginBottom: 16, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      ) : null}

      <div className="stitch-support-grid">
        {OFFICES.map((item) => (
          <button
            key={item.id}
            type="button"
            className="stitch-support-card stitch-support-card--compact"
            onClick={() => handleOfficeClick(item)}
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

      {/* Step 1: Select student with an issue */}
      {studentModalOpen && targetOffice ? (
        <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="select-student-title">
          <button type="button" className="modal-root__backdrop" onClick={() => setStudentModalOpen(false)} aria-label="Close" />
          <div className="modal-panel modal-panel--prompt" style={{ maxWidth: 540 }}>
            <div className="modal-panel__header">
              <h2 id="select-student-title" className="modal-panel__title">
                Choose Student with an Issue
              </h2>
              <button type="button" className="modal-panel__close" onClick={() => setStudentModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-panel__body">
              <p className="field__help" style={{ marginTop: 0 }}>
                Select the student this message concerns. The message will be tagged to their record at the {targetOffice.title.toLowerCase()}.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {children.map((child) => {
                  const name = joinFullName({
                    firstName: child.first_name,
                    middleName: child.middle_name,
                    lastName: child.last_name
                  });
                  return (
                    <button
                      key={child.id}
                      type="button"
                      className="dash-suite__card"
                      onClick={() => handleSelectStudentAndProceed(child)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <strong style={{ display: 'block', fontSize: '1rem' }}>{name}</strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-2, #64748b)' }}>
                          {child.school_name || 'Institution pending'} · Adm: {child.admission_number || '—'}
                        </span>
                      </div>
                      <Icon name="chevronRight" size={18} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Step 2: Compose Message Popup */}
      {composeModalOpen && targetOffice && selectedStudent ? (
        <div className="modal-root modal-root--center" role="dialog" aria-modal="true" aria-labelledby="compose-modal-title">
          <button type="button" className="modal-root__backdrop" onClick={() => setComposeModalOpen(false)} aria-label="Close" />
          <div className="modal-panel modal-panel--prompt" style={{ maxWidth: 560 }}>
            <div className="modal-panel__header">
              <h2 id="compose-modal-title" className="modal-panel__title">
                Message {targetOffice.title.toLowerCase()}
              </h2>
              <button type="button" className="modal-panel__close" onClick={() => setComposeModalOpen(false)} aria-label="Close">×</button>
            </div>
            <div className="modal-panel__body">
              <form onSubmit={handleSend}>
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(212,175,55,0.1)',
                  borderRadius: 8,
                  marginBottom: 16,
                  border: '1px solid rgba(212,175,55,0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', fontWeight: 600 }}>
                    <Icon name="profile" size={16} />
                    Student tagged:{' '}
                    {joinFullName({
                      firstName: selectedStudent.first_name,
                      middleName: selectedStudent.middle_name,
                      lastName: selectedStudent.last_name
                    })}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-2, #64748b)' }}>
                    At the reception, this message will be delivered under this student's account.
                  </p>
                </div>

                <div className="field">
                  <label htmlFor="office-message">Your message</label>
                  <textarea
                    id="office-message"
                    rows={4}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={`Write your message regarding ${selectedStudent.first_name || 'the student'}...`}
                    required
                    autoFocus
                  />
                </div>
                {error ? <p className="field__help" style={{ color: '#f87171' }}>{error}</p> : null}
                <div className="btn-row" style={{ marginTop: 16 }}>
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
                    disabled={sending || !body.trim()}
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

      {/* Limit Modal */}
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
          <p className="field__help">Messages you send regarding your children will appear here.</p>
        ) : (
          <div className="dash-activity__list">
            {messages.map((item) => (
              <article key={item.id} className="dash-activity__item">
                <div className="dash-activity__item-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p className="dash-activity__item-title" style={{ margin: 0 }}>
                      {item.metadata?.office_label || 'Office'}
                    </p>
                    {item.metadata?.tagged_student_name && (
                      <span className="stitch-status-badge stitch-status-badge--review" style={{ fontSize: '0.75rem' }}>
                        Student: {item.metadata.tagged_student_name}
                      </span>
                    )}
                  </div>
                  <p className="stitch-body-text" style={{ marginTop: 6 }}>{item.activity_description}</p>
                </div>
                {item.created_at ? (
                  <span className="stitch-label stitch-label--muted">{new Date(item.created_at).toLocaleString()}</span>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </ParentLayout>
  );
}
