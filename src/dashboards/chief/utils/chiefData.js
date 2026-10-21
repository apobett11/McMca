/**
 * Storage and management for Chief profile, applications, and messages.
 */

import { supabase } from '../../../lib/supabase.js';
import { CHIEF_APPEALS } from '../../../data/chiefMock.js';

const PROFILE_KEY = 'mcmca_chief_profile';
const APPS_KEY = 'mcmca_chief_applications';
const MESSAGES_KEY = 'mcmca_chief_messages';
const APPEALS_KEY = 'mcmca_chief_appeals';

export const CHIEF_ADMIN_AREAS = {
  'Parklands Ward': {
    locations: {
      'Parklands': {
        subLocations: ['Highridge', 'Spring Valley', 'City Park', 'Deep Sea'],
        villages: ['Highridge Village', 'Spring Valley Village', 'City Park Village', 'Deep Sea Village', 'Parklands Chief Camp']
      }
    }
  },
  'Tendeno/Sorget Ward': {
    locations: {
      'Tendeno': {
        subLocations: ['Tendeno Central', 'Tendeno East', 'Tendeno West'],
        villages: ['Tendeno Central Village', 'Kapkures Village', 'Chepsir Village', 'Tendeno Chief Office']
      },
      'Sorget': {
        subLocations: ['Sorget Central', 'Sorget Forest', 'Kipchorian'],
        villages: ['Sorget Central Village', 'Kapsebet Village', 'Kapchelach Village', 'Sorget Camp Office']
      }
    }
  },
  'Westlands Ward': {
    locations: {
      'Westlands': {
        subLocations: ['Kangemi', 'Mountain View', 'Kitisuru'],
        villages: ['Kangemi Central', 'Mountain View Estate', 'Kitisuru Center', 'Westlands Chief Office']
      }
    }
  }
};

export function getLocationKey(ward, location) {
  if (!ward || !location || !CHIEF_ADMIN_AREAS[ward]) return '';
  const locs = CHIEF_ADMIN_AREAS[ward].locations;
  if (locs[location]) return location;
  const stripped = location.replace(/\s+Location$/i, '').trim();
  if (locs[stripped]) return stripped;
  return Object.keys(locs)[0] || '';
}

export function getChiefProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse chief profile from localStorage', e);
  }
  return null;
}

