import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    graduation: (
      <path d="M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5" />
    ),
    school: (
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z M6 6h10 M6 10h10 M6 14h6" />
    ),
    backpack: (
      <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10Z M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M8 14h8 M10 10h4" />
    ),
    check: (
      <path d="M20 6 9 17l-5-5" />
    ),
    arrowRight: (
      <path d="M5 12h14 M12 5l7 7-7 7" />
    ),
    alert: (
      <path d="M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    ),
    info: (
      <circle cx="12" cy="12" r="10" />
    ),
    help: (
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01" />
    ),
    close: (
      <path d="M18 6 6 18 M6 6l12 12" />
    ),
    sparkles: (
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
    ),
    fileCheck: (
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M9 15l2 2 4-4" />
    ),
    card: (
      <rect width="20" height="14" x="2" y="5" rx="2" />
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
      {name === 'card' && <path d="M2 10h20" />}
    </svg>
  );
}

export default function BursaryProcessGuide() {
  // role: 'student' | 'parent' | null
  const [selectedRole, setSelectedRole] = useState(null);
  // studentLevel: 'tertiary' | 'secondary' | 'primary'
  const [studentLevel, setStudentLevel] = useState('tertiary');
  // Modal for "I don't have an ID"
  const [showNoIdModal, setShowNoIdModal] = useState(false);

  const navigate = useNavigate();

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
    <section id="bursary" className="gp-section-card gp-section-card--bursary bpg-section" aria-labelledby="bpg-title">
      {/* 1. SECTION HEADER */}
      <div className="bpg-header">
        <span className="bpg-eyebrow">
          <BpgIcon name="sparkles" size={14} className="bpg-sparkle-icon" />
          Simple Step-By-Step Guide
        </span>
        <h2 id="bpg-title" className="bpg-title">
          Bursary Application Process
        </h2>
        <p className="bpg-subtitle">
          Select whether you are applying as a Student or as a Parent/Guardian to view the exact step-by-step guidance.
        </p>
      </div>

      {/* 2. TOP-LEVEL ROLE SEGMENTED SELECTOR */}
      <div className="bpg-role-selector-wrap" role="group" aria-label="Role selector">
        <div className="bpg-role-segment">
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`bpg-role-btn ${selectedRole === 'student' ? 'is-active' : ''}`}
            aria-pressed={selectedRole === 'student'}
          >
            <div className="bpg-role-btn-icon">
              <BpgIcon name="user" size={18} />
            </div>
            <div className="bpg-role-btn-text">
              <span className="bpg-role-title">I am an Applicant / Student</span>
              <span className="bpg-role-hint">Applying for myself (18+ or Tertiary)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('parent')}
            className={`bpg-role-btn ${selectedRole === 'parent' ? 'is-active' : ''}`}
            aria-pressed={selectedRole === 'parent'}
          >
            <div className="bpg-role-btn-icon">
              <BpgIcon name="users" size={18} />
            </div>
            <div className="bpg-role-btn-text">
              <span className="bpg-role-title">I am a Parent / Guardian</span>
              <span className="bpg-role-hint">Managing children (Primary, High School, College)</span>
            </div>
          </button>
        </div>
      </div>

      {/* 3. EMPTY / PROMPT STATE (When selectedRole === null) */}
      {!selectedRole && (
        <div className="bpg-prompt-card bpg-glass-clay" role="region" aria-label="Role selection prompt">
          <div className="bpg-prompt-glow" aria-hidden="true" />
          <div className="bpg-prompt-badge">Select an Option Above</div>
          <h3 className="bpg-prompt-heading">Personalized Guidance Based On Your Application Type</h3>
          <p className="bpg-prompt-text">
            To view the exact registration requirements, document checklist, and submission steps, please choose whether
            you are an independent student or a parent/guardian managing family applications.
          </p>

          <div className="bpg-prompt-grid">
            <div
              className="bpg-prompt-tile"
              tabIndex={0}
              role="button"
              onClick={() => setSelectedRole('student')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedRole('student');
                }
              }}
            >
              <div className="bpg-prompt-tile-icon student-glow">
                <BpgIcon name="graduation" size={24} />
              </div>
              <div className="bpg-prompt-tile-info">
                <div className="bpg-prompt-tile-title">Students &amp; Tertiary Applicants</div>
                <div className="bpg-prompt-tile-desc">
                  For University, College, and TVET learners with a National ID. Minors in Secondary or Primary will find guidance on parental registration.
                </div>
              </div>
              <span className="bpg-prompt-tile-cta">
                View Student Steps <BpgIcon name="arrowRight" size={14} />
              </span>
            </div>

            <div
              className="bpg-prompt-tile"
              tabIndex={0}
              role="button"
              onClick={() => setSelectedRole('parent')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedRole('parent');
                }
              }}
            >
              <div className="bpg-prompt-tile-icon parent-glow">
                <BpgIcon name="users" size={24} />
              </div>
              <div className="bpg-prompt-tile-info">
                <div className="bpg-prompt-tile-title">Parents &amp; Legal Guardians</div>
                <div className="bpg-prompt-tile-desc">
                  Unified household portal to register, add multiple dependents across Primary, Secondary, or College, and submit bursaries for each child.
                </div>
              </div>
              <span className="bpg-prompt-tile-cta">
                View Parent Steps <BpgIcon name="arrowRight" size={14} />
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. STUDENT FLOW (When selectedRole === 'student') */}
      {selectedRole === 'student' && (
        <div className="bpg-flow-container">
          {/* Sub-Tabs Selector */}
          <div className="bpg-subtabs-wrap" role="tablist" aria-label="Academic level selector">
            {[
              { id: 'tertiary', label: 'Tertiary (University / TVET / College)', icon: 'graduation' },
              { id: 'secondary', label: 'Secondary / High School', icon: 'school' },
              { id: 'primary', label: 'Primary School', icon: 'backpack' }
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={studentLevel === tab.id}
                type="button"
                onClick={() => setStudentLevel(tab.id)}
                className={`bpg-subtab-btn ${studentLevel === tab.id ? 'is-active' : ''}`}
              >
                <BpgIcon name={tab.icon} size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* ================= OPTION A: TERTIARY ================= */}
          {studentLevel === 'tertiary' && (
            <div className="bpg-content-card bpg-glass-clay" role="tabpanel">
              {/* Header Meta */}
              <div className="bpg-card-header">
                <div>
                  <span className="bpg-pill bpg-pill--emerald">
                    Self-Service (Independent / 18+)
                  </span>
                  <h3 className="bpg-card-title">University, TVET &amp; College Student Pathway</h3>
                  <p className="bpg-card-desc">
                    For independent tertiary students applying with their own National ID and institution admission records.
                  </p>
                </div>

                {/* ID Notice with Explanation Link */}
                <div className="bpg-id-helper-box">
                  <div className="bpg-id-helper-status">
                    <BpgIcon name="card" size={16} />
                    <span>Requires a National ID (18+)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNoIdModal(true)}
                    className="bpg-no-id-link"
                  >
                    I don't have an ID
                    <BpgIcon name="help" size={13} />
                  </button>
                </div>
              </div>

              {/* ONLINE APPLICATION / NO PRINCIPAL WRITE-OFF CLARIFICATION */}
              <div className="bpg-online-notice-card">
                <div className="bpg-online-notice-icon">
                  <BpgIcon name="fileCheck" size={20} />
                </div>
                <div className="bpg-online-notice-content">
                  <div className="bpg-online-notice-title">
                    100% Online Digital Application — No Physical Principal Write-Off Required
                  </div>
                  <div className="bpg-online-notice-text">
                    You do <strong>not</strong> need to take a physical form to your University Dean, Principal, or Headteacher for a manual signature or official rubber stamp. Simply obtain your certified fee structure / statement and admission letter, and upload them directly into the online portal.
                  </div>
                </div>
              </div>

              {/* 5 STEPS GRID */}
              <div className="bpg-steps-grid bpg-steps-grid--5">
                <div className="bpg-step-item">
                  <div className="bpg-step-number">01</div>
                  <h4 className="bpg-step-title">Register with National ID</h4>
                  <p className="bpg-step-desc">
                    Sign up with your personal National ID, active mobile phone number, and student email. (Must be 18+).
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">02</div>
                  <h4 className="bpg-step-title">Upload &amp; Verify Documents</h4>
                  <p className="bpg-step-desc">
                    Attach your National ID (front &amp; back), official Institution Admission Letter, and the current validated Fee Statement online.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">03</div>
                  <h4 className="bpg-step-title">Fill Socio-Economic Details</h4>
                  <p className="bpg-step-desc">
                    Complete the step wizard detailing your personal profile, institution course details, family background, and bank disbursement details.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">04</div>
                  <h4 className="bpg-step-title">Chief Verification &amp; Committee</h4>
                  <p className="bpg-step-desc">
                    Your dossier routes automatically to your Ward Area Chief for background check, followed by MCA bursary committee allocation.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">05</div>
                  <h4 className="bpg-step-title">Direct Institution Disbursement</h4>
                  <p className="bpg-step-desc">
                    Approved funds are disbursed via official electronic payment schedules straight to your University/College account.
                  </p>
                </div>
              </div>

              {/* CHECKLIST & CTA BOX */}
              <div className="bpg-action-footer">
                <div className="bpg-checklist-wrap">
                  <div className="bpg-checklist-title">
                    <BpgIcon name="check" size={15} />
                    Required Documents for Tertiary Application:
                  </div>
                  <div className="bpg-chips-row">
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Valid National ID Card (Front &amp; Back)
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> College/University Admission Letter
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Current Certified Fee Statement (No manual stamp needed)
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Area Chief Letter / Recommendation
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/register?role=student&level=tertiary')}
                  className="bpg-cta-btn bpg-cta-btn--primary"
                >
                  <span>Register as Tertiary Student</span>
                  <BpgIcon name="arrowRight" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= OPTION B: SECONDARY ================= */}
          {studentLevel === 'secondary' && (
            <div className="bpg-content-card bpg-glass-clay" role="tabpanel">
              {/* Header Meta */}
              <div className="bpg-card-header">
                <div>
                  <span className="bpg-pill bpg-pill--amber">
                    Custody Requirement (AccountGate Notice)
                  </span>
                  <h3 className="bpg-card-title">Secondary &amp; High School Process</h3>
                  <p className="bpg-card-desc">
                    High school students are legal minors and are processed strictly under parental custody.
                  </p>
                </div>
              </div>

              {/* IMPORTANT NOTICE BANNER (Amber/Warning Glass) */}
              <div className="bpg-warning-banner">
                <div className="bpg-warning-icon">
                  <BpgIcon name="alert" size={20} />
                </div>
                <div className="bpg-warning-body">
                  <div className="bpg-warning-title">Minors Cannot Register Directly</div>
                  <p className="bpg-warning-text">
                    Due to statutory and child data protection requirements, high school bursary accounts are managed exclusively under parental custody. Your parent or legal guardian must create an account on the Parent Portal to submit your bursary application.
                  </p>
                </div>
              </div>

              {/* NO PRINCIPAL WRITE-OFF NOTICE */}
              <div className="bpg-online-notice-card">
                <div className="bpg-online-notice-icon">
                  <BpgIcon name="fileCheck" size={20} />
                </div>
                <div className="bpg-online-notice-content">
                  <div className="bpg-online-notice-title">
                    100% Online Application — No Physical Principal Write-Off Needed
                  </div>
                  <div className="bpg-online-notice-text">
                    There is <strong>no paper form</strong> for the school principal or headteacher to sign or stamp. The parent simply enters your NEMIS/UPI number and uploads the official secondary school fee structure and report card digitally.
                  </div>
                </div>
              </div>

              {/* 4 STEPS GRID */}
              <div className="bpg-steps-grid bpg-steps-grid--4">
                <div className="bpg-step-item">
                  <div className="bpg-step-number">01</div>
                  <h4 className="bpg-step-title">Parent Creates Account</h4>
                  <p className="bpg-step-desc">
                    Your parent or guardian signs up at the portal using their National ID and phone number.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">02</div>
                  <h4 className="bpg-step-title">Student Added to Household</h4>
                  <p className="bpg-step-desc">
                    The parent enters your UPI/NEMIS number, Birth Certificate number, and High School admission details.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">03</div>
                  <h4 className="bpg-step-title">Document Upload by Parent</h4>
                  <p className="bpg-step-desc">
                    Parent uploads the student's Birth Certificate/UPI, secondary school fees structure, and report card/admission form online.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">04</div>
                  <h4 className="bpg-step-title">Ward Review &amp; School Disbursement</h4>
                  <p className="bpg-step-desc">
                    Vetted by the Area Chief and approved by the MCA bursary committee for direct payment to the secondary school account.
                  </p>
                </div>
              </div>

              {/* CHECKLIST & CTA BOX */}
              <div className="bpg-action-footer">
                <div className="bpg-checklist-wrap">
                  <div className="bpg-checklist-title">
                    <BpgIcon name="check" size={15} />
                    Required Documents for Secondary School:
                  </div>
                  <div className="bpg-chips-row">
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Student Birth Certificate or NEMIS/UPI details
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> School Admission Letter or Student Report Form
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Current Term Fee Statement / Balance Slip
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Parent's National ID
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/register?role=parent')}
                  className="bpg-cta-btn bpg-cta-btn--primary"
                >
                  <span>Parent Portal Registration</span>
                  <BpgIcon name="arrowRight" size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ================= OPTION C: PRIMARY ================= */}
          {studentLevel === 'primary' && (
            <div className="bpg-content-card bpg-glass-clay" role="tabpanel">
              {/* Header Meta */}
              <div className="bpg-card-header">
                <div>
                  <span className="bpg-pill bpg-pill--amber">
                    Custody Requirement (Parent Managed)
                  </span>
                  <h3 className="bpg-card-title">Primary School Learner Pathway</h3>
                  <p className="bpg-card-desc">
                    Primary school learners are registered and processed exclusively through their Parent/Guardian profile.
                  </p>
                </div>
              </div>

              {/* IMPORTANT NOTICE BANNER (Amber/Warning Glass) */}
              <div className="bpg-warning-banner">
                <div className="bpg-warning-icon">
                  <BpgIcon name="alert" size={20} />
                </div>
                <div className="bpg-warning-body">
                  <div className="bpg-warning-title">Parental Custody Required</div>
                  <p className="bpg-warning-text">
                    Primary school learners cannot register directly. All registration, vulnerability assessments, and bursary submissions must be carried out through the registered Parent/Guardian portal.
                  </p>
                </div>
              </div>

              {/* NO HEADTEACHER WRITE-OFF NOTICE */}
              <div className="bpg-online-notice-card">
                <div className="bpg-online-notice-icon">
                  <BpgIcon name="fileCheck" size={20} />
                </div>
                <div className="bpg-online-notice-content">
                  <div className="bpg-online-notice-title">
                    100% Online Submission — No Manual Headteacher Clearance Form
                  </div>
                  <div className="bpg-online-notice-text">
                    This is an online digital system. You do <strong>not</strong> need to obtain a physical paper sign-off from the headteacher. Simply upload the learner's school enrollment letter or assessment slip through the Parent Dashboard.
                  </div>
                </div>
              </div>

              {/* 4 STEPS GRID */}
              <div className="bpg-steps-grid bpg-steps-grid--4">
                <div className="bpg-step-item">
                  <div className="bpg-step-number">01</div>
                  <h4 className="bpg-step-title">Guardian Portal Registration</h4>
                  <p className="bpg-step-desc">
                    Parent registers with their National ID and establishes their household profile.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">02</div>
                  <h4 className="bpg-step-title">Link Primary School Learner</h4>
                  <p className="bpg-step-desc">
                    The guardian adds the child using their Birth Certificate number and primary school assessment details.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">03</div>
                  <h4 className="bpg-step-title">Submit Need Assessment &amp; Fees</h4>
                  <p className="bpg-step-desc">
                    Upload the school verification letter and fee requirements through the Parent Dashboard online.
                  </p>
                </div>

                <div className="bpg-step-item">
                  <div className="bpg-step-number">04</div>
                  <h4 className="bpg-step-title">Vetting &amp; Allocation</h4>
                  <p className="bpg-step-desc">
                    Chief reviews family vulnerability metrics, and the bursary committee clears the allocation.
                  </p>
                </div>
              </div>

              {/* CHECKLIST & CTA BOX */}
              <div className="bpg-action-footer">
                <div className="bpg-checklist-wrap">
                  <div className="bpg-checklist-title">
                    <BpgIcon name="check" size={15} />
                    Required Documents for Primary School:
                  </div>
                  <div className="bpg-chips-row">
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Child Birth Certificate or Assessment Number
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Primary School Enrollment / Verification Letter
                    </span>
                    <span className="bpg-chip">
                      <BpgIcon name="check" size={12} /> Parent/Guardian National ID
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/register?role=parent')}
                  className="bpg-cta-btn bpg-cta-btn--primary"
                >
                  <span>Register as Parent / Guardian</span>
                  <BpgIcon name="arrowRight" size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PARENT / GUARDIAN FLOW (When selectedRole === 'parent') */}
      {selectedRole === 'parent' && (
        <div className="bpg-flow-container">
          <div className="bpg-content-card bpg-glass-clay">
            {/* Header Meta */}
            <div className="bpg-card-header">
              <div>
                <span className="bpg-pill bpg-pill--blue">
                  Household Management Suite
                </span>
                <h3 className="bpg-card-title">Parent &amp; Guardian Family Portal</h3>
                <p className="bpg-card-desc">
                  Manage bursary applications for all your children across Primary, Secondary, or College from one consolidated dashboard.
                </p>
              </div>

              {/* Requirements Note */}
              <div className="bpg-id-helper-box">
                <div className="bpg-id-helper-status">
                  <BpgIcon name="card" size={16} />
                  <span>Parent National ID Acts as Master Key</span>
                </div>
                <span className="bpg-subtle-hint">
                  Children's Birth Cert (or ID if student has one)
                </span>
              </div>
            </div>

            {/* ONLINE APPLICATION / NO HEADTEACHER WRITE-OFF CLARIFICATION */}
            <div className="bpg-online-notice-card">
              <div className="bpg-online-notice-icon">
                <BpgIcon name="fileCheck" size={20} />
              </div>
              <div className="bpg-online-notice-content">
                <div className="bpg-online-notice-title">
                  100% Online Paperless System — No School Principal / Headteacher Sign-Off Form
                </div>
                <div className="bpg-online-notice-text">
                  You do <strong>not</strong> need to visit headteachers or principals for a manual stamp or write-off letter. All student details, certified fee structures, and birth certificates are submitted digitally through your family dashboard.
                </div>
              </div>
            </div>

            {/* 5 STEPS GRID */}
            <div className="bpg-steps-grid bpg-steps-grid--5">
              <div className="bpg-step-item">
                <div className="bpg-step-number">01</div>
                <h4 className="bpg-step-title">Parent Self-Registration</h4>
                <p className="bpg-step-desc">
                  Create your account using your National ID, phone number, and location details. Your National ID acts as the household master key.
                </p>
              </div>

              <div className="bpg-step-item">
                <div className="bpg-step-number">02</div>
                <h4 className="bpg-step-title">Verify Identity &amp; Profile</h4>
                <p className="bpg-step-desc">
                  Verify your profile and Ward residency credentials to activate your full family management dashboard.
                </p>
              </div>

              <div className="bpg-step-item">
                <div className="bpg-step-number">03</div>
                <h4 className="bpg-step-title">Add Children to Household</h4>
                <p className="bpg-step-desc">
                  From your dashboard, click <strong>"Add Child"</strong>. Select <strong>Custody (CUS)</strong> for Primary/Secondary minors, or <strong>Delegated (DEL)</strong> for College youths.
                </p>
              </div>

              <div className="bpg-step-item">
                <div className="bpg-step-number">04</div>
                <h4 className="bpg-step-title">Verify Documents for Each Child</h4>
                <p className="bpg-step-desc">
                  Upload each child's Birth Certificate (or student ID if they have one) and official school fee statements online.
                </p>
              </div>

              <div className="bpg-step-item">
                <div className="bpg-step-number">05</div>
                <h4 className="bpg-step-title">Apply for Each Child &amp; Track</h4>
                <p className="bpg-step-desc">
                  Complete the bursary application form for each child individually, track Chief vetting in real time, and handle approvals.
                </p>
              </div>
            </div>

            {/* CHECKLIST & CTA BOX */}
            <div className="bpg-action-footer">
              <div className="bpg-checklist-wrap">
                <div className="bpg-checklist-title">
                  <BpgIcon name="check" size={15} />
                  Required Documents for Parent / Guardian:
                </div>
                <div className="bpg-chips-row">
                  <span className="bpg-chip">
                    <BpgIcon name="check" size={12} /> Parent / Guardian National ID (Master Key)
                  </span>
                  <span className="bpg-chip">
                    <BpgIcon name="check" size={12} /> Children's Birth Certificates / Student IDs (if available)
                  </span>
                  <span className="bpg-chip">
                    <BpgIcon name="check" size={12} /> Official Fee Statements for each respective school/institution
                  </span>
                  <span className="bpg-chip">
                    <BpgIcon name="check" size={12} /> Chief's Family Verification / Vulnerability Letter
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/register?role=parent')}
                className="bpg-cta-btn bpg-cta-btn--primary"
              >
                <span>Create Parent Account</span>
                <BpgIcon name="arrowRight" size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. "I DON'T HAVE AN ID" MODAL */}
      {showNoIdModal && (
        <div
          className="bpg-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="no-id-modal-title"
          onClick={() => setShowNoIdModal(false)}
        >
          <div
            className="bpg-modal-container bpg-glass-clay"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bpg-modal-header">
              <div className="bpg-modal-badge">
                <BpgIcon name="info" size={14} />
                Student Without National ID
              </div>
              <button
                type="button"
                onClick={() => setShowNoIdModal(false)}
                className="bpg-modal-close-btn"
                aria-label="Close modal"
              >
                <BpgIcon name="close" size={18} />
              </button>
            </div>

            <h3 id="no-id-modal-title" className="bpg-modal-title">
              How to Apply if You Don't Have a National ID
            </h3>

            <div className="bpg-modal-body">
              <p className="bpg-modal-intro">
                Under Kenyan legal requirements and civil registration protocols, self-service independent student registration is strictly reserved for adult citizens holding a valid National ID (18+).
              </p>

              <div className="bpg-modal-solution-box">
                <div className="bpg-modal-solution-title">
                  <BpgIcon name="users" size={18} />
                  Apply Through Your Parent or Legal Guardian
                </div>
                <p className="bpg-modal-solution-text">
                  If you do not have a National ID yet, or are under 18 years old, you do <strong>not</strong> need to worry. You are fully eligible for bursary assistance through your Parent/Guardian's account:
                </p>
                <ol className="bpg-modal-steps-list">
                  <li>
                    <strong>Parent Registers:</strong> Your parent or legal guardian signs up on the McMca portal with their National ID card.
                  </li>
                  <li>
                    <strong>Adds You as a Dependent:</strong> In their dashboard, they click <em>"Add Child"</em> using your Birth Certificate number or Student UPI/NEMIS.
                  </li>
                  <li>
                    <strong>Submits Your Bursary:</strong> They complete your school details, upload your certified fee structure, and submit the application for Ward vetting.
                  </li>
                </ol>
              </div>

              <div className="bpg-modal-tip">
                <BpgIcon name="sparkles" size={16} />
                <span>
                  <strong>Tip:</strong> If you are over 18 and have applied for your National ID card, you can also use your certified ID Waiting Card (with official serial number) or ask your parent to add you under Delegated (DEL) access.
                </span>
              </div>
            </div>

            <div className="bpg-modal-footer">
              <button
                type="button"
                onClick={() => {
                  setShowNoIdModal(false);
                  setSelectedRole('parent');
                }}
                className="bpg-modal-action-btn bpg-modal-action-btn--primary"
              >
                <span>Switch to Parent Application Guide</span>
                <BpgIcon name="arrowRight" size={15} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowNoIdModal(false);
                  navigate('/register?role=parent');
                }}
                className="bpg-modal-action-btn bpg-modal-action-btn--secondary"
              >
                <span>Go to Parent Registration</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
