/** Demo data for chief review workspace — replace with API + RLS-backed fetches. */

export const CHIEF = {
  fullName: 'Chief Peter Waweru',
  nationalId: '•••• •••• 3421',
  phone: '07XX *** **42',
  email: 'chief.waweru@example.com',
  verificationStatus: 'Verified',
  ward: 'Westlands Ward',
  location: 'Parklands',
  subLocation: 'Highridge'
};

export const CHIEF_SUMMARY = {
  pendingApplications: 12,
  pendingAppeals: 3,
  applicationsReviewedToday: 5,
  appealsReviewedToday: 1
};

export const CHIEF_NOTIFICATIONS = [
  {
    id: 'notif-1',
    studentName: 'Brian Kamau',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    type: 'New Application Submitted',
    timestamp: '2026-05-29T08:14:00',
    targetType: 'application',
    targetId: 'app-1',
    unread: true
  },
  {
    id: 'notif-2',
    studentName: 'Grace Mwangi',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    type: 'Clarification Response Received',
    timestamp: '2026-05-29T07:42:00',
    targetType: 'application',
    targetId: 'app-4',
    unread: true
  },
  {
    id: 'notif-3',
    studentName: 'Samuel Otieno',
    school: 'Nairobi School',
    educationLevel: 'Secondary',
    type: 'New Appeal Submitted',
    timestamp: '2026-05-28T16:30:00',
    targetType: 'appeal',
    targetId: 'appeal-1',
    unread: false
  },
  {
    id: 'notif-4',
    studentName: 'Faith Kamau',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    type: 'Application Updated',
    timestamp: '2026-05-28T11:05:00',
    targetType: 'application',
    targetId: 'app-2',
    unread: false
  },
  {
    id: 'notif-5',
    studentName: 'System',
    school: '—',
    educationLevel: '—',
    type: 'System Review Notice',
    timestamp: '2026-05-27T09:00:00',
    targetType: 'system',
    targetId: null,
    unread: false
  }
];

export const CHIEF_APPLICATIONS = [
  {
    id: 'app-1',
    fullName: 'Brian Kamau',
    dateOfBirth: '2013-04-12',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    grade: 'Grade 7',
    location: 'Parklands',
    subLocation: 'Highridge',
    cycle: '2025/2026',
    submittedDate: '2026-05-28T14:22:00',
    applicationStatus: 'Submitted',
    documentStatus: 'Pending Verification',
    riskFlagStatus: 'Verification Needed',
    lastUpdated: '2026-05-29T08:14:00',
    admissionNumber: 'SM-2019-0442',
    parentName: 'Mary Kamau',
    parentPhone: '07XX *** **19',
    contactEmail: 'mary.kamau@example.com',
    amountRequested: 'KES 48,000',
    previousAllocations: 'KES 42,000 (2024/2025)',
    reviewNotes: '',
    actionHistory: []
  },
  {
    id: 'app-2',
    fullName: 'Faith Kamau',
    dateOfBirth: '2010-08-03',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    grade: 'Form 2',
    location: 'Parklands',
    subLocation: 'Highridge',
    cycle: '2025/2026',
    submittedDate: '2026-05-27T10:15:00',
    applicationStatus: 'Under Review',
    documentStatus: 'Complete',
    riskFlagStatus: 'No Issues',
    lastUpdated: '2026-05-28T11:05:00',
    admissionNumber: 'PGH-2022-1188',
    parentName: 'Mary Kamau',
    parentPhone: '07XX *** **19',
    contactEmail: 'mary.kamau@example.com',
    amountRequested: 'KES 55,000',
    previousAllocations: 'KES 50,000 (2024/2025)',
    reviewNotes: 'Documents verified — pending final approval.',
    actionHistory: [
      { action: 'Review started', timestamp: '2026-05-27T15:00:00', by: 'Chief Waweru' }
    ]
  },
  {
    id: 'app-3',
    fullName: 'Kevin Ochieng',
    dateOfBirth: '2012-01-20',
    school: 'Westlands Primary',
    educationLevel: 'Primary',
    grade: 'Grade 6',
    location: 'Parklands',
    subLocation: 'Spring Valley',
    cycle: '2025/2026',
    submittedDate: '2026-05-26T09:40:00',
    applicationStatus: 'Pending Clarification',
    documentStatus: 'Missing Documents',
    riskFlagStatus: 'Incomplete Information',
    lastUpdated: '2026-05-27T08:30:00',
    admissionNumber: 'WP-2020-0311',
    parentName: 'Jane Ochieng',
    parentPhone: '07XX *** **55',
    contactEmail: 'jane.ochieng@example.com',
    amountRequested: 'KES 40,000',
    previousAllocations: 'None',
    reviewNotes: 'Requested birth certificate upload.',
    actionHistory: [
      {
        action: 'Clarification requested',
        timestamp: '2026-05-27T08:30:00',
        by: 'Chief Waweru',
        note: 'Birth certificate missing or unreadable.'
      }
    ]
  },
  {
    id: 'app-4',
    fullName: 'Grace Mwangi',
    dateOfBirth: '2009-11-05',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    grade: 'Form 3',
    location: 'Parklands',
    subLocation: 'Highridge',
    cycle: '2025/2026',
    submittedDate: '2026-05-25T16:00:00',
    applicationStatus: 'Under Review',
    documentStatus: 'Complete',
    riskFlagStatus: 'Duplicate Warning',
    lastUpdated: '2026-05-29T07:42:00',
    admissionNumber: 'PGH-2021-0992',
    parentName: 'Alice Mwangi',
    parentPhone: '07XX *** **88',
    contactEmail: 'alice.mwangi@example.com',
    amountRequested: 'KES 58,000',
    previousAllocations: 'KES 52,000 (2024/2025)',
    reviewNotes: 'Clarification response received — verify duplicate admission number.',
    actionHistory: [
      {
        action: 'Clarification requested',
        timestamp: '2026-05-26T10:00:00',
        by: 'Chief Waweru'
      },
      {
        action: 'Clarification response received',
        timestamp: '2026-05-29T07:42:00',
        by: 'Student'
      }
    ]
  },
  {
    id: 'app-5',
    fullName: 'James Otieno',
    dateOfBirth: '2004-06-18',
    school: 'University of Nairobi',
    educationLevel: 'Tertiary',
    grade: 'Year 2',
    location: 'Parklands',
    subLocation: 'Highridge',
    cycle: '2025/2026',
    submittedDate: '2026-05-24T11:20:00',
    applicationStatus: 'Approved',
    documentStatus: 'Complete',
    riskFlagStatus: 'No Issues',
    lastUpdated: '2026-05-25T14:00:00',
    admissionNumber: 'UON-2023-8821',
    parentName: 'Self (Adult student)',
    parentPhone: '07XX *** **77',
    contactEmail: 'james.otieno@example.com',
    amountRequested: 'KES 85,000',
    previousAllocations: 'KES 80,000 (2024/2025)',
    reviewNotes: 'Approved — all documents verified.',
    actionHistory: [
      { action: 'Approved', timestamp: '2026-05-25T14:00:00', by: 'Chief Waweru' }
    ]
  }
];

