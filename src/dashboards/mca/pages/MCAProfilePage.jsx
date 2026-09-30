import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MCALayout } from '../components/MCALayout.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { supabase } from '../../../lib/supabase';
import { useSecureData } from '../../../lib/useSecureData.js';
import { fetchMcaSummary, updateMcaPhone } from '../../../lib/mcaQueries.js';
import { isPhone } from '../../../domain/requirements.js';
import { useMca } from '../context/McaContext.jsx';
import { formatCount, formatDate, formatDays, formatKes } from '../../../utils/format.js';

const MIN_PASSWORD_LENGTH = 8;

function Message({ message }) {
  if (!message?.text) return null;
  return (
    <div className="notice" role={message.type === 'error' ? 'alert' : 'status'}>
      <p style={{ margin: 0 }}>{message.text}</p>
    </div>
  );
}

function PhoneForm({ userId, current, onSaved }) {
  const [phone, setPhone] = useState(current || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => setPhone(current || ''), [current]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isPhone(phone)) {
      setMessage({ type: 'error', text: 'Enter a valid phone number, for example 0712 345 678.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await updateMcaPhone(userId, phone);
      setMessage({ type: 'success', text: 'Phone number saved.' });
      onSaved();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'The phone number could not be saved.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mca-profile-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="mca-phone">Phone number</label>
        <input
          id="mca-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
      </div>
      <Message message={message} />
      <button type="submit" className="btn btn--primary" disabled={saving || phone.trim() === (current || '')}>
        {saving ? 'Saving…' : 'Save phone'}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setMessage({ type: 'error', text: `Use at least ${MIN_PASSWORD_LENGTH} characters.` });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: 'error', text: 'The two passwords do not match.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirm('');
      setMessage({ type: 'success', text: 'Password changed.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'The password could not be changed.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="mca-profile-form" onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="mca-password">New password</label>
        <input
          id="mca-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="mca-password-confirm">Confirm password</label>
        <input
          id="mca-password-confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>
      <Message message={message} />
      <button type="submit" className="btn btn--secondary" disabled={saving || !password}>
        <Icon name="shield" size={18} />
        {saving ? 'Saving…' : 'Change password'}
      </button>
    </form>
  );
}

export function MCAProfilePage() {
  const navigate = useNavigate();
  const { user, userId, signOut } = useAuth();
  const { profile, profileLoading, refreshProfile, displayName } = useMca();
  const { data: summary } = useSecureData(() => fetchMcaSummary({}), []);
  const totals = summary?.totals || {};
  const wards = profile?.wards || [];

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  return (
    <MCALayout pageTitle="Profile" layout="list" mcaName={displayName}>
      <div className="mca-page">
        <div className="mca-intro">
          <div>
            <h1 className="mca-intro__title">{displayName}</h1>
            <p className="mca-intro__sub">
              {[profile?.constituency, 'Member of County Assembly'].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        {!profileLoading && !profile ? (
          <div className="notice" role="status">
            <strong>Profile not set up</strong>
            <p>The administrator has not created your MCA record yet. Figures below may be empty until they do.</p>
          </div>
        ) : null}

        <div className="mca-grid-2">
          <SectionCard title="Details">
            <dl className="detail-grid">
              <div className="detail-grid__row">
                <dt>Email</dt>
                <dd>{profile?.email || user?.email || '—'}</dd>
              </div>
              <div className="detail-grid__row">
                <dt>Constituency</dt>
                <dd>{profile?.constituency || '—'}</dd>
              </div>
              <div className="detail-grid__row">
                <dt>Wards in scope</dt>
                <dd>
                  {wards.length ? (
                    <span className="mca-wards">
                      {wards.map((ward) => (
                        <span key={ward} className="badge badge--neutral">
                          {ward}
                        </span>
                      ))}
                    </span>
                  ) : (
                    'All wards'
                  )}
                </dd>
              </div>
              <div className="detail-grid__row">
                <dt>Last updated</dt>
                <dd>{formatDate(profile?.updated_at)}</dd>
              </div>
            </dl>
            <p className="mca-empty-note" style={{ marginTop: 12 }}>
              Name, constituency, and wards are set by the administrator.
            </p>
            {profile ? (
              <div style={{ marginTop: 16 }}>
                <PhoneForm userId={userId} current={profile.phone_number} onSaved={refreshProfile} />
              </div>
            ) : null}
          </SectionCard>

          <SectionCard title="Your decisions">
            <dl className="mca-facts">
              <div>
                <dt>Awaiting</dt>
                <dd>{formatCount(totals.awaiting)}</dd>
              </div>
              <div>
                <dt>Approved</dt>
                <dd>{formatCount(totals.approved)}</dd>
              </div>
              <div>
                <dt>Declined</dt>
                <dd>{formatCount(totals.declined)}</dd>
              </div>
              <div>
                <dt>Allocated</dt>
                <dd>{formatKes(totals.allocated, { compact: true })}</dd>
              </div>
              <div>
                <dt>Median decision time</dt>
                <dd>{formatDays(totals.median_days_to_mca)}</dd>
              </div>
              <div>
                <dt>Students reached</dt>
                <dd>{formatCount(totals.students)}</dd>
              </div>
            </dl>
            <p className="mca-empty-note" style={{ marginTop: 12 }}>All cycles, across your wards.</p>
          </SectionCard>
        </div>

        <SectionCard title="Security">
          <PasswordForm />
          <div className="mca-card-actions">
            <button type="button" className="btn btn--secondary" onClick={handleSignOut}>
              <Icon name="logout" size={18} />
              Sign out
            </button>
          </div>
        </SectionCard>
      </div>
    </MCALayout>
  );
}
