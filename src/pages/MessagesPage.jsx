import React, { useState } from 'react';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Icon } from '../components/Icon.jsx';
import { STUDENT_SHELL } from './studentShell.js';
import { Link } from 'react-router-dom';

const CHAT_OPTIONS = [
  {
    id: 'mca',
    title: 'MCA Office',
    desc: 'Committee review, ward decisions, and bursary status.',
    icon: 'applications'
  },
  {
    id: 'chief',
    title: 'Chief Office',
    desc: 'Local verification and chief approval questions.',
    icon: 'shield'
  },
  {
    id: 'help',
    title: 'Help Desk',
    desc: 'Upload issues, deadlines, and general support.',
    icon: 'support'
  }
];

export function MessagesPage() {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <PageShell pageTitle="Messages" notificationBadge showBottomNav={false} {...STUDENT_SHELL}>
      <Link className="back-link" to="/student/support">
        <Icon name="chevronLeft" size={18} />
        Back to support
      </Link>
      <SectionCard title="Messages" titleLevel="h1">
        <p className="section-card__lead">
          Message ward offices securely. Select a channel below to open the chat window.
        </p>
      </SectionCard>

      <SectionCard title="Choose who to message">
        <div className="chat-options">
          {CHAT_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`chat-option-card chat-option-card--lively ${activeChat?.id === option.id ? 'chat-option-card--active' : ''}`}
              onClick={() => setActiveChat(option)}
            >
              <Icon name={option.icon} size={24} />
              <span>
                <strong>{option.title}</strong>
                <span>{option.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="notice block">
        <strong>Development notice</strong>
        Live chat is coming soon. You will message ward offices securely from this page without
        leaving the portal.
      </div>

      <SectionCard title="Chat window">
        <div className="chat-window chat-window--lively">
          {activeChat ? (
            <>
              <p className="chat-window__header">
                <Icon name={activeChat.icon} size={20} />
                {activeChat.title}
              </p>
              <p className="chat-window__placeholder">
                Chat with {activeChat.title} will open here when the messaging service is connected.
                Do not share passwords or OTP codes in messages.
              </p>
            </>
          ) : (
            <p className="chat-window__placeholder">
              Select MCA Office, Chief Office, or Help Desk above to start.
            </p>
          )}
        </div>
      </SectionCard>
    </PageShell>
  );
}
