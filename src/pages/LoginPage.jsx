import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { assertPortalLoginAllowed } from '../lib/accountQueries';
import { useAuth } from '../context/AuthContext';
import {
  ACCOUNT_ROLE,
  DOCUMENT_KIND,
  WIZARD_FLOW,
  joinFullName
} from '../lib/accountAllocation';
import { getWizardSteps } from '../lib/accountAllocation/wizardFlows';
import {
  assignUserRole,
  createIndependentStudentAccount,
  createParentAccount,
  createNewUserAccount,
  persistIdPair,
  registerAuthUser,
  savePendingParentFromStudent,
  saveWizardStep
} from '../lib/accountQueries';
import { useWizardSession } from '../hooks/useWizardSession';
import { WizardShell } from '../components/account/WizardShell.jsx';
import { PersonalInfoFields } from '../components/account/PersonalInfoFields.jsx';
import { ParentInfoFields } from '../components/account/ParentInfoFields.jsx';
import { IdentityScanStep } from '../components/account/IdentityScanStep.jsx';

const DRAFT_OWNERS = {
  [ACCOUNT_ROLE.STUDENT]: 'anon-student',
  [ACCOUNT_ROLE.PARENT]: 'anon-parent'
};

function validateInstantField(name, value, allValues, currentRole) {
  switch (name) {
    case 'nationalId': {
      const clean = String(value || '').replace(/\D/g, '');
      if (!clean) return 'National ID number is required.';
      if (clean.length < 7 || clean.length > 8) return 'National ID must be 7 or 8 digits.';
      return '';
    }
    case 'firstName': {
      if (!String(value || '').trim()) return 'First name is required.';
      return '';
    }
    case 'middleName': {
      return '';
    }
    case 'lastName': {
      if (!String(value || '').trim()) return 'Last name is required.';
      return '';
    }
    case 'gender': {
      if (!value) return 'Please select a gender.';
      return '';
    }
    case 'dateOfBirth': {
      if (!value) return 'Date of birth is required.';
      const date = new Date(value);
      if (isNaN(date.getTime())) return 'Enter a valid date of birth.';
      const today = new Date();
      if (date > today) return 'Date of birth cannot be in the future.';
      let age = today.getFullYear() - date.getFullYear();
      const m = today.getMonth() - date.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--;
      if (age < 18) return 'Must be 18 years+';
      return '';
    }
    case 'phone': {
      const clean = String(value || '').trim().replace(/\s+/g, '');
      if (!clean) return 'Phone number is required.';
      if (!/^(?:\+254|0)(?:7|1)\d{8}$/.test(clean)) {
        return 'Enter a valid phone number (e.g. 07XX XXX XXX).';
      }
      return '';
    }
    case 'email': {
      const clean = String(value || '').trim();
      if (!clean) return 'Email is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
        return 'Enter a valid email address.';
      }
      return '';
    }
    case 'password': {
      const str = String(value || '');
      if (!str) return 'Password is required.';
      if (str.length < 6) return 'Password must be at least 6 characters.';
      return '';
    }
    case 'confirmPassword': {
      const str = String(value || '');
      if (!str) return 'Confirm password is required.';
      if (allValues?.password && str !== allValues.password) return 'Passwords do not match.';
      return '';
    }
    case 'parentStatus': {
      if (currentRole === ACCOUNT_ROLE.STUDENT && !value) {
        return "Please select parents' status.";
      }
      return '';
    }
    default:
      return '';
  }
}

