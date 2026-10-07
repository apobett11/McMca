/**
 * Help Desk Data & State Management
 * Pure transparent client-side and localStorage data store for Help Desk operations.
 * NO REALTIME subscriptions - transparent, explicit state management.
 */

export const PREDETERMINED_LOCATIONS = [
  'Tendeno',
  'Sorget',
  'Parklands',
  'Westlands'
];

export const STEP_NAMES = [
  { key: 'personal_information', label: '1. Personal Information' },
  { key: 'parent_information', label: '2. Parent / Guardian' },
  { key: 'family_details', label: '3. Family Details' },
  { key: 'institution', label: '4. Institution Details' },
  { key: 'home_details', label: '5. Home & Location' }
];

const PROFILE_KEY = 'mcmca_helpdesk_profile';
const APPS_KEY = 'mcmca_helpdesk_applications';
const STEPS_KEY = 'mcmca_helpdesk_steps';
const FAILED_UPLOADS_KEY = 'mcmca_helpdesk_failed_uploads';
const MESSAGES_KEY = 'mcmca_helpdesk_messages';
const MASS_LOGS_KEY = 'mcmca_helpdesk_mass_logs';

export const INITIAL_HELPDESK_PROFILE = {
  fullName: 'Clara Chelangat',
  officerId: 'HD-BURSARY-2026-08',
  email: 'helpdesk@tendeno-bursary.go.ke',
  phone: '0711 002 244',
  roleTitle: 'Help Desk Operations Lead',
  department: 'Assessment, Verification & Appeals Desk',
  shiftUnit: 'Day Shift (08:00 - 17:00)',
  assignedLocations: ['Tendeno', 'Sorget', 'Parklands', 'Westlands'],
  emailAlertsFailed: true,
  smsEscalations: true,
  autoDigest: false
};