export function saveChiefProfile(profileData) {
  const updated = {
    ...profileData,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_chief_profile_updated', { detail: updated }));
  return updated;
}

export function isChiefProfileComplete(profile) {
  if (!profile) return false;
  return Boolean(
    profile.fullName?.trim() &&
    profile.nationalId?.trim() &&
    profile.phone?.trim() &&
    profile.ward?.trim() &&
    profile.location?.trim() &&
    profile.subLocation?.trim()
  );
}

const INITIAL_APPLICATIONS = [
  {
    id: 'app-1',
    serial: 'BUR-2026-001',
    fullName: 'Brian Kamau',
    dateOfBirth: '2013-04-12',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    grade: 'Grade 7',
    village: 'Highridge Village',
    location: 'Parklands',
    subLocation: 'Highridge',
    idLocation: 'Parklands',
    isSuspicious: false,
    suspicionReason: '',
    submittedDate: '2026-05-28T14:22:00',
    applicationStatus: 'Under Review',
    amountRequested: 'KES 48,000',
    parentName: 'Mary Kamau',
    parentPhone: '0712 345 678',
    parentNationalId: '28475910',
    nationalId: '39485721',
    idNumber: '39485721'
  },
  {
    id: 'app-2',
    serial: 'BUR-2026-002',
    fullName: 'Kevin Ochieng',
    dateOfBirth: '2012-01-20',
    school: 'Westlands Primary',
    educationLevel: 'Primary',
    grade: 'Grade 6',
    village: 'Spring Valley Village',
    location: 'Parklands',
    subLocation: 'Spring Valley',
    idLocation: 'Nakuru West',
    isSuspicious: true,
    suspicionReason: 'Location stated on uploaded National ID reads "Nakuru West", but applicant submitted for "Parklands / Spring Valley".',
    submittedDate: '2026-05-26T09:40:00',
    applicationStatus: 'Under Review',
    amountRequested: 'KES 40,000',
    parentName: 'Jane Ochieng',
    parentPhone: '0723 456 789',
    parentNationalId: '19482039',
    nationalId: '40192837',
    idNumber: '40192837'
  },
  {
    id: 'app-3',
    serial: 'BUR-2026-003',
    fullName: 'Grace Mwangi',
    dateOfBirth: '2009-11-05',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    grade: 'Form 3',
    village: 'Highridge Village',
    location: 'Parklands',
    subLocation: 'Highridge',
    idLocation: 'Parklands',
    isSuspicious: false,
    suspicionReason: '',
    submittedDate: '2026-05-25T16:00:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 58,000',
    parentName: 'Alice Mwangi',
    parentPhone: '0734 567 890',
    parentNationalId: '22849102',
    nationalId: '38192048',
    idNumber: '38192048'
  },
  {
    id: 'app-4',
    serial: 'BUR-2026-004',
    fullName: 'Faith Chebet',
    dateOfBirth: '2010-08-03',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    grade: 'Form 2',
    village: 'City Park Village',
    location: 'Parklands',
    subLocation: 'City Park',
    idLocation: 'Kericho Central',
    isSuspicious: true,
    suspicionReason: 'Uploaded ID record indicates "Kericho Central" residency, which does not match this ward.',
    submittedDate: '2026-05-27T10:15:00',
    applicationStatus: 'Under Review',
    amountRequested: 'KES 55,000',
    parentName: 'David Chebet',
    parentPhone: '0745 678 901',
    parentNationalId: '18492019',
    nationalId: '41920192',
    idNumber: '41920192'
  },
  {
    id: 'app-5',
    serial: 'BUR-2026-005',
    fullName: 'James Otieno',
    dateOfBirth: '2004-06-18',
    school: 'University of Nairobi',
    educationLevel: 'Tertiary',
    grade: 'Year 2',
    village: 'Deep Sea Village',
    location: 'Parklands',
    subLocation: 'Highridge',
    idLocation: 'Parklands',
    isSuspicious: false,
    suspicionReason: '',
    submittedDate: '2026-05-24T12:00:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 75,000',
    parentName: 'Eunice Otieno',
    parentPhone: '0756 789 012',
    parentNationalId: '14920182',
    nationalId: '36920194',
    idNumber: '36920194'
  },
  {
    id: 'app-6',
    serial: 'BUR-2026-006',
    fullName: 'Beatrice Wanjiku',
    dateOfBirth: '2008-03-22',
    school: 'Nairobi School',
    educationLevel: 'Secondary',
    grade: 'Form 4',
    village: 'Spring Valley Village',
    location: 'Parklands',
    subLocation: 'Spring Valley',
    idLocation: 'Eldoret East',
    isSuspicious: true,
    suspicionReason: 'Birth Certificate and Parent ID indicate "Eldoret East" jurisdiction, failing local residence match.',
    submittedDate: '2026-05-28T09:12:00',
    applicationStatus: 'Under Review',
    amountRequested: 'KES 62,000',
    parentName: 'Joseph Wanjiku',
    parentPhone: '0767 890 123',
    parentNationalId: '17492049',
    nationalId: '39502914',
    idNumber: '39502914'
  },
  {
    id: 'app-7',
    serial: 'BUR-2026-007',
    fullName: 'Denis Kiprono',
    dateOfBirth: '2011-12-14',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    grade: 'Grade 8',
    village: 'Highridge Village',
    location: 'Parklands',
    subLocation: 'Highridge',
    idLocation: 'Highridge',
    isSuspicious: false,
    suspicionReason: '',
    submittedDate: '2026-05-29T11:30:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 45,000',
    parentName: 'Grace Kiprono',
    parentPhone: '0778 901 234',
    parentNationalId: '20491829',
    nationalId: '42910492',
    idNumber: '42910492'
  },
  {
    id: 'app-8',
    serial: 'BUR-2026-008',
    fullName: 'Mercy Achieng',
    dateOfBirth: '2006-09-30',
    school: 'Kenya Medical Training College',
    educationLevel: 'Tertiary',
    grade: 'Year 1',
    village: 'City Park Village',
    location: 'Parklands',
    subLocation: 'City Park',
    idLocation: 'Parklands',
    isSuspicious: false,
    suspicionReason: '',
    submittedDate: '2026-05-27T14:45:00',
    applicationStatus: 'Rejected',
    amountRequested: 'KES 70,000',
    parentName: 'Peter Achieng',
    parentPhone: '0789 012 345',
    parentNationalId: '13940192',
    nationalId: '35940192',
    idNumber: '35940192'
  }
];

export function getChiefApplications() {
  let stored = INITIAL_APPLICATIONS;
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (raw) stored = JSON.parse(raw);
    else localStorage.setItem(APPS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
  } catch (e) {
    console.error('Failed to parse chief applications', e);
  }

  let submitted = [];
  try {
    submitted = JSON.parse(localStorage.getItem('mcmca_submitted_applications') || '[]');
  } catch {}
  let session = [];
  try {
    session = JSON.parse(sessionStorage.getItem('mcmca_session_applications') || '[]');
  } catch {}

  const normalized = [...submitted, ...session].map(a => ({
    id: a.id || a.serial,
    serial: a.serial || `BUR-2026-${String(a.id || '').replace(/\D/g, '').slice(-4).padStart(4, '0')}`,
    fullName: a.fullName || a.studentName || 'Student Applicant',
    dateOfBirth: a.dateOfBirth || '2008-01-01',
    school: a.school || a.institution_name || 'Institution on file',
    educationLevel: a.educationLevel || a.institution_level || 'Secondary',
    grade: a.grade || 'Form 1',
    village: a.village || 'Tendeno Central Village',
    location: a.location || 'Tendeno',
    subLocation: a.subLocation || a.village || 'Tendeno Central',
    idLocation: a.idLocation || a.location || 'Tendeno',
    isSuspicious: Boolean(a.isSuspicious),
    suspicionReason: a.suspicionReason || '',
    submittedDate: a.submittedDate || a.submitted_at || a.created_at || new Date().toISOString(),
    applicationStatus: a.chief_recommended ? 'Approved' : (a.applicationStatus || 'Under Review'),
    amountRequested: a.amountRequested || (a.requested_amount ? `KES ${Number(a.requested_amount).toLocaleString()}` : 'KES 45,000'),
    parentName: a.parentName || 'Guardian on file',
    parentPhone: a.parentPhone || a.phone || '',
    parentNationalId: a.parentNationalId || '',
    nationalId: a.nationalId || a.idNumber || '',
    idNumber: a.nationalId || a.idNumber || ''
  }));

  const all = [...normalized, ...stored];
  return Array.from(new Map(all.map(a => [a.id || a.serial, a])).values());
}

export async function syncChiefApplicationsFromDB() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select('*, student_profiles(*), application_details(*)');
      if (!error && data && data.length > 0) {
        const fromDb = data.map((app) => {
          const profile = app.student_profiles || {};
          const details = app.application_details?.[0] || {};
          const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || 'Student Applicant';
          const serial = `BUR-${new Date(app.created_at || Date.now()).getFullYear()}-${String(profile.national_id || app.id).replace(/\D/g, '').slice(-4).padStart(4, '0')}`;
          return {
            id: app.id,
            serial,
            fullName,
            dateOfBirth: profile.date_of_birth || '2008-01-01',
            school: app.institution_name || profile.school_name || 'Institution on file',
            educationLevel: app.institution_level || profile.school_level || 'Secondary',
            grade: 'Form 1',
            village: profile.ward ? `${profile.ward} Village` : 'Tendeno Central Village',
            location: profile.county || 'Tendeno',
            subLocation: profile.ward || 'Tendeno Central',
            idLocation: profile.county || 'Tendeno',
            isSuspicious: false,
            suspicionReason: '',
            submittedDate: app.submitted_at || app.created_at || new Date().toISOString(),
            applicationStatus: app.chief_recommended ? 'Approved' : (app.application_status === 'approved' ? 'Approved' : app.application_status === 'rejected' ? 'Rejected' : 'Under Review'),
            amountRequested: app.requested_amount ? `KES ${Number(app.requested_amount).toLocaleString()}` : 'KES 45,000',
            parentName: details.guardian_name || 'Guardian on file',
            parentPhone: details.guardian_phone || profile.phone_number || '',
            parentNationalId: '',
            nationalId: profile.national_id || '',
            idNumber: profile.national_id || ''
          };
        });
        const current = getChiefApplications();
        const merged = Array.from(new Map([...fromDb, ...current].map(a => [a.id || a.serial, a])).values());
        localStorage.setItem(APPS_KEY, JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('mcmca_chief_apps_updated', { detail: merged }));
        return merged;
      }
    } catch (err) {
      console.warn('Chief DB sync fallback:', err);
    }
  }
  return getChiefApplications();
}

