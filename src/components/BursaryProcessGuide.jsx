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
    ),
    external: (
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3" />
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20 M2 12h20" />
      </>
    ),
    chevronDown: (
      <path d="m6 9 6 6 6-6" />
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

// Bursary Flows Configuration with 2-sentence humanized explanations
const BURSARY_FLOWS = {
  general: {
    key: 'general',
    label: 'All Applicants',
    badge: 'Simple Step-By-Step Guide',
    title: 'Bursary Application Process',
    description: 'Follow our simple 3-step online application pipeline. No manual principal write-off required—everything is submitted and verified digitally.',
    ctaText: 'Apply for Bursary',
    ctaRoute: '/register',
    steps: [
      {
        num: '01',
        title: 'Register online',
        titleLink: '/register',
        sentence1: 'Create your secure portal account using your National ID card and active mobile phone number.',
        sentence2: 'You will receive an instant one-time SMS verification code to establish your password and unlock your application dashboard.'
      },
      {
        num: '02',
        title: 'Setup and finish registration',
        sentence1: 'Provide your basic contact details, Ward residence information, and official school enrollment records.',
        sentence2: 'Attach your current certified fee structure so our vetting committee can accurately assess your family financial need.'
      },
      {
        num: '03',
        title: 'Apply',
        sentence1: 'Double-check your information and submit your completed bursary application with a single tap.',
        sentence2: 'Track your dossier in real time as the vetting committee clears and disburses approved funds directly to your school.'
      }
    ],
    requirements: [
      'Valid National ID (Applicant or Parent)',
      'Certified Fee Structure / Invoice',
      'Birth Certificate (For learners under 18)'
    ]
  },
  student: {
    key: 'student',
    label: 'Student Applicant',
    badge: 'Student Self-Service (18+)',
    title: 'Student Bursary Application Process',
    description: 'For tertiary and independent students applying with their own National ID. Minors or students without an ID apply through their parent.',
    ctaText: 'Register as Student',
    ctaRoute: '/register?role=student',
    steps: [
      {
        num: '01',
        title: 'Register online',
        titleLink: '/register?role=student',
        sentence1: 'Self-register your independent student profile using your personal National ID and student email address.',
        sentence2: 'This creates your permanent student account so you can manage your bursary applications and submit appeals directly.'
      },
      {
        num: '02',
        title: 'Setup the documents',
        sentence1: 'Upload clear photos of your National ID card (both front and back) alongside your official certified institution fee statement.',
        sentence2: 'Ensure your admission number and current balance are clearly legible to ensure your verification clears without delays.',
        hasNoIdLink: true
      },
      {
        num: '03',
        title: 'Apply',
        sentence1: 'Complete your household background questions and verify your college or university bank payment details.',
        sentence2: 'Once approved by the MCA bursary committee, your allocated funds are disbursed electronically straight to your institution.'
      }
    ],
    requirements: [
      'Valid National ID Card (18+)',
      'Current Certified Fee Statement / Invoice'
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
        title: 'Register online',
        titleLink: '/register?role=parent',
        sentence1: 'Sign up using your personal National ID card, which serves as the master key for your entire household profile.',
        sentence2: 'Confirm your mobile phone number to activate full access to manage all your family bursary applications in one unified space.'
      },
      {
        num: '02',
        title: "Setup parent's documents",
        sentence1: 'Upload front and back photos of your National ID to verify your identity and bona fide Ward residency.',
        sentence2: 'This one-time verification establishes your verified parental profile and safeguards your children’s applications.'
      },
      {
        num: '03',
        title: 'Register children below 18 years',
        sentence1: 'Click "Add Child" from your dashboard and enter each dependent learner’s Birth Certificate or NEMIS/UPI details.',
        sentence2: 'Choose Custody (CUS) for primary or secondary students so you retain complete control over their submissions.'
      },
      {
        num: '04',
        title: 'Upload documents for each child',
        sentence1: 'Attach each child’s Birth Certificate (or Student ID if available) and their official certified school fee statement.',
        sentence2: 'Remember that no physical headteacher write-off form is needed—simply upload their official school documents digitally.'
      },
      {
        num: '05',
        title: 'Apply for the child',
        sentence1: 'Submit an individualized bursary application for each child with their specific school fee balance and family situation.',
        sentence2: 'Monitor approval tranches in real time from your family feed until direct payment is made to the school account.'
      }
    ],
    requirements: [
      'Parent / Guardian National ID (Both sides)',
      'Child\'s Birth Certificate (or Student ID for Under 18)',
      'Certified School Fee Statement / Invoice'
    ]
  }
};