export const APPLICATION_DOCUMENTS = {
  'app-1': [
    {
      id: 'doc-a1-1',
      type: 'Fee Structure',
      verificationStatus: 'Pending Review',
      uploadDate: '2026-05-28T14:20:00'
    },
    {
      id: 'doc-a1-2',
      type: 'Admission Letter',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-28T14:18:00'
    },
    {
      id: 'doc-a1-3',
      type: 'School ID',
      verificationStatus: 'Pending Review',
      uploadDate: '2026-05-28T14:19:00'
    },
    {
      id: 'doc-a1-4',
      type: 'Birth Certificate',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-28T14:17:00'
    },
    {
      id: 'doc-a1-5',
      type: 'Report Form',
      verificationStatus: 'Pending Review',
      uploadDate: '2026-05-28T14:21:00'
    }
  ],
  'app-2': [
    {
      id: 'doc-a2-1',
      type: 'Fee Structure',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-27T10:10:00'
    },
    {
      id: 'doc-a2-2',
      type: 'Admission Letter',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-27T10:08:00'
    },
    {
      id: 'doc-a2-3',
      type: 'National ID',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-27T10:12:00'
    }
  ],
  'app-4': [
    {
      id: 'doc-a4-1',
      type: 'Fee Structure',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-25T15:55:00'
    },
    {
      id: 'doc-a4-2',
      type: 'Report Form',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-25T15:58:00'
    }
  ]
};

export const APPLICATION_AI_EXTRACTION = {
  'app-1': {
    ocrData: {
      studentName: 'Brian Kamau',
      school: 'St. Mary Primary School',
      feeAmount: 'KES 48,000',
      admissionNo: 'SM-2019-0442'
    },
    visibilityStatus: 'Visible',
    verificationStatus: 'Partially Verified',
    warnings: ['Fee amount on fee structure differs from application by KES 2,000']
  },
  'app-4': {
    ocrData: {
      studentName: 'Grace Mwangi',
      school: 'Parklands Girls High',
      admissionNo: 'PGH-2021-0992'
    },
    visibilityStatus: 'Visible',
    verificationStatus: 'Pending Review',
    warnings: ['Possible duplicate admission number detected in ward records']
  }
};

