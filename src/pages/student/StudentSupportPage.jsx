import React from 'react';
import { PageShell } from '../../components/PageShell.jsx';
import { PageIntro } from '../../components/student/PageIntro.jsx';
import { Icon } from '../../components/Icon.jsx';
import { STUDENT_SHELL } from '../studentShell.js';

const SUPPORT_TOPICS = [
  {
    id: 'chief',
    title: 'Chief Office',
    desc: 'Local verification and chief approval questions.',
    icon: 'shield'
  },
  {
    id: 'mca',
    title: 'MCA Office',
    desc: 'Committee review, ward decisions, and bursary status.',
    icon: 'applications'
  },
  {
    id: 'upload',
    title: 'Upload help',
    desc: 'Problems uploading documents or file types.',
    icon: 'upload'
  },
  {
    id: 'deadlines',
    title: 'Deadlines',
    desc: 'Dates, reminders, and what happens if you miss one.',
    icon: 'calendar'
  }
];

export function StudentSupportPage() {
  function openTopic(topic) {
    window.alert(
      `${topic.title}: In production this opens secure messaging or FAQs. Demo only — no chat connected yet.`
    );
  }

  return (
    <PageShell pageTitle="Support" {...STUDENT_SHELL}>
      <PageIntro lead="Choose a topic to get help from ward offices. For live chat, use Messages when it is enabled." />

      <div className="support-topics page-section--full" role="list">
        {SUPPORT_TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            className="support-topic"
            onClick={() => openTopic(topic)}
          >
            <Icon name={topic.icon} size={24} />
            <span>
              <strong>{topic.title}</strong>
              <span>{topic.desc}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="notice page-section--full">
        <strong>Security</strong>
        Ward staff will never ask for your password or OTP in chat or phone calls. Do not share
        one-time codes with anyone.
      </div>
    </PageShell>
  );
}
