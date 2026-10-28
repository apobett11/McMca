import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BursaryProcessGuide from '../components/BursaryProcessGuide';
import './GuestPage.css';

// SVG Icon Helper
function GuestIcon({ name, size = 18, className = '' }) {
  const icons = {
    school: (
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z M6 6h10 M6 10h10 M6 14h6" />
    ),
    bursary: (
      <path d="M12 2v20 M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    ),
    user: (
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    ),
    lock: (
      <path d="M7 11V7a5 5 0 0 1 10 0v4 M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
    ),
    chevronDown: (
      <path d="m6 9 6 6 6-6" />
    ),
    chevronRight: (
      <path d="m9 18 6-6-6-6" />
    ),
    chevronUp: (
      <path d="m18 15-6-6-6 6" />
    ),
    menu: (
      <path d="M4 6h16 M4 12h16 M4 18h16" />
    ),
    close: (
      <path d="M18 6 6 18 M6 6l12 12" />
    ),
    check: (
      <path d="M20 6 9 17l-5-5" />
    ),
    alert: (
      <path d="M12 8v4 M12 16h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    ),
    arrowRight: (
      <path d="M5 12h14 M12 5l7 7-7 7" />
    ),
    search: (
      <circle cx="11" cy="11" r="8" />
    ),
    shield: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    ),
    help: (
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01" />
    ),
    fileText: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8" />
    ),
    calendar: (
      <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18" />
    )
  };

  return (
    <svg
      className={className}
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
      {icons[name] || icons.shield}
      {name === 'search' && <path d="m21 21-4.35-4.35" />}
    </svg>
  );
}

// Village & Ward Bursary Allocation Data
const VILLAGE_DATA = [
  { name: 'Highridge Village', schools: 6, students: 620, bursaries: 410, pct: 66 },
  { name: 'Parklands Central', schools: 8, students: 840, bursaries: 590, pct: 70 },
  { name: 'Spring Valley', schools: 4, students: 430, bursaries: 295, pct: 68 },
  { name: 'Sorget Central', schools: 5, students: 510, bursaries: 380, pct: 74 },
  { name: 'Tendeno North', schools: 3, students: 310, bursaries: 240, pct: 77 },
  { name: 'Kapsorok Sub-Village', schools: 2, students: 190, bursaries: 145, pct: 76 }
];

// Frequently Asked Questions
const FAQS = [
  {
    question: 'Who is eligible to apply for the Tendeno / Sorget Ward Bursary?',
    answer: 'Any student enrolled in a recognized Secondary School, Special Needs Institution, TVET / Polytechnic, College, or University who is a verified resident of Tendeno / Sorget Ward is eligible to apply. Affirmative action is provided for total orphans, partial orphans, and learners with disabilities.'
  },
  {
    question: 'What mandatory documents must I attach to my bursary application?',
    answer: 'Applicants must provide: (1) Copy of National ID Card (or Birth Certificate for learners under 18), and (2) Official Certified School Fee Statement or Invoice from your educational institution. No physical chief recommendation or headteacher write-off form is needed.'
  },
  {
    question: 'Can a parent apply on behalf of multiple school-going children?',
    answer: 'Yes. Parents and guardians should register a Parent Account with their National ID. From your parent dashboard, you can add and manage applications for multiple dependents across primary, secondary, and tertiary levels under a single unified login.'
  },
  {
    question: 'How are the awarded bursary funds disbursed?',
    answer: 'In strict compliance with the Public Finance Management Act (PFM) and county civic regulations, no cash is given to individuals. Approved grants are disbursed directly to the official bank accounts of the respective schools, colleges, and universities via direct bank EFT remittance or official CDF bursary cheques.'
  },
  {
    question: 'How long does the verification and vetting process take?',
    answer: 'Once the application intake window closes, the Ward Bursary Vetting Committee, Area Chiefs, and village baraza representatives review all submissions within 3 to 5 business days. You can track your real-time verification and allocation status through the portal.'
  },
  {
    question: 'How do I track my bursary application after submitting?',
    answer: 'Simply click "Sign In" at the top of this portal and enter your National ID or email and password. Your personal dashboard will display whether your application is Under Review, Vetted by Chief, Approved by Committee, or Disbursed to your institution.'
  }
];