// Kiswahili translation for the Parent / Guardian process section
const PARENT_FLOW_SW = {
  key: 'parent',
  label: 'Mzazi / Mlezi',
  badge: 'Mfumo wa Kusimamia Kaya',
  title: 'Mwongozo wa Maombi kwa Wazazi na Walezi',
  description: 'Simamia maombi ya ufadhili wa masomo (bursary) kwa watoto wako wote katika Shule za Msingi, Upili, au Vyuo Vikuu kupitia akaunti moja ya familia.',
  ctaText: 'Jisajili kama Mzazi',
  ctaRoute: '/register?role=parent',
  steps: [
    {
      num: '01',
      title: 'Jisajili mtandaoni',
      titleLink: '/register?role=parent',
      sentence1: 'Fungua akaunti ya mfumo kwa kutumia Kitambulisho chako cha Kitaifa (National ID) na nambari yako ya simu inayotumika.',
      sentence2: 'Utapokea nambari maalum ya siri (OTP) kupitia SMS ili kuweka nenosiri lako na kuanza usimamizi wa maombi ya familia yako.'
    },
    {
      num: '02',
      title: 'Weka stakabadhi za mzazi',
      sentence1: 'Pakia picha ya Kitambulisho chako cha Kitaifa (upande wa mbele na nyuma) ili kuthibitisha utambulisho na ukaazi wako Wodini.',
      sentence2: 'Uthibitisho huu wa mara moja unakupa idhini kamili ya mzazi na kuwezesha usalama wa maombi ya watoto wako.'
    },
    {
      num: '03',
      title: 'Sajili watoto walio chini ya miaka 18',
      sentence1: 'Bofya "Ongeza Mtoto" (Add Child) kwenye dashibodi yako na uweke maelezo ya Cheti cha Kuzaliwa au nambari ya NEMIS/UPI ya kila mtoto.',
      sentence2: 'Chagua Haki ya Malezi (Custody) kwa wanafunzi wa msingi au sekondari ili kubaki na udhibiti kamili wa maombi yao.'
    },
    {
      num: '04',
      title: 'Pakia stakabadhi za kila mtoto',
      sentence1: 'Ambatanisha Cheti cha Kuzaliwa cha kila mtoto (au Kitambulisho cha Mwanafunzi kikiwepo) pamoja na ankara halisi ya karo ya shule husika.',
      sentence2: 'Kumbuka kwamba hakuna haja ya fomu iliyotiwa saini na mwalimu mkuu—pakia tu stakabadhi halisi mtandaoni moja kwa moja.'
    },
    {
      num: '05',
      title: 'Wasilisha ombi la mtoto',
      sentence1: 'Tuma ombi la ufadhili wa karo kwa kila mtoto kivyake ukizingatia kiwango cha ada na hali ya kifamilia.',
      sentence2: 'Fuatilia hatua za uidhinishaji kwa wakati halisi kutoka kwa akaunti yako hadi fedha zitakapotumwa moja kwa moja kwenye akaunti ya shule.'
    }
  ],
  requirements: [
    'Kitambulisho cha Mzazi / Mlezi (Mbele na Nyuma)',
    'Cheti cha Kuzaliwa cha Mtoto (au ID ya Shule)',
    'Muundo Halisi wa Karo ya Shule / Ankara'
  ]
};