export function updateChiefApplicationDecision(appId, decision, reviewNotes = '') {
  const current = getChiefApplications();
  const now = new Date().toISOString();
  let updatedTarget = null;
  const updated = current.map((app) => {
    if (app.id === appId) {
      updatedTarget = {
        ...app,
        applicationStatus: decision === 'approve' ? 'Approved' : 'Rejected',
        reviewNotes: reviewNotes || (decision === 'approve' ? 'Approved by Chief after review.' : 'Rejected by Chief due to verification failure.'),
        reviewedAt: now
      };
      return updatedTarget;
    }
    return app;
  });
  localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_chief_apps_updated', { detail: updated }));

  // Cross-dashboard propagation to submitted registry
  try {
    const rawSub = localStorage.getItem('mcmca_submitted_applications');
    if (rawSub) {
      const subList = JSON.parse(rawSub);
      const updatedSub = subList.map((a) => {
        if (a.id === appId || a.serial === updatedTarget?.serial) {
          return {
            ...a,
            status: decision === 'approve' ? 'Recommended by Chief' : 'Rejected by Chief',
            application_status: decision === 'approve' ? 'chief_approved' : 'rejected',
            chief_recommended: decision === 'approve',
            chief_notes: reviewNotes
          };
        }
        return a;
      });
      localStorage.setItem('mcmca_submitted_applications', JSON.stringify(updatedSub));
      window.dispatchEvent(new CustomEvent('mcmca_apps_updated', { detail: updatedSub }));
    }
  } catch (err) {
    console.warn('Cross sync submitted apps failed:', err);
  }

  // Persist to Supabase DB if possible
  if (supabase && updatedTarget && typeof appId === 'string' && appId.length > 20) {
    supabase.from('student_applications').update({
      chief_recommended: decision === 'approve',
      application_status: decision === 'approve' ? 'chief_approved' : 'rejected',
      updated_at: now
    }).eq('id', appId).then(() => {}).catch(() => {});
  }

  return updated;
}

