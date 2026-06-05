import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PARENT } from '../data/parentMock.js';

const FAQ_ITEMS = [
  { id: 1, question: 'How do I track my child\'s application status?', answer: 'Visit the Applications page from the sidebar. There you\'ll find a detailed pipeline view of every scholarship your child has applied to, with real-time status updates. Each application card shows the current stage and next step.' },
  { id: 2, question: 'What documents are required for a scholarship application?', answer: 'Typically you need: academic transcripts, proof of income, a personal statement, and letters of recommendation. Specific requirements vary by scholarship — check the individual program details on the Applications page.' },
  { id: 3, question: 'How long does the review process take?', answer: 'The review process usually takes 5-7 business days after all documents are submitted. You can monitor progress in real-time from the Applications dashboard, which shows each stage of review.' },
  { id: 4, question: 'Can I edit my application after submission?', answer: 'Yes, you can update your application as long as it hasn\'t entered the final review stage. Navigate to the Applications page, select the application, and use the "Edit Application" option.' },
  { id: 5, question: 'Who do I contact for technical issues with the portal?', answer: 'For technical support, you can reach the IT Help Desk via email at helpdesk@mcmca.com or call +233 50 123 4567. Response times are typically within 24 hours.' },
  { id: 6, question: 'Can I add another dependent to my account?', answer: 'Yes, you can manage all dependents from the Profile page. Scroll to the "Dependent Students" section and click "Add Dependent". You\'ll need the student\'s full name, date of birth, and student ID number.' }
];

const SUPPORT_OPTIONS = [
  { icon: 'mail', title: 'Email Support', desc: 'Get help via email', detail: 'helpdesk@mcmca.com', action: 'Send Email' },
  { icon: 'call', title: 'Phone Support', desc: 'Speak to an agent', detail: '+233 50 123 4567', action: 'Call Now' },
  { icon: 'forum', title: 'Live Chat', desc: 'Chat in real-time', detail: 'Available 24/7', action: 'Start Chat' },
  { icon: 'help_center', title: 'Knowledge Base', desc: 'Browse guides & FAQs', detail: 'Self-service resources', action: 'Browse KB' }
];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('');
}

