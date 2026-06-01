/** Demo data for parent household overview — replace with API + RLS-backed fetches. */

export const PARENT = {
  fullName: 'Mary Kamau',
  nationalId: '•••• •••• 5678',
  phone: '07XX *** **19',
  email: 'mary.kamau@example.com',
  verificationStatus: 'Verified',
  ward: 'Westlands Ward'
};

export const LINKED_STUDENTS = [
  {
    id: 'stu-brian',
    fullName: 'Brian Kamau',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    grade: 'Grade 7',
    applicationStatus: 'Under Review',
    amountAllocated: 'KES 45,000',
    profileStatus: 'Complete',
    documentStatus: 'Missing Documents',
    latestNotification: 'Missing fee structure',
    latestActivity: 'Uploaded fee structure',
    accessType: 'Full Control',
    requiresAttention: true,
    avatarColor: 'blue'
  },
  {
    id: 'stu-faith',
    fullName: 'Faith Kamau',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    grade: 'Form 2',
    applicationStatus: 'Approved',
    amountAllocated: 'KES 52,000',
    profileStatus: 'Complete',
    documentStatus: 'Complete',
    latestNotification: 'Application approved',
    latestActivity: 'Document verified',
    accessType: 'Delegated Access',
    requiresAttention: false,
    avatarColor: 'violet'
  },
  {
    id: 'stu-james',
    fullName: 'James Otieno',
    school: 'University of Nairobi',
    educationLevel: 'Tertiary',
    grade: 'Year 2',
    applicationStatus: 'Disbursed',
    amountAllocated: 'KES 80,000',
    profileStatus: 'Pending Verification',
    documentStatus: 'Pending Verification',
    latestNotification: 'Allocation notice',
    latestActivity: 'Logged in recently',
    accessType: 'Viewer Only',
    requiresAttention: false,
    avatarColor: 'teal',
    isAdult: true
  }
];

export const APPLICATIONS_AGGREGATE = [
  {
    id: 'app-1',
    studentId: 'stu-brian',
    fullName: 'Brian Kamau',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    grade: 'Grade 7',
    cycle: '2025/2026',
    submittedDate: '2026-01-15',
    applicationStatus: 'Under Review',
    amountRequested: 'KES 48,000',
    amountAllocated: 'KES 45,000',
    lastUpdated: '2026-05-20',
    accessType: 'Full Control',
    requiresAttention: true
  },
  {
    id: 'app-2',
    studentId: 'stu-faith',
    fullName: 'Faith Kamau',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    grade: 'Form 2',
    cycle: '2025/2026',
    submittedDate: '2026-01-10',
    applicationStatus: 'Approved',
    amountRequested: 'KES 55,000',
    amountAllocated: 'KES 52,000',
    lastUpdated: '2026-05-18',
    accessType: 'Delegated Access',
    requiresAttention: false
  },
  {
    id: 'app-3',
    studentId: 'stu-james',
    fullName: 'James Otieno',
    school: 'University of Nairobi',
    educationLevel: 'Tertiary',
    grade: 'Year 2',
    cycle: '2024/2025',
    submittedDate: '2025-03-22',
    applicationStatus: 'Disbursed',
    amountRequested: 'KES 85,000',
    amountAllocated: 'KES 80,000',
    lastUpdated: '2025-09-05',
    accessType: 'Viewer Only',
    requiresAttention: false
  }
];

export const DOCUMENTS_AGGREGATE = [
  {
    id: 'doc-1',
    studentId: 'stu-brian',
    fullName: 'Brian Kamau',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    cycle: '2025/2026',
    documentStatus: 'Missing Fee Structure',
    missingDocuments: 'Fee structure',
    verificationStatus: 'Pending Review',
    lastUploadDate: '2026-01-10',
    accessType: 'Full Control',
    requiresAttention: true
  },
  {
    id: 'doc-2',
    studentId: 'stu-faith',
    fullName: 'Faith Kamau',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    cycle: '2025/2026',
    documentStatus: 'Complete',
    missingDocuments: '—',
    verificationStatus: 'Verified',
    lastUploadDate: '2026-01-08',
    accessType: 'Delegated Access',
    requiresAttention: false
  },
  {
    id: 'doc-3',
    studentId: 'stu-james',
    fullName: 'James Otieno',
    school: 'University of Nairobi',
    educationLevel: 'Tertiary',
    cycle: '2024/2025',
    documentStatus: 'Pending Verification',
    missingDocuments: '—',
    verificationStatus: 'Pending Review',
    lastUploadDate: '2025-03-20',
    accessType: 'Viewer Only',
    requiresAttention: false
  }
];

export const NOTIFICATIONS_AGGREGATE = [
  {
    id: 'n1',
    studentId: 'stu-brian',
    studentName: 'Brian Kamau',
    type: 'Missing Document',
    title: 'Missing fee structure',
    body: 'Brian’s fee structure is required before 14 June.',
    group: 'documents',
    urgent: true,
    time: '2 hours ago'
  },
  {
    id: 'n2',
    studentId: 'stu-faith',
    studentName: 'Faith Kamau',
    type: 'Application Approved',
    title: 'Application approved',
    body: 'Faith’s 2025/2026 application was approved.',
    group: 'applications',
    urgent: false,
    time: 'Yesterday'
  },
  {
    id: 'n3',
    studentId: 'stu-brian',
    studentName: 'Brian Kamau',
    type: 'Deadline Reminder',
    title: 'Deadline reminder',
    body: 'Document upload deadline is 14 June 2026.',
    group: 'applications',
    urgent: true,
    time: '3 days ago'
  },
  {
    id: 'n4',
    studentId: 'stu-james',
    studentName: 'James Otieno',
    type: 'Allocation Notice',
    title: 'Allocation notice',
    body: 'Funds for the 2024/2025 cycle were disbursed.',
    group: 'applications',
    urgent: false,
    time: '1 week ago'
  },
  {
    id: 'n5',
    studentId: 'stu-faith',
    studentName: 'Faith Kamau',
    type: 'Login Activity',
    title: 'Student logged in',
    body: 'Faith accessed her dashboard from a new device.',
    group: 'system',
    urgent: false,
    time: '2 weeks ago'
  },
  {
    id: 'n6',
    studentId: null,
    studentName: null,
    type: 'System Announcement',
    title: 'New application cycle opens',
    body: '2026/2027 applications open 1 July for all wards.',
    group: 'system',
    urgent: false,
    time: '3 weeks ago'
  }
];
