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
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, width: '100%',
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          fontSize: 12, color: '#F87171', textAlign: 'center'
        }}>
          Daily limit reached. Try again tomorrow.
        </div>
      ) : status === 'wa_sent' || status === 'email_sent' ? (
        <div style={{
          padding: '10px 16px', borderRadius: 8, marginBottom: 16, width: '100%',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          fontSize: 12, color: '#22C55E', textAlign: 'center'
        }}>
          {status === 'wa_sent' ? 'WhatsApp opened' : 'Email client opened'}
        </div>
      ) : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        <button
          onClick={handleWhatsApp}
          disabled={waCount >= 5}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: 10, border: 'none',
            background: waCount >= 5 ? 'rgba(0,53,148,0.3)' : '#003594',
            color: 'white', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
            cursor: waCount >= 5 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s'
          }}
        >
          <Icon name="support" size={18} />
          WhatsApp ({5 - waCount}/5)
        </button>
        <button
          onClick={handleEmail}
          disabled={emailCount >= 3}
          style={{
            width: '100%', padding: '12px 20px', borderRadius: 10, border: '1px solid rgba(0,53,148,0.2)',
            background: 'transparent', color: '#003594', fontWeight: 600, fontSize: 13, fontFamily: 'inherit',
            cursor: emailCount >= 3 ? 'not-allowed' : 'pointer', opacity: emailCount >= 3 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s'
          }}
        >
          <Icon name="profile" size={18} />
          Email ({3 - emailCount}/3)
        </button>
      </div>
    </div>
  );
}

export function StudentMessagesPage() {
  const { data: profile } = useSecureData(fetchStudentProfile);
  const studentName = [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') || 'Student';

  return (
    <StudentLayout pageTitle="Contact" layout="dashboard">
      <div style={{
        padding: '48px 0 64px',
        background: 'var(--contact-bg, #EAF1FB)',
        borderRadius: '0 0 2rem 2rem',
        minHeight: 'calc(100vh - 160px)'
      }}>
        <div className="stitch-support-hero" style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 className="stitch-support-hero__title" style={{ color: 'var(--text, #111827)' }}>
            Contact & Support
          </h1>
          <p className="stitch-support-hero__desc" style={{ margin: '0 auto', color: 'var(--text-2, #434654)' }}>
            Reach the appropriate office quickly and securely.
          </p>
        </div>

        <div className="stitch-support-grid" style={{ maxWidth: 960, margin: '0 auto' }}>
          {CONTACTS.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              studentName={studentName}
            />
          ))}
        </div>
      </div>

      <style>{`
        :root { --contact-bg: #EAF1FB; }
        [data-theme="dark"] { --contact-bg: #0F172A; }
        .stitch-support-card {
          box-shadow: 0px 10px 30px rgba(15, 23, 42, 0.08);
          transition: box-shadow 0.25s ease, transform 0.25s ease;
        }
        .stitch-support-card:hover {
          transform: translateY(-4px);
          box-shadow: 0px 16px 40px rgba(15, 23, 42, 0.12);
        }
      `}</style>
    </StudentLayout>
  );
}
