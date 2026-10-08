import React, { useState, useEffect, useRef, useId } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { assertPortalLoginAllowed } from '../lib/accountQueries';
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
    hospital: (
      <path d="M12 6v12 M6 12h12 M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z" />
    ),
    development: (
      <path d="M3 21h18 M5 21V7l8-4v18 M13 11l6 3v7 M9 9h1 M9 13h1 M9 17h1 M16 17h1" />
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
    message: (
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    whatsapp: (
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    ),
    facebook: (
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    ),
    arrowRight: (
      <path d="M5 12h14 M12 5l7 7-7 7" />
    ),
    search: (
      <circle cx="11" cy="11" r="8" />
    ),
    shield: (
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

// Village & Ward Data
const VILLAGE_DATA = [
  { name: 'Highridge Village', schools: 6, students: 620, bursaries: 410, pct: 66 },
  { name: 'Parklands Central', schools: 8, students: 840, bursaries: 590, pct: 70 },
  { name: 'Spring Valley', schools: 4, students: 430, bursaries: 295, pct: 68 },
  { name: 'Sorget Central', schools: 5, students: 510, bursaries: 380, pct: 74 },
  { name: 'Tendeno North', schools: 3, students: 310, bursaries: 240, pct: 77 },
  { name: 'Kapsorok Sub-Village', schools: 2, students: 190, bursaries: 145, pct: 76 }
];

// Project Showcases
const PROJECTS = [
  {
    title: 'St. Mary Modern Science Laboratory',
    category: 'Education Infrastructure',
    village: 'Parklands Central',
    status: 'Completed',
    budget: 'KES 4.2M',
    summary: 'Fully equipped physics, chemistry, and biology labs serving over 650 students.',
    imageUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Highridge Community Solar Borehole',
    category: 'Water & Sanitation',
    village: 'Highridge Village',
    status: 'Commissioned',
    budget: 'KES 3.1M',
    summary: 'High-yield solar pump providing clean, chlorinated drinking water to 1,200 households.',
    imageUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Parklands Dispensary Maternity Wing',
    category: 'Healthcare Expansion',
    village: 'Parklands Central',
    status: 'Operational',
    budget: 'KES 5.5M',
    summary: '12-bed maternity unit with solar vaccine storage and emergency power backup.',
    imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80'
  },
  {
    title: 'Tendeno-Sorget Road Grading & Solar Lights',
    category: 'Civic Roads & Lighting',
    village: 'Tendeno North',
    status: 'Phase 2 Active',
    budget: 'KES 2.8M',
    summary: '8km all-weather graveling and installation of 45 solar streetlamps for security.',
    imageUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?auto=format&fit=crop&w=600&q=80'
  }
];

// Bursary Steps Configuration by Persona
const STEPS_CONFIG = {
  university: {
    label: 'University / College',
    description: 'For undergraduate, diploma, and certificate students in recognized tertiary institutions.',
    steps: [
      { num: '01', title: 'National ID & Profile', desc: 'Create your account using your National ID and institutional admission details.' },
      { num: '02', title: 'Upload Fee Statement', desc: 'Attach official current semester fee structure and student verification card.' },
      { num: '03', title: 'Ward Committee Review', desc: 'Vetting by the Ward Bursary Committee and verification by the Area Chief.' },
      { num: '04', title: 'Direct Disbursement', desc: 'Approved funds paid straight to your university/college bank account.' }
    ],
    requirements: ['National ID Card', 'College Admission Letter', 'Current Fee Statement', 'Student Portal Login / ID']
  },
  highschool: {
    label: 'High School',
    description: 'For secondary school students (Form 1 to Form 4) enrolled in public day and boarding schools.',
    steps: [
      { num: '01', title: 'Registration / NEMIS', desc: 'Register with student NEMIS / UPI number or through a parent account.' },
      { num: '02', title: 'School Principal Sign-off', desc: 'Submit terminal report card and the principal fee balance invoice.' },
      { num: '03', title: 'Location Vetting', desc: 'Verification of family residency by local village elders and Area Chief.' },
      { num: '04', title: 'CDF Cheque Delivery', desc: 'Bursary cheques sent directly to your secondary school administration.' }
    ],
    requirements: ['NEMIS / Assessment Number', 'School Fee Structure', 'Birth Certificate / ID', 'Chief Endorsement Form']
  },
  primary: {
    label: 'Primary School',
    description: 'Special support, vulnerable pupil assistance, and transition aid for primary learners.',
    steps: [
      { num: '01', title: 'Parent Account Setup', desc: 'Parent or guardian signs up with their National ID to manage the child application.' },
      { num: '02', title: 'Headteacher Endorsement', desc: 'Obtain assessment confirmation from the primary school headteacher.' },
      { num: '03', title: 'Village Elder Review', desc: 'Community validation to ensure affirmative action reaches the most needy.' },
      { num: '04', title: 'Disbursement & Kit', desc: 'Direct school supply grant and essential fee relief distributed.' }
    ],
    requirements: ['Parent National ID', 'Pupil Birth Certificate', 'Headteacher Letter', 'Village Residency Proof']
  },
  parent: {
    label: 'I am a Parent / Guardian',
    description: 'Manage bursary applications for all your children from one consolidated family account.',
    steps: [
      { num: '01', title: 'Parent Registration', desc: 'Register your parent account once using your National ID card.' },
      { num: '02', title: 'Add Dependents', desc: 'Link your children (Primary, High School, or College) under your dashboard.' },
      { num: '03', title: 'Submit Documents', desc: 'Upload each child fee structures and your family income / situation status.' },
      { num: '04', title: 'Track Allocations', desc: 'Receive SMS updates and live dashboard status as bursaries are awarded.' }
    ],
    requirements: ['Parent National ID', 'Children Birth Certificates', 'School Fee Structures', 'Proof of Vulnerability (if any)']
  }
};

export function GuestPage() {
  const navigate = useNavigate();

  // Navigation & Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');

  // Hero Dropdown
  const [bursaryDropdownOpen, setBursaryDropdownOpen] = useState(false);

  // Bursary Steps Persona
  const [selectedPersona, setSelectedPersona] = useState('university');

  // Village Filter
  const [villageSearch, setVillageSearch] = useState('');

  // Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [instituteModalOpen, setInstituteModalOpen] = useState(false);
  const [metricModal, setMetricModal] = useState(null);

  // Inline Login State (houses login directly on guest page)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Issue Submission State
  const [issueName, setIssueName] = useState('');
  const [issuePhone, setIssuePhone] = useState('');
  const [issueVillage, setIssueVillage] = useState('Highridge Village');
  const [issueCategory, setIssueCategory] = useState('Roads & Infrastructure');
  const [issueDetails, setIssueDetails] = useState('');
  const [issueSubmitted, setIssueSubmitted] = useState(false);

  // IDs for accessibility
  const loginIdInputId = useId();
  const loginPassInputId = useId();
  const issueNameId = useId();
  const issuePhoneId = useId();
  const issueVillageId = useId();
  const issueCategoryId = useId();
  const issueDetailsId = useId();

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

  // Direct login handler
  async function handleDirectLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      if (!supabase) {
        throw new Error('This site is not connected to the database yet.');
      }
      let loginEmail = loginIdentifier.trim();
      const isEmail = loginEmail.includes('@');
      if (!isEmail) {
        const cleanId = loginEmail.replace(/\D/g, '');
        try {
          const map = JSON.parse(localStorage.getItem('mcmca_id_map') || '{}');
          if (map[cleanId]) loginEmail = map[cleanId];
        } catch {}

        if (!loginEmail.includes('@')) {
          try {
            const { data: student } = await supabase
              .from('student_profiles')
              .select('email')
              .eq('national_id', cleanId)
              .maybeSingle();
            if (student?.email) loginEmail = student.email;
            else {
              const { data: parent } = await supabase
                .from('parent_profiles')
                .select('email')
                .eq('national_id', cleanId)
                .maybeSingle();
              if (parent?.email) loginEmail = parent.email;
            }
          } catch {}
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      if (signInError) throw signInError;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('No user found');

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('auth_user_id', user.id)
        .single();
      if (roleError || !roleData) throw roleError || new Error('No role associated with this user');

      const role = roleData.role;
      await assertPortalLoginAllowed(user.id, role);

      if (role === 'student') navigate('/student/dashboard');
      else if (role === 'parent') navigate('/parent/dashboard');
      else if (role === 'chief') navigate('/chief/dashboard');
      else if (role === 'mca') navigate('/mca/dashboard');
      else if (role === 'helpdesk' || role === 'help_desk') navigate('/helpdesk/dashboard');
      else throw new Error('Invalid user role');
    } catch (err) {
      setLoginError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  }

  // Handle complaint submission
  function handleIssueSubmit(e) {
    e.preventDefault();
    setIssueSubmitted(true);
    setTimeout(() => {
      setIssueModalOpen(false);
      setIssueSubmitted(false);
      setIssueName('');
      setIssuePhone('');
      setIssueDetails('');
    }, 2800);
  }

  // Filtered villages
  const filteredVillages = VILLAGE_DATA.filter((v) =>
    v.name.toLowerCase().includes(villageSearch.toLowerCase())
  );

  return (
    <div className="guest-page">
      {/* 1. TOP BAR */}
      <header className="gp-top-bar" role="banner">
        <div className="gp-container gp-top-bar__inner">
          <div className="gp-top-bar__left">
            <img
              src="/images/ng-cdf-logo.png"
              alt="NG-CDF Kenya Crest"
              className="gp-top-bar__logo"
            />
            <div className="gp-top-bar__brand">
              <span className="gp-top-bar__name">Tendeno / Sorget Ward</span>
              <span className="gp-top-bar__sub">McMca Bursary & Civic Transparency Portal</span>
            </div>
          </div>
          <div className="gp-top-bar__right">
            <span className="gp-top-bar__item">
              <GuestIcon name="phone" size={14} /> Hotline: <strong>+254 700 123 456</strong>
            </span>
            <span className="gp-top-bar__item">
              <GuestIcon name="hospital" size={14} /> Office: <strong>Mon–Fri 8am–5pm</strong>
            </span>
            <span className="gp-badge gp-badge--green" style={{ margin: 0 }}>
              ● 2026/2027 Bursary Open
            </span>
          </div>
        </div>
      </header>

      {/* 2. PC FLOATING NAVIGATION BAR (Below top bar with space and smooth radius) */}
      <div className="gp-nav-bar-wrapper">
        <nav className="gp-nav-bar" aria-label="Main Navigation">
          <ul className="gp-nav-links">
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'hero' ? 'is-active' : ''}`}
                onClick={() => scrollTo('hero')}
              >
                Overview
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'bursary' ? 'is-active' : ''}`}
                onClick={() => scrollTo('bursary')}
              >
                Bursary Steps
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'development' ? 'is-active' : ''}`}
                onClick={() => scrollTo('development')}
              >
                Constituency Development
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'issues' ? 'is-active' : ''}`}
                onClick={() => scrollTo('issues')}
              >
                Report an Issue
              </button>
            </li>
            <li>
              <button
                type="button"
                className={`gp-nav-link ${activeSection === 'social' ? 'is-active' : ''}`}
                onClick={() => scrollTo('social')}
              >
                Community Forum
              </button>
            </li>
          </ul>

          {/* Bright Blue Login Button in PC Nav Bar */}
          <button
            type="button"
            className="gp-btn-login"
            onClick={() => setLoginModalOpen(true)}
            aria-label="Open Sign In Window"
          >
            <GuestIcon name="lock" size={16} />
            <span>Sign In</span>
          </button>
        </nav>
      </div>

      {/* 3. MOBILE HEADER & STICKY TOP */}
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
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gp-navy)' }}>McMCA Ward Portal</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--gp-text-muted)' }}>Tendeno / Sorget</div>
          </div>
        </div>

        <div className="gp-mobile-header__actions">
          <button
            type="button"
            className="gp-btn-login"
            style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            onClick={() => setLoginModalOpen(true)}
          >
            <GuestIcon name="lock" size={14} />
            Sign In
          </button>
        </div>
      </div>

      {/* 4. COLLAPSIBLE SIDEBAR DRAWER (Mobile) */}
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
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--gp-navy)' }}>McMca Portal</div>
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
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('hero')}>
            <GuestIcon name="shield" size={18} /> Overview
          </button>
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('bursary')}>
            <GuestIcon name="bursary" size={18} /> Bursary Steps
          </button>
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('development')}>
            <GuestIcon name="development" size={18} /> Ward Developments
          </button>
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('issues')}>
            <GuestIcon name="alert" size={18} /> Report an Issue
          </button>
          <button type="button" className="gp-sidebar__link" onClick={() => scrollTo('social')}>
            <GuestIcon name="message" size={18} /> Community Forum
          </button>

          <hr style={{ border: 'none', borderTop: '1px solid var(--gp-border)', margin: '10px 0' }} />

          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gp-text-light)', padding: '4px 14px', textTransform: 'uppercase' }}>
            Quick Actions
          </div>
          <Link
            to="/register?role=student"
            className="gp-sidebar__link"
            onClick={() => setSidebarOpen(false)}
          >
            <GuestIcon name="user" size={18} /> Apply as Student
          </Link>
          <Link
            to="/register?role=parent"
            className="gp-sidebar__link"
            onClick={() => setSidebarOpen(false)}
          >
            <GuestIcon name="bursary" size={18} /> Apply as Parent
          </Link>
          <button
            type="button"
            className="gp-sidebar__link"
            onClick={() => {
              setSidebarOpen(false);
              setIssueModalOpen(true);
            }}
          >
            <GuestIcon name="alert" size={18} /> Lodge Citizen Grievance
          </button>
        </nav>

        <div className="gp-sidebar__footer">
          <button
            type="button"
            className="gp-btn gp-btn--primary"
            style={{ width: '100%' }}
            onClick={() => {
              setSidebarOpen(false);
              setLoginModalOpen(true);
            }}
          >
            <GuestIcon name="lock" size={16} /> Sign In to Portal
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--gp-text-muted)' }}>
            Need help? Call +254 700 123 456
          </div>
        </div>
      </aside>

      {/* 5. HERO SECTION */}
      <section id="hero" className="gp-section gp-hero">
        <div className="gp-container">
          <span className="gp-badge gp-badge--blue">
            <GuestIcon name="shield" size={13} /> Official Ward Civic Portal
          </span>
          <h1 className="gp-hero__title">
            Empowering <span>Tendeno / Sorget Ward</span>
          </h1>
          <p className="gp-hero__lead">
            Transparent education bursary allocation, real-time constituency development tracking,
            and direct community governance under the Member of County Assembly.
          </p>

          {/* 4 Analytics In Cards (Clickable, compact & consistent) */}
          <div className="gp-analytics-grid">
            {/* Card 1: Schools Covered */}
            <div
              className="gp-metric-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                setMetricModal({
                  title: 'Schools Covered in Ward',
                  value: '28 Schools',
                  badge: '100% Ward Coverage',
                  description: 'Spanning all 6 sub-locations, comprising 14 primary schools, 9 secondary schools, and 5 technical/vocational institutions.',
                  details: [
                    'Primary Schools: 14 supported with desks & sanitation',
                    'Secondary Schools: 9 funded with lab equipment & CDF bursaries',
                    'Tertiary / Vocational: 5 institutes with specialized training subsidies'
                  ]
                })
              }
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
            >
              <div className="gp-metric-card__header">
                <span className="gp-metric-card__lbl">Schools Covered</span>
                <span className="gp-metric-card__icon gp-metric-card__icon--blue">
                  <GuestIcon name="school" size={16} />
                </span>
              </div>
              <div className="gp-metric-card__val">28</div>
              <div className="gp-metric-card__arrow">
                View distribution <GuestIcon name="chevronRight" size={12} />
              </div>
            </div>

            {/* Card 2: Bursaries Applied */}
            <div
              className="gp-metric-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                setMetricModal({
                  title: 'Bursaries Applied & Disbursed',
                  value: '2,450+ Beneficiaries',
                  badge: 'KES 18.5M Allocated',
                  description: 'All applications are vetted through village barazas and verified by the Area Chief to ensure fairness and zero bias.',
                  details: [
                    'High School Learners: 1,420 students supported',
                    'University & College: 780 students supported',
                    'Special Needs & Vulnerable: 250 fully sponsored'
                  ]
                })
              }
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
            >
              <div className="gp-metric-card__header">
                <span className="gp-metric-card__lbl">Bursaries Awarded</span>
                <span className="gp-metric-card__icon gp-metric-card__icon--green">
                  <GuestIcon name="bursary" size={16} />
                </span>
              </div>
              <div className="gp-metric-card__val">2,450+</div>
              <div className="gp-metric-card__arrow">
                Review allocations <GuestIcon name="chevronRight" size={12} />
              </div>
            </div>

            {/* Card 3: Hospitals & Health */}
            <div
              className="gp-metric-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                setMetricModal({
                  title: 'Health Centers & Dispensaries',
                  value: '8 Facilities Supported',
                  badge: 'Ward Health Network',
                  description: 'Ward medical facilities equipped with maternity amenities, solar backup systems, and essential medication restocking.',
                  details: [
                    'Parklands Dispensary: Maternity wing active',
                    'Highridge Health Post: 24-hr emergency nurse station',
                    'Sorget Clinic: Solar cold-chain refrigeration installed'
                  ]
                })
              }
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
            >
              <div className="gp-metric-card__header">
                <span className="gp-metric-card__lbl">Hospitals & Clinics</span>
                <span className="gp-metric-card__icon gp-metric-card__icon--gold">
                  <GuestIcon name="hospital" size={16} />
                </span>
              </div>
              <div className="gp-metric-card__val">8</div>
              <div className="gp-metric-card__arrow">
                Inspect facilities <GuestIcon name="chevronRight" size={12} />
              </div>
            </div>

            {/* Card 4: Developments */}
            <div
              className="gp-metric-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                setMetricModal({
                  title: 'Ward Development Projects',
                  value: '42 Projects Delivered',
                  badge: 'FY 2024–2026',
                  description: 'Key community infrastructure including roads, high-yield boreholes, youth innovation hubs, and market floodlighting.',
                  details: [
                    'Water: 12 boreholes and community kiosks',
                    'Roads: 48km graded and culverted',
                    'Security: 95 solar streetlamps in trading centers'
                  ]
                })
              }
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.click()}
            >
              <div className="gp-metric-card__header">
                <span className="gp-metric-card__lbl">Ward Developments</span>
                <span className="gp-metric-card__icon gp-metric-card__icon--navy">
                  <GuestIcon name="development" size={16} />
                </span>
              </div>
              <div className="gp-metric-card__val">42</div>
              <div className="gp-metric-card__arrow">
                Explore projects <GuestIcon name="chevronRight" size={12} />
              </div>
            </div>
          </div>

          {/* Quick Buttons: Apply Bursary (dropdown: student, parent), Log in an issue, Apply Institute (Inline) */}
          <div className="gp-quick-actions">
            {/* 1. Apply Bursary with Dropdown */}
            <div className="gp-dropdown-wrap" ref={dropdownRef}>
              <button
                type="button"
                className="gp-btn gp-btn--primary"
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
                      navigate('/register?role=student');
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
                      navigate('/register?role=parent');
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

            {/* 2. Log in an Issue */}
            <button
              type="button"
              className="gp-btn gp-btn--navy"
              onClick={() => setIssueModalOpen(true)}
            >
              <GuestIcon name="alert" size={16} />
              <span>Log in an Issue</span>
            </button>

            {/* 3. Apply Institute */}
            <button
              type="button"
              className="gp-btn gp-btn--outline"
              onClick={() => setInstituteModalOpen(true)}
            >
              <GuestIcon name="school" size={16} />
              <span>Apply Institute</span>
            </button>
          </div>

          {/* Small General Analytics At Bottom Of Hero */}
          <div className="gp-general-analytics">
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
        </div>
      </section>

      {/* 6. BURSARY APPLICATION SECTION (STEPS & SELECTION) */}
      <section id="bursary" className="gp-section gp-section--alt">
        <div className="gp-container">
          <div className="gp-section-header">
            <span className="gp-badge gp-badge--blue">Simple Step-By-Step Guide</span>
            <h2 className="gp-section-title">Bursary Application Process</h2>
            <p className="gp-section-desc">
              Select your academic level or role to view exact requirements and step-by-step guidance.
            </p>
          </div>

          {/* Persona / Study Level Selector */}
          <div className="gp-persona-pills">
            {Object.entries(STEPS_CONFIG).map(([key, config]) => (
              <button
                key={key}
                type="button"
                className={`gp-persona-pill ${selectedPersona === key ? 'is-active' : ''}`}
                onClick={() => setSelectedPersona(key)}
              >
                {config.label}
              </button>
            ))}
          </div>

          {/* Dynamic 4 Steps Display */}
          <div className="gp-steps-grid">
            {STEPS_CONFIG[selectedPersona].steps.map((st) => (
              <div key={st.num} className="gp-step-card">
                <div className="gp-step-card__num">{st.num}</div>
                <h3 className="gp-step-card__title">{st.title}</h3>
                <p className="gp-step-card__desc">{st.desc}</p>
              </div>
            ))}
          </div>

          {/* Checklist Box */}
          <div className="gp-requirements-box">
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gp-navy)', marginBottom: 6 }}>
                Required Documents for {STEPS_CONFIG[selectedPersona].label}:
              </div>
              <div className="gp-requirements-list">
                {STEPS_CONFIG[selectedPersona].requirements.map((req) => (
                  <span key={req} className="gp-req-chip">
                    <GuestIcon name="check" size={13} /> {req}
                  </span>
                ))}
              </div>
            </div>

            {/* Universal Apply Button -> Registers with appropriate role */}
            <Link
              to={selectedPersona === 'parent' ? '/register?role=parent' : '/register?role=student'}
              className="gp-btn gp-btn--primary"
              style={{ borderRadius: 999 }}
            >
              <span>Apply as {selectedPersona === 'parent' ? 'Parent' : 'Student'}</span>
              <GuestIcon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 7. CONSTITUENCY DEVELOPMENT SECTION */}
      <section id="development" className="gp-section gp-section--tint">
        <div className="gp-container">
          <div className="gp-section-header">
            <span className="gp-badge gp-badge--navy">Accountability in Action</span>
            <h2 className="gp-section-title">Constituency Development</h2>
            <p className="gp-section-desc">
              Explore key infrastructure completed across the ward and review school & bursary distribution per village.
            </p>
          </div>

          {/* Place For Pictures: Ward Projects Showcase */}
          <div className="gp-projects-grid">
            {PROJECTS.map((proj) => (
              <div key={proj.title} className="gp-project-card">
                <div style={{ position: 'relative', height: 120, background: '#E2E8F0', overflow: 'hidden' }}>
                  <img
                    src={proj.imageUrl}
                    alt={proj.title}
                    className="gp-project-card__img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    style={{ position: 'relative', zIndex: 1 }}
                  />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94A3B8'
                  }}>
                    <GuestIcon name="development" size={28} />
                  </div>
                </div>
                <div className="gp-project-card__body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="gp-badge gp-badge--blue" style={{ fontSize: '0.68rem', padding: '2px 8px', margin: 0 }}>
                      {proj.status}
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gp-navy)' }}>
                      {proj.budget}
                    </span>
                  </div>
                  <h3 className="gp-project-card__title">{proj.title}</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--gp-text-muted)', margin: 0, flex: 1 }}>
                    {proj.summary}
                  </p>
                  <div className="gp-project-card__meta">
                    <span>📍 {proj.village}</span>
                    <span>{proj.category}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Schools & Bursary Distribution per Village */}
          <div className="gp-villages-card">
            <div className="gp-villages-header">
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--gp-navy)' }}>
                  Schools & Bursary Distribution Per Village
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gp-text-muted)' }}>
                  Village-by-village allocation metrics across Tendeno/Sorget Ward.
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

          {/* Option To Send Complaint / Issue to MCA Office */}
          <div id="issues" className="gp-issue-card">
            <div className="gp-issue-card__info">
              <h3 className="gp-issue-card__title">Have an issue or project needing repair?</h3>
              <p className="gp-issue-card__desc">
                Notice broken water pumps, missing school desks, road blockages, or bursary concerns?
                Send an official complaint directly to the MCA Office for inspection.
              </p>
            </div>
            <button
              type="button"
              className="gp-btn gp-btn--primary"
              style={{ padding: '12px 24px', fontSize: '0.95rem' }}
              onClick={() => setIssueModalOpen(true)}
            >
              <GuestIcon name="alert" size={18} />
              <span>Submit Issue to MCA</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. SOCIAL FORUM SECTION */}
      <section id="social" className="gp-section">
        <div className="gp-container">
          <div className="gp-section-header">
            <span className="gp-badge gp-badge--blue">Stay Connected</span>
            <h2 className="gp-section-title">Community Social Forum</h2>
            <p className="gp-section-desc">
              Join official community groups, follow ward project announcements, and message the MCA office directly.
            </p>
          </div>

          <div className="gp-social-box">
            <p style={{ maxWidth: 560, margin: '0 auto', fontSize: '0.92rem', color: 'var(--gp-text-muted)' }}>
              Get verified public notices, baraza dates, and emergency alerts. Open to all residents of Tendeno / Sorget Ward.
            </p>

            {/* Three Inline Social Buttons */}
            <div className="gp-social-buttons">
              <a
                href="https://chat.whatsapp.com/"
                target="_blank"
                rel="noreferrer"
                className="gp-btn gp-btn-whatsapp"
              >
                <GuestIcon name="whatsapp" size={18} />
                <span>Join WhatsApp Community</span>
              </a>

              <a
                href="https://facebook.com/"
                target="_blank"
                rel="noreferrer"
                className="gp-btn gp-btn-facebook"
              >
                <GuestIcon name="facebook" size={18} />
                <span>Follow Facebook Page</span>
              </a>

              <a
                href="https://wa.me/254700123456"
                target="_blank"
                rel="noreferrer"
                className="gp-btn gp-btn-office"
              >
                <GuestIcon name="message" size={18} />
                <span>Message MCA Office</span>
              </a>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--gp-text-light)', marginTop: 8 }}>
              Official channels monitored daily by the Ward Civic Secretariat.
            </div>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
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
              onClick={() => setLoginModalOpen(true)}
              style={{ background: 'none', border: 'none', color: '#60A5FA', cursor: 'pointer', padding: 0 }}
            >
              Sign In
            </button>
            <span style={{ margin: '0 8px' }}>•</span>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>

      {/* ========================================================
          MODALS
         ======================================================== */}

      {/* A. SIGN IN MODAL (Houses the Login Form directly on the guest page) */}
      {loginModalOpen && (
        <div
          className="gp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-dialog-title"
          onClick={() => setLoginModalOpen(false)}
        >
          <div className="gp-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gp-modal-close"
              onClick={() => setLoginModalOpen(false)}
              aria-label="Close Sign In Dialog"
            >
              <GuestIcon name="close" size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'var(--gp-blue-light)',
                color: 'var(--gp-blue-bright)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8
              }}>
                <GuestIcon name="lock" size={22} />
              </div>
              <h2 id="login-dialog-title" style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: 700, color: 'var(--gp-navy)' }}>
                Sign In to McMca
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--gp-text-muted)' }}>
                Enter your National ID number or registered Email.
              </p>
            </div>

            {loginError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: 16,
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                fontSize: '0.8125rem'
              }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleDirectLogin}>
              <div className="gp-field">
                <label htmlFor={loginIdInputId}>National ID or Email</label>
                <input
                  id={loginIdInputId}
                  type="text"
                  placeholder="e.g. 40112233 or name@mail.com"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  required
                />
              </div>

              <div className="gp-field" style={{ marginBottom: 20 }}>
                <label htmlFor={loginPassInputId}>Password</label>
                <input
                  id={loginPassInputId}
                  type="password"
                  placeholder="Your account password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="gp-btn gp-btn--primary"
                style={{ width: '100%', padding: '12px' }}
                disabled={loginLoading}
              >
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 18, fontSize: '0.8125rem', color: 'var(--gp-text-muted)' }}>
              New applicant or parent?{' '}
              <Link
                to="/register"
                onClick={() => setLoginModalOpen(false)}
                style={{ color: 'var(--gp-blue-bright)', fontWeight: 600 }}
              >
                Create an account
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* B. REPORT AN ISSUE MODAL */}
      {issueModalOpen && (
        <div
          className="gp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="issue-dialog-title"
          onClick={() => setIssueModalOpen(false)}
        >
          <div className="gp-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gp-modal-close"
              onClick={() => setIssueModalOpen(false)}
              aria-label="Close Dialog"
            >
              <GuestIcon name="close" size={18} />
            </button>

            <h2 id="issue-dialog-title" style={{ margin: '0 0 4px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--gp-navy)' }}>
              Log a Ward Issue or Complaint
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '0.82rem', color: 'var(--gp-text-muted)' }}>
              Your submission will be routed directly to the Tendeno / Sorget Ward MCA Civic Desk.
            </p>

            {issueSubmitted ? (
              <div style={{
                textAlign: 'center',
                padding: '24px 12px',
                background: 'var(--gp-green-bg)',
                borderRadius: 12,
                color: 'var(--gp-green)'
              }}>
                <GuestIcon name="check" size={32} />
                <div style={{ fontWeight: 700, fontSize: '1rem', marginTop: 8 }}>Issue Successfully Logged!</div>
                <div style={{ fontSize: '0.8125rem', marginTop: 4, color: 'var(--gp-navy)' }}>
                  Reference: <strong>MCA-{Math.floor(100000 + Math.random() * 900000)}</strong>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gp-text-muted)', marginTop: 8 }}>
                  An officer has been assigned to inspect this report. Thank you for your civic contribution.
                </p>
              </div>
            ) : (
              <form onSubmit={handleIssueSubmit}>
                <div className="gp-field">
                  <label htmlFor={issueNameId}>Your Full Name</label>
                  <input
                    id={issueNameId}
                    type="text"
                    required
                    placeholder="e.g. John Kipkorir"
                    value={issueName}
                    onChange={(e) => setIssueName(e.target.value)}
                  />
                </div>

                <div className="gp-field">
                  <label htmlFor={issuePhoneId}>Phone Number</label>
                  <input
                    id={issuePhoneId}
                    type="tel"
                    required
                    placeholder="e.g. 0712 345 678"
                    value={issuePhone}
                    onChange={(e) => setIssuePhone(e.target.value)}
                  />
                </div>

                <div className="gp-field">
                  <label htmlFor={issueVillageId}>Village / Sub-Location</label>
                  <select
                    id={issueVillageId}
                    value={issueVillage}
                    onChange={(e) => setIssueVillage(e.target.value)}
                  >
                    {VILLAGE_DATA.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                    <option value="Other">Other Area in Ward</option>
                  </select>
                </div>

                <div className="gp-field">
                  <label htmlFor={issueCategoryId}>Issue Category</label>
                  <select
                    id={issueCategoryId}
                    value={issueCategory}
                    onChange={(e) => setIssueCategory(e.target.value)}
                  >
                    <option value="Roads & Infrastructure">Roads & Broken Culverts</option>
                    <option value="Water & Boreholes">Clean Water & Borehole Malfunction</option>
                    <option value="School Facilities">School Facilities & Classrooms</option>
                    <option value="Bursary Inquiry">Bursary Inquiry or Delay</option>
                    <option value="Dispensary & Health">Health Center or Dispensary Support</option>
                    <option value="Security & Solar Lights">Security & Street Lighting</option>
                  </select>
                </div>

                <div className="gp-field" style={{ marginBottom: 18 }}>
                  <label htmlFor={issueDetailsId}>Issue Description</label>
                  <textarea
                    id={issueDetailsId}
                    rows={3}
                    required
                    placeholder="Provide details of the problem and location landmark..."
                    value={issueDetails}
                    onChange={(e) => setIssueDetails(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="gp-btn gp-btn--primary"
                  style={{ width: '100%', padding: '11px' }}
                >
                  Submit Official Report
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* C. APPLY INSTITUTE MODAL */}
      {instituteModalOpen && (
        <div
          className="gp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="inst-dialog-title"
          onClick={() => setInstituteModalOpen(false)}
        >
          <div className="gp-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gp-modal-close"
              onClick={() => setInstituteModalOpen(false)}
              aria-label="Close Dialog"
            >
              <GuestIcon name="close" size={18} />
            </button>

            <span className="gp-badge gp-badge--blue" style={{ marginBottom: 8 }}>
              TVET & Vocational Grant
            </span>
            <h2 id="inst-dialog-title" style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--gp-navy)' }}>
              Vocational & Institute Bursaries
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--gp-text-muted)' }}>
              The MCA office provides specialized 70% to 100% tuition coverage for students attending accredited
              technical colleges and vocational training institutes.
            </p>

            <div style={{ background: 'var(--gp-surface-soft)', padding: 14, borderRadius: 10, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--gp-navy)', marginBottom: 6 }}>
                Eligible Technical Courses:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8125rem', color: 'var(--gp-text-muted)', lineHeight: 1.6 }}>
                <li>Electrical & Solar Installation</li>
                <li>Automotive Mechanics & Fabrication</li>
                <li>Plumbing & Water Systems</li>
                <li>Agriculture & Modern Agribusiness</li>
                <li>Information Technology & Digital Skills</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                className="gp-btn gp-btn--outline"
                style={{ flex: 1 }}
                onClick={() => setInstituteModalOpen(false)}
              >
                Close
              </button>
              <Link
                to="/register?role=student"
                className="gp-btn gp-btn--primary"
                style={{ flex: 1, textAlign: 'center' }}
                onClick={() => setInstituteModalOpen(false)}
              >
                Register Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* D. ANALYTICS CARD DETAIL MODAL */}
      {metricModal && (
        <div
          className="gp-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="metric-dialog-title"
          onClick={() => setMetricModal(null)}
        >
          <div className="gp-modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="gp-modal-close"
              onClick={() => setMetricModal(null)}
              aria-label="Close Metric Dialog"
            >
              <GuestIcon name="close" size={18} />
            </button>

            <span className="gp-badge gp-badge--green" style={{ marginBottom: 8 }}>
              {metricModal.badge}
            </span>
            <h2 id="metric-dialog-title" style={{ margin: '0 0 2px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--gp-navy)' }}>
              {metricModal.title}
            </h2>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gp-blue-bright)', marginBottom: 12 }}>
              {metricModal.value}
            </div>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--gp-text-muted)' }}>
              {metricModal.description}
            </p>

            <div style={{ background: 'var(--gp-surface-soft)', padding: 14, borderRadius: 10, marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--gp-navy)', marginBottom: 6 }}>
                Key Breakdown:
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8125rem', color: 'var(--gp-text-muted)', lineHeight: 1.6 }}>
                {metricModal.details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="gp-btn gp-btn--navy"
                onClick={() => setMetricModal(null)}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default GuestPage;
