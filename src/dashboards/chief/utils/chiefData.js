/**
 * Storage and management for Chief profile, applications, and messages.
 */

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
  try {
    const raw = localStorage.getItem(APPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse chief applications', e);
  }
  localStorage.setItem(APPS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
  return INITIAL_APPLICATIONS;
}

export function updateChiefApplicationDecision(appId, decision, reviewNotes = '') {
  const current = getChiefApplications();
  const updated = current.map((app) => {
    if (app.id === appId) {
      return {
        ...app,
        applicationStatus: decision === 'approve' ? 'Approved' : 'Rejected',
        reviewNotes: reviewNotes || (decision === 'approve' ? 'Approved by Chief after review.' : 'Rejected by Chief due to verification failure.'),
        reviewedAt: new Date().toISOString()
      };
    }
    return app;
  });
  localStorage.setItem(APPS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_chief_apps_updated', { detail: updated }));
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
    submittedDate: '2026-05-29T08:14:00',
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
    submittedDate: '2026-05-28T16:30:00',
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
    submittedDate: '2026-05-27T11:20:00',
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
    submittedDate: '2026-05-26T14:10:00',
    status: 'replied',
    replies: [
      {
        sender: 'Chief Peter Waweru',
        body: 'Please visit the office on Tuesday morning between 9:00 AM and 11:30 AM with your original ID and two passport photos.',
        sentAt: '2026-05-26T16:45:00'
      }
    ]
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
