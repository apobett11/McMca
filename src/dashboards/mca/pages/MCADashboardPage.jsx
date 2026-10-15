import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MCALayout } from '../components/MCALayout.jsx';
import { Icon } from '../../../components/Icon.jsx';
import {
  getMCAApplications,
  getMCAIssues,
  getMCADevelopments,
  addMCADevelopment,
  getMCAMessages,
  getMCAProfile,
  WARD_VILLAGES
} from '../utils/mcaData.js';

export function MCADashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(() => getMCAProfile());
  const [applications, setApplications] = useState(() => getMCAApplications());
  const [issues, setIssues] = useState(() => getMCAIssues());
  const [developments, setDevelopments] = useState(() => getMCADevelopments());
  const [messages, setMessages] = useState(() => getMCAMessages());

  // Modal for MCA to post what he has done directly
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newVillage, setNewVillage] = useState(WARD_VILLAGES[0]);
  const [newCategory, setNewCategory] = useState('Roads & Infrastructure');
  const [newComment, setNewComment] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newCost, setNewCost] = useState('');
  const [newBeneficiaries, setNewBeneficiaries] = useState('');

  // Photo viewer modal
  const [activePhoto, setActivePhoto] = useState(null);

  useEffect(() => {
    function refreshData() {
      setProfile(getMCAProfile());
      setApplications(getMCAApplications());
      setIssues(getMCAIssues());
      setDevelopments(getMCADevelopments());
      setMessages(getMCAMessages());
    }

    window.addEventListener('mcmca_mca_apps_updated', refreshData);
    window.addEventListener('mcmca_mca_issues_updated', refreshData);
    window.addEventListener('mcmca_mca_developments_updated', refreshData);
    window.addEventListener('mcmca_mca_messages_updated', refreshData);
    window.addEventListener('mcmca_mca_profile_updated', refreshData);

    return () => {
      window.removeEventListener('mcmca_mca_apps_updated', refreshData);
      window.removeEventListener('mcmca_mca_issues_updated', refreshData);
      window.removeEventListener('mcmca_mca_developments_updated', refreshData);
      window.removeEventListener('mcmca_mca_messages_updated', refreshData);
      window.removeEventListener('mcmca_mca_profile_updated', refreshData);
    };
  }, []);

  // Quick stats calculation
  const totalBursaryAllocated = applications.reduce((sum, a) => sum + (Number(a.bursaryAmount) || 0), 0);
  const waitingIssuesCount = issues.filter(i => i.status === 'waiting').length;
  const scheduledIssuesCount = issues.filter(i => i.status === 'scheduled').length;
  const doneIssuesCount = issues.filter(i => i.status === 'done').length;
  const pendingMessagesCount = messages.filter(m => m.status === 'Pending MCA Action').length;

  function handleCreateDevelopment(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const photoList = newPhotoUrl.trim()
      ? [newPhotoUrl.trim()]
      : ['https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80'];

    addMCADevelopment({
      title: newTitle.trim(),
      village: newVillage,
      category: newCategory,
      comment: newComment.trim() || 'Project commissioned and inspected by Hon. MCA Hillary Bett.',
      photos: photoList,
      costKes: newCost.trim() || 'Ward Dev Fund',
      beneficiaries: newBeneficiaries.trim() || `${newVillage} Community`,
      tag: 'MCA Executive Action'
    });

    setNewTitle('');
    setNewComment('');
    setNewPhotoUrl('');
    setNewCost('');
    setNewBeneficiaries('');
    setPostModalOpen(false);
  }

  return (
    <MCALayout pageTitle="MCA Executive Dashboard" mcaName={profile.fullName}>
      {/* HERO SECTION */}
      <section className="mca-hero" aria-label="MCA Ward Executive Overview">
        <div className="mca-hero__header">
          <div>
            <div className="mca-hero__meta" style={{ marginBottom: 8 }}>
              <span className="mca-hero__badge">
                <Icon name="shield" size={14} /> Official Ward Executive
              </span>
              <Link
                to="/mca/applications"
                className="mca-hero__cycle-pill"
                style={{ textDecoration: 'none', cursor: 'pointer', transition: 'transform 0.15s ease' }}
                title="Click to open Applications & Distribution Cards"
              >
                <Icon name="calendar" size={14} /> 2026/2027 Active Cycle →
              </Link>
            </div>
            <h1 className="mca-hero__title">
              {profile.fullName || 'Hon. Hillary Kiprotich Bett'}
            </h1>
            <p className="mca-hero__subtitle">
              Tendeno / Sorget Ward Executive Command • Live civic governance & bursary allocations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="mca-btn mca-btn--done"
              onClick={() => setPostModalOpen(true)}
              style={{ padding: '10px 18px', fontWeight: 700 }}
            >
              <Icon name="plus" size={18} />
              Post Ward Development
            </button>
            <Link
              to="/mca/issues"
              className="mca-btn mca-btn--schedule"
              style={{ padding: '10px 18px', fontWeight: 700, textDecoration: 'none' }}
            >
              <Icon name="calendar" size={18} />
              Open MCA Diary ({scheduledIssuesCount})
            </Link>
          </div>
        </div>
      </section>

      {/* ANALYTICS QUICK CARDS */}
      <section className="mca-section" aria-label="Analytics Quick Cards">
        <div className="mca-section__header">
          <div>
            <h2 className="mca-section__title">
              <Icon name="funds" size={20} />
              Executive Metrics
            </h2>
            <p className="mca-section__desc">Key performance and allocation indicators for Tendeno / Sorget Ward</p>
          </div>
        </div>

        <div className="mca-metrics-grid">
          {/* Card 1: Bursaries */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/applications')}
            title="Click to view Applications Analytics"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                <Icon name="funds" size={18} />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 600 }}>Active Cycle</span>
            </div>
            <div>
              <div className="mca-metric-card__value">KES {(totalBursaryAllocated).toLocaleString()}</div>
              <div className="mca-metric-card__label">Bursary Disbursed / Allocated</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#34d399' }}>
              <Icon name="check" size={14} /> {applications.length} students enrolled
            </div>
          </div>

          {/* Card 2: Waiting Issues */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/issues')}
            title="Click to view Waiting Citizen Issues"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                <Icon name="clock" size={18} />
              </div>
              <span className="mca-badge mca-badge--waiting">{waitingIssuesCount} Waiting</span>
            </div>
            <div>
              <div className="mca-metric-card__value">{issues.length}</div>
              <div className="mca-metric-card__label">Citizen Issues Logged</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#fbbf24' }}>
              Requires MCA review or diary scheduling
            </div>
          </div>

          {/* Card 3: Scheduled Diary */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/issues')}
            title="Click to open MCA Diary"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                <Icon name="calendar" size={18} />
              </div>
              <span className="mca-badge mca-badge--scheduled">{scheduledIssuesCount} Scheduled</span>
            </div>
            <div>
              <div className="mca-metric-card__value">{scheduledIssuesCount}</div>
              <div className="mca-metric-card__label">Site Visits & Barazas</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#818cf8' }}>
              Organized by village diary
            </div>
          </div>

          {/* Card 4: Help Desk Forwarded */}
          <div
            className="mca-metric-card mca-card--clickable"
            onClick={() => navigate('/mca/messages')}
            title="Click to view Help Desk Messages"
          >
            <div className="mca-metric-card__top">
              <div className="mca-metric-card__icon" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
                <Icon name="bell" size={18} />
              </div>
              <span className="mca-badge" style={{ background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                {pendingMessagesCount} Actionable
              </span>
            </div>
            <div>
              <div className="mca-metric-card__value">{messages.length}</div>
              <div className="mca-metric-card__label">Help Desk Escalations</div>
            </div>
            <div className="mca-metric-card__trend" style={{ color: '#94a3b8' }}>
              Forwarded citizen petitions
            </div>
          </div>
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="mca-section" aria-label="Executive Quick Actions">
        <div className="mca-section__header">
          <div>
            <h2 className="mca-section__title">
              <Icon name="arrowRight" size={18} />
              Quick Actions
            </h2>
            <p className="mca-section__desc">Direct access to daily ward administrative workflows</p>
          </div>
        </div>

        <div className="mca-quick-actions">
          <Link to="/mca/applications" className="mca-action-btn mca-action-btn--primary">
            <Icon name="applications" size={20} />
            <span>Applications Analytics</span>
          </Link>

          <Link to="/mca/issues" className="mca-action-btn">
            <Icon name="calendar" size={20} />
            <span>Village Issues & Diary</span>
          </Link>

          <button
            type="button"
            className="mca-action-btn"
            onClick={() => setPostModalOpen(true)}
          >
            <Icon name="upload" size={20} />
            <span>Post Completed Project</span>
          </button>

          <Link to="/mca/messages" className="mca-action-btn">
            <Icon name="support" size={20} />
            <span>Help Desk Messages</span>
          </Link>
        </div>
      </section>

      {/* DEVELOPMENTS SHOWCASE - WHAT THE MCA HAS DONE */}
      <section className="mca-section" aria-label="Ward Developments Showcase">
        <div className="mca-section__header">
          <div>
            <h2 className="mca-section__title">
              <Icon name="approved" size={20} />
              Ward Developments & Accomplished Projects
            </h2>
            <p className="mca-section__desc">
              Community projects completed and verified by the MCA. Issues marked as Done automatically publish here.
            </p>
          </div>
          <button
            type="button"
            className="mca-btn mca-btn--done"
            onClick={() => setPostModalOpen(true)}
          >
            <Icon name="plus" size={16} />
            Add Project
          </button>
        </div>

        {developments.length === 0 ? (
          <div className="mca-card" style={{ textAlign: 'center', padding: '36px 20px', color: '#94a3b8' }}>
            <p>No completed developments published yet. Mark citizen issues as Done or post a new development above!</p>
          </div>
        ) : (
          <div className="mca-dev-grid">
            {developments.map((dev) => (
              <article key={dev.id} className="mca-dev-card">
                <div
                  className="mca-dev-card__image-container"
                  onClick={() => dev.photos?.[0] && setActivePhoto(dev.photos[0])}
                  style={{ cursor: dev.photos?.[0] ? 'pointer' : 'default' }}
                  title="Click to view full photo"
                >
                  {dev.photos && dev.photos[0] ? (
                    <img
                      src={dev.photos[0]}
                      alt={dev.title}
                      className="mca-dev-card__image"
                      loading="lazy"
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      No Photo Available
                    </div>
                  )}
                  <span
                    className="mca-badge mca-badge--done"
                    style={{ position: 'absolute', top: 10, left: 10, backdropFilter: 'blur(6px)' }}
                  >
                    Done • {dev.village}
                  </span>
                  {dev.photos && dev.photos.length > 1 && (
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: 6
                      }}
                    >
                      +{dev.photos.length - 1} photos
                    </span>
                  )}
                </div>

                <div className="mca-dev-card__body">
                  <h3 className="mca-dev-card__title">{dev.title}</h3>
                  <p className="mca-dev-card__comment">{dev.comment}</p>
                  
                  <div className="mca-dev-card__footer">
                    <span>
                      <strong>Beneficiaries:</strong> {dev.beneficiaries || dev.village}
                    </span>
                    <span>
                      {dev.completedDate}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* RECENT WAITING ISSUES TICKER */}
      <section className="mca-section" aria-label="Waiting Citizen Issues">
        <div className="mca-section__header">
          <div>
            <h2 className="mca-section__title">
              <Icon name="clock" size={20} />
              Recent Citizen Grievances Awaiting Action
            </h2>
            <p className="mca-section__desc">Prioritize scheduling or resolve directly with village representatives</p>
          </div>
          <Link to="/mca/issues" className="mca-btn mca-btn--schedule" style={{ textDecoration: 'none' }}>
            View All Issues ({issues.length})
          </Link>
        </div>

        <div className="mca-issues-list">
          {issues.slice(0, 3).map((iss) => (
            <div key={iss.id} className="mca-issue-card">
              <div className="mca-issue-card__top">
                <div>
                  <h3 className="mca-issue-card__title">{iss.title}</h3>
                  <p className="mca-issue-card__desc">{iss.description}</p>
                </div>
                <div>
                  {iss.status === 'waiting' && <span className="mca-badge mca-badge--waiting">Waiting</span>}
                  {iss.status === 'scheduled' && <span className="mca-badge mca-badge--scheduled">Scheduled: {iss.scheduledDate}</span>}
                  {iss.status === 'done' && <span className="mca-badge mca-badge--done">Done</span>}
                  {iss.status === 'cancelled' && <span className="mca-badge mca-badge--cancelled">Cancelled</span>}
                </div>
              </div>
              <div className="mca-issue-card__meta">
                <span><strong>Village:</strong> {iss.village}</span>
                <span><strong>Reported By:</strong> {iss.residentName}</span>
                <span><strong>Date:</strong> {iss.dateReported}</span>
                <span><strong>Urgency:</strong> {iss.urgency || 'Normal'}</span>
                <Link
                  to="/mca/issues"
                  style={{ marginLeft: 'auto', color: '#60a5fa', textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem' }}
                >
                  Manage in Diary →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MODAL: POST WHAT MCA HAS DONE (WITH PHOTOS & COMMENTS) */}
      {postModalOpen && (
        <div className="mca-modal-overlay" role="dialog" aria-modal="true">
          <div className="mca-modal-dialog">
            <div className="mca-modal-header">
              <h3 className="mca-modal-title">Post Completed Ward Development</h3>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setPostModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDevelopment}>
              <div className="mca-form-group">
                <label className="mca-form-label">Project Title</label>
                <input
                  type="text"
                  className="mca-input"
                  placeholder="e.g. Renovation of Chepsir Tea Collection Shed"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="mca-form-group">
                  <label className="mca-form-label">Village</label>
                  <select
                    className="mca-select"
                    value={newVillage}
                    onChange={(e) => setNewVillage(e.target.value)}
                  >
                    {WARD_VILLAGES.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="mca-form-group">
                  <label className="mca-form-label">Category</label>
                  <select
                    className="mca-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Water & Sanitation">Water & Sanitation</option>
                    <option value="Education & ECDE">Education & ECDE</option>
                    <option value="Health & Medical">Health & Medical</option>
                    <option value="Energy & Lighting">Energy & Lighting</option>
                    <option value="Youth & Sports">Youth & Sports</option>
                  </select>
                </div>
              </div>

              <div className="mca-form-group">
                <label className="mca-form-label">MCA Completion Comment / Details</label>
                <textarea
                  className="mca-textarea"
                  rows={3}
                  placeholder="Explain the scope accomplished, community impact, or handover details..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  required
                />
              </div>

              <div className="mca-form-group">
                <label className="mca-form-label">Project Photo URL (or Image Link)</label>
                <input
                  type="url"
                  className="mca-input"
                  placeholder="https://images.unsplash.com/... or paste image link"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                />
                <span style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'block', marginTop: 4 }}>
                  Tip: A verified civic infrastructure photo will be assigned if left empty.
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="mca-form-group">
                  <label className="mca-form-label">Beneficiaries Count</label>
                  <input
                    type="text"
                    className="mca-input"
                    placeholder="e.g. 500 families"
                    value={newBeneficiaries}
                    onChange={(e) => setNewBeneficiaries(e.target.value)}
                  />
                </div>
                <div className="mca-form-group">
                  <label className="mca-form-label">Budget / Ward Fund (KES)</label>
                  <input
                    type="text"
                    className="mca-input"
                    placeholder="e.g. 1,200,000"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  className="mca-btn mca-btn--cancel"
                  onClick={() => setPostModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="mca-btn mca-btn--done"
                  style={{ padding: '10px 20px', fontWeight: 700 }}
                >
                  Publish to Ward Homepage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PHOTO VIEWER MODAL */}
      {activePhoto && (
        <div className="mca-modal-overlay" onClick={() => setActivePhoto(null)} role="dialog">
          <div
            className="mca-modal-dialog"
            style={{ maxWidth: 720, padding: 12, background: '#000' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <button
                type="button"
                className="mca-modal-close-btn"
                onClick={() => setActivePhoto(null)}
                aria-label="Close photo"
              >
                ×
              </button>
            </div>
            <img
              src={activePhoto}
              alt="Project View"
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8 }}
            />
          </div>
        </div>
      )}
    </MCALayout>
  );
}