const INITIAL_APPLICATIONS = [
  {
    id: 'hd-app-01',
    serial: 'BUR-2026-001',
    fullName: 'Brian Kamau',
    nationalId: '39485721',
    school: 'St. Mary Primary School',
    educationLevel: 'Primary',
    grade: 'Grade 7',
    location: 'Parklands',
    subLocation: 'Highridge',
    submittedDate: '2026-10-01T14:22:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 48,000',
    parentName: 'Mary Kamau',
    parentPhone: '0712 345 678',
    chiefReasonForFail: '',
    riskFlag: 'Clean',
    helpDeskNotes: 'Verified resident of Highridge. Standard approval.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-02',
    serial: 'BUR-2026-002',
    fullName: 'Kevin Ochieng',
    nationalId: '40192837',
    school: 'Westlands Primary',
    educationLevel: 'Primary',
    grade: 'Grade 6',
    location: 'Parklands',
    subLocation: 'Spring Valley',
    submittedDate: '2026-10-02T09:40:00',
    applicationStatus: 'Rejected',
    amountRequested: 'KES 40,000',
    parentName: 'Jane Ochieng',
    parentPhone: '0723 456 789',
    chiefReasonForFail: 'Location stated on uploaded National ID reads "Nakuru West", but applicant submitted for "Parklands / Spring Valley". Residency unconfirmed.',
    riskFlag: 'Jurisdiction Mismatch',
    helpDeskNotes: 'Applicant presented tenancy lease covering last 18 months in Spring Valley. Assessed candidate for MCA direct escalation.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-03',
    serial: 'BUR-2026-003',
    fullName: 'Grace Mwangi',
    nationalId: '38192048',
    school: 'Parklands Girls High',
    educationLevel: 'Secondary',
    grade: 'Form 3',
    location: 'Parklands',
    subLocation: 'Highridge',
    submittedDate: '2026-09-28T16:00:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 58,000',
    parentName: 'Alice Mwangi',
    parentPhone: '0734 567 890',
    chiefReasonForFail: '',
    riskFlag: 'Clean',
    helpDeskNotes: 'Approved by Chief.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-04',
    serial: 'BUR-2026-004',
    fullName: 'Faith Chebet',
    nationalId: '41920192',
    school: 'Tendeno Secondary School',
    educationLevel: 'Secondary',
    grade: 'Form 2',
    location: 'Tendeno',
    subLocation: 'Tendeno Central',
    submittedDate: '2026-10-03T10:15:00',
    applicationStatus: 'Rejected',
    amountRequested: 'KES 55,000',
    parentName: 'David Chebet',
    parentPhone: '0745 678 901',
    chiefReasonForFail: 'Uploaded ID record indicates "Kericho Central" birthplace residency; missing letter from local sub-chief confirming 3+ years Tendeno residence.',
    riskFlag: 'Residency Verification Pending',
    helpDeskNotes: 'Awaiting local utility bill verification before appeal cutoff.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-05',
    serial: 'BUR-2026-005',
    fullName: 'James Kiprono',
    nationalId: '36920194',
    school: 'Egerton University',
    educationLevel: 'Tertiary',
    grade: 'Year 2',
    location: 'Tendeno',
    subLocation: 'Tendeno East',
    submittedDate: '2026-10-02T12:00:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 75,000',
    parentName: 'Eunice Kiprono',
    parentPhone: '0756 789 012',
    chiefReasonForFail: '',
    riskFlag: 'Clean',
    helpDeskNotes: 'Passed all financial checks.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-06',
    serial: 'BUR-2026-006',
    fullName: 'Mercy Achieng',
    nationalId: '35940192',
    school: 'Kenya Medical Training College',
    educationLevel: 'Tertiary',
    grade: 'Year 1',
    location: 'Westlands',
    subLocation: 'Kangemi',
    submittedDate: '2026-09-30T14:45:00',
    applicationStatus: 'Rejected',
    amountRequested: 'KES 70,000',
    parentName: 'Peter Achieng',
    parentPhone: '0789 012 345',
    chiefReasonForFail: 'Family declared combined monthly income exceeding bursary baseline cap (> KES 75,000); missing evidence of high medical dependency burden.',
    riskFlag: 'Income Cap Exceeded',
    helpDeskNotes: 'Applicant submitted parent chronic illness medical receipts for appeal consideration.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-07',
    serial: 'BUR-2026-007',
    fullName: 'Geoffrey Koech',
    nationalId: '42881903',
    school: 'Sorget Vocational Training Centre',
    educationLevel: 'Tertiary',
    grade: 'Year 1',
    location: 'Sorget',
    subLocation: 'Sorget Central',
    submittedDate: '2026-10-04T08:30:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 35,000',
    parentName: 'Samuel Koech',
    parentPhone: '0711 223 344',
    chiefReasonForFail: '',
    riskFlag: 'Clean',
    helpDeskNotes: 'Total orphan criteria met. Fully approved.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-08',
    serial: 'BUR-2026-008',
    fullName: 'Sharon Cherotich',
    nationalId: '43992811',
    school: 'Sorget Girls High School',
    educationLevel: 'Secondary',
    grade: 'Form 3',
    location: 'Sorget',
    subLocation: 'Sorget Forest',
    submittedDate: '2026-10-04T11:15:00',
    applicationStatus: 'Rejected',
    amountRequested: 'KES 46,000',
    parentName: 'Rachel Cherotich',
    parentPhone: '0722 334 455',
    chiefReasonForFail: 'Fee structure missing official school serial rubber stamp and current Term 3 balance verification signature.',
    riskFlag: 'Unverified Fee Voucher',
    helpDeskNotes: 'School bursar re-stamped voucher; recommended for direct MCA proceed.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-09',
    serial: 'BUR-2026-009',
    fullName: 'Dennis Kipkemboi',
    nationalId: '41872910',
    school: 'Tendeno Boys High',
    educationLevel: 'Secondary',
    grade: 'Form 4',
    location: 'Tendeno',
    subLocation: 'Tendeno West',
    submittedDate: '2026-10-05T09:00:00',
    applicationStatus: 'Under Review',
    amountRequested: 'KES 52,000',
    parentName: 'Gideon Kipkemboi',
    parentPhone: '0733 445 566',
    chiefReasonForFail: '',
    riskFlag: 'Pending Crosscheck',
    helpDeskNotes: 'Under chief verification.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-10',
    serial: 'BUR-2026-010',
    fullName: 'Lilian Njeri',
    nationalId: '40981726',
    school: 'Westlands Technical Institute',
    educationLevel: 'Tertiary',
    grade: 'Year 2',
    location: 'Westlands',
    subLocation: 'Mountain View',
    submittedDate: '2026-10-01T15:20:00',
    applicationStatus: 'Approved',
    amountRequested: 'KES 60,000',
    parentName: 'Francis Njeri',
    parentPhone: '0744 556 677',
    chiefReasonForFail: '',
    riskFlag: 'Clean',
    helpDeskNotes: 'Passed all criteria.',
    sentToMcaDirect: false
  },
  {
    id: 'hd-app-11',
    serial: 'BUR-2026-011',
    fullName: 'Emmanuel Kiprono',
    nationalId: '39772819',
    school: 'University of Kabianga',
    educationLevel: 'Tertiary',
    grade: 'Year 3',
    location: 'Sorget',
    subLocation: 'Kipchorian',
    submittedDate: '2026-09-29T10:00:00',
    applicationStatus: 'Proceeded to MCA Direct',
    amountRequested: 'KES 80,000',
    parentName: 'Esther Kiprono',
    parentPhone: '0755 667 788',
    chiefReasonForFail: 'Initially rejected due to late submission timestamp.',
    riskFlag: 'Help Desk Proceeded',
    helpDeskNotes: 'Applicant hospital admission caused delay; granted special dispensation to MCA Direct.',
    sentToMcaDirect: true,
    mcaForwardedAt: '2026-10-03T11:00:00',
    mcaOverrideReason: 'Hospitalization medical discharge confirmed; expedited to MCA desk.'
  },
  {
    id: 'hd-app-12',
    serial: 'BUR-2026-012',
    fullName: 'Victor Mwangi',
    nationalId: '42883910',
    school: 'Parklands Boys High',
    educationLevel: 'Secondary',
    grade: 'Form 1',
    location: 'Parklands',
    subLocation: 'City Park',
    submittedDate: '2026-10-05T14:10:00',
    applicationStatus: 'Rejected',
    amountRequested: 'KES 42,000',
    parentName: 'Hannah Mwangi',
    parentPhone: '0766 778 899',
    chiefReasonForFail: 'Duplicate bursary allocation flagged: Applicant already received full bursary from NG-CDF national allocation this quarter.',
    riskFlag: 'Dual Bursary Conflict',
    helpDeskNotes: 'Under review for partial top-up appeal.',
    sentToMcaDirect: false
  }
];

