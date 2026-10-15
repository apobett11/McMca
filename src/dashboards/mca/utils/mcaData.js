/**
 * MCA Dashboard State & Data Service
 * Provides full offline persistence with localStorage and reactive CustomEvent dispatching.
 */

const MCA_APPS_KEY = 'mcmca_mca_applications_v3';
const MCA_ISSUES_KEY = 'mcmca_mca_issues_v3';
const MCA_DEVELOPMENTS_KEY = 'mcmca_mca_developments_v3';
const MCA_MESSAGES_KEY = 'mcmca_mca_messages_v3';
const MCA_PROFILE_KEY = 'mcmca_mca_profile_v3';
const MCA_CYCLE_SETTINGS_KEY = 'mcmca_mca_cycle_settings_v3';

export const MCA_CYCLES = ['2026/2027', '2025/2026', '2024/2025'];

export const WARD_VILLAGES = [
  'Tendeno Central',
  'Kapkures',
  'Chepsir',
  'Sorget Central',
  'Kapsebet',
  'Kapchelach'
];

export const VILLAGE_COLORS = {
  'Tendeno Central': '#3b82f6', // Sapphire Blue
  'Kapkures': '#10b981',       // Emerald Green
  'Chepsir': '#f59e0b',        // Amber Gold
  'Sorget Central': '#8b5cf6', // Royal Purple
  'Kapsebet': '#06b6d4',       // Cyan
  'Kapchelach': '#f43f5e'      // Rose Red
};

export const POLLING_STATIONS = [
  'Tendeno Primary Polling Station',
  'Kapkures Tea Nursery Polling Station',
  'Chepsir Primary Polling Station',
  'Sorget Forest Polling Station',
  'Kapsebet ECDE Polling Station',
  'Kapchelach Dispensary Polling Station'
];

export const EDUCATION_LEVELS = [
  'Primary',
  'Secondary',
  'TVET / Vocational',
  'University'
];

export const AGE_BRACKETS = [
  'Under 15',
  '15 - 18',
  '19 - 22',
  '23 and above'
];

export const CYCLE_STATES = [
  { value: 'pending', label: 'Pending' },
  { value: 'allocated', label: 'Allocated' },
  { value: 'disbursed', label: 'Disbursed' },
  { value: 'paid to account', label: 'Paid to account' }
];

