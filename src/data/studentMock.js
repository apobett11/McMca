/** Demo data for the student operational portal (single student workflow). */

export const STUDENT = {
  firstName: 'Brian',
  lastName: "O'Conner",
  fullName: "Brian O'Conner",
  institutionName: 'St. Mary Primary School',
  cycle: '2025/2026 Bursary Cycle',
  studentId: 'STU-88291',
  initials: 'BO',
  phone: '+254 712 *** 841',
  email: 'brian.kamau@school.mail',
  wardName: 'Westlands Ward'
};

export const STUDENT_APPLICATION = {
  status: 'Under Review',
  deadline: '14 June 2026',
  deadlineLabel: 'Document upload deadline',
  nextAction: {
    required: true,
    title: 'Upload your fee structure',
    message:
      'Before June 14, upload your fee structure so your application can be checked by the committee.',
    cta: 'Go to Document Uploads',
    route: '/student/documents'
  },
  timelineStages: [
    { label: 'Submitted', state: 'completed' },
    { label: 'Documents Verified', state: 'completed' },
    { label: 'Under Review', state: 'current' },
    { label: 'MCA Review', state: 'upcoming' },
    { label: 'Funds Processing', state: 'upcoming' }
  ]
};

export const STUDENT_NOTIFICATIONS = [
  {
    title: 'Missing document reminder',
    body: 'Your fee structure is not yet confirmed. Please upload it before the deadline.',
    variant: 'warning',
    unread: true,
    time: '2h ago'
  },
  {
    title: 'Application update',
    body: 'Your documents were received successfully.',
    variant: 'success',
    unread: false,
    time: '1d ago'
  },
  {
    title: 'Deadline notice',
    body: 'June 14 is the last day for document uploads for your current review stage.',
    variant: 'warning',
    unread: false,
    time: '3d ago'
  }
];

export const STUDENT_ACTIVITY = [
  {
    title: 'Document uploaded successfully',
    body: 'Fee structure uploaded on 10 Jan 2026.',
    variant: 'success',
    icon: 'upload'
  },
  {
    title: 'Chief reviewed your application',
    body: 'Step moved to Under Review.',
    variant: 'info',
    icon: 'shield'
  },
  {
    title: 'Funds sent on schedule',
    body: 'Funds sending will happen after MCA Review.',
    variant: 'info',
    icon: 'funds'
  }
];

export const STUDENT_APPLICATIONS = [
  {
    id: 'app-2025',
    year: '2025/2026',
    status: 'Under Review',
    trackingCode: 'MCA-2025-8842',
    submittedAt: '12 Jan 2026'
  },
  {
    id: 'app-2024',
    year: '2024/2025',
    status: 'Funds Sent',
    trackingCode: 'MCA-2024-1102',
    submittedAt: '8 Mar 2025'
  }
];

export const STUDENT_DOC_CHECKLIST = [
  {
    label: 'Fee structure',
    status: 'missing',
    desc: 'Official school fee breakdown for the current term.'
  },
  {
    label: 'Student ID or birth certificate',
    status: 'ok',
    desc: 'Clear photo or scan of your ID document.'
  },
  {
    label: 'Admission / enrollment proof',
    status: 'ok',
    desc: 'Letter from school confirming enrollment.'
  },
  {
    label: 'Guardian consent form',
    status: 'missing',
    desc: 'Signed consent from parent or guardian.'
  }
];

export const STUDENT_MODAL_NOTIFICATIONS = STUDENT_NOTIFICATIONS.map((n) => ({
  title: n.title,
  body: n.body,
  variant: n.variant,
  unread: n.unread
}));
