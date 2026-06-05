import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PARENT } from '../data/parentMock.js';

const CONVERSATIONS = [
  { id: 'bursary', title: 'Bursary Office', icon: 'account_balance', desc: 'Your application for the Excellence Grant has been reviewed.', time: '10:42 AM', active: true },
  { id: 'support', title: 'Technical Support', icon: 'support_agent', desc: 'The document upload issue has been resolved.', time: 'Yesterday', active: false },
  { id: 'admissions', title: 'Admissions', icon: 'school', desc: 'Welcome to the portal! Let us know if you need help.', time: 'Monday', active: false }
];

const FOOTER_LINKS = [
  { label: 'Support Center', path: '/support' },
  { label: 'Privacy Policy', path: '#' },
  { label: 'Terms of Service', path: '#' },
  { label: 'Accessibility', path: '#' }
];

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('');
}

export function MessagesPage() {
  const [activeConv, setActiveConv] = useState(CONVERSATIONS[0]);
  const [messageText, setMessageText] = useState('');

  function addMessage(text) {
    const now = new Date();
    const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    const chatWindow = document.getElementById('chat-window');
    if (!chatWindow) return;
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex flex-row-reverse gap-3 max-w-[80%] ml-auto';
    msgDiv.style.cssText = 'display: flex; flex-direction: row-reverse; gap: 12px; max-width: 80%; margin-left: auto; margin-bottom: 16px;';
    msgDiv.innerHTML = '<div style=\"background: #765a14; color: white; border-radius: 16px; border-bottom-right-radius: 4px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);\">' +
      '<p style=\"margin: 0; font-family: Manrope, sans-serif; font-size: 16px; line-height: 1.6;\">' + text.replace(/</g, '&lt;') + '</p>' +
      '<div style=\"display: flex; align-items: center; justify-content: flex-end; gap: 4px; margin-top: 8px;\">' +
      '<span style=\"font-size: 10px; font-family: Hanken Grotesk, sans-serif; opacity: 0.7;\">' + time + '</span>' +
      '<span class=\"material-symbols-outlined\" style=\"font-size: 12px;\">done</span></div></div>';
    chatWindow.appendChild(msgDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const text = messageText.trim();
      if (text) {
        addMessage(text);
        setMessageText('');
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Manrope, system-ui, sans-serif', background: '#f1fbff', color: '#131d21', overflow: 'hidden' }}>
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
            <Link to="/student/messages" className="stitch-parent-sidebar__link stitch-parent-sidebar__link--active">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>chat_bubble</span>
              <span>Messages</span>
            </Link>
            <Link to="/profile" className="stitch-parent-sidebar__link">
              <span className="material-symbols-outlined">person</span>
              <span>Profile</span>
            </Link>
          </nav>
          <div className="stitch-parent-sidebar__bottom">
            <nav className="stitch-parent-sidebar__nav">
              <Link to="/support" className="stitch-parent-sidebar__link">
                <span className="material-symbols-outlined">help_outline</span>
                <span>Support</span>
              </Link>
              <Link to="/profile" className="stitch-parent-sidebar__link">
                <span className="material-symbols-outlined">settings</span>
                <span>Settings</span>
              </Link>
            </nav>
          </div>
        </aside>

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <div style={{ width: '384px', borderRight: '1px solid rgba(208,197,179,0.2)', display: 'flex', flexDirection: 'column', background: '#ffffff', flexShrink: 0 }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(208,197,179,0.1)' }}>
              <div style={{ position: 'relative' }}>
                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#7f7667', fontSize: '14px' }}>search</span>
                <input style={{ width: '100%', padding: '8px 12px 8px 40px', background: '#f1fbff', border: '1px solid rgba(208,197,179,0.3)', borderRadius: '12px', fontFamily: 'Manrope', fontSize: '14px', outline: 'none' }} placeholder="Search conversations..." type="text" />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {CONVERSATIONS.map((conv) => (
                <div key={conv.id} onClick={() => setActiveConv(conv)} style={{ padding: '16px 20px', display: 'flex', gap: '16px', cursor: 'pointer', background: activeConv?.id === conv.id ? '#eaf5fa' : 'transparent', borderLeft: activeConv?.id === conv.id ? '4px solid #765a14' : '4px solid transparent', transition: 'background 0.2s' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(184,150,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#765a14' }}>
                    <span className="material-symbols-outlined">{conv.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <h4 style={{ margin: 0, fontFamily: 'Manrope', fontSize: '18px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#131d21' }}>{conv.title}</h4>
                      <span style={{ fontSize: '10px', fontFamily: 'Hanken Grotesk', fontWeight: 700, color: '#7f7667', whiteSpace: 'nowrap', marginLeft: '8px' }}>{conv.time}</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontFamily: 'Manrope', fontSize: '14px', color: '#586062', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conv.desc}</p>
                  </div>
                  {activeConv?.id === conv.id && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#765a14', alignSelf: 'center' }}></div>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1fbff' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(208,197,179,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(24px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(184,150,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#765a14' }}>
                  <span className="material-symbols-outlined">{activeConv?.icon || 'chat'}</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontFamily: 'Manrope', fontSize: '18px', fontWeight: 600, color: '#131d21' }}>{activeConv?.title || 'Select a conversation'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', display: 'inline-block' }}></span>
                    <span style={{ fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: '#765a14' }}>Active now</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', color: '#586062', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">videocam</span>
                </button>
                <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', color: '#586062', cursor: 'pointer' }}>
                  <span className="material-symbols-outlined">info</span>
                </button>
              </div>
            </div>

            <div id="chat-window" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <span style={{ padding: '4px 16px', borderRadius: '9999px', background: 'rgba(208,197,179,0.2)', fontFamily: 'Hanken Grotesk', fontSize: '10px', fontWeight: 700, color: '#7f7667' }}>October 24, 2023</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', maxWidth: '80%', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(184,150,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end', marginBottom: '4px', color: '#765a14' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{activeConv?.icon || 'chat'}</span>
                </div>
                <div style={{ background: '#dfeaef', borderRadius: '16px', borderBottomLeftRadius: '4px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid rgba(208,197,179,0.1)' }}>
                  <p style={{ margin: 0, fontFamily: 'Manrope', fontSize: '16px', color: '#131d21', lineHeight: 1.6 }}>Dear {PARENT.fullName.split(' ')[0]}, thank you for submitting the updated income statements for your scholarship applications. We have received all documents.</p>
                  <span style={{ fontSize: '10px', fontFamily: 'Hanken Grotesk', fontWeight: 700, color: '#7f7667', display: 'block', marginTop: '8px', textAlign: 'right' }}>09:15 AM</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '12px', maxWidth: '80%', marginLeft: 'auto', marginBottom: '24px' }}>
                <div style={{ background: '#765a14', color: 'white', borderRadius: '16px', borderBottomRightRadius: '4px', padding: '16px', boxShadow: '0 4px 12px rgba(118,90,20,0.15)' }}>
                  <p style={{ margin: 0, fontFamily: 'Manrope', fontSize: '16px', lineHeight: 1.6 }}>Great! Thank you for the confirmation. Do you have an estimated timeline for the final decision?</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', marginTop: '8px' }}>
                    <span style={{ fontSize: '10px', fontFamily: 'Hanken Grotesk', opacity: 0.7 }}>09:32 AM</span>
                    <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>done_all</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', maxWidth: '80%', marginBottom: '24px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(184,150,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end', marginBottom: '4px', color: '#765a14' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{activeConv?.icon || 'chat'}</span>
                </div>
                <div style={{ background: '#dfeaef', borderRadius: '16px', borderBottomLeftRadius: '4px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', border: '1px solid rgba(208,197,179,0.1)' }}>
                  <p style={{ margin: 0, fontFamily: 'Manrope', fontSize: '16px', color: '#131d21', lineHeight: 1.6 }}>Normally it takes 5-7 business days. You can track the progress in the 'Applications' tab. I've attached a guide on what to expect next.</p>
                  <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '12px', border: '1px solid rgba(208,197,179,0.2)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#ffdad6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ba1a1a' }}>
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontFamily: 'Hanken Grotesk', fontSize: '12px', fontWeight: 700, color: '#131d21', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>NEXT_STEPS_GUIDE.PDF</p>
                      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#7f7667' }}>1.2 MB &bull; PDF Document</p>
                    </div>
                    <span className="material-symbols-outlined" style={{ color: '#7f7667' }}>download</span>
                  </div>
                  <span style={{ fontSize: '10px', fontFamily: 'Hanken Grotesk', fontWeight: 700, color: '#7f7667', display: 'block', marginTop: '8px', textAlign: 'right' }}>10:42 AM</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px', background: '#ffffff', borderTop: '1px solid rgba(208,197,179,0.1)' }}>
              <div style={{ maxWidth: '896px', margin: '0 auto', display: 'flex', alignItems: 'flex-end', gap: '16px', background: '#eaf5fa', borderRadius: '24px', padding: '8px', border: '1px solid rgba(208,197,179,0.2)' }}>
                <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', color: '#586062', cursor: 'pointer', marginBottom: '4px' }}>
                  <span className="material-symbols-outlined">add</span>
                </button>
                <textarea
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'Manrope', fontSize: '16px', padding: '12px 0', maxHeight: '128px', resize: 'none', color: '#131d21' }}
                  placeholder="Type a message..."
                  rows={1}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={handleKeyDown}
                ></textarea>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', marginRight: '4px' }}>
                  <button style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: 'transparent', color: '#586062', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined">sentiment_satisfied</span>
                  </button>
                  <button onClick={() => { if (messageText.trim()) addMessage(messageText.trim()); setMessageText(''); }} style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: 'none', background: '#765a14', color: 'white', cursor: 'pointer', boxShadow: '0 4px 8px rgba(118,90,20,0.2)' }}>
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
              <p style={{ textAlign: 'center', fontSize: '10px', fontFamily: 'Hanken Grotesk', fontWeight: 700, color: '#7f7667', marginTop: '12px' }}>Messages are encrypted and visible only to authorized personnel.</p>
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
          {FOOTER_LINKS.map((link) => (
            <Link key={link.label} to={link.path} className="stitch-parent-footer__link">{link.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