export function SupportPage() {
  const [activeFAQ, setActiveFAQ] = useState(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Manrope, system-ui, sans-serif', background: '#f1fbff', color: '#131d21' }}>
      <header className="stitch-parent-header" style={{ flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={{ textDecoration: 'none' }}>
            <span className="stitch-parent-header__brand">ScholarShip</span>
          </Link>
        </div>
        <div className="stitch-parent-header__actions">
          <button className="stitch-parent-header__icon-btn" aria-label="Notifications">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="stitch-parent-header__icon-btn" aria-label="Toggle theme">
            <span className="material-symbols-outlined">dark_mode</span>
          </button>
          <div className="stitch-parent-header__profile">
            <div className="stitch-parent-header__profile-text">
              <p className="stitch-parent-header__profile-name">{PARENT.fullName}</p>
              <p className="stitch-parent-header__profile-role">Parent Portal</p>
            </div>
            <div className="stitch-parent-header__avatar" style={{ background: 'linear-gradient(135deg, #765a14, #b8964b)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '16px' }}>
              {getInitials(PARENT.fullName)}
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <aside className="stitch-parent-sidebar" style={{ position: 'static', height: 'auto', flexShrink: 0 }}>
          <div className="stitch-parent-sidebar__heading">
            <h3 className="stitch-parent-sidebar__title">Parent Portal</h3>
            <p className="stitch-parent-sidebar__subtitle">Education Management</p>
          </div>
          <nav className="stitch-parent-sidebar__nav">
            <Link to="/dashboard" className="stitch-parent-sidebar__link">
              <span className="material-symbols-outlined">home</span>
              <span>Home</span>
            </Link>
            <Link to="/applications" className="stitch-parent-sidebar__link">
              <span className="material-symbols-outlined">description</span>
              <span>Applications</span>
            </Link>
            <Link to="/student/messages" className="stitch-parent-sidebar__link">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span>Messages</span>
            </Link>
            <Link to="/profile" className="stitch-parent-sidebar__link">
              <span className="material-symbols-outlined">person</span>
              <span>Profile</span>
            </Link>
          </nav>
          <div className="stitch-parent-sidebar__bottom">
            <nav className="stitch-parent-sidebar__nav">
              <Link to="/support" className="stitch-parent-sidebar__link stitch-parent-sidebar__link--active">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>help_outline</span>
                <span>Support</span>
              </Link>
              <Link to="/profile" className="stitch-parent-sidebar__link">
                <span className="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </aside>

        <main style={{ flex: 1, overflowY: 'auto', padding: '40px 48px' }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontFamily: 'Manrope', fontSize: '36px', fontWeight: 800, color: '#131d21', margin: '0 0 8px' }}>Support Center</h1>
            <p style={{ fontFamily: 'Manrope', fontSize: '18px', color: '#586062', margin: 0 }}>How can we help you and your family today?</p>
          </div>

          <div style={{ marginBottom: '48px' }}>
            <div className="stitch-insights-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              {SUPPORT_OPTIONS.map((option) => (
                <div key={option.title} className="stitch-glass-card" style={{ padding: '32px 24px', textAlign: 'center', border: '1px solid rgba(208,197,179,0.15)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(118,90,20,0.1), rgba(184,150,75,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#765a14' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{option.icon}</span>
                  </div>
                  <h3 style={{ fontFamily: 'Manrope', fontSize: '20px', fontWeight: 700, color: '#131d21', margin: '0 0 8px' }}>{option.title}</h3>
                  <p style={{ fontFamily: 'Manrope', fontSize: '14px', color: '#586062', margin: '0 0 4px' }}>{option.desc}</p>
                  <p style={{ fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: '#765a14', margin: '0 0 20px' }}>{option.detail}</p>
                  <button style={{ background: '#765a14', color: 'white', border: 'none', borderRadius: '12px', padding: '10px 24px', fontFamily: 'Manrope', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>{option.action}</button>
                </div>
              ))}
            </div>
          </div>

          <div className="stitch-glass-card" style={{ padding: '32px', border: '1px solid rgba(208,197,179,0.15)' }}>
            <h2 style={{ fontFamily: 'Manrope', fontSize: '24px', fontWeight: 700, color: '#131d21', margin: '0 0 24px' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {FAQ_ITEMS.map((faq) => (
                <div key={faq.id} style={{ borderBottom: '1px solid rgba(208,197,179,0.15)', padding: '4px 0' }}>
                  <button onClick={() => setActiveFAQ(activeFAQ === faq.id ? null : faq.id)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 8px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope', fontSize: '16px', fontWeight: 600, color: '#131d21', textAlign: 'left' }}>
                    <span>{faq.question}</span>
                    <span className="material-symbols-outlined" style={{ color: '#765a14', transform: activeFAQ === faq.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>expand_more</span>
                  </button>
                  {activeFAQ === faq.id && (
                    <div style={{ padding: '0 8px 20px', fontFamily: 'Manrope', fontSize: '15px', color: '#586062', lineHeight: 1.7 }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      <footer className="stitch-parent-footer" style={{ flexShrink: 0 }}>
        <div>
          <span className="stitch-parent-footer__brand">ScholarShip</span>
          <p className="stitch-parent-footer__copy">&copy; 2026 ScholarShip Education Management. All rights reserved.</p>
        </div>
        <div className="stitch-parent-footer__links">
          {[
            { label: 'Support Center', path: '/support' },
            { label: 'Privacy Policy', path: '#' },
            { label: 'Terms of Service', path: '#' },
            { label: 'Accessibility', path: '#' }
          ].map((link) => (
            <Link key={link.label} to={link.path} className="stitch-parent-footer__link">{link.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
