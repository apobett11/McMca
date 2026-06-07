import React, { useState, useCallback } from 'react';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext';
import { useSecureData } from '../../../lib/useSecureData';
import { fetchStudentProfile, fetchStudentApplication } from '../../../lib/queries';

const CONTACTS = [
  {
    id: 'chief',
    title: 'Message Chief',
    desc: 'Contact your area chief for verification and local inquiries',
    icon: 'shield',
    whatsapp: '254712345678',
    email: 'chief@westlands.go.ke',
    template: `Hello Chief,\n\nI am requesting assistance regarding my bursary application.\n\nStudent Name: {name}\n\nThank you.`
  },
  {
    id: 'mca',
    title: 'Message MCA',
    desc: 'Contact the MCA office for bursary status and committee inquiries',
    icon: 'applications',
    whatsapp: '254712345679',
    email: 'mca@westlands.go.ke',
    template: `Hello MCA,\n\nI am following up on my bursary application.\n\nStudent Name: {name}\n\nThank you.`
  },
  {
    id: 'help',
    title: 'Contact Help Desk',
    desc: 'Get technical support for platform and account issues',
    icon: 'support',
    whatsapp: '254712345680',
    email: 'support@westlands.go.ke',
    template: `Hello Support,\n\nI need assistance with the student portal.\n\nStudent Name: {name}\n\nThank you.`
  }
];

function getDailyCount(key) {
  try {
    const raw = localStorage.getItem(`contact_${key}`);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    const today = new Date().toDateString();
    return date === today ? count : 0;
  } catch {
    return 0;
  }
}

function incrementDailyCount(key) {
  const today = new Date().toDateString();
  const current = getDailyCount(key);
  localStorage.setItem(`contact_${key}`, JSON.stringify({ date: today, count: current + 1 }));
  return current + 1;
}

function ContactModal({ contact, studentName, onClose }) {
  const [contacted, setContacted] = useState(null);

  const message = contact.template.replace('{name}', studentName || 'Student');

  const handleWhatsApp = useCallback(() => {
    const count = getDailyCount(`wa_${contact.id}`);
    if (count >= 5) {
      setContacted('limit');
      return;
    }
    incrementDailyCount(`wa_${contact.id}`);
    const url = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setContacted('whatsapp');
  }, [contact, message]);

  const handleEmail = useCallback(() => {
    const count = getDailyCount(`email_${contact.id}`);
    if (count >= 3) {
      setContacted('limit');
      return;
    }
    incrementDailyCount(`email_${contact.id}`);
    const subject = encodeURIComponent('Bursary Support Request');
    const body = encodeURIComponent(message);
    window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    setContacted('email');
  }, [contact, message]);

  const waCount = getDailyCount(`wa_${contact.id}`);
  const emailCount = getDailyCount(`email_${contact.id}`);

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close" />
      <div className="modal-panel" role="dialog" aria-modal="true">
        <header className="modal-panel__header">
          <h2 className="modal-panel__title">{contact.title}</h2>
          <button type="button" className="modal-panel__close" onClick={onClose}>×</button>
        </header>
        <div className="modal-panel__body">
          {contacted === 'limit' ? (
            <div className="notice" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
              <strong>Daily limit reached</strong>
              <p>You have reached the daily limit for this contact method. Please try again tomorrow.</p>
              <button className="btn btn--primary" onClick={onClose} style={{ borderRadius: 999, width: 'auto', padding: '10px 24px', marginTop: 8 }}>
                Close
              </button>
            </div>
          ) : contacted ? (
            <div className="notice" style={{ background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }}>
              <strong>{contacted === 'whatsapp' ? 'WhatsApp opened' : 'Email client opened'}</strong>
              <p>{contacted === 'whatsapp' ? 'WhatsApp should open in a new tab. If not, check your browser settings.' : 'Your email client should open. If not, check your default email settings.'}</p>
              <button className="btn btn--primary" onClick={onClose} style={{ borderRadius: 999, width: 'auto', padding: '10px 24px', marginTop: 8 }}>
                Done
              </button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 14, color: 'var(--text-2, #94A3B8)', marginBottom: 16 }}>
                Choose how you would like to contact {contact.title.toLowerCase()}.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button className="btn btn--primary" onClick={handleWhatsApp} style={{ borderRadius: 12, width: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="support" size={20} />
                  WhatsApp ({5 - waCount}/5 today)
                </button>
                <button className="btn btn--secondary" onClick={handleEmail} style={{ borderRadius: 12, width: '100%', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Icon name="profile" size={20} />
                  Email ({3 - emailCount}/3 today)
                </button>
              </div>
              <details style={{ marginTop: 16 }}>
                <summary style={{ fontSize: 12, color: 'var(--text-3, #64748B)', cursor: 'pointer' }}>Preview message</summary>
                <pre style={{ marginTop: 8, padding: 12, background: 'var(--surface, #1E293B)', borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap', color: 'var(--text, #E2E8F0)' }}>{message}</pre>
              </details>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function StudentMessagesPage() {
  const [activeContact, setActiveContact] = useState(null);
  const { data: profile } = useSecureData(fetchStudentProfile);
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') || 'Student';

  return (
    <StudentLayout pageTitle="Contact" layout="dashboard">
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title">Contact & Support</h1>
        <p className="stitch-support-hero__desc">
          Get in touch with ward officials and support staff. Choose a contact option below.
        </p>
      </div>

      <div className="stitch-support-grid">
        {CONTACTS.map((contact) => (
          <button
            key={contact.id}
            type="button"
            className="stitch-support-card"
            onClick={() => setActiveContact(contact)}
            style={{ textAlign: 'left', cursor: 'pointer', border: 'none', width: '100%', fontFamily: 'inherit' }}
          >
            <div className="stitch-support-card__icon stitch-support-card__icon--primary">
              <Icon name={contact.icon} size={28} />
            </div>
            <h3 className="stitch-support-card__title">{contact.title}</h3>
            <p className="stitch-support-card__desc">{contact.desc}</p>
            <span className="stitch-support-card__btn">
              Contact Now
            </span>
          </button>
        ))}
      </div>

      {activeContact && (
        <ContactModal
          contact={activeContact}
          studentName={studentName}
          onClose={() => setActiveContact(null)}
        />
      )}
    </StudentLayout>
  );
}