export function GuestPage() {
  const navigate = useNavigate();

  // Navigation & Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('bursary');

  // Hero Dropdown
  const [bursaryDropdownOpen, setBursaryDropdownOpen] = useState(false);

  // Village Filter
  const [villageSearch, setVillageSearch] = useState('');

  // Modals
  const [metricModal, setMetricModal] = useState(null);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState(0); // 0 is opened by default

  // Set Light Theme for Guest Page
  useEffect(() => {
    const prevBg = document.body.style.backgroundColor;
    const prevTheme = document.documentElement.getAttribute('data-theme');
    document.body.style.backgroundColor = '#F8FAFC';
    document.documentElement.setAttribute('data-theme', 'light');
    return () => {
      document.body.style.backgroundColor = prevBg;
      if (prevTheme) {
        document.documentElement.setAttribute('data-theme', prevTheme);
      }
    };
  }, []);

  // Dropdown ref & outside click handler
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setBursaryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smooth scroll helper
  const scrollTo = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filtered villages
  const filteredVillages = VILLAGE_DATA.filter((v) =>
    v.name.toLowerCase().includes(villageSearch.toLowerCase())
  );

  return (
    <div className="guest-page">
      {/* 1. PC FLOATING NAVIGATION BAR WITH BRAND & GLASSMORPHISM */}
      <div className="gp-nav-bar-wrapper">
        <nav className="gp-nav-bar" aria-label="Main Navigation">
          <div className="gp-nav-brand">
            <img
              src="/images/ng-cdf-logo.png"
              alt="NG-CDF Crest"
              className="gp-nav-logo"
            />
            <div className="gp-nav-brand-text">
              <span className="gp-nav-brand-name">Tendeno / Sorget Ward</span>
              <span className="gp-nav-brand-sub">McMCA Bursary Application &amp; Transparency Portal</span>
            </div>
          </div>

          <ul className="gp-nav-links">
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'bursary' ? 'is-active' : ''}`}
                onClick={() => scrollTo('bursary')}
              >
                Application Process
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'distribution' ? 'is-active' : ''}`}
                onClick={() => scrollTo('distribution')}
              >
                Location Distribution
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'faq' ? 'is-active' : ''}`}
                onClick={() => scrollTo('faq')}
              >
                FAQ
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'rules' ? 'is-active' : ''}`}
                onClick={() => scrollTo('rules')}
              >
                Privacy Policy
              </button>
            </li>
          </ul>

          {/* Right Action: Sign In Button */}
          <div className="gp-nav-actions">
            <button
              type="button"
              className="gp-btn-login gp-btn--clay"
              onClick={() => navigate('/login')}
              aria-label="Open Sign In Window"
            >
              <GuestIcon name="lock" size={16} />
              <span>Sign In</span>
            </button>
          </div>
        </nav>
      </div>

      {/* 2. MOBILE HEADER & STICKY TOP */}
      <div className="gp-mobile-header">
        <div className="gp-mobile-header__brand">
          <button
            type="button"
            className="gp-hamburger-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open Navigation Drawer"
          >
            <GuestIcon name="menu" size={20} />
          </button>
          <img
            src="/images/ng-cdf-logo.png"
            alt="NG-CDF Logo"
            style={{ height: 26, width: 'auto' }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FFFFFF' }}>McMCA Bursary Portal</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>Tendeno / Sorget Ward</div>
          </div>
        </div>

        <div className="gp-mobile-header__actions">
          <button
            type="button"
            className="gp-btn-login"
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            onClick={() => navigate('/login')}
          >
            <GuestIcon name="lock" size={14} />
            Sign In
          </button>
        </div>
      </div>

      {/* 3. COLLAPSIBLE SIDEBAR DRAWER (Mobile) */}
      <div
        className={`gp-sidebar-backdrop ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className={`gp-sidebar ${sidebarOpen ? 'is-open' : ''}`} aria-label="Mobile Navigation">
        <div className="gp-sidebar__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/images/ng-cdf-logo.png"
              alt="CDF Logo"
              style={{ height: 28, width: 'auto' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gp-navy)' }}>McMCA Bursary</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--gp-text-muted)' }}>Tendeno / Sorget Ward</div>
            </div>
          </div>
          <button
            type="button"
            className="gp-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close Navigation"
          >
            <GuestIcon name="close" size={18} />
          </button>
        </div>

        <nav className="gp-sidebar__nav">
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('bursary')}>
            <GuestIcon name="bursary" size={18} /> Application Process
          </button>
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('distribution')}>
            <GuestIcon name="school" size={18} /> Location Distribution
          </button>
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('faq')}>
            <GuestIcon name="help" size={18} /> Frequently Asked Questions
          </button>
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('rules')}>
            <GuestIcon name="fileText" size={18} /> Privacy Policy
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid var(--gp-border)', margin: '10px 0' }} />

          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gp-text-light)', padding: '4px 14px', textTransform: 'uppercase' }}>
            Quick Actions
          </div>
          <Link
            to="/login?tab=register&role=student"
            className="gp-sidebar__link"
            onClick={() => setSidebarOpen(false)}
          >
            <GuestIcon name="user" size={18} /> Apply as Student
          </Link>
          <Link
            to="/login?tab=register&role=parent"
            className="gp-sidebar__link"
            onClick={() => setSidebarOpen(false)}
          >
            <GuestIcon name="bursary" size={18} /> Apply as Parent
          </Link>
        </nav>

        <div className="gp-sidebar__footer">
          <button
            type="button"
            className="gp-btn gp-btn--primary"
            style={{ width: '100%' }}
            onClick={() => {
              setSidebarOpen(false);
              navigate('/login');
            }}
          >
            <GuestIcon name="lock" size={16} /> Sign In to Portal
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gp-text-muted)' }}>
            Tendeno / Sorget Ward Bursary Help Desk
          </div>
        </div>
      </aside>

      {/* MAIN CIVIC CONTENT CONTAINER */}
      <main className="gp-main-content">
        <div className="gp-container gp-sections-stack">
          {/* 1. HERO SECTION CARD */}
          <section id="hero" className="gp-section-card gp-section-card--hero">
            <span className="gp-badge gp-badge--blue">
              <GuestIcon name="shield" size={13} /> Official Ward Bursary Portal
            </span>
            <h1 className="gp-hero__title">
              Empowering <span>Tendeno / Sorget Ward</span>
            </h1>
            <p className="gp-hero__lead">
              Transparent education bursary allocation, streamlined online application vetting,
              and direct tuition fee disbursement under the Member of County Assembly.
            </p>

            {/* 4 Analytics In Cards (Purely Bursary Platform) */}
            <div className="gp-analytics-grid">
              {/* Card 1: Schools Covered */}
              <div
                className="gp-metric-card gp-metric-card--clay"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setMetricModal({
                    title: 'Schools Covered in Ward',
                    value: '28 Schools',
                    badge: '100% Ward Coverage',
                    description: 'Comprehensive educational mapping across all 6 sub-locations, comprising 14 primary schools, 9 secondary schools, and 5 technical/tertiary training centres.',
                    analytics: [
                      { name: 'Parklands Central', val: '8 schools' },
                      { name: 'Highridge Village', val: '6 schools' },
                      { name: 'Sorget Central', val: '5 schools' },
                      { name: 'Spring Valley', val: '4 schools' },
                      { name: 'Tendeno North', val: '3 schools' },
                      { name: 'Kapsorok Sub-Village', val: '2 schools' }
                    ],
                    details: [
                      'Primary Schools: 14 assisted with special needs transition aid & affirmative grants',
                      'Secondary Schools: 9 funded directly with CDF bursary remittances',
                      'Tertiary / Colleges: 5 partner institutes with tuition subsidies'
                    ]
                  })
                }
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
              >
                <div className="gp-metric-card__header">
                  <span className="gp-metric-card__lbl">Schools Covered</span>
                  <span className="gp-metric-card__icon gp-metric-card__icon--blue">
                    <GuestIcon name="school" size={17} />
                  </span>
                </div>
                <div className="gp-metric-card__body">
                  <div className="gp-metric-card__val">28</div>
                  <div className="gp-metric-card__sub">
                    <span className="gp-metric-card__sub-dot gp-metric-card__sub-dot--blue" />
                    <span>All 6 Locations Covered</span>
                  </div>
                </div>
                <div className="gp-metric-card__footer">
                  <span className="gp-metric-card__btn">
                    <span>View distribution</span>
                    <GuestIcon name="chevronRight" size={12} />
                  </span>
                </div>
              </div>

              {/* Card 2: Bursaries Awarded */}
              <div
                className="gp-metric-card gp-metric-card--clay"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setMetricModal({
                    title: 'Bursary Allocations & Beneficiaries',
                    value: '2,450+ Beneficiaries',
                    badge: 'KES 18.5M Allocated',
                    description: 'All applications are vetted through village barazas and verified by Area Chiefs to guarantee fair and impartial support.',
                    analytics: [
                      { name: 'Parklands Central', val: '590 (KES 4.4M)' },
                      { name: 'Highridge Village', val: '410 (KES 3.1M)' },
                      { name: 'Sorget Central', val: '380 (KES 2.9M)' },
                      { name: 'Spring Valley', val: '295 (KES 2.2M)' },
                      { name: 'Tendeno North', val: '240 (KES 1.8M)' },
                      { name: 'Kapsorok Sub-Village', val: '145 (KES 1.1M)' },
                      { name: 'Tertiary & Special Needs', val: '390 (KES 3.0M)' }
                    ],
                    details: [
                      'High School Learners: 1,420 students supported across secondary schools',
                      'University & College: 780 students supported in tertiary institutions',
                      'Special Needs & Affirmative Action: 250 fully sponsored'
                    ]
                  })
                }
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
              >
                <div className="gp-metric-card__header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="gp-metric-card__lbl">Bursaries Awarded</span>
                    <span className="gp-metric-tag gp-metric-tag--emerald">Primary Impact</span>
                  </div>
                  <span className="gp-metric-card__icon gp-metric-card__icon--green">
                    <GuestIcon name="bursary" size={17} />
                  </span>
                </div>
                <div className="gp-metric-card__body">
                  <div className="gp-metric-card__val gp-metric-card__val--emerald">2,450+</div>
                  <div className="gp-metric-card__sub gp-metric-card__sub--green">
                    <span className="gp-metric-card__sub-dot gp-metric-card__sub-dot--green" />
                    <span>KES 18.5M Total Awarded</span>
                  </div>
                </div>
                <div className="gp-metric-card__footer">
                  <span className="gp-metric-card__btn">
                    <span>View distribution</span>
                    <GuestIcon name="chevronRight" size={12} />
                  </span>
                </div>
              </div>

              {/* Card 3: Active Allocation Cycle */}
              <div
                className="gp-metric-card gp-metric-card--clay gp-metric-card--active-cycle"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setMetricModal({
                    title: 'Active Intake Cycle (FY 2026/2027)',
                    value: '100% Direct Disbursement',
                    badge: 'Active Window',
                    description: 'Applications are processed in designated academic cycles. All awarded funds are disbursed electronically straight to the registered bank account of each school or university.',
                    analytics: [
                      { name: 'Intake Cycle', val: 'FY 2026/2027' },
                      { name: 'Disbursement Method', val: 'Direct School Account' },
                      { name: 'Vetting Stages', val: 'Chief + Ward Committee' },
                      { name: 'Turnaround Time', val: '3–5 Days Post-Deadline' }
                    ],
                    details: [
                      'EFT Bank Remittances: Direct transfer with student registration and admission numbers',
                      'Official CDF Cheques: Delivered and signed for by secondary school principals',
                      'Audited Transparency: Zero cash handling ensures zero leakage or misappropriation'
                    ]
                  })
                }
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
              >
                <div className="gp-metric-card__header">
                  <span className="gp-metric-card__lbl">Active Intake Cycle</span>
                  <span className="gp-metric-card__icon gp-metric-card__icon--navy">
                    <GuestIcon name="calendar" size={17} />
                  </span>
                </div>
                <div className="gp-metric-card__body">
                  <div className="gp-metric-card__val">2026/2027</div>
                  <div className="gp-metric-card__sub gp-metric-card__sub--live">
                    <span className="gp-pulse-dot" />
                    <span>Applications Window Open</span>
                  </div>
                </div>
                <div className="gp-metric-card__footer">
                  <span className="gp-metric-card__btn">
                    <span>View cycle details</span>
                    <GuestIcon name="chevronRight" size={12} />
                  </span>
                </div>
              </div>

              {/* Card 4: Transparency & Audit Compliance */}
              <div
                className="gp-metric-card gp-metric-card--clay"
                role="button"
                tabIndex={0}
                onClick={() =>
                  setMetricModal({
                    title: 'Transparency & Civic Audit Compliance',
                    value: '98.2% Allocation Rate',
                    badge: 'Certified Clean Audit',
                    description: 'The bursary fund operates under stringent Public Finance Management (PFM) regulations, with published lists verified at village barazas.',
                    analytics: [
                      { name: 'Public Audit Rating', val: 'Grade A (Clean)' },
                      { name: 'Residency Verification', val: '100% Chief Endorsed' },
                      { name: 'Affirmative Action Target', val: '25% Most Vulnerable' },
                      { name: 'Online Tracking', val: 'Realtime SMS & Portal' }
                    ],
                    details: [
                      'Vetting Committee: Includes education officers, area chief, MCA, and parent reps',
                      'Grievance Redress: Disputed decisions can be appealed directly to the Ward Secretariat',
                      'Statutory Compliance: Full compliance with Kenya Data Protection Act 2019'
                    ]
                  })
                }
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
              >
                <div className="gp-metric-card__header">
                  <span className="gp-metric-card__lbl">Transparency &amp; Audit</span>
                  <span className="gp-metric-card__icon gp-metric-card__icon--gold">
                    <GuestIcon name="shield" size={17} />
                  </span>
                </div>
                <div className="gp-metric-card__body">
                  <div className="gp-metric-card__val">98.2%</div>
                  <div className="gp-metric-card__sub gp-metric-card__sub--gold">
                    <span className="gp-metric-card__sub-dot gp-metric-card__sub-dot--gold" />
                    <span>Baraza &amp; Chief Vetted</span>
                  </div>
                </div>
                <div className="gp-metric-card__footer">
                  <span className="gp-metric-card__btn">
                    <span>View audit standards</span>
                    <GuestIcon name="chevronRight" size={12} />
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions for Bursary Portal */}
            <div className="gp-quick-actions">
              {/* 1. Apply Bursary with Dropdown */}
              <div className="gp-dropdown-wrap" ref={dropdownRef}>
                <button
                  type="button"
                  className="gp-btn gp-btn--primary gp-btn--clay"
                  onClick={() => setBursaryDropdownOpen(!bursaryDropdownOpen)}
                  aria-expanded={bursaryDropdownOpen}
                >
                  <GuestIcon name="bursary" size={16} />
                  <span>Apply Bursary</span>
                  <GuestIcon name="chevronDown" size={14} />
                </button>

                {bursaryDropdownOpen && (
                  <div className="gp-dropdown-menu" role="menu">
                    <button
                      type="button"
                      className="gp-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setBursaryDropdownOpen(false);
                        navigate('/login?tab=register&role=student');
                      }}
                    >
                      <GuestIcon name="user" size={16} />
                      <div>
                        <div>Student Application</div>
                        <small style={{ color: 'var(--gp-text-muted)' }}>Self-register with National ID</small>
                      </div>
                    </button>
                    <button
                      type="button"
                      className="gp-dropdown-item"
                      role="menuitem"
                      onClick={() => {
                        setBursaryDropdownOpen(false);
                        navigate('/login?tab=register&role=parent');
                      }}
                    >
                      <GuestIcon name="school" size={16} />
                      <div>
                        <div>Parent Application</div>
                        <small style={{ color: 'var(--gp-text-muted)' }}>Apply for your child / dependent</small>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Step-by-Step Guidance */}
              <button
                type="button"
                className="gp-btn gp-btn--navy gp-btn--clay"
                onClick={() => scrollTo('bursary')}
              >
                <GuestIcon name="arrowRight" size={16} />
                <span>Application Guidelines</span>
              </button>

              {/* 3. Sign In Button */}
              <button
                type="button"
                className="gp-btn gp-btn--clay"
                style={{ background: '#FFFFFF', color: 'var(--gp-navy)', border: '1px solid var(--gp-border)' }}
                onClick={() => navigate('/login')}
              >
                <GuestIcon name="lock" size={16} />
                <span>Register / Sign In</span>
              </button>
            </div>

            {/* Small General Analytics At Bottom Of Hero */}
            <div className="gp-general-analytics gp-glass-card">
              <div className="gp-general-analytics__item">
                <span className="gp-general-analytics__dot" />
                <span><strong>KES 24.5M</strong> Ward Fund Pool</span>
              </div>
              <div className="gp-general-analytics__item">
                <span className="gp-general-analytics__dot" />
                <span><strong>98.2%</strong> Allocation Transparency</span>
              </div>
              <div className="gp-general-analytics__item">
                <span className="gp-general-analytics__dot" />
                <span><strong>5 Sub-Locations</strong> Connected</span>
              </div>
              <div className="gp-general-analytics__item">
                <span className="gp-general-analytics__dot" />
                <span><strong>3–5 Days</strong> Average Review</span>
              </div>
            </div>
          </section>

          {/* 2. BURSARY APPLICATION SECTION CARD */}
          <BursaryProcessGuide />

          {/* 3. WARD BURSARY DISTRIBUTION SECTION CARD */}
          <section id="distribution" className="gp-section-card gp-section-card--dev">
            <div className="gp-section-header">
              <span className="gp-badge gp-badge--navy">Accountability in Action</span>
              <h2 className="gp-section-title">Location Distribution</h2>
              <p className="gp-section-desc">
                Review village-by-village student enrollment, bursary beneficiaries, and allocation coverage rates across Tendeno / Sorget Ward.
              </p>
            </div>

            {/* Schools & Bursary Distribution per Village Table */}
            <div className="gp-villages-card gp-glass-card">
              <div className="gp-villages-header">
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--gp-navy)' }}>
                    Bursary Allocations &amp; Coverage Per Village
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gp-text-muted)' }}>
                    Certified records from the Tendeno / Sorget Ward Bursary Vetting Committee.
                  </p>
                </div>

                <input
                  type="text"
                  placeholder="Search village name…"
                  value={villageSearch}
                  onChange={(e) => setVillageSearch(e.target.value)}
                  className="gp-search-input"
                />
              </div>

              <div className="gp-table-wrap">
                <table className="gp-table">
                  <thead>
                    <tr>
                      <th>Village Name</th>
                      <th>Schools Supported</th>
                      <th>Total Students</th>
                      <th>Awarded Bursary</th>
                      <th>Coverage Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVillages.map((v) => (
                      <tr key={v.name}>
                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                        <td>{v.schools} Schools</td>
                        <td>{v.students.toLocaleString()} Learners</td>
                        <td style={{ fontWeight: 700, color: 'var(--gp-blue-bright)' }}>
                          {v.bursaries.toLocaleString()} Awarded
                        </td>
                        <td>
                          <span className="gp-progress-bar">
                            <span className="gp-progress-fill" style={{ width: `${v.pct}%` }} />
                          </span>
                          <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>{v.pct}%</span>
                        </td>
                      </tr>
                    ))}
                    {filteredVillages.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--gp-text-muted)' }}>
                          No villages match your search term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* 4. FREQUENTLY ASKED QUESTIONS (FAQ) SECTION */}
          <section id="faq" className="gp-section-card gp-section-card--faq">
            <div className="gp-section-header">
              <span className="gp-badge gp-badge--blue">Common Questions</span>
              <h2 className="gp-section-title">Frequently Asked Questions</h2>
              <p className="gp-section-desc">
                Everything you need to know about eligibility, required documentation, vetting timelines, and fee disbursement.
              </p>
            </div>

            <div className="gp-faq-list">
              {FAQS.map((faq, index) => {
                const isOpen = expandedFaq === index;
                return (
                  <div key={index} className={`gp-faq-item ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="gp-faq-trigger"
                      onClick={() => setExpandedFaq(isOpen ? null : index)}
                      aria-expanded={isOpen}
                    >
                      <span className="gp-faq-question">{faq.question}</span>
                      <span className="gp-faq-icon">
                        <GuestIcon name="chevronDown" size={16} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="gp-faq-answer">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5. PRIVACY POLICY & PUBLIC GOVERNANCE RULES */}
          <section id="rules" className="gp-section-card gp-section-card--rules">
            <div className="gp-section-header">
              <span className="gp-badge" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60A5FA', border: '1px solid rgba(96, 165, 250, 0.3)' }}>
                Statutory Compliance
              </span>
              <h2 className="gp-section-title" style={{ color: '#FFFFFF' }}>Privacy Policy</h2>
              <p className="gp-section-desc" style={{ color: '#94A3B8' }}>
                The Tendeno / Sorget Ward Bursary Portal strictly adheres to the Kenya Data Protection Act, 2019, and the Public Finance Management (PFM) regulations.
              </p>
            </div>

            {/* 3 Governance Highlight Columns */}
            <div className="gp-rules-grid">
              <div className="gp-rules-col">
                <div className="gp-rules-col-icon">
                  <GuestIcon name="shield" size={22} />
                </div>
                <h3 className="gp-rules-col-title">Data Protection &amp; Privacy</h3>
                <p className="gp-rules-col-desc">
                  Your National ID, student records, and family financial data are processed securely. Personal information is used strictly by the vetting committee and never shared with commercial entities.
                </p>
              </div>

              <div className="gp-rules-col">
                <div className="gp-rules-col-icon">
                  <GuestIcon name="check" size={22} />
                </div>
                <h3 className="gp-rules-col-title">Fairness &amp; Anti-Corruption</h3>
                <p className="gp-rules-col-desc">
                  Zero tolerance for bribery or nepotism. Submissions are cross-verified by Area Chiefs and village elders to ensure bursary allocations reach genuine, deserving students.
                </p>
              </div>

              <div className="gp-rules-col">
                <div className="gp-rules-col-icon">
                  <GuestIcon name="fileText" size={22} />
                </div>
                <h3 className="gp-rules-col-title">Direct School Disbursement</h3>
                <p className="gp-rules-col-desc">
                  In compliance with government audit standards, approved grants are dispatched via bank EFT or certified CDF cheque directly to school and university institutional accounts.
                </p>
              </div>
            </div>

            {/* CTA Box with Button to see full privacy rules */}
            <div className="gp-rules-cta-box">
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#FFFFFF', marginBottom: 4 }}>
                  Read the Full Statutory Policy &amp; Regulations
                </div>
                <div style={{ fontSize: '0.84rem', color: '#94A3B8' }}>
                  Review candidate eligibility, citizen rights under the Data Protection Act, and appeals procedures.
                </div>
              </div>

              <button
                type="button"
                className="gp-btn gp-btn--primary gp-btn--clay"
                onClick={() => setPrivacyModalOpen(true)}
              >
                <GuestIcon name="fileText" size={16} />
                <span>View Full Privacy Rules &amp; Policy</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="gp-footer" role="contentinfo">
        <div className="gp-container gp-footer__inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img
              src="/images/ng-cdf-logo.png"
              alt="NG-CDF Logo"
              style={{ height: 24, width: 'auto', filter: 'brightness(0) invert(1)' }}
            />
            <span>Office of the Member of County Assembly — Tendeno / Sorget Ward</span>
          </div>
          <div>
            <span>Staff Portal: </span>
            <Link to="/helpdesk/dashboard">Help Desk</Link>
            <span style={{ margin: '0 8px' }}>•</span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: 0 }}
            >
              Sign In
            </button>
            <span style={{ margin: '0 8px' }}>•</span>
            <Link to="/register">Register</Link>
            <span style={{ margin: '0 8px' }}>•</span>
            <button
              type="button"
              onClick={() => setPrivacyModalOpen(true)}
              style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: 0 }}
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* ========================================================
          MODALS
         ======================================================== */}

      {/* ANALYTICS CARD DETAIL MODAL */}
      {metricModal && (
        <div
          className="gp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="metric-dialog-title"
          onClick={() => setMetricModal(null)}
        >
          <div className="gp-modal-box gp-modal-box--analytics" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gp-modal-close"
              onClick={() => setMetricModal(null)}
              aria-label="Close Metric Dialog"
            >
              <GuestIcon name="close" size={18} />
            </button>

            {/* Header with Badge & Hierarchy */}
            <div className="gp-modal-header">
              <span className="gp-badge gp-badge--green" style={{ marginBottom: 6 }}>
                {metricModal.badge}
              </span>
              <h2 id="metric-dialog-title" className="gp-modal-title">
                {metricModal.title}
              </h2>
              <div className="gp-modal-highlight-val">
                {metricModal.value}
              </div>
              <p className="gp-modal-desc">
                {metricModal.description}
              </p>
            </div>

            {/* Distribution Analytics Breakdown Grid */}
            {metricModal.analytics && metricModal.analytics.length > 0 && (
              <div className="gp-modal-analytics-block">
                <div className="gp-modal-analytics-header">
                  <span>Location / Category Distribution</span>
                  <span className="gp-badge gp-badge--blue" style={{ margin: 0, padding: '2px 8px', fontSize: '0.68rem' }}>
                    Ward Baraza Verified
                  </span>
                </div>
                <div className="gp-modal-analytics-grid">
                  {metricModal.analytics.map((item, idx) => (
                    <div key={idx} className="gp-modal-stat-pill">
                      <span className="gp-modal-stat-name">{item.name}</span>
                      <span className="gp-modal-stat-num">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Breakdown Details List */}
            {metricModal.details && metricModal.details.length > 0 && (
              <div className="gp-modal-details-card">
                <div className="gp-modal-details-title">
                  Key Distribution Highlights:
                </div>
                <ul className="gp-modal-details-list">
                  {metricModal.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Bar */}
            <div className="gp-modal-actions">
              <button
                type="button"
                className="gp-btn gp-btn--primary"
                onClick={() => {
                  setMetricModal(null);
                  scrollTo('bursary');
                }}
              >
                Apply for Bursary
              </button>
              <button
                type="button"
                className="gp-btn gp-btn--navy"
                onClick={() => setMetricModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. FULL PRIVACY POLICY & STATUTORY BURSARY RULES MODAL */}
      {privacyModalOpen && (
        <div
          className="gp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-dialog-title"
          onClick={() => setPrivacyModalOpen(false)}
        >
          <div className="gp-modal-box gp-modal-box--policy" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gp-modal-close"
              onClick={() => setPrivacyModalOpen(false)}
              aria-label="Close Privacy Policy Dialog"
            >
              <GuestIcon name="close" size={18} />
            </button>

            <span className="gp-badge gp-badge--blue" style={{ marginBottom: 6 }}>
              Statutory Government Policy
            </span>
            <h2 id="privacy-dialog-title" style={{ margin: '0 0 6px', fontSize: '1.4rem', fontWeight: 800, color: 'var(--gp-navy)' }}>
              Tendeno / Sorget Ward Bursary Privacy Policy &amp; Operating Rules
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: '0.82rem', color: 'var(--gp-text-muted)' }}>
              Official administrative guidelines issued under the Office of the Member of County Assembly and the County Bursary Allocation Act.
            </p>

            <div className="gp-policy-content">
              {/* Clause 1 */}
              <div className="gp-policy-clause">
                <h3 className="gp-policy-title">1. Legal Basis &amp; Authority</h3>
                <p>
                  This portal is established under Article 53 and Article 55 of the Constitution of Kenya (Access to Basic Education &amp; Youth Empowerment),
                  the County Governments Act, and the Public Finance Management (PFM) Act. The Office of the MCA is mandated to ensure equitable, transparent distribution of Ward education relief funds.
                </p>
              </div>

              {/* Clause 2 */}
              <div className="gp-policy-clause">
                <h3 className="gp-policy-title">2. Data Protection &amp; Citizen Privacy (Data Protection Act, 2019)</h3>
                <p>
                  We are committed to safeguarding the personal identification and academic information submitted by applicants and parents:
                </p>
                <ul className="gp-policy-list">
                  <li><strong>Data Collected:</strong> Full legal name, National Identity Number, Birth Certificate number, student admission details, academic fee structures, and Area Chief residency endorsements.</li>
                  <li><strong>Lawful Purpose:</strong> All data is gathered exclusively to verify eligibility, calculate need priority scores, and effect direct payments to educational institutions.</li>
                  <li><strong>Non-Disclosure:</strong> Under no circumstances is applicant data sold, rented, or shared with commercial entities or non-authorized third parties.</li>
                  <li><strong>Retention &amp; Deletion:</strong> Records are preserved in compliance with government public audit schedules, after which personal identifiable records are securely purged.</li>
                </ul>
              </div>

              {/* Clause 3 */}
              <div className="gp-policy-clause">
                <h3 className="gp-policy-title">3. Eligibility Criteria &amp; Rules of Application</h3>
                <p>
                  To maintain absolute fairness across all 6 administrative sub-locations in Tendeno / Sorget Ward:
                </p>
                <ul className="gp-policy-list">
                  <li><strong>Bona Fide Ward Residency:</strong> The student or parent/guardian must be an active resident of Tendeno / Sorget Ward, attested by the local village elder and endorsed by the Area Chief or Sub-Chief.</li>
                  <li><strong>Accredited Institutions:</strong> Bursary funding is only available to students enrolled in registered primary, secondary, special needs, TVET/polytechnic, or higher learning institutions recognized by the Ministry of Education.</li>
                  <li><strong>Accurate Information:</strong> Any falsification of academic documents, fake fee structures, or misrepresentation of dependency will result in automatic disqualification and referral to statutory authorities.</li>
                </ul>
              </div>

              {/* Clause 4 */}
              <div className="gp-policy-clause">
                <h3 className="gp-policy-title">4. Vetting, Affirmative Action &amp; Anti-Corruption Mandate</h3>
                <p>
                  Applications undergo multi-tier vetting to eliminate bias:
                </p>
                <ul className="gp-policy-list">
                  <li><strong>Vetting Committee:</strong> Consists of community elders, educational representatives, Area Chiefs, and ward civic representatives.</li>
                  <li><strong>Affirmative Action:</strong> Priority is legally guaranteed to orphans, students with disabilities, and families facing extreme documented hardship.</li>
                  <li><strong>Zero Bribery Policy:</strong> Application, vetting, and award allocation are 100% free of charge. Solicitation of payments by any agent or staff member is strictly prohibited and punishable under law.</li>
                </ul>
              </div>

              {/* Clause 5 */}
              <div className="gp-policy-clause">
                <h3 className="gp-policy-title">5. Direct Institutional Disbursement Mechanism</h3>
                <p>
                  No bursary funds are released to individuals or cash accounts. In line with the Auditor General's recommendations, payments are made exclusively by electronic bank transfer (EFT) or certified CDF cheque drawn in favor of the beneficiary's registered school, college, or university account.
                </p>
              </div>

              {/* Clause 6 */}
              <div className="gp-policy-clause">
                <h3 className="gp-policy-title">6. Citizen Rights &amp; Appeals Process</h3>
                <p>
                  Applicants have the right to request clarification on any vetting outcome. An aggrieved citizen may lodge an official review petition with the Help Desk Secretariat within 14 calendar days of allocation publication.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
              <button
                type="button"
                className="gp-btn gp-btn--navy"
                onClick={() => window.print()}
              >
                Print Official Policy
              </button>
              <button
                type="button"
                className="gp-btn gp-btn--primary"
                onClick={() => setPrivacyModalOpen(false)}
              >
                I Understand &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestPage;
