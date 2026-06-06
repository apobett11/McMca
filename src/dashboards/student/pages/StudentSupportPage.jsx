import React from 'react';
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
    route: '#'
  }
];

export function StudentSupportPage() {
  return (
    <StudentLayout pageTitle="Support" layout="dashboard">
      <div className="stitch-support-hero">
        <h1 className="stitch-support-hero__title">Support Center</h1>
        <p className="stitch-support-hero__desc">
          Choose a topic to get help from ward offices. For live chat, use Messages.
        </p>
      </div>

      <div className="stitch-support-grid">
        {SUPPORT_TOPICS.map((topic) => (
          <Link
            key={topic.id}
            to={topic.route}
            className="stitch-support-card"
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

      <div className="stitch-faq">
        <h2 className="stitch-faq__title">Frequently Asked Questions</h2>
        <p className="stitch-faq__desc">Common questions about the bursary application process.</p>
        <div className="stitch-faq__list">
          <div className="stitch-faq__item stitch-faq__item--open">
            <div className="stitch-faq__item-head">
              <h3 className="stitch-faq__item-q">How long does the review process take?</h3>
              <span className="stitch-faq__item-chevron"><Icon name="chevronRight" size={20} /></span>
            </div>
            <div className="stitch-faq__item-body">
              <p className="stitch-faq__item-answer">The review process typically takes 5-7 business days after all documents are submitted.</p>
            </div>
          </div>
          <div className="stitch-faq__item">
            <div className="stitch-faq__item-head">
              <h3 className="stitch-faq__item-q">What documents do I need to submit?</h3>
              <span className="stitch-faq__item-chevron"><Icon name="chevronRight" size={20} /></span>
            </div>
            <div className="stitch-faq__item-body" style={{ display: 'none' }}>
              <p className="stitch-faq__item-answer">You need: fee structure, student ID or birth certificate, admission/enrollment proof, and guardian consent form.</p>
            </div>
          </div>
          <div className="stitch-faq__item">
            <div className="stitch-faq__item-head">
              <h3 className="stitch-faq__item-q">How will I know if my application is approved?</h3>
              <span className="stitch-faq__item-chevron"><Icon name="chevronRight" size={20} /></span>
            </div>
            <div className="stitch-faq__item-body" style={{ display: 'none' }}>
              <p className="stitch-faq__item-answer">You will receive a notification in your dashboard and via the linked parent/guardian phone number.</p>
            </div>
          </div>
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