const INITIAL_STEP_PROGRESS = [
  {
    id: 'step-prog-01',
    applicantName: 'Brian Kamau',
    nationalId: '39485721',
    phone: '0712 345 678',
    location: 'Parklands',
    school: 'St. Mary Primary School',
    completedSteps: ['personal_information', 'parent_information', 'family_details', 'institution', 'home_details'],
    hangingSteps: [],
    stepsCount: 5,
    totalSteps: 5,
    totalDocuments: 4,
    lastActiveDate: '2026-10-06T11:20:00',
    registrationStatus: 'Completed',
    reminded: false
  },
  {
    id: 'step-prog-02',
    applicantName: 'Collins Kibet',
    nationalId: '41992837',
    phone: '0721 889 900',
    location: 'Tendeno',
    school: 'Kapkures Secondary',
    completedSteps: ['personal_information', 'parent_information'],
    hangingSteps: ['family_details', 'institution', 'home_details'],
    stepsCount: 2,
    totalSteps: 5,
    totalDocuments: 1,
    lastActiveDate: '2026-10-05T16:40:00',
    registrationStatus: 'Hanging (Step 2)',
    reminded: false
  },
  {
    id: 'step-prog-03',
    applicantName: 'Faith Chebet',
    nationalId: '41920192',
    phone: '0745 678 901',
    location: 'Tendeno',
    school: 'Tendeno Secondary School',
    completedSteps: ['personal_information', 'parent_information', 'family_details', 'institution'],
    hangingSteps: ['home_details'],
    stepsCount: 4,
    totalSteps: 5,
    totalDocuments: 3,
    lastActiveDate: '2026-10-06T09:15:00',
    registrationStatus: 'Hanging (Step 4)',
    reminded: true
  },
  {
    id: 'step-prog-04',
    applicantName: 'Kevin Ochieng',
    nationalId: '40192837',
    phone: '0723 456 789',
    location: 'Parklands',
    school: 'Westlands Primary',
    completedSteps: ['personal_information', 'parent_information', 'family_details', 'institution', 'home_details'],
    hangingSteps: [],
    stepsCount: 5,
    totalSteps: 5,
    totalDocuments: 4,
    lastActiveDate: '2026-10-04T13:10:00',
    registrationStatus: 'Completed',
    reminded: false
  },
  {
    id: 'step-prog-05',
    applicantName: 'Beatrice Chepkoech',
    nationalId: '43881920',
    phone: '0732 119 922',
    location: 'Sorget',
    school: 'Sorget Girls High School',
    completedSteps: ['personal_information'],
    hangingSteps: ['parent_information', 'family_details', 'institution', 'home_details'],
    stepsCount: 1,
    totalSteps: 5,
    totalDocuments: 0,
    lastActiveDate: '2026-10-03T10:05:00',
    registrationStatus: 'Hanging (Step 1)',
    reminded: false
  },
  {
    id: 'step-prog-06',
    applicantName: 'Vincent Kiprotich',
    nationalId: '42771829',
    phone: '0743 228 833',
    location: 'Sorget',
    school: 'Kipchorian Mixed Day',
    completedSteps: ['personal_information', 'parent_information', 'family_details'],
    hangingSteps: ['institution', 'home_details'],
    stepsCount: 3,
    totalSteps: 5,
    totalDocuments: 2,
    lastActiveDate: '2026-10-05T14:50:00',
    registrationStatus: 'Hanging (Step 3)',
    reminded: false
  },
  {
    id: 'step-prog-07',
    applicantName: 'Diana Atieno',
    nationalId: '44883921',
    phone: '0754 337 744',
    location: 'Westlands',
    school: 'Kangemi High School',
    completedSteps: ['personal_information', 'parent_information', 'family_details'],
    hangingSteps: ['institution', 'home_details'],
    stepsCount: 3,
    totalSteps: 5,
    totalDocuments: 2,
    lastActiveDate: '2026-10-06T15:30:00',
    registrationStatus: 'Hanging (Step 3)',
    reminded: false
  },
  {
    id: 'step-prog-08',
    applicantName: 'Geoffrey Koech',
    nationalId: '42881903',
    phone: '0711 223 344',
    location: 'Sorget',
    school: 'Sorget Vocational Training Centre',
    completedSteps: ['personal_information', 'parent_information', 'family_details', 'institution', 'home_details'],
    hangingSteps: [],
    stepsCount: 5,
    totalSteps: 5,
    totalDocuments: 4,
    lastActiveDate: '2026-10-06T12:00:00',
    registrationStatus: 'Completed',
    reminded: false
  },
  {
    id: 'step-prog-09',
    applicantName: 'Moses Wanyama',
    nationalId: '45991823',
    phone: '0765 448 855',
    location: 'Westlands',
    school: 'Nairobi Technical Institute',
    completedSteps: ['personal_information', 'parent_information'],
    hangingSteps: ['family_details', 'institution', 'home_details'],
    stepsCount: 2,
    totalSteps: 5,
    totalDocuments: 1,
    lastActiveDate: '2026-10-04T08:25:00',
    registrationStatus: 'Hanging (Step 2)',
    reminded: false
  },
  {
    id: 'step-prog-10',
    applicantName: 'Brenda Jerotich',
    nationalId: '43991029',
    phone: '0776 559 966',
    location: 'Tendeno',
    school: 'Chepsir Day Secondary',
    completedSteps: ['personal_information', 'parent_information', 'family_details', 'institution'],
    hangingSteps: ['home_details'],
    stepsCount: 4,
    totalSteps: 5,
    totalDocuments: 3,
    lastActiveDate: '2026-10-05T17:10:00',
    registrationStatus: 'Hanging (Step 4)',
    reminded: true
  }
];

