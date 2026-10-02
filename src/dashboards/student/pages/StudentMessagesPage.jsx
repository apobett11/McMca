import React, { useState, useCallback } from 'react';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useSecureData } from '../../../lib/useSecureData';
import { fetchStudentProfile } from '../../../lib/queries';

const CONTACTS = [
  {
    id: 'chief',
    title: 'Message Chief',
    desc: 'Contact your area chief for verification and local inquiries',
    icon: 'shield',
    whatsapp: '254712345678',
    email: 'chief@westlands.go.ke',
    template: 'Hello Chief,\n\nI am requesting assistance regarding my bursary application.\n\nStudent Name: {name}\n\nThank you.'
  },
  {
    id: 'mca',
    title: 'Message MCA',
    desc: 'Contact the MCA office for bursary status and committee inquiries',
    icon: 'applications',
    whatsapp: '254712345679',
    email: 'mca@westlands.go.ke',
    template: 'Hello MCA,\n\nI am following up on my bursary application.\n\nStudent Name: {name}\n\nThank you.'
  },
  {
    id: 'help',
    title: 'Contact Help Desk',
    desc: 'Get technical support for platform and account issues',
    icon: 'support',
    whatsapp: '254712345680',
    email: 'support@westlands.go.ke',
    template: 'Hello Support,\n\nI need assistance with the student portal.\n\nStudent Name: {name}\n\nThank you.'
  }
];

function getDailyCount(key) {
  try {
    const raw = localStorage.getItem(`contact_${key}`);
    if (!raw) return 0;
    const { date, count } = JSON.parse(raw);
    return date === new Date().toDateString() ? count : 0;
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

function ContactCard({ contact, studentName }) {
  const [status, setStatus] = useState(null);

  const message = contact.template.replace('{name}', studentName || 'Student');
  const waCount = getDailyCount(`wa_${contact.id}`);
  const emailCount = getDailyCount(`email_${contact.id}`);

  const handleWhatsApp = useCallback(() => {
    if (waCount >= 5) { setStatus('wa_limit'); return; }
    incrementDailyCount(`wa_${contact.id}`);
    window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
    setStatus('wa_sent');
  }, [contact, message, waCount]);

  const handleEmail = useCallback(() => {
    if (emailCount >= 3) { setStatus('email_limit'); return; }
    incrementDailyCount(`email_${contact.id}`);
    window.location.href = `mailto:${contact.email}?subject=${encodeURIComponent('Bursary Support Request')}&body=${encodeURIComponent(message)}`;
    setStatus('email_sent');
  }, [contact, message, emailCount]);

  return (
    <div className="stitch-support-card" style={{ cursor: 'default' }}>
      <div className={`stitch-support-card__icon ${contact.id === 'chief' ? 'stitch-support-card__icon--primary' : contact.id === 'mca' ? 'stitch-support-card__icon--secondary' : 'stitch-support-card__icon--tertiary'}`}>
        <Icon name={contact.icon} size={28} />
      </div>
      <h3 className="stitch-support-card__title">{contact.title}</h3>
      <p className="stitch-support-card__desc">{contact.desc}</p>

      {status === 'wa_limit' || status === 'email_limit' ? (
        <p className="student-inline-note student-inline-note--error">Daily limit reached. Try again tomorrow.</p>
      ) : status === 'wa_sent' || status === 'email_sent' ? (
        <p className="student-inline-note student-inline-note--ok">
          {status === 'wa_sent' ? 'WhatsApp opened' : 'Email client opened'}
        </p>
      ) : null}

      <div className="student-contact-actions">
        <button
          type="button"
          className="btn btn--primary student-contact-btn"
          onClick={handleWhatsApp}
          disabled={waCount >= 5}
        >
          <Icon name="support" size={18} />
          WhatsApp ({Math.max(0, 5 - waCount)}/5)
        </button>
        <button
          type="button"
          className="btn btn--secondary student-contact-btn"
          onClick={handleEmail}
          disabled={emailCount >= 3}
        >
          <Icon name="profile" size={18} />
          Email ({Math.max(0, 3 - emailCount)}/3)
        </button>
      </div>
    </div>
  );
}

export function StudentMessagesPage() {
  const { data: profile } = useSecureData(fetchStudentProfile);
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') || 'Student';

  return (
    <StudentLayout pageTitle="Contact" layout="dashboard" studentName={profile ? studentName : ''}>
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title">Contact & Support</h1>
        <p className="stitch-support-hero__desc">Reach the appropriate office quickly and securely.</p>
      </div>

      <div className="stitch-support-grid">
        {CONTACTS.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            studentName={studentName}
          />
        ))}
      </div>
    </StudentLayout>
  );
}