// Initial Bursary Applications across cycles with polling stations and failure tracking
const INITIAL_APPLICATIONS = [
  // 2026/2027 applications
  {
    id: 'app-26-001',
    year: '2026/2027',
    serial: 'BUR-26-001',
    fullName: 'Brian Kiprono',
    age: 16,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Kipsigis High School',
    pollingStation: 'Tendeno Primary Polling Station',
    location: 'Tendeno',
    village: 'Tendeno Central',
    bursaryAmount: 12000,
    month: 'Feb',
    week: 'Week 2',
    status: 'Allocated', // Allocated | Failed | Pending | Disbursed | Paid to account
    submittedDate: '2026-02-14',
    parentName: 'Mary Chepkoech',
    phone: '+254 712 889 012',
    needScore: 'High Need'
  },
  {
    id: 'app-26-002',
    year: '2026/2027',
    serial: 'BUR-26-002',
    fullName: 'Faith Cherotich',
    age: 20,
    ageBracket: '19 - 22',
    educationLevel: 'University',
    school: 'Moi University',
    pollingStation: 'Sorget Forest Polling Station',
    location: 'Sorget',
    village: 'Sorget Central',
    bursaryAmount: 25000,
    month: 'Feb',
    week: 'Week 3',
    status: 'Allocated',
    submittedDate: '2026-02-18',
    parentName: 'Paul Rotich',
    phone: '+254 722 456 789',
    needScore: 'Extreme Need'
  },
  {
    id: 'app-26-003',
    year: '2026/2027',
    serial: 'BUR-26-003',
    fullName: 'Kelvin Kiplangat',
    age: 14,
    ageBracket: 'Under 15',
    educationLevel: 'Primary',
    school: 'Tendeno Model Primary',
    pollingStation: 'Kapkures Tea Nursery Polling Station',
    location: 'Tendeno',
    village: 'Kapkures',
    bursaryAmount: 8000,
    month: 'Mar',
    week: 'Week 1',
    status: 'Pending',
    submittedDate: '2026-03-02',
    parentName: 'Sarah Chepkemoi',
    phone: '+254 720 112 334',
    needScore: 'Moderate Need'
  },
  {
    id: 'app-26-004',
    year: '2026/2027',
    serial: 'BUR-26-004',
    fullName: 'Mercy Jebet',
    age: 19,
    ageBracket: '19 - 22',
    educationLevel: 'TVET / Vocational',
    school: 'Rift Valley Tech Training Institute',
    pollingStation: 'Chepsir Primary Polling Station',
    location: 'Tendeno',
    village: 'Chepsir',
    bursaryAmount: 15000,
    month: 'Mar',
    week: 'Week 2',
    status: 'Disbursed',
    submittedDate: '2026-03-10',
    parentName: 'David Korir',
    phone: '+254 728 776 543',
    needScore: 'High Need'
  },
  {
    id: 'app-26-005',
    year: '2026/2027',
    serial: 'BUR-26-005',
    fullName: 'Emmanuel Kipkemboi',
    age: 17,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Chepsir Secondary School',
    pollingStation: 'Chepsir Primary Polling Station',
    location: 'Tendeno',
    village: 'Chepsir',
    bursaryAmount: 12000,
    month: 'Jan',
    week: 'Week 3',
    status: 'Allocated',
    submittedDate: '2026-01-20',
    parentName: 'Grace Cherono',
    phone: '+254 711 234 567',
    needScore: 'High Need'
  },
  {
    id: 'app-26-006',
    year: '2026/2027',
    serial: 'BUR-26-006',
    fullName: 'Linet Chebet',
    age: 24,
    ageBracket: '23 and above',
    educationLevel: 'University',
    school: 'University of Nairobi',
    pollingStation: 'Kapsebet ECDE Polling Station',
    location: 'Sorget',
    village: 'Kapsebet',
    bursaryAmount: 25000,
    month: 'Apr',
    week: 'Week 1',
    status: 'Failed',
    failureReason: 'Missing certified fee structure and stamp',
    submittedDate: '2026-04-05',
    parentName: 'Joseph Bett',
    phone: '+254 723 998 877',
    needScore: 'Moderate Need'
  },
  {
    id: 'app-26-007',
    year: '2026/2027',
    serial: 'BUR-26-007',
    fullName: 'Dennis Kiprotich',
    age: 16,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Kericho Boys High School',
    pollingStation: 'Kapchelach Dispensary Polling Station',
    location: 'Sorget',
    village: 'Kapchelach',
    bursaryAmount: 14000,
    month: 'Feb',
    week: 'Week 4',
    status: 'Paid to account',
    submittedDate: '2026-02-28',
    parentName: 'Eunice Chepngetich',
    phone: '+254 715 678 123',
    needScore: 'High Need'
  },
  {
    id: 'app-26-008',
    year: '2026/2027',
    serial: 'BUR-26-008',
    fullName: 'Sharon Chepkirui',
    age: 13,
    ageBracket: 'Under 15',
    educationLevel: 'Primary',
    school: 'Sorget Boarding Primary',
    pollingStation: 'Sorget Forest Polling Station',
    location: 'Sorget',
    village: 'Sorget Central',
    bursaryAmount: 7000,
    month: 'Jan',
    week: 'Week 2',
    status: 'Allocated',
    submittedDate: '2026-01-18',
    parentName: 'Peter Koech',
    phone: '+254 718 223 344',
    needScore: 'Moderate Need'
  },
  {
    id: 'app-26-009',
    year: '2026/2027',
    serial: 'BUR-26-009',
    fullName: 'Collins Kiptoo',
    age: 21,
    ageBracket: '19 - 22',
    educationLevel: 'TVET / Vocational',
    school: 'Kericho National Polytechnic',
    pollingStation: 'Kapkures Tea Nursery Polling Station',
    location: 'Tendeno',
    village: 'Kapkures',
    bursaryAmount: 18000,
    month: 'Apr',
    week: 'Week 2',
    status: 'Failed',
    failureReason: 'Duplicate applicant national ID found',
    submittedDate: '2026-04-12',
    parentName: 'Agnes Chelangat',
    phone: '+254 729 443 322',
    needScore: 'Extreme Need'
  },
  {
    id: 'app-26-010',
    year: '2026/2027',
    serial: 'BUR-26-010',
    fullName: 'Brenda Cherono',
    age: 18,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Kipsigis Girls High School',
    pollingStation: 'Tendeno Primary Polling Station',
    location: 'Tendeno',
    village: 'Tendeno Central',
    bursaryAmount: 12000,
    month: 'Mar',
    week: 'Week 4',
    status: 'Allocated',
    submittedDate: '2026-03-24',
    parentName: 'James Kirui',
    phone: '+254 724 556 677',
    needScore: 'High Need'
  },
  {
    id: 'app-26-011',
    year: '2026/2027',
    serial: 'BUR-26-011',
    fullName: 'Allan Kipkoech',
    age: 22,
    ageBracket: '19 - 22',
    educationLevel: 'University',
    school: 'Egerton University',
    pollingStation: 'Kapchelach Dispensary Polling Station',
    location: 'Sorget',
    village: 'Kapchelach',
    bursaryAmount: 22000,
    month: 'Feb',
    week: 'Week 3',
    status: 'Failed',
    failureReason: 'Income declaration exceeds threshold',
    submittedDate: '2026-02-21',
    parentName: 'Gladys Cheruiyot',
    phone: '+254 713 112 233',
    needScore: 'High Need'
  },
  {
    id: 'app-26-012',
    year: '2026/2027',
    serial: 'BUR-26-012',
    fullName: 'Joan Chepchirchir',
    age: 15,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Sorget Secondary School',
    pollingStation: 'Kapsebet ECDE Polling Station',
    location: 'Sorget',
    village: 'Kapsebet',
    bursaryAmount: 10000,
    month: 'Mar',
    week: 'Week 3',
    status: 'Allocated',
    submittedDate: '2026-03-15',
    parentName: 'Moses Sang',
    phone: '+254 726 889 900',
    needScore: 'Moderate Need'
  },
  {
    id: 'app-26-013',
    year: '2026/2027',
    serial: 'BUR-26-013',
    fullName: 'Victor Bett',
    age: 17,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Chepsir Secondary School',
    pollingStation: 'Chepsir Primary Polling Station',
    location: 'Tendeno',
    village: 'Chepsir',
    bursaryAmount: 11000,
    month: 'Jan',
    week: 'Week 4',
    status: 'Failed',
    failureReason: 'Chief verification stamp missing',
    submittedDate: '2026-01-28',
    parentName: 'Ezekiel Bett',
    phone: '+254 714 887 766',
    needScore: 'Moderate Need'
  },
  {
    id: 'app-26-014',
    year: '2026/2027',
    serial: 'BUR-26-014',
    fullName: 'Cynthia Chepngetich',
    age: 20,
    ageBracket: '19 - 22',
    educationLevel: 'TVET / Vocational',
    school: 'Rift Valley Tech Training Institute',
    pollingStation: 'Tendeno Primary Polling Station',
    location: 'Tendeno',
    village: 'Tendeno Central',
    bursaryAmount: 16000,
    month: 'Feb',
    week: 'Week 1',
    status: 'Paid to account',
    submittedDate: '2026-02-05',
    parentName: 'Naomi Chepkoech',
    phone: '+254 721 334 990',
    needScore: 'High Need'
  },

  // 2025/2026
  {
    id: 'app-25-001',
    year: '2025/2026',
    serial: 'BUR-25-001',
    fullName: 'Gideon Kipruto',
    age: 17,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Chepsir Secondary School',
    pollingStation: 'Chepsir Primary Polling Station',
    location: 'Tendeno',
    village: 'Chepsir',
    bursaryAmount: 10000,
    month: 'Feb',
    week: 'Week 2',
    status: 'Paid to account',
    submittedDate: '2025-02-10',
    parentName: 'Alice Chepkoech',
    phone: '+254 712 111 222',
    needScore: 'High Need'
  },
  {
    id: 'app-25-002',
    year: '2025/2026',
    serial: 'BUR-25-002',
    fullName: 'Daisy Chelangat',
    age: 20,
    ageBracket: '19 - 22',
    educationLevel: 'University',
    school: 'Moi University',
    pollingStation: 'Sorget Forest Polling Station',
    location: 'Sorget',
    village: 'Sorget Central',
    bursaryAmount: 20000,
    month: 'Jan',
    week: 'Week 3',
    status: 'Paid to account',
    submittedDate: '2025-01-14',
    parentName: 'Joel Rono',
    phone: '+254 722 334 455',
    needScore: 'Extreme Need'
  },
  {
    id: 'app-25-003',
    year: '2025/2026',
    serial: 'BUR-25-003',
    fullName: 'Geoffrey Rotich',
    age: 19,
    ageBracket: '19 - 22',
    educationLevel: 'TVET / Vocational',
    school: 'Kericho National Polytechnic',
    pollingStation: 'Kapkures Tea Nursery Polling Station',
    location: 'Tendeno',
    village: 'Kapkures',
    bursaryAmount: 15000,
    month: 'Mar',
    week: 'Week 1',
    status: 'Failed',
    failureReason: 'Non-resident ward verification',
    submittedDate: '2025-03-03',
    parentName: 'Kiprotich Langat',
    phone: '+254 729 001 223',
    needScore: 'Moderate Need'
  },

  // 2024/2025
  {
    id: 'app-24-001',
    year: '2024/2025',
    serial: 'BUR-24-001',
    fullName: 'Titus Kipchumba',
    age: 18,
    ageBracket: '15 - 18',
    educationLevel: 'Secondary',
    school: 'Kipsigis High School',
    pollingStation: 'Kapchelach Dispensary Polling Station',
    location: 'Sorget',
    village: 'Kapchelach',
    bursaryAmount: 10000,
    month: 'Jan',
    week: 'Week 4',
    status: 'Paid to account',
    submittedDate: '2024-01-22',
    parentName: 'Kiprono Rop',
    phone: '+254 720 887 766',
    needScore: 'High Need'
  }
];

