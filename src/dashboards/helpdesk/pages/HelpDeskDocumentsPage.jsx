import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { HelpDeskLayout } from '../components/HelpDeskLayout.jsx';
import { TableSubpage } from '../components/TableSubpage.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { RefreshButton } from '../../../components/RefreshButton.jsx';
import {
  PREDETERMINED_LOCATIONS,
  STEP_NAMES,
  getHelpDeskStepProgress,
  getHelpDeskFailedUploads,
  getHelpDeskApplications,
  getMassMessageLogs,
  sendMassMessage,
  sendStepReminder,
  requestReupload,
  saveHelpDeskStepProgress
} from '../utils/helpDeskData.js';

export function HelpDeskDocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const subpageParam = searchParams.get('table'); // null | 'steps' | 'failed_uploads' | 'rejected'

  const [activeSubpage, setActiveSubpage] = useState(subpageParam || null);
  const [stepsData, setStepsData] = useState(() => getHelpDeskStepProgress());
  const [failedUploads, setFailedUploads] = useState(() => getHelpDeskFailedUploads());
  const [applications, setApplications] = useState(() => getHelpDeskApplications());
  const [massLogs, setMassLogs] = useState(() => getMassMessageLogs());
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState('');
  const feedbackTimerRef = useRef(null);

  function triggerFeedback(msg, duration = 4000) {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback('');
    }, duration);
  }

  // Mass message modal state
  const [massModalOpen, setMassModalOpen] = useState(false);
  const [massTarget, setMassTarget] = useState('hanging_steps');
  const [massTitle, setMassTitle] = useState('Reminder: Complete your hanging bursary steps');
  const [massBody, setMassBody] = useState(
    'Dear Applicant, our records show you have pending registration steps on the Tendeno/Sorget Bursary Portal. Kindly log in and complete your details before the cutoff date.'
  );

  function handleSelectMassTarget(target) {
    setMassTarget(target);
    if (target === 'hanging_steps') {
      setMassTitle('Reminder: Complete your hanging bursary steps');
      setMassBody('Dear Applicant, our records show you have pending registration steps on the Tendeno/Sorget Bursary Portal. Kindly log in and complete your details before the cutoff date.');
    } else if (target === 'failed_uploads') {
      setMassTitle('Document Re-upload Required');
      setMassBody('Your uploaded fee structure or birth certificate was rejected due to quality or missing stamp. Log in to re-upload clear copies immediately.');
    } else if (target === 'rejected_apps') {
      setMassTitle('Bursary Application Status: Pre-appeal clarification');
      setMassBody('Dear Applicant, your application was flagged during chief review. Contact the Help Desk before formal appeal cutoff to supply missing verification documents.');
    } else {
      setMassTitle('Bursary Cycle Cutoff Reminder');
      setMassBody('Notice to all applicants in Tendeno, Sorget, Parklands and Westlands: The bursary review window closes shortly.');
    }
  }

  // Filters for Step Table subpage
  const [stepLocation, setStepLocation] = useState('all');
  const [stepStatusFilter, setStepStatusFilter] = useState('all'); // all | incomplete | complete
  const [stepSearch, setStepSearch] = useState('');
  const [stepSortField, setStepSortField] = useState('stepsCount'); // stepsCount | totalDocuments | applicantName | lastActiveDate
  const [stepSortOrder, setStepSortOrder] = useState('asc'); // asc | desc

  // Filters for Failed Uploads subpage
  const [uploadLocation, setUploadLocation] = useState('all');
  const [uploadDocType, setUploadDocType] = useState('all');
  const [uploadSearch, setUploadSearch] = useState('');
  const [uploadSortField, setUploadSortField] = useState('uploadDate');
  const [uploadSortOrder, setUploadSortOrder] = useState('desc');

  // Keep subpage URL param in sync
  useEffect(() => {
    if (subpageParam) {
      setActiveSubpage(subpageParam);
    }
  }, [subpageParam]);

  function openSubpage(name) {
    setActiveSubpage(name);
    setSearchParams({ table: name });
  }

  function closeSubpage() {
    setActiveSubpage(null);
    setSearchParams({});
  }

  function reloadData() {
    setRefreshing(true);
    setStepsData(getHelpDeskStepProgress());
    setFailedUploads(getHelpDeskFailedUploads());
    setMassLogs(getMassMessageLogs());
    setTimeout(() => {
      setRefreshing(false);
    }, 200);
  }

  useEffect(() => {
    function onStepsUpdate(e) {
      if (e.detail) setStepsData(e.detail);
    }
    function onUploadsUpdate(e) {
      if (e.detail) setFailedUploads(e.detail);
    }
    function onMassUpdate(e) {
      if (e.detail) setMassLogs(e.detail);
    }
    window.addEventListener('mcmca_helpdesk_steps_updated', onStepsUpdate);
    window.addEventListener('mcmca_helpdesk_failed_uploads_updated', onUploadsUpdate);
    window.addEventListener('mcmca_helpdesk_mass_updated', onMassUpdate);

    return () => {
      window.removeEventListener('mcmca_helpdesk_steps_updated', onStepsUpdate);
      window.removeEventListener('mcmca_helpdesk_failed_uploads_updated', onUploadsUpdate);
      window.removeEventListener('mcmca_helpdesk_mass_updated', onMassUpdate);
    };
  }, []);

  // Summary counts
  const totalApplicants = stepsData.length;
  const incompleteCount = stepsData.filter((s) => s.stepsCount < s.totalSteps).length;
  const completeCount = stepsData.filter((s) => s.stepsCount === s.totalSteps).length;
  const totalFailedUploadsCount = failedUploads.length;

  // Handlers
  function handleSendMassBroadcast(e) {
    e.preventDefault();
    const res = sendMassMessage({
      targetGroup: massTarget,
      title: massTitle,
      messageText: massBody
    });
    setMassModalOpen(false);
    setStepsData(getHelpDeskStepProgress());
    setFailedUploads(getHelpDeskFailedUploads());
    setMassLogs(getMassMessageLogs());
    triggerFeedback(`Mass broadcast dispatched to ${res.count} applicants successfully!`, 5000);
  }

  function handleIndividualReminder(applicantId, name) {
    sendStepReminder(applicantId);
    setStepsData(getHelpDeskStepProgress());
    triggerFeedback(`Reminder sent to ${name}.`, 4000);
  }

  function handleRequestReupload(uploadId, applicantName) {
    requestReupload(uploadId);
    setFailedUploads(getHelpDeskFailedUploads());
    triggerFeedback(`Re-upload request sent to ${applicantName}.`, 4000);
  }

  // Filter & Sort for Steps Table
  const filteredSteps = useMemo(() => {
    return stepsData
      .filter((item) => {
        if (stepLocation !== 'all' && item.location?.toLowerCase() !== stepLocation.toLowerCase()) {
          return false;
        }
        if (stepStatusFilter === 'incomplete' && item.stepsCount >= item.totalSteps) {
          return false;
        }
        if (stepStatusFilter === 'complete' && item.stepsCount < item.totalSteps) {
          return false;
        }
        if (stepSearch.trim()) {
          const q = stepSearch.toLowerCase();
          const matchName = item.applicantName?.toLowerCase().includes(q);
          const matchId = item.nationalId?.toLowerCase().includes(q);
          const matchPhone = item.phone?.toLowerCase().includes(q);
          const matchSchool = item.school?.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchPhone && !matchSchool) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[stepSortField];
        let valB = b[stepSortField];
        if (stepSortField === 'lastActiveDate') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }
        if (valA < valB) return stepSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return stepSortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [stepsData, stepLocation, stepStatusFilter, stepSearch, stepSortField, stepSortOrder]);

  // Filter & Sort for Failed Uploads Table
  const filteredUploads = useMemo(() => {
    return failedUploads
      .filter((item) => {
        if (uploadLocation !== 'all' && item.location?.toLowerCase() !== uploadLocation.toLowerCase()) {
          return false;
        }
        if (uploadDocType !== 'all' && item.documentType !== uploadDocType) {
          return false;
        }
        if (uploadSearch.trim()) {
          const q = uploadSearch.toLowerCase();
          const matchName = item.applicantName?.toLowerCase().includes(q);
          const matchReason = item.failureReason?.toLowerCase().includes(q);
          const matchFile = item.fileName?.toLowerCase().includes(q);
          if (!matchName && !matchReason && !matchFile) return false;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[uploadSortField];
        let valB = b[uploadSortField];
        if (uploadSortField === 'uploadDate') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        } else if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = (valB || '').toLowerCase();
        }
        if (valA < valB) return uploadSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return uploadSortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [failedUploads, uploadLocation, uploadDocType, uploadSearch, uploadSortField, uploadSortOrder]);

  return (
    <HelpDeskLayout pageTitle="Documents &amp; Steps" layout="dashboard">
      <div className="stitch-dashboard">
        {/* Floating Success / Status Toast with Cancel Button */}
        {feedback && (
          <div className="hd-toast notice" role="status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="check" size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{feedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback('')}
              className="hd-toast__close"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUBPAGE 1: STEP PROGRESS TABLE (Opened with X cancel button) */}
        {/* ========================================================= */}
        {activeSubpage === 'steps' && (
          <TableSubpage
            title="Applicant Step Progress Table"
            subtitle="Sorted by steps covered / level reached to monitor abandoned or hanging registration steps."
            category="Documents"
            onClose={closeSubpage}
            badgeText={`${filteredSteps.length} Applicants`}
            badgeTone="review"
            toolbar={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Pre-determined Location Select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="step-loc-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>Location:</label>
                      <select
                        id="step-loc-sel"
                        value={stepLocation}
                        onChange={(e) => setStepLocation(e.target.value)}
                        className="select-filter"
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <option value="all">All Locations</option>
                        {PREDETERMINED_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    {/* Step Status Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="step-status-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>Step Status:</label>
                      <select
                        id="step-status-sel"
                        value={stepStatusFilter}
                        onChange={(e) => setStepStatusFilter(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <option value="all">All Statuses</option>
                        <option value="incomplete">Hanging / Incomplete (&lt;5)</option>
                        <option value="complete">Fully Completed (5/5)</option>
                      </select>
                    </div>

                    {/* Sort Field Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="step-sort-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>Sort By:</label>
                      <select
                        id="step-sort-sel"
                        value={stepSortField}
                        onChange={(e) => setStepSortField(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <option value="stepsCount">Level Reached (Steps Covered)</option>
                        <option value="totalDocuments">Total Documents Attached</option>
                        <option value="applicantName">Applicant Name</option>
                        <option value="lastActiveDate">Last Active Date</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setStepSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                        className="btn btn--secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                        title="Toggle Ascending/Descending"
                      >
                        {stepSortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
                      </button>
                    </div>
                  </div>

                  {/* Mass Broadcast Shortcut from Subpage */}
                  <button
                    type="button"
                    onClick={() => setMassModalOpen(true)}
                    className="btn btn--primary"
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    <Icon name="support" size={16} />
                    Send Mass Reminder
                  </button>
                </div>

                {/* Search Bar */}
                <div>
                  <input
                    type="text"
                    value={stepSearch}
                    onChange={(e) => setStepSearch(e.target.value)}
                    placeholder="Search applicant name, national ID, phone, or school..."
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            }
          >
            <div className="data-table-wrap">
              <table className="data-table" aria-label="Applicant step completion queue">
                <thead>
                  <tr>
                    <th scope="col">Applicant Name &amp; ID</th>
                    <th scope="col">Location</th>
                    <th scope="col">Steps Covered (Level Reached)</th>
                    <th scope="col">Hanging Steps Left</th>
                    <th scope="col">Docs Attached</th>
                    <th scope="col">Registration Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSteps.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-2)' }}>
                        No applicants found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredSteps.map((row) => {
                      const pct = Math.round((row.stepsCount / row.totalSteps) * 100);
                      const isComplete = row.stepsCount === row.totalSteps;
                      return (
                        <tr key={row.id} className={!isComplete ? 'data-table__row--attention' : ''}>
                          <td>
                            <strong>{row.applicantName}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                              ID: {row.nationalId} &bull; Tel: {row.phone}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-2)' }}>
                              {row.school}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge--neutral">{row.location}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div
                                style={{
                                  width: 90,
                                  height: 8,
                                  borderRadius: 999,
                                  background: 'rgba(148, 163, 184, 0.2)',
                                  overflow: 'hidden'
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: isComplete ? '#22C55E' : 'var(--gold-champagne, #ddbb6a)',
                                    borderRadius: 999
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                {row.stepsCount} / {row.totalSteps} ({pct}%)
                              </span>
                            </div>
                          </td>
                          <td>
                            {row.hangingSteps.length === 0 ? (
                              <span style={{ color: '#22C55E', fontSize: '0.82rem', fontWeight: 600 }}>
                                None &bull; Ready
                              </span>
                            ) : (
                              <span style={{ color: '#F87171', fontSize: '0.82rem' }}>
                                {row.hangingSteps.map(k => k.replace(/_/g, ' ')).join(', ')}
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="badge badge--neutral">
                              {row.totalDocuments} / 4 docs
                            </span>
                          </td>
                          <td>
                            <span className={`stitch-status-badge ${isComplete ? 'stitch-status-badge--admitted' : 'stitch-status-badge--review'}`}>
                              {row.registrationStatus}
                            </span>
                          </td>
                          <td>
                            {isComplete ? (
                              <span style={{ color: 'var(--text-2)', fontSize: '0.8rem' }}>On file</span>
                            ) : row.reminded ? (
                              <span className="badge badge--info" style={{ fontSize: '0.75rem' }}>
                                Reminded
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleIndividualReminder(row.id, row.applicantName)}
                                className="btn btn--secondary"
                                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              >
                                Remind
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </TableSubpage>
        )}

        {/* ========================================================= */}
        {/* SUBPAGE 2: FAILED UPLOADS TABLE (Opened with X cancel button) */}
        {/* ========================================================= */}
        {activeSubpage === 'failed_uploads' && (
          <TableSubpage
            title="Failed Document Uploads &amp; Reasons"
            subtitle="Review all document upload errors, OCR failures, missing stamps, and size violations with direct applicant re-upload actions."
            category="Documents"
            onClose={closeSubpage}
            badgeText={`${filteredUploads.length} Failed Uploads`}
            badgeTone="declined"
            toolbar={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {/* Pre-determined Location Select */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="upload-loc-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>Location:</label>
                      <select
                        id="upload-loc-sel"
                        value={uploadLocation}
                        onChange={(e) => setUploadLocation(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <option value="all">All Locations</option>
                        {PREDETERMINED_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>{loc}</option>
                        ))}
                      </select>
                    </div>

                    {/* Document Type Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="upload-type-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>Doc Type:</label>
                      <select
                        id="upload-type-sel"
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <option value="all">All Document Types</option>
                        <option value="Fee Structure">Fee Structure</option>
                        <option value="Student ID / Birth Certificate">Student ID / Birth Cert</option>
                        <option value="Admission Letter">Admission Letter</option>
                        <option value="Guardian Death / Disability Cert">Death / Disability Cert</option>
                        <option value="Guardian Consent Form">Guardian Consent Form</option>
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label htmlFor="upload-sort-sel" style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }}>Sort:</label>
                      <select
                        id="upload-sort-sel"
                        value={uploadSortField}
                        onChange={(e) => setUploadSortField(e.target.value)}
                        style={{ padding: '6px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                      >
                        <option value="uploadDate">Upload Date</option>
                        <option value="applicantName">Applicant Name</option>
                        <option value="documentType">Document Type</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setUploadSortOrder(o => o === 'asc' ? 'desc' : 'asc')}
                        className="btn btn--secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        {uploadSortOrder === 'asc' ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={uploadSearch}
                    onChange={(e) => setUploadSearch(e.target.value)}
                    placeholder="Search applicant name, failure reason, or file name..."
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
            }
          >
            <div className="data-table-wrap">
              <table className="data-table" aria-label="Failed uploads table">
                <thead>
                  <tr>
                    <th scope="col">Applicant &amp; Phone</th>
                    <th scope="col">Location</th>
                    <th scope="col">Document Type</th>
                    <th scope="col">File Info</th>
                    <th scope="col">Reason for Upload Failure</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUploads.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-2)' }}>
                        No failed uploads matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUploads.map((row) => (
                      <tr key={row.id} className="data-table__row--attention">
                        <td>
                          <strong>{row.applicantName}</strong>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>
                            ID: {row.nationalId} &bull; Tel: {row.phone}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--neutral">{row.location}</span>
                        </td>
                        <td>
                          <span className="badge badge--warning">{row.documentType}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem' }}>{row.fileName}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-2)' }}>{row.fileSize}</div>
                        </td>
                        <td>
                          <div style={{ color: '#F87171', fontSize: '0.84rem', lineHeight: 1.4, maxWidth: 360 }}>
                            {row.failureReason}
                          </div>
                        </td>
                        <td>
                          <span className="stitch-status-badge stitch-status-badge--declined">
                            {row.status}
                          </span>
                        </td>
                        <td>
                          {row.reuploadRequested ? (
                            <span className="badge badge--info" style={{ fontSize: '0.75rem' }}>
                              Requested
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRequestReupload(row.id, row.applicantName)}
                              className="btn btn--secondary"
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            >
                              Request Re-upload
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TableSubpage>
        )}

        {/* ========================================================= */}
        {/* DEFAULT OVERVIEW VIEW (When NO subpage is loaded) */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* SUBPAGE 3: REJECTED APPLICATIONS TABLE (When opened from Documents page) */}
        {/* ========================================================= */}
        {activeSubpage === 'rejected' && (
          <TableSubpage
            title="Rejected Applications Table"
            category="Documents"
            onClose={closeSubpage}
            badgeText={`${applications.filter(a => a.applicationStatus === 'Rejected').length} Flagged`}
            badgeTone="declined"
          >
            <div className="data-table-wrap">
              <table className="data-table" aria-label="Rejected applications table">
                <thead>
                  <tr>
                    <th scope="col">Applicant &amp; Serial</th>
                    <th scope="col">Location</th>
                    <th scope="col">Requested</th>
                    <th scope="col">Chief Rejection Flag</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.filter(a => a.applicationStatus === 'Rejected').map((row) => (
                    <tr key={row.id}>
                      <td>
                        <strong>{row.fullName}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {row.serial} &bull; {row.institution}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge--neutral">{row.location}</span>
                      </td>
                      <td>
                        <strong>{row.amountRequested}</strong>
                      </td>
                      <td>
                        <span style={{ color: '#F87171', fontSize: '0.84rem' }}>
                          {row.chiefReasonForFail || 'Flagged during residency verification.'}
                        </span>
                      </td>
                      <td>
                        <span className="stitch-status-badge stitch-status-badge--declined">
                          {row.applicationStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TableSubpage>
        )}

        {/* ========================================================= */}
        {/* DEFAULT OVERVIEW VIEW (When NO subpage is loaded) */}
        {/* ========================================================= */}
        {!activeSubpage && (
          <section className="dash-single-card hd-card" style={{ padding: 0 }}>
            {/* Header with Title and Sleek Icon Refresh */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div>
                <h2 className="stitch-section-title" style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>
                  Documents &amp; Step Coverage Center
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={reloadData}
                  disabled={refreshing}
                  className="btn btn--secondary"
                  aria-label="Refresh telemetry data"
                  title="Refresh data"
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name="refresh" size={18} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                </button>
              </div>
            </div>

            {/* Group 1: Grouped Alike Telemetry Metric Tiles */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => openSubpage('steps')}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view all monitored applicants"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Monitored</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>{totalApplicants}</div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>All tracked applicants</span>
                </div>

                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => openSubpage('steps')}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view hanging steps"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Hanging Steps</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: incompleteCount > 0 ? '#f59e0b' : '#10b981', marginTop: 4 }}>
                    {incompleteCount}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{Math.round((incompleteCount / totalApplicants) * 100)}% incomplete</span>
                </div>

                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => openSubpage('steps')}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view completed steps"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Completed Steps</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>{completeCount}</div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>5 of 5 steps completed</span>
                </div>

                <div
                  className="hd-metric-tile hd-card--interactive"
                  onClick={() => openSubpage('failed_uploads')}
                  style={{ cursor: 'pointer', padding: 14 }}
                  title="Click to view failed uploads"
                >
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Failed Uploads</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: totalFailedUploadsCount > 0 ? '#ef4444' : '#10b981', marginTop: 4 }}>
                    {totalFailedUploadsCount}
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Requires re-upload</span>
                </div>
              </div>
            </div>

            {/* Group 2: 4 Clickable Action Cards (Darker backgrounds, interactive click to show all data) */}
            <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {/* Card 1: Step Progress Desk */}
              <div
                className="hd-card hd-card--interactive"
                onClick={() => openSubpage('steps')}
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>
                      Step Progress Desk
                    </h3>
                    <span className="stitch-status-badge stitch-status-badge--review">
                      {incompleteCount} Hanging
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 6 }}>
                    Level reached &amp; steps covered
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {totalApplicants} Total &bull; {completeCount} Complete
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openSubpage('steps'); }}
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Icon name="chevronRight" size={18} />
                  Open Step Progress Table (Sub-page)
                </button>
              </div>

              {/* Card 2: Failed Uploads Desk */}
              <div
                className="hd-card hd-card--interactive"
                onClick={() => openSubpage('failed_uploads')}
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>
                      Failed Uploads Desk
                    </h3>
                    <span className="stitch-status-badge stitch-status-badge--declined">
                      {totalFailedUploadsCount} Errors
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 6 }}>
                    Document errors &amp; OCR flags
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {totalFailedUploadsCount} Flagged &bull; {failedUploads.filter(u => u.reuploadRequested).length} Re-requested
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openSubpage('failed_uploads'); }}
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Icon name="chevronRight" size={18} />
                  Open Failed Uploads Table (Sub-page)
                </button>
              </div>

              {/* Card 3: Rejected Applications Desk */}
              <div
                className="hd-card hd-card--interactive"
                onClick={() => openSubpage('rejected')}
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>
                      Rejected Applications Desk
                    </h3>
                    <span className="stitch-status-badge stitch-status-badge--declined">
                      {applications.filter(a => a.applicationStatus === 'Rejected').length} Failed
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 6 }}>
                    Flagged applications before appeal
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {applications.filter(a => a.applicationStatus === 'Rejected').length} Cases Ready for Review
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); openSubpage('rejected'); }}
                  className="btn btn--primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Icon name="chevronRight" size={18} />
                  View Rejected Applications
                </button>
              </div>

              {/* Card 4: Mass Broadcast Desk */}
              <div
                className="hd-card hd-card--interactive"
                onClick={() => setMassModalOpen(true)}
                style={{
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>
                      Mass Broadcast Desk
                    </h3>
                    <span className="badge badge--neutral">
                      {massLogs.length} Broadcasts
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-2)', marginBottom: 6 }}>
                    Batch alerts to incomplete applicants
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>
                    {incompleteCount} Targetable &bull; SMS &amp; Portal
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMassModalOpen(true); }}
                  className="btn btn--secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Icon name="support" size={18} />
                  Send Mass Messages
                </button>
              </div>
            </div>

            {/* Mass Message Broadcast Logs (Clean list if any) */}
            {massLogs.length > 0 && (
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                      Recent Broadcasts Log
                    </h4>
                    <span className="badge badge--neutral" style={{ fontSize: '0.72rem' }}>{massLogs.length} Records</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {massLogs.slice(0, 3).map((log) => (
                      <div
                        key={log.id}
                        className="hd-card"
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: 10
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{log.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {log.targetGroup} &bull; {log.recipientCount} recipients &bull; {new Date(log.sentAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <span className="badge badge--success" style={{ fontSize: '0.74rem' }}>{log.channel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* MASS MESSAGE MODAL (No cancel button, auto-prefilled template) */}
        {/* ========================================================= */}
        {massModalOpen && (
          <div className="modal-root" role="presentation">
            <button type="button" className="modal-root__backdrop" onClick={() => setMassModalOpen(false)} aria-label="Close mass message modal" />
            <div
              className="modal-panel hd-card"
              role="dialog"
              aria-modal="true"
              style={{ maxWidth: 540, background: '#070d18', border: '1px solid rgba(255, 255, 255, 0.12)' }}
            >
              <header className="modal-panel__header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <h2 className="modal-panel__title" style={{ color: '#fff', fontSize: '1.1rem' }}>Send Mass Message to Applicants</h2>
                <button type="button" className="modal-panel__close" onClick={() => setMassModalOpen(false)}>×</button>
              </header>
              <form onSubmit={handleSendMassBroadcast} className="modal-panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="field">
                  <label htmlFor="mass-target" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Recipient Target Group</label>
                  <select
                    id="mass-target"
                    value={massTarget}
                    onChange={(e) => handleSelectMassTarget(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                  >
                    <option value="hanging_steps">Applicants with Hanging Steps ({incompleteCount})</option>
                    <option value="failed_uploads">Applicants with Failed Document Uploads ({totalFailedUploadsCount})</option>
                    <option value="rejected_apps">Applicants with Rejected Applications ({applications.filter(a => a.applicationStatus === 'Rejected').length})</option>
                    <option value="all_applicants">All Monitored Applicants ({totalApplicants})</option>
                  </select>
                </div>

                {/* Quick template buttons that also auto-fill */}
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: 6 }}>
                    Quick Message Template (Auto-selected above, or click to switch):
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => handleSelectMassTarget('hanging_steps')}
                    >
                      Hanging Steps
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => handleSelectMassTarget('failed_uploads')}
                    >
                      Failed Uploads
                    </button>
                    <button
                      type="button"
                      className="btn btn--secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                      onClick={() => handleSelectMassTarget('rejected_apps')}
                    >
                      Pre-Appeal Alert
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="mass-title" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Subject</label>
                  <input
                    id="mass-title"
                    type="text"
                    value={massTitle}
                    onChange={(e) => setMassTitle(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff' }}
                  />
                </div>

                <div className="field">
                  <label htmlFor="mass-body" style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8' }}>Message Body (SMS &amp; In-Portal)</label>
                  <textarea
                    id="mass-body"
                    rows={3}
                    value={massBody}
                    onChange={(e) => setMassBody(e.target.value)}
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#0b1422', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#fff', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Footer has NO cancel button - only submit */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                  <button type="submit" className="btn btn--primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                    <Icon name="support" size={16} />
                    Dispatch Mass Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </HelpDeskLayout>
  );
}
