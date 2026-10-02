import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentLayout } from '../components/StudentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';

const SUPPORT_TOPICS = [
  {
    id: 'chief',
    title: 'Chief Office',
    desc: 'Local verification and chief approval questions.',
    icon: 'shield',
    route: '/student/messages'
  },
  {
    id: 'mca',
    title: 'MCA Office',
    desc: 'Committee review, ward decisions, and bursary status.',
    icon: 'applications',
    route: '/student/messages'
  },
  {
    id: 'upload',
    title: 'Upload help',
    desc: 'Problems uploading documents or file types.',
    icon: 'upload',
    route: '/student/documents'
  },
  {
    id: 'faq',
    title: 'FAQ',
    desc: 'Frequently asked questions about the bursary process.',
    icon: 'info',
    route: '#student-faq'
  }
];

const FAQS = [
  {
    id: 'review',
    q: 'How long does the review process take?',
    a: 'The review process typically takes 5–7 business days after all documents are submitted.'
  },
  {
    id: 'docs',
    q: 'What documents do I need to submit?',
    a: 'You need a fee structure, student ID or birth certificate, admission or enrollment proof, and a guardian consent form.'
  },
  {
    id: 'approved',
    q: 'How will I know if my application is approved?',
    a: 'You will receive a notification in your dashboard and through the linked parent or guardian phone number.'
  }
];

export function StudentSupportPage() {
  const [openId, setOpenId] = useState(FAQS[0].id);

  return (
    <StudentLayout pageTitle="Support" layout="dashboard">
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title">Support Center</h1>
        <p className="stitch-support-hero__desc">
          Choose a topic to get help from ward offices. For live chat, use Messages.
        </p>
      </div>

      <div className="stitch-support-grid stitch-support-grid--topics">
        {SUPPORT_TOPICS.map((topic) => (
          <Link
            key={topic.id}
            to={topic.route}
            className="stitch-support-card"
            onClick={(event) => {
              if (!topic.route.startsWith('#')) return;
              event.preventDefault();
              document.getElementById(topic.route.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <div className="stitch-support-card__icon stitch-support-card__icon--primary">
              <Icon name={topic.icon} size={28} />
            </div>
            <h3 className="stitch-support-card__title">{topic.title}</h3>
            <p className="stitch-support-card__desc">{topic.desc}</p>
            <span className="stitch-support-card__btn">
              Get Help
            </span>
          </Link>
        ))}
      </div>

      <div className="stitch-faq" id="student-faq">
        <h2 className="stitch-faq__title">Frequently Asked Questions</h2>
        <p className="stitch-faq__desc">Common questions about the bursary application process.</p>
        <div className="stitch-faq__list">
          {FAQS.map((item) => {
            const open = openId === item.id;
            return (
              <div key={item.id} className={`stitch-faq__item ${open ? 'stitch-faq__item--open' : ''}`}>
                <button
                  type="button"
                  className="stitch-faq__item-head"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? '' : item.id)}
                >
                  <h3 className="stitch-faq__item-q">{item.q}</h3>
                  <span className="stitch-faq__item-chevron"><Icon name="chevronRight" size={20} /></span>
                </button>
                {open ? (
                  <div className="stitch-faq__item-body">
                    <p className="stitch-faq__item-answer">{item.a}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="stitch-support-break">
        <div className="stitch-support-break__content">
          <h2 className="stitch-support-break__title">Secure Communication</h2>
          <p className="stitch-support-break__desc">
            All messages are encrypted and visible only to authorized ward personnel. Never share your OTP or password.
          </p>
          <div className="stitch-support-break__features">
            <span className="stitch-support-break__feature">
              <Icon name="shield" size={16} /> End-to-end encrypted
            </span>
            <span className="stitch-support-break__feature">
              <Icon name="approved" size={16} /> Verified staff only
            </span>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}