// Initial Issues raised by citizens with village color tagging
const INITIAL_ISSUES = [
  {
    id: 'iss-101',
    title: 'Severe Culvert Washout on Kapkures-Chepsir Feeder Road',
    category: 'Roads & Infrastructure',
    description: 'Heavy rains have completely blocked the culvert at Kapkures junction. School transport and milk collection trucks are stranded.',
    residentName: 'Kipkoech Chepkwony',
    residentPhone: '+254 721 345 678',
    village: 'Kapkures',
    location: 'Tendeno',
    dateReported: '2026-10-02',
    status: 'waiting', // waiting | scheduled | done | cancelled
    urgency: 'High',
    scheduledDate: '',
    scheduledTime: '',
    scheduledNotes: '',
    completionComment: '',
    completionPhotos: []
  },
  {
    id: 'iss-102',
    title: 'Broken Solar Submersible Pump at Sorget Central Community Borehole',
    category: 'Water & Sanitation',
    description: 'The solar inverter tripped during lightning storm. 300+ households currently walking 4km to the river for domestic water.',
    residentName: 'Beatrice Chelangat',
    residentPhone: '+254 713 908 123',
    village: 'Sorget Central',
    location: 'Sorget',
    dateReported: '2026-10-04',
    status: 'waiting',
    urgency: 'Critical',
    scheduledDate: '',
    scheduledTime: '',
    scheduledNotes: '',
    completionComment: '',
    completionPhotos: []
  },
  {
    id: 'iss-103',
    title: 'Faulty Transformer causing 2-Week Power Outage in Tendeno Trading Center',
    category: 'Energy & Power',
    description: 'Transformer blown at market square. Posho mills, salons, and cold milk stores are incurring daily losses.',
    residentName: 'Silas Langat',
    residentPhone: '+254 722 554 433',
    village: 'Tendeno Central',
    location: 'Tendeno',
    dateReported: '2026-10-05',
    status: 'scheduled',
    urgency: 'High',
    scheduledDate: '2026-10-12',
    scheduledTime: '10:00 AM',
    scheduledNotes: 'Joint site inspection with Kenya Power County Regional Engineer.',
    completionComment: '',
    completionPhotos: []
  },
  {
    id: 'iss-104',
    title: 'Roofing Sheeting Blown Off at Kapsebet ECDE Classroom',
    category: 'Education & Early Childhood',
    description: 'Windstorm de-roofed the junior pre-primary room. 45 young learners are sharing one cramped room in primary section.',
    residentName: 'Teacher Hellen Rono',
    residentPhone: '+254 719 223 889',
    village: 'Kapsebet',
    location: 'Sorget',
    dateReported: '2026-10-06',
    status: 'waiting',
    urgency: 'Medium',
    scheduledDate: '',
    scheduledTime: '',
    scheduledNotes: '',
    completionComment: '',
    completionPhotos: []
  },
  {
    id: 'iss-105',
    title: 'Essential Antibiotics & Malaria Test Kits Shortage at Kapchelach Dispensary',
    category: 'Health & Sanitation',
    description: 'Mothers seeking immunization and malaria treatment turned away due to stock-out in government dispensary.',
    residentName: 'Daniel Cheruiyot',
    residentPhone: '+254 710 445 566',
    village: 'Kapchelach',
    location: 'Sorget',
    dateReported: '2026-09-28',
    status: 'scheduled',
    urgency: 'High',
    scheduledDate: '2026-10-15',
    scheduledTime: '02:00 PM',
    scheduledNotes: 'Meeting Sub-County Medical Officer of Health regarding medicine restocking.',
    completionComment: '',
    completionPhotos: []
  },
  {
    id: 'iss-106',
    title: 'Illegal Sand Harvesting Causing Bank Erosion along Chepsir Stream',
    category: 'Environment',
    description: 'Unlicensed tipper lorries excavating riparian reserve near Chepsir bridge, weakening bridge foundation pillars.',
    residentName: 'Joshua Bett',
    residentPhone: '+254 725 667 788',
    village: 'Chepsir',
    location: 'Tendeno',
    dateReported: '2026-09-22',
    status: 'done',
    urgency: 'Medium',
    scheduledDate: '2026-09-25',
    scheduledTime: '11:00 AM',
    scheduledNotes: 'County enforcement visited riparian boundary.',
    completionComment: 'Site gazetted with riparian warning signs and enforcement patrols stationed.',
    completionPhotos: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'iss-107',
    title: 'Dilapidated Cattle Dip Water Troughs in Kapkures Sub-location',
    category: 'Agriculture & Livestock',
    description: 'Tick-borne diseases threatening dairy cows as cattle dip water troughs are cracked and leaking acaricide.',
    residentName: 'Elder Kipngetich Sang',
    residentPhone: '+254 721 776 543',
    village: 'Kapkures',
    location: 'Tendeno',
    dateReported: '2026-09-15',
    status: 'done',
    urgency: 'High',
    scheduledDate: '2026-09-18',
    scheduledTime: '09:30 AM',
    scheduledNotes: 'Inspected with livestock extension officer.',
    completionComment: 'Repaired concrete troughs and restocked 500L acaricide dip solution.',
    completionPhotos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

// Initial Developments
const INITIAL_DEVELOPMENTS = [
  {
    id: 'dev-001',
    title: 'Commissioning of Kapkures High-Yield Solar Borehole',
    village: 'Kapkures',
    location: 'Tendeno',
    completedDate: '2026-09-18',
    category: 'Water & Sanitation',
    comment: 'Successfully drilled to 160m depth with 10,000L elevated tank. Provides clean water to 420 families and Kapkures Primary School.',
    photos: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80'
    ],
    costKes: '1,450,000',
    beneficiaries: '2,100 residents',
    tag: 'Ward Fund 2026'
  },
  {
    id: 'dev-002',
    title: 'Gravelling & Culvert Installation on Chepsir - Kipsinende 4.2km Road',
    village: 'Chepsir',
    location: 'Tendeno',
    completedDate: '2026-08-30',
    category: 'Roads & Infrastructure',
    comment: 'Completed grading, heavy murram compaction, and 6 stone culverts. Farmers can now easily transport tea & milk to the buying center without mud blockage.',
    photos: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80'
    ],
    costKes: '2,800,000',
    beneficiaries: '3,800 residents',
    tag: 'County Ward Priority'
  },
  {
    id: 'dev-003',
    title: 'Construction of Modern 2-Classroom Tuition Block at Sorget Central ECDE',
    village: 'Sorget Central',
    location: 'Sorget',
    completedDate: '2026-07-22',
    category: 'Education & Early Childhood',
    comment: 'Handed over modern tiled classrooms with kid-friendly furniture, whiteboard, and 5-door pit latrine block to headteacher and parents.',
    photos: [
      'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80'
    ],
    costKes: '1,890,000',
    beneficiaries: '110 young learners',
    tag: 'Education Infrastructure'
  }
];