const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    senderName: 'Mary Kamau',
    senderRole: 'Parent',
    studentName: 'Brian Kamau',
    subject: 'Verification query for Highridge residence',
    body: 'Good morning Chief. I submitted Brian Kamau\'s bursary application. Kindly let me know if you need any additional utility bills to verify our Highridge residence.',
    submittedDate: '2026-10-02T08:14:00',
    status: 'unread',
    replies: []
  },
  {
    id: 'msg-2',
    senderName: 'Kevin Ochieng',
    senderRole: 'Applicant',
    studentName: 'Kevin Ochieng',
    subject: 'Clarification regarding National ID location mismatch',
    body: 'Greetings Chief. My national ID was issued in Nakuru West when my family lived there 2 years ago, but we have lived in Spring Valley for over 18 months now. Please advise how I can verify this.',
    submittedDate: '2026-10-01T16:30:00',
    status: 'to_be_replied',
    replies: []
  },
  {
    id: 'msg-3',
    senderName: 'Alice Mwangi',
    senderRole: 'Parent',
    studentName: 'Grace Mwangi',
    subject: 'Confirmation of approval status',
    body: 'Hello Chief, thank you for reviewing Grace\'s application. Is there any signed verification letter required to submit to the school bursar?',
    submittedDate: '2026-09-24T11:20:00',
    status: 'unread',
    replies: []
  },
  {
    id: 'msg-4',
    senderName: 'David Chebet',
    senderRole: 'Parent',
    studentName: 'Faith Chebet',
    subject: 'Request for in-person appointment',
    body: 'Dear Chief, I would like to visit the office with my family registration book to clear up the address question on Faith\'s file.',
    submittedDate: '2026-09-15T14:10:00',
    status: 'replied',
    replies: [
      {
        sender: 'Chief Peter Waweru',
        body: 'Please visit the office on Tuesday morning between 9:00 AM and 11:30 AM with your original ID and two passport photos.',
        sentAt: '2026-09-15T16:45:00'
      }
    ]
  },
  {
    id: 'msg-5',
    senderName: 'Joseph Mutua',
    senderRole: 'Parent',
    studentName: 'Samuel Mutua',
    subject: 'Submission of amended guardianship affidavit',
    body: 'Chief, I have uploaded the stamp from the commissioner of oaths to Samuel\'s bursary appeal dossier. Kindly review when convenient.',
    submittedDate: '2026-08-28T09:45:00',
    status: 'replied',
    replies: [
      {
        sender: 'Chief Peter Waweru',
        body: 'Affidavit received and verified against the sub-county civil registry records. Approved for committee consideration.',
        sentAt: '2026-08-28T14:20:00'
      }
    ]
  },
  {
    id: 'msg-6',
    senderName: 'Beatrice Wanjiku',
    senderRole: 'Applicant',
    studentName: 'Beatrice Wanjiku',
    subject: 'Appeal hearing schedule inquiry',
    body: 'Respected Chief, my appeal regarding the Nairobi School tuition allocation was filed last month. May I know when the ward vetting panel sits?',
    submittedDate: '2026-08-12T10:00:00',
    status: 'to_be_replied',
    replies: []
  }
];

export function getChiefMessages() {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse chief messages', e);
  }
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
  return INITIAL_MESSAGES;
}