export default function BursaryProcessGuide() {
  // Default is 'general' as requested
  const [activeTab, setActiveTab] = useState('general');
  // Language toggle for parent section ('en' | 'sw')
  const [parentLang, setParentLang] = useState('en');
  // Collapsible steps state on mobile (accordion)
  const [expandedSteps, setExpandedSteps] = useState({ '01': true });
  // Modal for "I don't have an ID"
  const [showNoIdModal, setShowNoIdModal] = useState(false);

  // Keep step '01' open when switching tabs or language
  useEffect(() => {
    setExpandedSteps({ '01': true });
  }, [activeTab, parentLang]);

  const toggleStep = (num) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [num]: !prev[num]
    }));
  };

  const current =
    activeTab === 'parent' && parentLang === 'sw'
      ? PARENT_FLOW_SW
      : BURSARY_FLOWS[activeTab] || BURSARY_FLOWS.general;

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

      {/* 2. Buttons below header (Placement matches previous design; strictly inline in mobile) */}
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
          <BpgIcon name="user" size={14} />
          <span>I am a Student</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'parent'}
          onClick={() => setActiveTab(activeTab === 'parent' ? 'general' : 'parent')}
          className={`bpg-pill ${activeTab === 'parent' ? 'is-active' : ''}`}
        >
          <BpgIcon name="users" size={14} />
          <span>{parentLang === 'sw' && activeTab === 'parent' ? 'Mimi ni Mzazi / Mlezi' : 'I am a Parent / Guardian'}</span>
        </button>
      </div>

      {/* 2b. Language Toggle for Parent Flow (English / Kiswahili) */}
      {activeTab === 'parent' && (
        <div className="bpg-lang-toggle-bar" role="region" aria-label="Language Switcher">
          <div className="bpg-lang-intro">
            <BpgIcon name="globe" size={15} className="bpg-lang-icon" />
            <span className="bpg-lang-text">
              {parentLang === 'sw' ? 'Lugha ya Mwongozo:' : 'Guide Language:'}
            </span>
          </div>
          <div className="bpg-lang-segmented" role="radiogroup" aria-label="Language Selection">
            <button
              type="button"
              role="radio"
              aria-checked={parentLang === 'en'}
              onClick={() => setParentLang('en')}
              className={`bpg-lang-pill ${parentLang === 'en' ? 'is-active' : ''}`}
            >
              English
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={parentLang === 'sw'}
              onClick={() => setParentLang('sw')}
              className={`bpg-lang-pill ${parentLang === 'sw' ? 'is-active' : ''}`}
            >
              Kiswahili
            </button>
          </div>
        </div>
      )}

      {/* 3. Online Application Notice Bar */}
      <div className="bpg-notice-bar">
        <div className="bpg-notice-text">
          <BpgIcon name="fileCheck" size={16} className="bpg-notice-icon" />
          <span>
            {activeTab === 'parent' && parentLang === 'sw' ? (
              <>
                <strong>Maombi 100% Mtandaoni:</strong> Hakuna haja ya fomu ya mwalimu mkuu iliyotiwa saini. Ambatanisha ankara halisi ya karo moja kwa moja mtandaoni.
              </>
            ) : (
              <>
                <strong>100% Online Application:</strong> No physical Headteacher or Principal write-off form needed. Attach official certified fee statements directly online.
              </>
            )}
          </span>
        </div>
      </div>

      {/* 4. Steps Grid (Collapsible on mobile with bold titles, grid on desktop) */}
      <div className={`bpg-steps-grid bpg-steps-grid--${current.steps.length}`}>
        {current.steps.map((st) => {
          const isExpanded = !!expandedSteps[st.num];
          return (
            <div
              key={st.num}
              className={`bpg-step-card ${isExpanded ? 'is-expanded' : 'is-collapsed'}`}
            >
              {/* Header trigger for accordion on mobile, standard layout on desktop */}
              <div
                className="bpg-step-header"
                onClick={() => toggleStep(st.num)}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-controls={`bpg-step-body-${st.num}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleStep(st.num);
                  }
                }}
              >
                <div className="bpg-step-header-left">
                  <div className="bpg-step-num">{st.num}</div>
                  <strong className="bpg-step-title-bold">{st.title}</strong>
                </div>
                <span className="bpg-step-chevron" aria-hidden="true">
                  <BpgIcon name="chevronDown" size={15} />
                </span>
              </div>

              {/* Step content: descriptions and actions */}
              <div
                id={`bpg-step-body-${st.num}`}
                className="bpg-step-content"
              >
                {st.titleLink && (
                  <div className="bpg-step-action-row">
                    <Link
                      to={st.titleLink}
                      className="bpg-step-link"
                      title={parentLang === 'sw' && activeTab === 'parent' ? `Bofya kufungua` : `Click to ${st.title.toLowerCase()}`}
                    >
                      <span>{parentLang === 'sw' && activeTab === 'parent' ? `Fungua: ${st.title}` : `Open: ${st.title}`}</span>
                      <BpgIcon name="external" size={12} className="bpg-step-link-icon" />
                    </Link>
                  </div>
                )}

                <div className="bpg-step-sentences">
                  <p className="bpg-step-sentence">{st.sentence1}</p>
                  <p className="bpg-step-sentence">{st.sentence2}</p>
                </div>

                {/* Special "I don't have an ID" link in Student Step 2 */}
                {st.hasNoIdLink && (
                  <div className="bpg-step-link-box">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNoIdModal(true);
                      }}
                      className="bpg-no-id-link"
                    >
                      <BpgIcon name="help" size={12} />
                      <span>I don't have an ID</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Requirements & Action Box (Placement matches previous design) */}
      <div className="bpg-requirements-box">
        <div className="bpg-requirements-left">
          <div className="bpg-requirements-heading">
            {activeTab === 'parent' && parentLang === 'sw'
              ? 'Stakabadhi Zinazohitajika kwa Mzazi / Mlezi:'
              : `Required Documents for ${current.label}:`}
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