// Initial Messages
const INITIAL_MESSAGES = [
  {
    id: 'msg-01',
    senderName: 'Francis Kiprono',
    village: 'Tendeno Central',
    phone: '+254 721 998 123',
    subject: 'Bursary check delay for Chepsir Sec form 3 orphan',
    message: 'Greetings Hon. MCA. The help desk verified this orphan student whose cheque is delayed at ward office. Mother passed away, fee balance is 14k.',
    category: 'Bursary Follow-up',
    forwardedBy: 'Mercy Cherono (Help Desk Officer)',
    forwardedAt: '2026-10-07 09:30 AM',
    priority: 'Urgent',
    status: 'Pending MCA Action'
  },
  {
    id: 'msg-02',
    senderName: 'Elder Kipkorir',
    village: 'Kapsebet',
    phone: '+254 711 332 554',
    subject: 'Public Baraza requested regarding market shed drainage',
    message: 'Market vendors in Kapsebet request Hon. MCA to schedule a 30-min listening session next week during Wednesday market day.',
    category: 'Community Baraza',
    forwardedBy: 'David Langat (Help Desk Agent)',
    forwardedAt: '2026-10-06 03:15 PM',
    priority: 'Normal',
    status: 'Pending MCA Action'
  },
  {
    id: 'msg-03',
    senderName: 'Faith Chepkirui',
    village: 'Kapchelach',
    phone: '+254 728 441 990',
    subject: 'Youth Sports Tournament Sponsorship Request',
    message: 'Ward youth football tournament kickoff set for December holidays. Helpdesk received official constitution and proposal for soccer balls & trophy.',
    category: 'Youth & Sports',
    forwardedBy: 'Mercy Cherono (Help Desk Officer)',
    forwardedAt: '2026-10-05 11:20 AM',
    priority: 'Info',
    status: 'Reviewed'
  }
];

