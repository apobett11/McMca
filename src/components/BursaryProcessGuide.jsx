import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './BursaryProcessGuide.css';

// SVG Icons
function BpgIcon({ name, size = 18, className = '' }) {
  const icons = {
    user: (
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    ),
    users: (
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75" />
    ),
    sparkles: (
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    ),
    check: (
      <path d="M20 6 9 17l-5-5" />
    ),
    arrowRight: (
      <path d="M5 12h14 M12 5l7 7-7 7" />
    ),
    info: (
      <circle cx="12" cy="12" r="10" />
    ),
    close: (
      <path d="M18 6 6 18 M6 6l12 12" />
    ),
    fileCheck: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4" />
    ),
    help: (
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01" />
    )
  };

  return (
    <svg
      className={`bpg-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[name] || icons.info}
      {name === 'info' && <path d="M12 16v-4 M12 8h.01" />}
    </svg>
  );
}

// Bursary Flows Configuration
const BURSARY_FLOWS = {
  general: {
    key: 'general',
    label: 'All Applicants',
    badge: 'Simple Step-By-Step Guide',
    title: 'Bursary Application Process',
    description: 'Follow our simple online application pipeline. No manual principal write-off required—everything is submitted and verified digitally.',
    ctaText: 'Apply for Bursary',
    ctaRoute: '/register',
    steps: [
      {
        num: '01',
        title: 'Register Online',
        desc: 'Create your account using your National ID card and active mobile phone number.'
      },
      {
        num: '02',
        title: 'Verify Documents',
        desc: 'Attach your identification and official fee statement online. No physical principal write-off required.'
      },
      {
        num: '03',
        title: 'Apply for Bursary',
        desc: 'Complete the financial assistance wizard with family socio-economic and school details.'
      },
      {
        num: '04',
        title: 'Vetting & Disbursement',
        desc: 'Ward Area Chief verifies residency, the committee clears allocation, and funds are disbursed to the school.'
      }
    ],
    requirements: [
      'National ID / Parent ID',
      'Certified Fee Structure / Invoice',
      'School Admission Letter or Report Form',
      'Area Chief Letter / Recommendation'
    ]
  },
  student: {
    key: 'student',
    label: 'Student Applicant',
    badge: 'Student Self-Service (18+)',
    title: 'Student Bursary Application Process',
    description: 'For university, college, and TVET students applying independently. Minors or students without an ID apply through their parent.',
    ctaText: 'Register as Student',
    ctaRoute: '/register?role=student',
    steps: [
      {
        num: '01',
        title: 'Register with National ID',
        desc: 'Sign up with your personal National ID, active mobile number, and student email. (Must be 18+).'
      },
      {
        num: '02',
        title: 'Verify Documents Online',
        desc: 'Upload your National ID (front & back), official Admission Letter, and certified Fee Statement. No principal sign-off needed.'
      },
      {
        num: '03',
        title: 'Personal & School Details',
        desc: 'Enter your personal biodata, university/college details, student registration number, and institution bank details.'
      },
      {
        num: '04',
        title: 'Apply & Track Review',
        desc: 'Submit for Ward Area Chief verification and committee review, with electronic funds disbursed directly to your institution.'
      }
    ],
    requirements: [
      'Valid National ID Card (18+)',
      'College / School Admission Letter',
      'Current Certified Fee Statement (No principal write-off needed)',
      'Area Chief Letter / Recommendation'
    ]
  },
  parent: {
    key: 'parent',
    label: 'Parent / Guardian',
    badge: 'Household Management Suite',
    title: 'Parent & Guardian Application Pipeline',
    description: 'Manage bursary applications for all your children across Primary, Secondary, or College under one consolidated family account.',
    ctaText: 'Register as Parent',
    ctaRoute: '/register?role=parent',
    steps: [
      {
        num: '01',
        title: 'Parent Registration',
        desc: 'Register your parent account once using your National ID card, which acts as the household master key.'
      },
      {
        num: '02',
        title: 'Verify Account',
        desc: 'Complete initial identity and Ward residency verification to activate your family dashboard.'
      },
      {
        num: '03',
        title: 'Add Child to Household',
        desc: 'Add each dependent from your dashboard (Custody for Primary/Secondary minors, Delegated for College youths).'
      },
      {
        num: '04',
        title: 'Verify Child Documents',
        desc: 'Upload each child’s Birth Certificate (or Student ID if available) and certified school fee statements online.'
      },
      {
        num: '05',
        title: 'Apply for Each Child',
        desc: 'Fill out the bursary application for each child individually and track approval tranches directly on your dashboard.'
      }
    ],
    requirements: [
      'Parent / Guardian National ID (Master Key)',
      'Children’s Birth Certificates (or Student ID if available)',
      'Official Fee Statements for Each Respective School',
      'Chief’s Family Verification / Vulnerability Letter'
    ]
  }
};

export default function BursaryProcessGuide() {
  // Default is 'general' as requested
  const [activeTab, setActiveTab] = useState('general');
  // Modal for "I don't have an ID"
  const [showNoIdModal, setShowNoIdModal] = useState(false);

  const current = BURSARY_FLOWS[activeTab] || BURSARY_FLOWS.general;

  // Close modal on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setShowNoIdModal(false);
      }
    }
    if (showNoIdModal) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showNoIdModal]);

  return (
    <section id="bursary" className="gp-section-card gp-section-card--bursary bpg-card" aria-labelledby="bpg-title">
      {/* 1. Header (Placement matches previous design) */}
      <div className="gp-section-header bpg-header">
        <span className="gp-badge gp-badge--blue bpg-badge">
          <BpgIcon name="sparkles" size={13} className="bpg-sparkle" />
          {current.badge}
        </span>
        <h2 id="bpg-title" className="gp-section-title bpg-title">
          {current.title}
        </h2>
        <p className="gp-section-desc bpg-desc">
          {current.description}
        </p>
      </div>

      {/* 2. Buttons below header (Placement matches previous design) */}
      <div className="bpg-pills-row" role="tablist" aria-label="Application Role Options">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'general'}
          onClick={() => setActiveTab('general')}
          className={`bpg-pill ${activeTab === 'general' ? 'is-active' : ''}`}
        >
          General Guide
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'student'}
          onClick={() => setActiveTab(activeTab === 'student' ? 'general' : 'student')}
          className={`bpg-pill ${activeTab === 'student' ? 'is-active' : ''}`}
        >
          <BpgIcon name="user" size={15} />
          <span>I am a Student</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'parent'}
          onClick={() => setActiveTab(activeTab === 'parent' ? 'general' : 'parent')}
          className={`bpg-pill ${activeTab === 'parent' ? 'is-active' : ''}`}
        >
          <BpgIcon name="users" size={15} />
          <span>I am a Parent / Guardian</span>
        </button>
      </div>

      {/* 3. Online Application Notice + Student ID Helper */}
      <div className="bpg-notice-bar">
        <div className="bpg-notice-text">
          <BpgIcon name="fileCheck" size={16} className="bpg-notice-icon" />
          <span>
            <strong>100% Online Application:</strong> No physical Headteacher or Principal write-off form needed. Attach official certified fee statements directly online.
          </span>
        </div>

        {activeTab === 'student' && (
          <div className="bpg-id-helper">
            <span className="bpg-id-status">Requires National ID (18+)</span>
            <button
              type="button"
              onClick={() => setShowNoIdModal(true)}
              className="bpg-no-id-link"
            >
              I don't have an ID
              <BpgIcon name="help" size={12} />
            </button>
          </div>
        )}
      </div>

      {/* 4. Steps Grid (Placement matches previous design, not crowded) */}
      <div className={`bpg-steps-grid bpg-steps-grid--${current.steps.length}`}>
        {current.steps.map((st) => (
          <div key={st.num} className="bpg-step-card">
            <div className="bpg-step-num">{st.num}</div>
            <h3 className="bpg-step-title">{st.title}</h3>
            <p className="bpg-step-desc">{st.desc}</p>
          </div>
        ))}
      </div>

      {/* 5. Requirements & Action Box (Placement matches previous design) */}
      <div className="bpg-requirements-box">
        <div className="bpg-requirements-left">
          <div className="bpg-requirements-heading">
            Required Documents for {current.label}:
          </div>
          <div className="bpg-requirements-chips">
            {current.requirements.map((req) => (
              <span key={req} className="bpg-req-chip">
                <BpgIcon name="check" size={13} /> {req}
              </span>
            ))}
          </div>
        </div>

        {/* CTA Button tailored to selected role */}
        <Link
          to={current.ctaRoute}
          className="bpg-cta-btn"
        >
          <span>{current.ctaText}</span>
          <BpgIcon name="arrowRight" size={16} />
        </Link>
      </div>

      {/* 6. "I Don't Have an ID" Apple Glass Modal */}
      {showNoIdModal && (
        <div
          className="bpg-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-id-title"
          onClick={() => setShowNoIdModal(false)}
        >
          <div
            className="bpg-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bpg-modal-top">
              <span className="bpg-modal-badge">
                <BpgIcon name="info" size={13} />
                Learner Without National ID
              </span>
              <button
                type="button"
                onClick={() => setShowNoIdModal(false)}
                className="bpg-modal-close"
                aria-label="Close modal"
              >
                <BpgIcon name="close" size={16} />
              </button>
            </div>

            <h3 id="no-id-title" className="bpg-modal-heading">
              Applying Without a National ID
            </h3>

            <p className="bpg-modal-body-text">
              Independent student accounts require an official National ID (18+). If you do not have an ID yet or are under 18 years old, you will apply through your parent or legal guardian.
            </p>

            <div className="bpg-modal-steps-box">
              <div className="bpg-modal-steps-title">
                How It Works:
              </div>
              <ol className="bpg-modal-steps-list">
                <li>Your parent or legal guardian registers on the portal using their National ID.</li>
                <li>In their dashboard, they click <strong>"Add Child"</strong> using your Birth Certificate or NEMIS/UPI.</li>
                <li>They upload your certified school fee structure and submit the bursary application on your behalf.</li>
              </ol>
            </div>

            <div className="bpg-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowNoIdModal(false);
                  setActiveTab('parent');
                }}
                className="bpg-modal-btn bpg-modal-btn--primary"
              >
                <span>View Parent Guide</span>
                <BpgIcon name="arrowRight" size={14} />
              </button>
              <Link
                to="/register?role=parent"
                onClick={() => setShowNoIdModal(false)}
                className="bpg-modal-btn bpg-modal-btn--secondary"
              >
                Go to Parent Registration
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