const INITIAL_FAILED_UPLOADS = [
  {
    id: 'fail-up-01',
    applicantName: 'Sharon Cherotich',
    nationalId: '43992811',
    phone: '0722 334 455',
    location: 'Sorget',
    documentType: 'Fee Structure',
    uploadDate: '2026-10-05T11:15:00',
    fileName: 'fee_struct_2026.pdf',
    fileSize: '3.4 MB',
    failureReason: 'Missing official school rubber stamp and principal signature on Term 3 fee breakdown.',
    status: 'Pending Re-upload',
    reuploadRequested: true
  },
  {
    id: 'fail-up-02',
    applicantName: 'Collins Kibet',
    nationalId: '41992837',
    phone: '0721 889 900',
    location: 'Tendeno',
    documentType: 'Student ID / Birth Certificate',
    uploadDate: '2026-10-04T14:30:00',
    fileName: 'birth_cert_scan.jpg',
    fileSize: '1.2 MB',
    failureReason: 'OCR failure: Image blurred; entry serial number and applicant date of birth illegible.',
    status: 'Pending Re-upload',
    reuploadRequested: false
  },
  {
    id: 'fail-up-03',
    applicantName: 'Moses Wanyama',
    nationalId: '45991823',
    phone: '0765 448 855',
    location: 'Westlands',
    documentType: 'Admission Letter',
    uploadDate: '2026-10-03T09:45:00',
    fileName: 'admission_letter.pdf',
    fileSize: '14.2 MB',
    failureReason: 'File size exceeded limit (14.2MB exceeds maximum 10MB portal upload limit).',
    status: 'Rejected Upload',
    reuploadRequested: true
  },
  {
    id: 'fail-up-04',
    applicantName: 'Vincent Kiprotich',
    nationalId: '42771829',
    phone: '0743 228 833',
    location: 'Sorget',
    documentType: 'Guardian Death / Disability Cert',
    uploadDate: '2026-10-02T16:10:00',
    fileName: 'disability_card.png',
    fileSize: '2.1 MB',
    failureReason: 'Name mismatch: National Council for Persons with Disabilities card name differs from registered guardian name.',
    status: 'Under Review',
    reuploadRequested: false
  },
  {
    id: 'fail-up-05',
    applicantName: 'Victor Mwangi',
    nationalId: '42883910',
    phone: '0766 778 899',
    location: 'Parklands',
    documentType: 'Guardian Consent Form',
    uploadDate: '2026-10-05T13:20:00',
    fileName: 'consent_form_signed.pdf',
    fileSize: '0.8 MB',
    failureReason: 'Corrupted document format: PDF stream terminated prematurely; page 2 empty.',
    status: 'Pending Re-upload',
    reuploadRequested: false
  }
];

const INITIAL_MESSAGES = [
  {
    id: 'msg-hd-01',
    senderName: 'Mary Kamau',
    senderRole: 'Parent',
    studentName: 'Brian Kamau',
    location: 'Parklands',
    destinationOffice: 'helpdesk',
    subject: 'Assistance verifying uploaded utility receipt',
    body: 'Hello Help Desk, I uploaded our water bill for Highridge residence. Could you please confirm if it was successfully attached to Brian\'s file?',
    sentDate: '2026-10-06T08:14:00',
    status: 'replied',
    replies: [
      {
        sender: 'Clara Chelangat (Help Desk)',
        body: 'Good morning Mary. We confirm the utility bill has been verified and attached to Brian Kamau\'s bursary file.',
        sentAt: '2026-10-06T09:00:00'
      }
    ]
  },
  {
    id: 'msg-hd-02',
    senderName: 'Jane Ochieng',
    senderRole: 'Parent',
    studentName: 'Kevin Ochieng',
    location: 'Parklands',
    destinationOffice: 'helpdesk',
    subject: 'National ID birthplace vs current Spring Valley residence',
    body: 'Greetings. The chief marked our application as rejected because my ID says Nakuru West. We have lived in Spring Valley since 2024. How do I request Help Desk to forward this to the MCA before the appeal deadline?',
    sentDate: '2026-10-06T10:30:00',
    status: 'to_be_replied',
    replies: []
  },
  {
    id: 'msg-hd-03',
    senderName: 'David Chebet',
    senderRole: 'Parent',
    studentName: 'Faith Chebet',
    location: 'Tendeno',
    destinationOffice: 'mca',
    subject: 'Direct appeal request regarding Tendeno ward residency',
    body: 'Honorable MCA, our family relocated to Tendeno Central 3 years ago from Kericho. We seek your direct consideration on Faith\'s secondary school bursary.',
    sentDate: '2026-10-05T14:10:00',
    status: 'to_be_replied',
    replies: []
  },
  {
    id: 'msg-hd-04',
    senderName: 'Rachel Cherotich',
    senderRole: 'Parent',
    studentName: 'Sharon Cherotich',
    location: 'Sorget',
    destinationOffice: 'helpdesk',
    subject: 'Fee voucher stamp clarification',
    body: 'Help Desk, our school principal was away during mid-term. I now have the official stamp on Sharon\'s fee structure. How can I re-upload it?',
    sentDate: '2026-10-05T16:20:00',
    status: 'replied',
    replies: [
      {
        sender: 'Clara Chelangat (Help Desk)',
        body: 'Hello Rachel, we have enabled the re-upload token on your student documents tab. Kindly upload the newly stamped PDF.',
        sentAt: '2026-10-05T17:05:00'
      }
    ]
  },
  {
    id: 'msg-hd-05',
    senderName: 'Samuel Koech',
    senderRole: 'Parent',
    studentName: 'Geoffrey Koech',
    location: 'Sorget',
    destinationOffice: 'mca',
    subject: 'Gratitude for bursary allocation notice',
    body: 'Thank you Honorable MCA and committee for approving Geoffrey Koech\'s vocational training fee support.',
    sentDate: '2026-10-04T12:00:00',
    status: 'replied',
    replies: [
      {
        sender: 'MCA Office Secretariat',
        body: 'You are welcome. Cheque disbursement will proceed through the college accounts office on Friday.',
        sentAt: '2026-10-04T15:30:00'
      }
    ]
  },
  {
    id: 'msg-hd-06',
    senderName: 'Francis Njeri',
    senderRole: 'Parent',
    studentName: 'Lilian Njeri',
    location: 'Westlands',
    destinationOffice: 'chief',
    subject: 'In-person verification scheduling',
    body: 'Chief Peter, please confirm what days you are in the Mountain View camp for bursary document sign-off.',
    sentDate: '2026-10-03T11:45:00',
    status: 'replied',
    replies: [
      {
        sender: 'Chief Peter Waweru',
        body: 'Tuesdays and Thursdays from 9:00 AM to 1:00 PM.',
        sentAt: '2026-10-03T14:15:00'
      }
    ]
  },
  {
    id: 'msg-hd-07',
    senderName: 'Collins Kibet',
    senderRole: 'Student',
    studentName: 'Collins Kibet',
    location: 'Tendeno',
    destinationOffice: 'helpdesk',
    subject: 'System error when saving Family Information step',
    body: 'Dear Help Desk, I reached step 3 (Family details) but the save button gave an error about monthly income format. Kindly assist.',
    sentDate: '2026-10-06T11:00:00',
    status: 'to_be_replied',
    replies: []
  },
  {
    id: 'msg-hd-08',
    senderName: 'Diana Atieno',
    senderRole: 'Student',
    studentName: 'Diana Atieno',
    location: 'Westlands',
    destinationOffice: 'mca',
    subject: 'Inquiry on technical diploma bursary threshold',
    body: 'To MCA Bursary Board: Are diploma students at Kangemi Technical eligible for the 80% tuition grant or 50% only?',
    sentDate: '2026-10-04T16:00:00',
    status: 'to_be_replied',
    replies: []
  }
];