// Initial Profile
const INITIAL_PROFILE = {
  fullName: 'Hon. Hillary Kiprotich Bett',
  title: 'Member of County Assembly (MCA)',
  ward: 'Tendeno / Sorget Ward',
  constituency: 'Kipkelion West',
  county: 'Kericho County',
  term: '2022 - 2027 (Current)',
  phone: '+254 722 000 111',
  email: 'mca.tendeno@kericho.go.ke',
  officeLocation: 'Tendeno Civic Centre, Off Kericho-Kisumu Rd',
  liaisonOfficer: 'Mercy Chepkirui (+254 712 334 455)',
  workingHours: 'Mon - Fri, 8:00 AM - 5:00 PM',
  bio: 'Dedicated servant leader championing equitable bursary distribution, all-weather rural road connectivity, clean household water, and youth empowerment in Tendeno and Sorget.'
};

// Initial Cycle Settings
const DEFAULT_CYCLE_SETTINGS = {
  cycle: '2026/2027',
  openingDateTime: '2026-01-15T08:00',
  closingDateTime: '2026-04-30T17:00',
  state: 'allocated' // pending | allocated | disbursed | paid to account
};

/* STORAGE ACCESSORS */

export function getMCACycleSettings() {
  try {
    const raw = localStorage.getItem(MCA_CYCLE_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse cycle settings', e);
  }
  localStorage.setItem(MCA_CYCLE_SETTINGS_KEY, JSON.stringify(DEFAULT_CYCLE_SETTINGS));
  return DEFAULT_CYCLE_SETTINGS;
}

export function saveMCACycleSettings(settings) {
  localStorage.setItem(MCA_CYCLE_SETTINGS_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent('mcmca_mca_cycle_settings_updated', { detail: settings }));
  return settings;
}

export function getMCAApplications() {
  try {
    const raw = localStorage.getItem(MCA_APPS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse MCA applications', e);
  }
  localStorage.setItem(MCA_APPS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
  return INITIAL_APPLICATIONS;
}

export function saveMCAApplications(apps) {
  localStorage.setItem(MCA_APPS_KEY, JSON.stringify(apps));
  window.dispatchEvent(new CustomEvent('mcmca_mca_apps_updated', { detail: apps }));
  return apps;
}

export function getMCAIssues() {
  try {
    const raw = localStorage.getItem(MCA_ISSUES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse MCA issues', e);
  }
  localStorage.setItem(MCA_ISSUES_KEY, JSON.stringify(INITIAL_ISSUES));
  return INITIAL_ISSUES;
}

export function saveMCAIssues(issues) {
  localStorage.setItem(MCA_ISSUES_KEY, JSON.stringify(issues));
  window.dispatchEvent(new CustomEvent('mcmca_mca_issues_updated', { detail: issues }));
  return issues;
}

export function getMCADevelopments() {
  try {
    const raw = localStorage.getItem(MCA_DEVELOPMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse MCA developments', e);
  }
  localStorage.setItem(MCA_DEVELOPMENTS_KEY, JSON.stringify(INITIAL_DEVELOPMENTS));
  return INITIAL_DEVELOPMENTS;
}

export function saveMCADevelopments(devs) {
  localStorage.setItem(MCA_DEVELOPMENTS_KEY, JSON.stringify(devs));
  window.dispatchEvent(new CustomEvent('mcmca_mca_developments_updated', { detail: devs }));
  return devs;
}

export function addMCADevelopment(dev) {
  const current = getMCADevelopments();
  const newDev = {
    ...dev,
    id: `dev-${Date.now()}`,
    completedDate: dev.completedDate || new Date().toISOString().split('T')[0]
  };
  const updated = [newDev, ...current];
  saveMCADevelopments(updated);
  return newDev;
}

export function getMCAMessages() {
  try {
    const raw = localStorage.getItem(MCA_MESSAGES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse MCA messages', e);
  }
  localStorage.setItem(MCA_MESSAGES_KEY, JSON.stringify(INITIAL_MESSAGES));
  return INITIAL_MESSAGES;
}

export function saveMCAMessages(msgs) {
  localStorage.setItem(MCA_MESSAGES_KEY, JSON.stringify(msgs));
  window.dispatchEvent(new CustomEvent('mcmca_mca_messages_updated', { detail: msgs }));
  return msgs;
}

export function getMCAProfile() {
  try {
    const raw = localStorage.getItem(MCA_PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse MCA profile', e);
  }
  localStorage.setItem(MCA_PROFILE_KEY, JSON.stringify(INITIAL_PROFILE));
  return INITIAL_PROFILE;
}

export function saveMCAProfile(prof) {
  localStorage.setItem(MCA_PROFILE_KEY, JSON.stringify(prof));
  window.dispatchEvent(new CustomEvent('mcmca_mca_profile_updated', { detail: prof }));
  return prof;
}

export function markIssueAsDone(issueId, comment, photos = []) {
  const issues = getMCAIssues();
  let completedIssue = null;
  const updatedIssues = issues.map((iss) => {
    if (iss.id === issueId) {
      completedIssue = {
        ...iss,
        status: 'done',
        completionComment: comment,
        completionPhotos: photos,
        completedAt: new Date().toISOString().split('T')[0]
      };
      return completedIssue;
    }
    return iss;
  });

  saveMCAIssues(updatedIssues);

  if (completedIssue) {
    const devRecord = {
      title: completedIssue.title,
      village: completedIssue.village,
      location: completedIssue.location || 'Tendeno/Sorget',
      category: completedIssue.category || 'Ward Development',
      comment: comment || 'Successfully completed by the MCA Ward Administration.',
      photos: photos.length > 0 ? photos : [
        'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80'
      ],
      costKes: 'Ward Project',
      beneficiaries: `${completedIssue.village} Community`,
      tag: 'Completed Issue'
    };
    addMCADevelopment(devRecord);
  }

  return completedIssue;
}

export function scheduleIssue(issueId, date, time = '10:00 AM', notes = '') {
  const issues = getMCAIssues();
  const updated = issues.map((iss) => {
    if (iss.id === issueId) {
      return {
        ...iss,
        status: 'scheduled',
        scheduledDate: date,
        scheduledTime: time,
        scheduledNotes: notes
      };
    }
    return iss;
  });
  return saveMCAIssues(updated);
}

export function cancelIssue(issueId, reason = 'Cancelled by MCA') {
  const issues = getMCAIssues();
  const updated = issues.map((iss) => {
    if (iss.id === issueId) {
      return {
        ...iss,
        status: 'cancelled',
        cancellationReason: reason
      };
    }
    return iss;
  });
  return saveMCAIssues(updated);
}
