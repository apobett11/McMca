import React, { useEffect, useState } from 'react';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
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
  const [office, setOffice] = useState('chief');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState('');
  const [messages, setMessages] = useState([]);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user?.id) return;
      try {
        const [profile, history] = await Promise.all([
          fetchStudentProfile(user.id),
          fetchStudentOfficeMessages(user.id)
        ]);
        if (!active) return;
        const name = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ');
        setStudentName(name);
        setMessages(history || []);
      } catch (err) {
        if (active) setError(err.message || 'Could not load messages.');
      }
    }
    load();
    return () => { active = false; };
  }, [user?.id]);

  async function handleSend(event) {
    event.preventDefault();
    if (!user?.id) return;
    setSending(true);
    setError('');
    setSent('');
    try {
      const result = await sendStudentOfficeMessage(user.id, { office, body });
      const history = await fetchStudentOfficeMessages(user.id);
      setMessages(history);
      setBody('');
      setSent(`Sent to the ${result.label.toLowerCase()}.`);
    } catch (err) {
      setError(err.message || 'Could not send this message.');
    } finally {
      setSending(false);
    }
  }

  const selected = OFFICES.find((item) => item.id === office) || OFFICES[0];

  return (
    <StudentLayout pageTitle="Contact" layout="dashboard" studentName={studentName}>
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title">Contact</h1>
        <p className="stitch-support-hero__desc">
          Send a message to the area chief, the MCA office, or the help desk.
        </p>
      </div>

      <div className="stitch-support-grid">
        {OFFICES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`stitch-support-card${office === item.id ? ' stitch-support-card--selected' : ''}`}
            onClick={() => setOffice(item.id)}
          >
            <div className={`stitch-support-card__icon stitch-support-card__icon--${item.tone}`}>
              <Icon name={item.icon} size={28} />
            </div>
            <h3 className="stitch-support-card__title">{item.title}</h3>
            <p className="stitch-support-card__desc">{item.desc}</p>
          </button>
        ))}
      </div>

      <form className="wizard-panel" onSubmit={handleSend}>
        <h2>Message the {selected.title.toLowerCase()}</h2>
        <p className="field__help">
          {studentName ? `Sending as ${studentName}. ` : ''}
          The office receives this on your student record.
        </p>
        <div className="field">
          <label htmlFor="office-message">Message</label>
          <textarea
            id="office-message"
            rows={5}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={`Write to the ${selected.title.toLowerCase()}`}
            required
          />
        </div>
        {error ? <p className="field__help">{error}</p> : null}
        {sent ? <p className="student-inline-note student-inline-note--ok">{sent}</p> : null}
        <button type="submit" className="btn btn--primary" disabled={sending} style={{ borderRadius: 999, width: 'auto' }}>
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </form>

      <section className="dash-activity">
        <h2 className="stitch-section-title">Sent messages</h2>
        {messages.length === 0 ? (
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