// Helper Functions
function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from localStorage`, err);
  }
  localStorage.setItem(key, JSON.stringify(fallback));
  return fallback;
}

function saveStored(key, data, eventName) {
  localStorage.setItem(key, JSON.stringify(data));
  if (eventName) {
    window.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}

export function getHelpDeskProfile() {
  return getStored(PROFILE_KEY, INITIAL_HELPDESK_PROFILE);
}

export function saveHelpDeskProfile(profile) {
  saveStored(PROFILE_KEY, profile, 'mcmca_helpdesk_profile_updated');
  return profile;
}

export function getHelpDeskApplications() {
  return getStored(APPS_KEY, INITIAL_APPLICATIONS);
}

export function saveHelpDeskApplications(apps) {
  saveStored(APPS_KEY, apps, 'mcmca_helpdesk_apps_updated');
  return apps;
}

export function getHelpDeskStepProgress() {
  return getStored(STEPS_KEY, INITIAL_STEP_PROGRESS);
}

export function saveHelpDeskStepProgress(steps) {
  saveStored(STEPS_KEY, steps, 'mcmca_helpdesk_steps_updated');
  return steps;
}

export function getHelpDeskFailedUploads() {
  return getStored(FAILED_UPLOADS_KEY, INITIAL_FAILED_UPLOADS);
}

export function saveHelpDeskFailedUploads(uploads) {
  saveStored(FAILED_UPLOADS_KEY, uploads, 'mcmca_helpdesk_failed_uploads_updated');
  return uploads;
}

export function getHelpDeskMessages() {
  return getStored(MESSAGES_KEY, INITIAL_MESSAGES);
}

export function saveHelpDeskMessages(messages) {
  saveStored(MESSAGES_KEY, messages, 'mcmca_helpdesk_messages_updated');
  return messages;
}

export function getMassMessageLogs() {
  return getStored(MASS_LOGS_KEY, []);
}

/**
 * Proceed a failed application directly to MCA
 */
export function proceedApplicationToMca(appId, overrideNotes, officerName = 'Help Desk Officer') {
  const apps = getHelpDeskApplications();
  const now = new Date().toISOString();
  let proceededApp = null;

  const updatedApps = apps.map((app) => {
    if (app.id === appId) {
      proceededApp = {
        ...app,
        applicationStatus: 'Proceeded to MCA Direct',
        sentToMcaDirect: true,
        mcaForwardedAt: now,
        mcaOverrideReason: overrideNotes || 'Proceeded by Help Desk with verified evidence prior to formal appeal cutoff.',
        forwardedBy: officerName
      };
      return proceededApp;
    }
    return app;
  });

  saveHelpDeskApplications(updatedApps);

  // Sync to chief applications storage if chief data exists
  try {
    const rawChief = localStorage.getItem('mcmca_chief_applications');
    if (rawChief) {
      const chiefApps = JSON.parse(rawChief);
      const updatedChief = chiefApps.map((ca) => {
        if (ca.id === appId || ca.serial === proceededApp?.serial) {
          return {
            ...ca,
            applicationStatus: 'Escalated to MCA Direct',
            helpDeskProceeded: true,
            proceedNotes: overrideNotes
          };
        }
        return ca;
      });
      localStorage.setItem('mcmca_chief_applications', JSON.stringify(updatedChief));
      window.dispatchEvent(new CustomEvent('mcmca_chief_apps_updated', { detail: updatedChief }));
    }
  } catch (e) {
    console.warn('Chief applications sync skipped:', e);
  }

  return { success: true, application: proceededApp };
}

/**
 * Record a direct communication to a student or parent regarding a failed application
 */
export function contactApplicantRecord(appId, { recipientType, contactNumber, messageText }) {
  const apps = getHelpDeskApplications();
  const target = apps.find(a => a.id === appId);
  const now = new Date().toISOString();

  // Create an internal help desk message record
  const msgs = getHelpDeskMessages();
  const newMsg = {
    id: `msg-hd-out-${Date.now()}`,
    senderName: 'Help Desk Outreach',
    senderRole: 'Help Desk',
    studentName: target?.fullName || 'Applicant',
    location: target?.location || 'General',
    destinationOffice: 'helpdesk',
    subject: `Notice regarding Bursary Application ${target?.serial || ''} (${recipientType})`,
    body: messageText,
    sentDate: now,
    status: 'replied',
    replies: [
      {
        sender: `${recipientType} (${contactNumber})`,
        body: 'Dispatched via Direct SMS / Portal Notification.',
        sentAt: now
      }
    ]
  };

  saveHelpDeskMessages([newMsg, ...msgs]);
  return { success: true, messageId: newMsg.id };
}

/**
 * Reply to a message (Help Desk or MCA text)
 */
export function replyToMessage(messageId, replyText, senderName = 'Clara Chelangat (Help Desk)') {
  const msgs = getHelpDeskMessages();
  const now = new Date().toISOString();

  const updated = msgs.map((m) => {
    if (m.id === messageId) {
      return {
        ...m,
        status: 'replied',
        replies: [
          ...(m.replies || []),
          {
            sender: senderName,
            body: replyText,
            sentAt: now
          }
        ]
      };
    }
    return m;
  });

  saveHelpDeskMessages(updated);
  return updated;
}

/**
 * Forward / annotate a message directly for MCA
 */
export function forwardMessageToMca(messageId, internalNote, officerName = 'Help Desk Officer') {
  const msgs = getHelpDeskMessages();
  const now = new Date().toISOString();

  const updated = msgs.map((m) => {
    if (m.id === messageId) {
      return {
        ...m,
        forwardedToMca: true,
        forwardedToMcaAt: now,
        forwardedToMcaNote: internalNote,
        forwardedBy: officerName
      };
    }
    return m;
  });

  saveHelpDeskMessages(updated);
  return updated;
}

/**
 * Send Mass Message to applicants (hanging steps or failed uploads)
 */
export function sendMassMessage({ targetGroup, title, messageText, channel = 'SMS & Portal' }) {
  const steps = getHelpDeskStepProgress();
  const uploads = getHelpDeskFailedUploads();

  let recipientCount = 0;
  if (targetGroup === 'hanging_steps') {
    recipientCount = steps.filter(s => s.stepsCount < s.totalSteps).length;
    // Mark them as reminded
    const updated = steps.map(s => s.stepsCount < s.totalSteps ? { ...s, reminded: true } : s);
    saveHelpDeskStepProgress(updated);
  } else if (targetGroup === 'failed_uploads') {
    recipientCount = uploads.length;
    const updated = uploads.map(u => ({ ...u, reuploadRequested: true }));
    saveHelpDeskFailedUploads(updated);
  } else {
    recipientCount = steps.length;
  }

  const logs = getMassMessageLogs();
  const newLog = {
    id: `mass-${Date.now()}`,
    targetGroup,
    title,
    messageText,
    channel,
    recipientCount,
    sentAt: new Date().toISOString(),
    sender: 'Help Desk Broadcast Center'
  };

  const updatedLogs = [newLog, ...logs];
  saveStored(MASS_LOGS_KEY, updatedLogs, 'mcmca_helpdesk_mass_updated');

  return { success: true, count: recipientCount, log: newLog };
}

/**
 * Mark a step reminder as sent for an individual applicant
 */
export function sendStepReminder(applicantId) {
  const steps = getHelpDeskStepProgress();
  const updated = steps.map(s => s.id === applicantId ? { ...s, reminded: true, remindedAt: new Date().toISOString() } : s);
  saveHelpDeskStepProgress(updated);
  return updated;
}

/**
 * Request re-upload for an individual failed upload
 */
export function requestReupload(uploadId) {
  const uploads = getHelpDeskFailedUploads();
  const updated = uploads.map(u => u.id === uploadId ? { ...u, reuploadRequested: true, requestedAt: new Date().toISOString() } : u);
  saveHelpDeskFailedUploads(updated);
  return updated;
}

/**
 * Calculate Analytics Across Modules
 */
export function calculateHelpDeskMetrics() {
  const apps = getHelpDeskApplications();
  const steps = getHelpDeskStepProgress();
  const uploads = getHelpDeskFailedUploads();
  const messages = getHelpDeskMessages();

  const totalApps = apps.length;
  const passedApps = apps.filter(a => a.applicationStatus === 'Approved').length;
  const failedApps = apps.filter(a => a.applicationStatus === 'Rejected').length;
  const underReviewApps = apps.filter(a => a.applicationStatus === 'Under Review').length;
  const mcaDirectApps = apps.filter(a => a.applicationStatus === 'Proceeded to MCA Direct').length;

  const passRate = totalApps > 0 ? Math.round((passedApps / totalApps) * 100) : 0;
  const failRate = totalApps > 0 ? Math.round((failedApps / totalApps) * 100) : 0;
  const ratio = failedApps > 0 ? (passedApps / failedApps).toFixed(2) : (passedApps > 0 ? `${passedApps}:0` : '0:0');

  // Distribution by location
  const locationBreakdown = PREDETERMINED_LOCATIONS.map((loc) => {
    const locApps = apps.filter(a => a.location?.toLowerCase() === loc.toLowerCase());
    const total = locApps.length;
    const passed = locApps.filter(a => a.applicationStatus === 'Approved').length;
    const failed = locApps.filter(a => a.applicationStatus === 'Rejected').length;
    const review = locApps.filter(a => a.applicationStatus === 'Under Review').length;
    const mca = locApps.filter(a => a.applicationStatus === 'Proceeded to MCA Direct').length;
    const locPassRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    const locFailRate = total > 0 ? Math.round((failed / total) * 100) : 0;

    return {
      location: loc,
      total,
      passed,
      failed,
      underReview: review,
      mcaDirect: mca,
      passRate: locPassRate,
      failRate: locFailRate
    };
  });

  // Hanging steps metrics
  const totalApplicants = steps.length;
  const incompleteStepsCount = steps.filter(s => s.stepsCount < s.totalSteps).length;
  const completedStepsCount = steps.filter(s => s.stepsCount === s.totalSteps).length;
  const stepCompletionRate = totalApplicants > 0 ? Math.round((completedStepsCount / totalApplicants) * 100) : 0;

  // Failed uploads metrics
  const totalFailedUploads = uploads.length;
  const reuploadRequestedCount = uploads.filter(u => u.reuploadRequested).length;

  // Messages metrics
  const totalMessages = messages.length;
  const toHelpDesk = messages.filter(m => m.destinationOffice === 'helpdesk');
  const toMca = messages.filter(m => m.destinationOffice === 'mca');
  const toChief = messages.filter(m => m.destinationOffice === 'chief');

  function getReplyStats(list) {
    const total = list.length;
    const replied = list.filter(m => m.status === 'replied').length;
    const pending = total - replied;
    const rate = total > 0 ? Math.round((replied / total) * 100) : 0;
    return { total, replied, pending, rate };
  }

  const helpDeskStats = getReplyStats(toHelpDesk);
  const mcaStats = getReplyStats(toMca);
  const chiefStats = getReplyStats(toChief);
  const overallMessageStats = getReplyStats(messages);

  // Message breakdown by location
  const messageLocationBreakdown = PREDETERMINED_LOCATIONS.map((loc) => {
    const locMsgs = messages.filter(m => m.location?.toLowerCase() === loc.toLowerCase());
    const stats = getReplyStats(locMsgs);
    return {
      location: loc,
      ...stats
    };
  });

  return {
    applications: {
      total: totalApps,
      passed: passedApps,
      failed: failedApps,
      underReview: underReviewApps,
      mcaDirect: mcaDirectApps,
      passRate,
      failRate,
      ratio,
      byLocation: locationBreakdown,
      locationBreakdown
    },
    steps: {
      total: totalApplicants,
      incomplete: incompleteStepsCount,
      completed: completedStepsCount,
      completionRate: stepCompletionRate
    },
    uploads: {
      totalFailed: totalFailedUploads,
      requested: reuploadRequestedCount
    },
    messages: {
      overall: overallMessageStats,
      helpdesk: helpDeskStats,
      mca: mcaStats,
      chief: chiefStats,
      byLocation: messageLocationBreakdown
    }
  };
}

/**
 * Help Desk Officer Session Hours Tracking
 * Counts full rounded hours: today, this week, this month
 * Clicking month shows weeks; clicking week shows daily hours with graphs
 */
export function getHelpDeskSessionHours() {
  return {
    today: 6, // 6 full hours
    thisWeek: 34, // 34 full hours
    thisMonth: 148, // 148 full hours
    shiftSchedule: 'Day Shift (08:00 - 17:00)',
    shiftAdherenceRate: 96,
    activeSessionDuration: '6 Hours Active',
    monthlyBreakdown: [
      {
        month: 'October 2026',
        totalHours: 148,
        targetHours: 160,
        weeks: [
          {
            weekNumber: 1,
            label: 'Week 1 (Oct 1 - Oct 7)',
            totalHours: 40,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Oct 01' },
              { day: 'Tue', hours: 8, target: 8, date: 'Oct 02' },
              { day: 'Wed', hours: 8, target: 8, date: 'Oct 03' },
              { day: 'Thu', hours: 8, target: 8, date: 'Oct 04' },
              { day: 'Fri', hours: 8, target: 8, date: 'Oct 05' }
            ]
          },
          {
            weekNumber: 2,
            label: 'Week 2 (Oct 8 - Oct 14)',
            totalHours: 38,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Oct 08' },
              { day: 'Tue', hours: 8, target: 8, date: 'Oct 09' },
              { day: 'Wed', hours: 7, target: 8, date: 'Oct 10' },
              { day: 'Thu', hours: 8, target: 8, date: 'Oct 11' },
              { day: 'Fri', hours: 7, target: 8, date: 'Oct 12' }
            ]
          },
          {
            weekNumber: 3,
            label: 'Week 3 (Oct 15 - Oct 21)',
            totalHours: 36,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Oct 15' },
              { day: 'Tue', hours: 7, target: 8, date: 'Oct 16' },
              { day: 'Wed', hours: 7, target: 8, date: 'Oct 17' },
              { day: 'Thu', hours: 8, target: 8, date: 'Oct 18' },
              { day: 'Fri', hours: 6, target: 8, date: 'Oct 19' }
            ]
          },
          {
            weekNumber: 4,
            label: 'Week 4 (Oct 22 - Oct 28)',
            totalHours: 34,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Oct 22' },
              { day: 'Tue', hours: 8, target: 8, date: 'Oct 23' },
              { day: 'Wed', hours: 6, target: 8, date: 'Oct 24' },
              { day: 'Thu', hours: 7, target: 8, date: 'Oct 25' },
              { day: 'Fri', hours: 5, target: 8, date: 'Oct 26' }
            ]
          }
        ]
      },
      {
        month: 'September 2026',
        totalHours: 160,
        targetHours: 160,
        weeks: [
          {
            weekNumber: 1,
            label: 'Week 1',
            totalHours: 40,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Sep 01' },
              { day: 'Tue', hours: 8, target: 8, date: 'Sep 02' },
              { day: 'Wed', hours: 8, target: 8, date: 'Sep 03' },
              { day: 'Thu', hours: 8, target: 8, date: 'Sep 04' },
              { day: 'Fri', hours: 8, target: 8, date: 'Sep 05' }
            ]
          },
          {
            weekNumber: 2,
            label: 'Week 2',
            totalHours: 40,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Sep 08' },
              { day: 'Tue', hours: 8, target: 8, date: 'Sep 09' },
              { day: 'Wed', hours: 8, target: 8, date: 'Sep 10' },
              { day: 'Thu', hours: 8, target: 8, date: 'Sep 11' },
              { day: 'Fri', hours: 8, target: 8, date: 'Sep 12' }
            ]
          },
          {
            weekNumber: 3,
            label: 'Week 3',
            totalHours: 40,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Sep 15' },
              { day: 'Tue', hours: 8, target: 8, date: 'Sep 16' },
              { day: 'Wed', hours: 8, target: 8, date: 'Sep 17' },
              { day: 'Thu', hours: 8, target: 8, date: 'Sep 18' },
              { day: 'Fri', hours: 8, target: 8, date: 'Sep 19' }
            ]
          },
          {
            weekNumber: 4,
            label: 'Week 4',
            totalHours: 40,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Sep 22' },
              { day: 'Tue', hours: 8, target: 8, date: 'Sep 23' },
              { day: 'Wed', hours: 8, target: 8, date: 'Sep 24' },
              { day: 'Thu', hours: 8, target: 8, date: 'Sep 25' },
              { day: 'Fri', hours: 8, target: 8, date: 'Sep 26' }
            ]
          }
        ]
      },
      {
        month: 'August 2026',
        totalHours: 152,
        targetHours: 160,
        weeks: [
          {
            weekNumber: 1,
            label: 'Week 1',
            totalHours: 38,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Aug 03' },
              { day: 'Tue', hours: 8, target: 8, date: 'Aug 04' },
              { day: 'Wed', hours: 7, target: 8, date: 'Aug 05' },
              { day: 'Thu', hours: 8, target: 8, date: 'Aug 06' },
              { day: 'Fri', hours: 7, target: 8, date: 'Aug 07' }
            ]
          },
          {
            weekNumber: 2,
            label: 'Week 2',
            totalHours: 38,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Aug 10' },
              { day: 'Tue', hours: 8, target: 8, date: 'Aug 11' },
              { day: 'Wed', hours: 8, target: 8, date: 'Aug 12' },
              { day: 'Thu', hours: 7, target: 8, date: 'Aug 13' },
              { day: 'Fri', hours: 7, target: 8, date: 'Aug 14' }
            ]
          },
          {
            weekNumber: 3,
            label: 'Week 3',
            totalHours: 38,
            daily: [
              { day: 'Mon', hours: 7, target: 8, date: 'Aug 17' },
              { day: 'Tue', hours: 8, target: 8, date: 'Aug 18' },
              { day: 'Wed', hours: 8, target: 8, date: 'Aug 19' },
              { day: 'Thu', hours: 8, target: 8, date: 'Aug 20' },
              { day: 'Fri', hours: 7, target: 8, date: 'Aug 21' }
            ]
          },
          {
            weekNumber: 4,
            label: 'Week 4',
            totalHours: 38,
            daily: [
              { day: 'Mon', hours: 8, target: 8, date: 'Aug 24' },
              { day: 'Tue', hours: 7, target: 8, date: 'Aug 25' },
              { day: 'Wed', hours: 8, target: 8, date: 'Aug 26' },
              { day: 'Thu', hours: 8, target: 8, date: 'Aug 27' },
              { day: 'Fri', hours: 7, target: 8, date: 'Aug 28' }
            ]
          }
        ]
      }
    ]
  };
}

/**
 * Chiefs Message Sent vs Answered Analytics
 * Help Desk monitors these; chiefs manage their own responses
 */
export function getChiefMessagesAnalytics() {
  const msgs = getHelpDeskMessages().filter(m => m.destinationOffice === 'chief');
  const total = msgs.length;
  const answered = msgs.filter(m => m.status === 'replied').length;
  const pending = total - answered;
  const replyRate = total > 0 ? Math.round((answered / total) * 100) : 0;

  const chiefs = [
    { name: 'Chief Peter Waweru', location: 'Parklands & Westlands', total: 3, answered: 2, pending: 1, rate: 67 },
    { name: 'Chief Kiprono Langat', location: 'Tendeno', total: 2, answered: 2, pending: 0, rate: 100 },
    { name: 'Chief Stephen Cheruiyot', location: 'Sorget', total: 1, answered: 0, pending: 1, rate: 0 }
  ];

  return {
    totalSent: total,
    answered,
    pending,
    replyRate,
    chiefs,
    messages: msgs
  };
}