export function LoginPage({ initialTab = 'login' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshRole } = useAuth();

  const isRegisterRoute = location.pathname.includes('/register') || searchParams.get('tab') === 'register' || initialTab === 'register';
  const [activeTab, setActiveTab] = useState(isRegisterRoute ? 'register' : 'login');

  // Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register state
  const paramRole = searchParams.get('role');
  const initialRole = paramRole === 'parent'
    ? ACCOUNT_ROLE.PARENT
    : paramRole === 'student'
      ? ACCOUNT_ROLE.STUDENT
      : null;
  const [role, setRole] = useState(initialRole);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);
  const [finished, setFinished] = useState(false);

  // Form error tracking & popup modal state
  const [formErrors, setFormErrors] = useState({});
  const [popupModal, setPopupModal] = useState(null); // { type: 'error' | 'success', title: string, message: string }

  // Sync tab with URL if needed
  useEffect(() => {
    if (paramRole) {
      setActiveTab('register');
      setRole(paramRole === 'parent' ? ACCOUNT_ROLE.PARENT : ACCOUNT_ROLE.STUDENT);
    }
  }, [paramRole]);

  const flowId = role === ACCOUNT_ROLE.PARENT
    ? WIZARD_FLOW.REGISTER_PARENT
    : WIZARD_FLOW.REGISTER_INDEPENDENT;
  const steps = useMemo(() => (role ? getWizardSteps(flowId) : []), [role, flowId]);
  const cacheOwnerKey = created?.profileId
    ? `${role}:${created.profileId}`
    : DRAFT_OWNERS[role] || 'anon';

  const wizard = useWizardSession({
    flowId,
    ownerType: role || 'anon',
    ownerId: created?.profileId || created?.userId,
    authUserId: created?.userId,
    steps,
    cacheOwnerKey,
    enabled: Boolean(role) && !finished && activeTab === 'register'
  });

  const handleFieldChange = (name, value) => {
    wizard.updateField(name, value);
    // Suppress alerts while input is actively going on; clear any stale error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleFieldBlur = (name, value) => {
    const updatedValues = { ...wizard.values, [name]: value ?? wizard.values[name] };
    const err = validateInstantField(name, updatedValues[name], updatedValues, role);
    setFormErrors((prev) => {
      const next = { ...prev };
      if (err) {
        next[name] = err;
      } else {
        delete next[name];
      }
      if (name === 'password' && updatedValues.confirmPassword) {
        const confirmErr = validateInstantField('confirmPassword', updatedValues.confirmPassword, updatedValues, role);
        if (confirmErr) next.confirmPassword = confirmErr;
        else delete next.confirmPassword;
      }
      return next;
    });
  };

  async function handleLogin(e) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      if (!supabase) {
        throw new Error('Database connection is not configured.');
      }
      let loginEmail = identifier.trim();
      const isEmail = loginEmail.includes('@');
      if (!isEmail) {
        const cleanId = loginEmail.replace(/\D/g, '');
        try {
          const map = JSON.parse(localStorage.getItem('mcmca_id_map') || '{}');
          if (map[cleanId]) {
            loginEmail = map[cleanId];
          }
        } catch {}

        if (!loginEmail.includes('@')) {
          try {
            const { data: student } = await supabase
              .from('student_profiles')
              .select('email')
              .eq('national_id', cleanId)
              .maybeSingle();
            if (student?.email) {
              loginEmail = student.email;
            } else {
              const { data: parent } = await supabase
                .from('parent_profiles')
                .select('email')
                .eq('national_id', cleanId)
                .maybeSingle();
              if (parent?.email) {
                loginEmail = parent.email;
              }
            }
          } catch {}
        }
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: password
      });
      if (signInError) throw signInError;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error('No user found');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      const userRole = roleData?.role || user.user_metadata?.role;
      if (!userRole) {
        throw new Error('No role associated with this account');
      }

      await assertPortalLoginAllowed(user.id, userRole);

      if (userRole === 'student') navigate('/student/dashboard');
      else if (userRole === 'parent') navigate('/parent/dashboard');
      else if (userRole === 'chief') navigate('/chief/dashboard');
      else if (userRole === 'mca') navigate('/mca/dashboard');
      else if (userRole === 'helpdesk' || userRole === 'help_desk') navigate('/helpdesk/dashboard');
      else throw new Error('Invalid user role');
    } catch (err) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handlePersonalStep() {
    const errors = {};
    const fieldList = ['nationalId', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'phone', 'email', 'password', 'confirmPassword'];
    if (role === ACCOUNT_ROLE.STUDENT) fieldList.push('parentStatus');

    for (const field of fieldList) {
      const err = validateInstantField(field, wizard.values[field], wizard.values, role);
      if (err) errors[field] = err;
    }

    if (!wizard.files.idPhoto) {
      errors.idPhoto = 'Front of ID photo is required.';
    }
    if (!wizard.files.idBack) {
      errors.idBack = 'Back of ID photo is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstField = Object.keys(errors)[0];
      const errMsg = errors[firstField];

      setPopupModal({
        type: 'error',
        title: 'Registration Error',
        message: errMsg
      });

      setTimeout(() => {
        const fieldId = firstField === 'idPhoto' || firstField === 'idBack' ? firstField : `reg-${firstField}`;
        const target = document.getElementById(fieldId) || document.querySelector(`[name="${firstField}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof target.focus === 'function') target.focus();
        }
      }, 100);
      return;
    }

    setSubmitting(true);
    setFormErrors({});
    wizard.setError('');

    try {
      const emailVal = String(wizard.values.email || '').trim();
      const pwdVal = String(wizard.values.password || '');

      // 1. Complete atomic registration: create auth user, UUID, user_roles, and profile (all or nothing)
      const account = await createNewUserAccount({
        role,
        email: emailVal,
        password: pwdVal,
        fields: wizard.values
      });

      // 2. Establish authenticated session on frontend
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: emailVal,
        password: pwdVal
      });
      if (signInErr) {
        console.warn('Sign-in after register warning:', signInErr);
      }

      // 3. Persist ID documents front & back under authenticated session
      try {
        await persistIdPair({
          authUserId: account.user.id,
          ownerType: role,
          ownerId: account.profile.id,
          studentProfileId: role === ACCOUNT_ROLE.STUDENT ? account.profile.id : null,
          expected: {
            fullName: joinFullName(wizard.values),
            nationalId: wizard.values.nationalId
          },
          front: wizard.files.idPhoto,
          frontResult: wizard.verifications?.idPhoto,
          back: wizard.files.idBack,
          backResult: wizard.verifications?.idBack,
          frontKind: DOCUMENT_KIND.ID_FRONT,
          backKind: DOCUMENT_KIND.ID_BACK
        });
      } catch (docErr) {
        console.warn('ID documents persistence notice:', docErr);
      }

      const payload = {
        firstName: wizard.values.firstName,
        middleName: wizard.values.middleName || '',
        lastName: wizard.values.lastName,
        gender: wizard.values.gender,
        dateOfBirth: wizard.values.dateOfBirth,
        phone: wizard.values.phone,
        nationalId: wizard.values.nationalId,
        email: emailVal
      };
      if (role === ACCOUNT_ROLE.STUDENT) {
        payload.parentStatus = wizard.values.parentStatus || '';
      }

      await saveWizardStep({
        authUserId: account.user.id,
        ownerType: role,
        ownerId: account.profile.id,
        flowId: role === ACCOUNT_ROLE.STUDENT ? WIZARD_FLOW.DASHBOARD_STUDENT : WIZARD_FLOW.DASHBOARD_PARENT,
        stepKey: 'personal_information',
        payload,
        completed: true
      });

      try {
        const idMap = JSON.parse(localStorage.getItem('mcmca_id_map') || '{}');
        const cleanIdNum = String(wizard.values.nationalId || '').trim().replace(/\D/g, '');
        if (cleanIdNum) {
          idMap[cleanIdNum] = emailVal;
          localStorage.setItem('mcmca_id_map', JSON.stringify(idMap));
        }
      } catch {}

      await wizard.completeStep('personal_information', payload, ['idPhoto', 'idBack']);
      await supabase.auth.signOut();

      // Show success popup where user naturally sees it
      setPopupModal({
        type: 'success',
        title: 'Account Created Successfully!',
        message: `Your ${role === ACCOUNT_ROLE.STUDENT ? 'Student' : 'Parent'} registration has been written to the database. Sign in using your National ID number or email to access your dashboard.`
      });
    } catch (err) {
      setPopupModal({
        type: 'error',
        title: 'Registration Failed',
        message: err.message || 'Could not complete registration. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  }

  const fieldStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: 14,
    borderRadius: 10,
    border: '1.5px solid rgba(59, 130, 246, 0.35)',
    background: '#091024',
    color: '#F8FAFC',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#070D1E',
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(37, 99, 235, 0.22) 0%, transparent 60%), radial-gradient(circle at 10% 90%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
      fontFamily: 'var(--font-body, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      padding: '32px 16px'
    }}>
      {/* Universal Success & Failed State Popup */}
      {popupModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 13, 30, 0.88)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          role="dialog"
          aria-modal="true"
        >
          <div
            style={{
              background: '#0F172A',
              borderRadius: 20,
              maxWidth: 440,
              width: '100%',
              padding: '28px 24px',
              border: popupModal.type === 'error' ? '1.5px solid rgba(239, 68, 68, 0.45)' : '1.5px solid rgba(16, 185, 129, 0.45)',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
              textAlign: 'center',
              color: '#F8FAFC',
              fontFamily: 'inherit'
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: popupModal.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: popupModal.type === 'error' ? '#EF4444' : '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}
            >
              {popupModal.type === 'error' ? (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>

            <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#FFFFFF' }}>
              {popupModal.title}
            </h3>

            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94A3B8', lineHeight: 1.55 }}>
              {popupModal.message}
            </p>

            {popupModal.type === 'success' ? (
              <button
                type="button"
                onClick={() => {
                  const targetId = wizard.values.nationalId || wizard.values.email || '';
                  setPopupModal(null);
                  setRole(null);
                  setFinished(false);
                  setActiveTab('login');
                  setIdentifier(targetId);
                  setPassword('');
                }}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                Sign In Now
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPopupModal(null)}
                style={{
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                }}
              >
                Dismiss & Fix Errors
              </button>
            )}
          </div>
        </div>
      )}

      <div style={{
        width: '100%',
        maxWidth: activeTab === 'register' && role && !finished ? 580 : 440,
        background: 'linear-gradient(145deg, rgba(16, 28, 56, 0.98), rgba(11, 19, 38, 0.98))',
        borderRadius: 22,
        padding: activeTab === 'register' && role && !finished ? '32px 28px' : '36px 32px',
        border: '1.5px solid rgba(59, 130, 246, 0.35)',
        boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.25s ease'
      }}>
        {/* Top Crisp Accent Line (Google Stitch Sovereign Accent) */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #2563EB, #06B6D4, #F59E0B)'
        }} />

        {/* Portal Civic Branding Header */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 15,
            background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
            padding: 2,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
            marginBottom: 12
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              background: '#070D1E',
              borderRadius: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#60A5FA'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
          </div>

          <h1 style={{
            fontSize: '1.45rem',
            fontWeight: 800,
            color: '#F8FAFC',
            margin: '0 0 6px',
            letterSpacing: '-0.02em',
            fontFamily: '"Sora", sans-serif'
          }}>
            McMCA Bursary Portal
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 12,
            color: '#94A3B8'
          }}>
            <span>Tendeno / Sorget Ward</span>
            <span>•</span>
            <span style={{
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#F59E0B',
              border: '1px solid rgba(245, 158, 11, 0.32)',
              padding: '2px 8px',
              borderRadius: 999,
              fontWeight: 700,
              fontSize: 11
            }}>
              2026/2027 Cycle
            </span>
          </div>
        </div>

        {/* Unified Tab Switcher: Sign In & Register */}
        <div style={{
          display: 'flex',
          background: '#070D1E',
          border: '1.5px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 14,
          padding: 4,
          marginBottom: 24
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setFinished(false);
            }}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: activeTab === 'login' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
              background: activeTab === 'login' ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
              color: activeTab === 'login' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: activeTab === 'login' ? '0 2px 10px rgba(37, 99, 235, 0.45)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 10,
              border: activeTab === 'register' ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
              background: activeTab === 'register' ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'transparent',
              color: activeTab === 'register' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: activeTab === 'register' ? '0 2px 10px rgba(37, 99, 235, 0.45)' : 'none'
            }}
          >
            Register
          </button>
        </div>

        {/* 1. MINIMALISTIC SIGN IN VIEW */}
        {activeTab === 'login' && (
          <div>
            {loginError && (
              <div style={{
                padding: '10px 14px',
                marginBottom: 18,
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                fontSize: 13,
                color: '#F87171'
              }}>
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                  National ID or Email
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. 40112233 or user@email.com"
                  required
                  style={fieldStyle}
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    style={{ ...fieldStyle, paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: 12,
                      background: 'none',
                      border: 'none',
                      color: showLoginPassword ? '#60A5FA' : '#94A3B8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                      borderRadius: 6
                    }}
                  >
                    {showLoginPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                style={{
                  width: '100%',
                  padding: '13px',
                  borderRadius: 12,
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: loginLoading ? 'not-allowed' : 'pointer',
                  opacity: loginLoading ? 0.75 : 1,
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.4)',
                  transition: 'all 0.2s ease'
                }}
              >
                {loginLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveTab('register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#60A5FA',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Don't have an account? Register
              </button>
            </div>

            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <Link to="/" style={{ color: '#94A3B8', fontSize: 12, textDecoration: 'none' }}>
                ← Back to Homepage
              </Link>
            </div>
          </div>
        )}

        {/* 2. REGISTER VIEW */}
        {activeTab === 'register' && (
          <div>
            {!role ? (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                    Register as
                  </label>
                  <select
                    value=""
                    onChange={(e) => {
                      const selected = e.target.value;
                      if (selected === 'student') setRole(ACCOUNT_ROLE.STUDENT);
                      else if (selected === 'parent') setRole(ACCOUNT_ROLE.PARENT);
                    }}
                    style={fieldStyle}
                  >
                    <option value="">Select account type...</option>
                    <option value="student">Student</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#60A5FA',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Already have an account? Sign in
                  </button>
                </div>

                <div style={{ marginTop: 14, textAlign: 'center' }}>
                  <Link to="/" style={{ color: '#94A3B8', fontSize: 12, textDecoration: 'none' }}>
                    ← Back to Homepage
                  </Link>
                </div>
              </div>
            ) : (
              /* Official Registration Form for Student or Parent */
              <div>
                {wizard.loading ? (
                  <p style={{ color: '#94A3B8', fontSize: 13, textAlign: 'center' }}>Restoring saved progress…</p>
                ) : (
                  <WizardShell
                    embedded
                    steps={steps}
                    stepIndex={wizard.stepIndex}
                    error={wizard.error}
                    submitting={submitting}
                    nextLabel="Create account"
                    hideBack={true}
                    extraAction={null}
                    onNext={handlePersonalStep}
                  >
                    {wizard.currentStep?.key === 'personal_information' && (
                      <>
                        <h2 style={{
                          fontSize: 22,
                          fontWeight: 800,
                          textAlign: 'center',
                          color: '#FFFFFF',
                          margin: '0 0 20px 0'
                        }}>
                          Personal Information
                        </h2>
                        <PersonalInfoFields
                          values={wizard.values}
                          onChange={handleFieldChange}
                          onBlurField={handleFieldBlur}
                          errors={formErrors}
                          includeAuth
                          idPrefix="reg-"
                          isStudent={role === ACCOUNT_ROLE.STUDENT}
                        />
                        <IdentityScanStep
                          values={wizard.values}
                          files={wizard.files}
                          errors={formErrors}
                          onFile={(field, file, verification) => {
                            wizard.updateFile(field, file, verification);
                            setFormErrors((prev) => ({
                              ...prev,
                              [field]: file ? '' : 'This document is required.'
                            }));
                          }}
                          registeredName={joinFullName(wizard.values)}
                          registeredId={wizard.values.nationalId}
                        />
                      </>
                    )}
                  </WizardShell>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