export const CHIEF_APPEALS = [
  {
    id: 'appeal-1',
    applicationId: 'app-rejected-1',
    fullName: 'Samuel Otieno',
    school: 'Nairobi School',
    educationLevel: 'Secondary',
    grade: 'Form 4',
    cycle: '2025/2026',
    originalApplicationStatus: 'Rejected',
    appealStatus: 'Submitted',
    appealSubmissionDate: '2026-05-28T16:30:00',
    supportingDocumentsStatus: 'Pending Verification',
    lastUpdated: '2026-05-28T16:30:00',
    appealReason:
      'Required documents were uploaded after the initial deadline due to school administration delay.',
    originalRejectionReason: 'Missing fee structure and incomplete report form.',
    originalReviewNotes: 'Documents incomplete at time of review.',
    actionHistory: []
  },
  {
    id: 'appeal-2',
    applicationId: 'app-rejected-2',
    fullName: 'Lucy Wanjiku',
    school: 'Westlands Secondary',
    educationLevel: 'Secondary',
    grade: 'Form 1',
    cycle: '2025/2026',
    originalApplicationStatus: 'Rejected',
    appealStatus: 'Under Review',
    appealSubmissionDate: '2026-05-27T12:00:00',
    supportingDocumentsStatus: 'Complete',
    lastUpdated: '2026-05-28T09:15:00',
    appealReason: 'Family income changed after initial application — new supporting affidavit attached.',
    originalRejectionReason: 'Income threshold exceeded based on submitted documents.',
    originalReviewNotes: 'PAYE slip indicated income above ward threshold.',
    actionHistory: [
      { action: 'Review started', timestamp: '2026-05-28T09:15:00', by: 'Chief Waweru' }
    ]
  },
  {
    id: 'appeal-3',
    applicationId: 'app-rejected-3',
    fullName: 'Daniel Kiprop',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    grade: 'Grade 8',
    cycle: '2025/2026',
    originalApplicationStatus: 'Rejected',
    appealStatus: 'Clarification Requested',
    appealSubmissionDate: '2026-05-26T08:45:00',
    supportingDocumentsStatus: 'Missing Documents',
    lastUpdated: '2026-05-27T11:00:00',
    appealReason: 'Appeal against rejection — guardian change not reflected in original application.',
    originalRejectionReason: 'Guardian information could not be verified.',
    originalReviewNotes: 'Guardian ID did not match ward records.',
    actionHistory: [
      {
        action: 'Clarification requested',
        timestamp: '2026-05-27T11:00:00',
        by: 'Chief Waweru',
        note: 'Provide legal guardianship documentation.'
      }
    ]
  }
];

export const APPEAL_DOCUMENTS = {
  'appeal-1': [
    {
      id: 'doc-ap1-1',
      type: 'Fee Structure',
      verificationStatus: 'Pending Review',
      uploadDate: '2026-05-28T16:28:00'
    },
    {
      id: 'doc-ap1-2',
      type: 'Report Form',
      verificationStatus: 'Pending Review',
      uploadDate: '2026-05-28T16:29:00'
    }
  ],
  'appeal-2': [
    {
      id: 'doc-ap2-1',
      type: 'National ID',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-27T11:58:00'
    },
    {
      id: 'doc-ap2-2',
      type: 'Birth Certificate',
      verificationStatus: 'Verified',
      uploadDate: '2026-05-27T11:55:00'
    }
  ]
};

export const APPEAL_ORIGINAL_APPLICATIONS = {
  'appeal-1': {
    amountRequested: 'KES 62,000',
    submittedDate: '2026-05-15T10:00:00',
    documentStatus: 'Missing Documents',
    amountAllocated: '—'
  },
  'appeal-2': {
    amountRequested: 'KES 50,000',
    submittedDate: '2026-05-10T09:30:00',
    documentStatus: 'Complete',
    amountAllocated: '—'
  },
  'appeal-3': {
    amountRequested: 'KES 44,000',
    submittedDate: '2026-05-08T14:00:00',
    documentStatus: 'Complete',
    amountAllocated: '—'
  }
};

export const CLARIFICATION_REASONS = [
  'Missing or unreadable document',
  'Information mismatch with uploaded documents',
  'Incomplete guardian or contact details',
  'Duplicate application concern',
  'Other — specify in notes'
];

export const REJECTION_REASONS = [
  'Documents incomplete or invalid',
  'Does not meet eligibility criteria',
  'Duplicate application confirmed',
  'Information could not be verified',
  'Other — specify in notes'
];