export function openChiefMessage(msgId) {
  const messages = getChiefMessages();
  const updated = messages.map((m) => {
    // If it is unread, it transitions to 'to_be_replied'. It will NOT be marked read/resolved until replied!
    if (m.id === msgId && m.status === 'unread') {
      return { ...m, status: 'to_be_replied', openedAt: new Date().toISOString() };
    }
    return m;
  });
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_chief_messages_updated', { detail: updated }));
  return updated;
}

export function replyToChiefMessage(msgId, answerText, chiefName = 'Chief') {
  if (!answerText?.trim()) return getChiefMessages();
  const messages = getChiefMessages();
  const updated = messages.map((m) => {
    if (m.id === msgId) {
      const existingReplies = m.replies || [];
      return {
        ...m,
        status: 'replied',
        replies: [
          ...existingReplies,
          {
            sender: chiefName,
            body: answerText.trim(),
            sentAt: new Date().toISOString()
          }
        ]
      };
    }
    return m;
  });
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_chief_messages_updated', { detail: updated }));
  return updated;
}

export function getChiefAppeals() {
  try {
    const raw = localStorage.getItem(APPEALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse chief appeals', e);
  }
  localStorage.setItem(APPEALS_KEY, JSON.stringify(CHIEF_APPEALS));
  return CHIEF_APPEALS;
}

export function updateChiefAppealDecision(appealId, decision, notes = '') {
  const list = getChiefAppeals();
  const statusMap = {
    approve: 'Approved',
    reject: 'Rejected',
    clarify: 'Clarification Requested'
  };
  const updated = list.map((a) => {
    if (a.id === appealId) {
      return {
        ...a,
        appealStatus: statusMap[decision] || 'Under Review',
        reviewNotes: notes,
        lastUpdated: new Date().toISOString(),
        actionHistory: [
          ...(a.actionHistory || []),
          {
            action: `Appeal ${statusMap[decision] || decision}`,
            timestamp: new Date().toISOString(),
            note: notes
          }
        ]
      };
    }
    return a;
  });
  localStorage.setItem(APPEALS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_chief_appeals_updated', { detail: updated }));
  return updated;
}

export function getChiefUpdateCounts() {
  const apps = getChiefApplications();
  const appeals = getChiefAppeals();
  const msgs = getChiefMessages();

  const pendingApps = apps.filter(
    (a) => a.applicationStatus === 'Under Review' || a.applicationStatus === 'Submitted' || a.isSuspicious
  ).length;

  const pendingAppeals = appeals.filter(
    (a) => a.appealStatus === 'Submitted' || a.appealStatus === 'Under Review' || a.appealStatus === 'Clarification Requested'
  ).length;

  const pendingMsgs = msgs.filter(
    (m) => m.status === 'unread' || m.status === 'to_be_replied'
  ).length;

  return {
    applications: pendingApps,
    appeals: pendingAppeals,
    messages: pendingMsgs,
    hasAnyUpdate: pendingApps > 0 || pendingAppeals > 0 || pendingMsgs > 0
  };
}

export function bulkApproveCleanApplications() {
  const current = getChiefApplications();
  let count = 0;
  const approvedIds = new Set();
  const now = new Date().toISOString();
  const updated = current.map((app) => {
    // Only accept non-suspicious applications that are not already approved
    if (!app.isSuspicious && app.applicationStatus !== 'Approved') {
      count++;
      approvedIds.add(app.id);
      approvedIds.add(app.serial);
      return {
        ...app,
        applicationStatus: 'Approved',
        reviewNotes: 'Bulk-approved by Chief: verified resident with consistent records.',
        reviewedAt: now
      };
    }
    return app;
  });
  if (count > 0) {
    localStorage.setItem(APPS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('mcmca_chief_apps_updated', { detail: updated }));

    try {
      const rawSub = localStorage.getItem('mcmca_submitted_applications');
      if (rawSub) {
        const subList = JSON.parse(rawSub);
        const updatedSub = subList.map((a) => {
          if (approvedIds.has(a.id) || approvedIds.has(a.serial)) {
            return {
              ...a,
              status: 'Recommended by Chief',
              application_status: 'chief_approved',
              chief_recommended: true,
              chief_notes: 'Bulk-approved by Chief: verified resident with consistent records.'
            };
          }
          return a;
        });
        localStorage.setItem('mcmca_submitted_applications', JSON.stringify(updatedSub));
        window.dispatchEvent(new CustomEvent('mcmca_apps_updated', { detail: updatedSub }));
      }
    } catch (err) {
      console.warn('Cross sync bulk approve failed:', err);
    }
  }
  return { updated, count };
}

