/**
 * Institution & Admissions Data Service for McMCA
 * Manages Ward Institutions (Vacancies, Fees, Courses) and Public Applications.
 * Synchronizes across Guest Page application modal, MCA Dashboard, and Help Desk Dashboard.
 */

const INSTITUTIONS_KEY = 'mcmca_institutions_v1';
const INSTITUTION_APPS_KEY = 'mcmca_institution_applications_v1';

export const INITIAL_INSTITUTIONS = [
  {
    id: 'inst-01',
    name: 'Tendeno Vocational Training Centre',
    type: 'Vocational Training Centre (VTC)',
    location: 'Tendeno Central',
    vacancies: 60,
    fees: 22000,
    subsidizedPercent: 80,
    contactPerson: 'Mr. David Langat',
    phone: '+254 721 345 678',
    courses: ['Electrical & Solar Systems', 'Automotive Mechanics', 'Carpentry & Joinery', 'Welding & Metal Fabrication'],
    requirements: ['KCPE / KCSE Certificate or Equivalent', 'Copy of National ID / Birth Certificate', 'Tendeno Ward Resident', '2 Passport Photos'],
    establishedYear: 2018,
    status: 'Active'
  },
  {
    id: 'inst-02',
    name: 'Sorget Technical & Agricultural Institute',
    type: 'Technical Institute',
    location: 'Sorget Central',
    vacancies: 45,
    fees: 26000,
    subsidizedPercent: 75,
    contactPerson: 'Mrs. Beatrice Koech',
    phone: '+254 722 456 789',
    courses: ['Modern Agribusiness & Crop Science', 'Dairy & Animal Husbandry', 'Plumbing & Water Systems', 'Food Processing'],
    requirements: ['KCSE Mean Grade D or above', 'Ward Residency Letter', 'National ID Card'],
    establishedYear: 2020,
    status: 'Active'
  },
  {
    id: 'inst-03',
    name: 'Kapkures Youth Polytechnic',
    type: 'Youth Polytechnic',
    location: 'Kapkures',
    vacancies: 35,
    fees: 18000,
    subsidizedPercent: 90,
    contactPerson: 'Eng. Peter Rotich',
    phone: '+254 723 567 890',
    courses: ['Masonry & Building Technology', 'Fashion Design & Garment Making', 'Beauty & Hairdressing'],
    requirements: ['Open Entry (Primary School Leavers / Secondary Leavers)', 'National ID / Birth Cert'],
    establishedYear: 2016,
    status: 'Active'
  },
  {
    id: 'inst-04',
    name: 'Chepsir Technical Training Institute',
    type: 'Technical College',
    location: 'Chepsir',
    vacancies: 50,
    fees: 24000,
    subsidizedPercent: 80,
    contactPerson: 'Dr. Caroline Chepkirui',
    phone: '+254 724 678 901',
    courses: ['Information Communication Technology (ICT)', 'Digital Skills & Graphic Design', 'Motor Vehicle Electricals'],
    requirements: ['KCSE Certificate', 'ID Card Copy', 'Birth Certificate'],
    establishedYear: 2021,
    status: 'Active'
  },
  {
    id: 'inst-05',
    name: 'Kapsebet Community College',
    type: 'Community College',
    location: 'Kapsebet',
    vacancies: 40,
    fees: 20000,
    subsidizedPercent: 85,
    contactPerson: 'Mr. Julius Kiprono',
    phone: '+254 725 789 012',
    courses: ['Electrical Installation', 'Plumbing & Pipefitting', 'Welding & Fabrication'],
    requirements: ['National ID / Birth Cert', 'Passport Photo', 'Ward Resident'],
    establishedYear: 2019,
    status: 'Active'
  },
  {
    id: 'inst-06',
    name: 'Kapchelach Skills Innovation Hub',
    type: 'Vocational Hub',
    location: 'Kapchelach',
    vacancies: 25,
    fees: 19000,
    subsidizedPercent: 100,
    contactPerson: 'Ms. Faith Sang',
    phone: '+254 726 890 123',
    courses: ['Renewable Energy & Solar Tech', 'Commercial Baking & Pastry', 'ICT & Cyber Literacy'],
    requirements: ['Youth aged 17-30', 'ID Card', 'Ward Residency Letter'],
    establishedYear: 2022,
    status: 'Active'
  }
];

export const INITIAL_APPLICATIONS = [
  {
    id: 'app-inst-01',
    referenceNo: 'INST-2026-0101',
    firstName: 'Mercy',
    lastName: 'Cherono',
    gender: 'Female',
    nationalId: '39881234',
    email: 'mercy.cherono@gmail.com',
    phone: '+254 728 112 233',
    fileName: 'KCSE_Result_Slip_Mercy.pdf',
    parentName: 'Alice Cherono',
    parentRelationship: 'Mother',
    parentPhone: '+254 722 990 011',
    parentEmail: 'alice.cherono@gmail.com',
    location: 'Tendeno Central',
    preferredInstitute: 'Tendeno Vocational Training Centre',
    preferredCourse: 'Electrical & Solar Systems',
    notes: 'Interested in solar panel installation workshop.',
    submittedAt: '2026-10-09T09:15:00.000Z',
    status: 'Accepted',
    issueFlag: 'Duplicate Email'
  },
  {
    id: 'app-inst-02',
    referenceNo: 'INST-2026-0102',
    firstName: 'Mercy',
    lastName: 'Cherono',
    gender: 'Female',
    nationalId: '39881234',
    email: 'mercy.cherono@gmail.com',
    phone: '+254 728 112 233',
    fileName: 'ID_Document_Copy.pdf',
    parentName: 'Alice Cherono',
    parentRelationship: 'Mother',
    parentPhone: '+254 722 990 011',
    parentEmail: 'alice.cherono@gmail.com',
    location: 'Sorget Central',
    preferredInstitute: 'Sorget Technical & Agricultural Institute',
    preferredCourse: 'Modern Agribusiness & Crop Science',
    notes: 'Second choice application submitted directly.',
    submittedAt: '2026-10-09T14:30:00.000Z',
    status: 'Accepted',
    issueFlag: 'Duplicate Email'
  },
  {
    id: 'app-inst-03',
    referenceNo: 'INST-2026-0103',
    firstName: 'Denis',
    lastName: 'Kipruto',
    gender: 'Male',
    nationalId: '38112299',
    email: 'denis.kipruto@gmail.com',
    phone: '+254 719 445 566',
    fileName: 'School_Leaving_Certificate.pdf',
    parentName: 'Wilson Kipruto',
    parentRelationship: 'Father',
    parentPhone: '+254 720 334 455',
    parentEmail: '',
    location: 'Chepsir',
    preferredInstitute: 'Chepsir Technical Training Institute',
    preferredCourse: 'Information Communication Technology (ICT)',
    notes: 'Passionate about coding and graphic design.',
    submittedAt: '2026-10-10T11:00:00.000Z',
    status: 'Accepted',
    issueFlag: 'Clean'
  },
  {
    id: 'app-inst-04',
    referenceNo: 'INST-2026-0104',
    firstName: 'Brian',
    lastName: 'Kipkoech',
    gender: 'Male',
    nationalId: '37220011',
    email: 'brian.koech@gmail.com',
    phone: '07123', // Intentional short/invalid phone format
    fileName: '', // Missing document file
    parentName: 'Grace Koech',
    parentRelationship: 'Mother',
    parentPhone: '+254 711 889 900',
    parentEmail: '',
    location: 'Kapkures',
    preferredInstitute: 'Kapkures Youth Polytechnic',
    preferredCourse: 'Masonry & Building Technology',
    notes: 'Primary school certificate pending collection.',
    submittedAt: '2026-10-11T08:45:00.000Z',
    status: 'Accepted',
    issueFlag: 'Invalid Phone & Missing File'
  },
  {
    id: 'app-inst-05',
    referenceNo: 'INST-2026-0105',
    firstName: 'Sharon',
    lastName: 'Chebet',
    gender: 'Female',
    nationalId: '40115588',
    email: 'sharon.chebet@gmail.com',
    phone: '+254 725 332 211',
    fileName: 'Sharon_Cert_2026.pdf',
    parentName: 'Ezekiel Chebet',
    parentRelationship: 'Father',
    parentPhone: '+254 721 665 544',
    parentEmail: 'ezekiel.chebet@gmail.com',
    location: 'Kapsebet',
    preferredInstitute: 'Kapsebet Community College',
    preferredCourse: 'Electrical Installation',
    notes: 'Completed secondary education in 2025.',
    submittedAt: '2026-10-11T16:20:00.000Z',
    status: 'Accepted',
    issueFlag: 'Clean'
  },
  {
    id: 'app-inst-06',
    referenceNo: 'INST-2026-0106',
    firstName: 'Kevin',
    lastName: 'Kiprono',
    gender: 'Male',
    nationalId: '39441122',
    email: 'kevin.kiprono@yahoo.com',
    phone: '+254 718 223 344',
    fileName: 'Kevin_KCSE.pdf',
    parentName: 'Sarah Kiprono',
    parentRelationship: 'Mother',
    parentPhone: '+254 729 443 322',
    parentEmail: '',
    location: 'Tendeno Central',
    preferredInstitute: 'Tendeno Vocational Training Centre',
    preferredCourse: 'Automotive Mechanics',
    notes: 'Seeking morning session enrolment.',
    submittedAt: '2026-10-12T10:10:00.000Z',
    status: 'Accepted',
    issueFlag: 'Clean'
  }
];

export function getInstitutions() {
  try {
    const raw = localStorage.getItem(INSTITUTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored institutions', e);
  }
  localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(INITIAL_INSTITUTIONS));
  return INITIAL_INSTITUTIONS;
}

export function saveInstitution(inst) {
  const current = getInstitutions();
  const index = current.findIndex(i => i.id === inst.id);
  let updated;
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...updated[index], ...inst };
  } else {
    const newInst = {
      ...inst,
      id: inst.id || `inst-${Date.now()}`,
      status: inst.status || 'Active'
    };
    updated = [newInst, ...current];
  }
  localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_institutions_updated', { detail: updated }));
  return updated;
}

export function updateInstituteVacancies(id, newVacancies) {
  const current = getInstitutions();
  const val = Math.max(0, parseInt(newVacancies, 10) || 0);
  const updated = current.map(i => i.id === id ? { ...i, vacancies: val } : i);
  localStorage.setItem(INSTITUTIONS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_institutions_updated', { detail: updated }));
  return updated;
}

export function getInstitutionApplications() {
  try {
    const raw = localStorage.getItem(INSTITUTION_APPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored institution apps', e);
  }
  localStorage.setItem(INSTITUTION_APPS_KEY, JSON.stringify(INITIAL_APPLICATIONS));
  return INITIAL_APPLICATIONS;
}

export function submitInstitutionApplication(data) {
  const current = getInstitutionApplications();
  const nextSerial = 100 + current.length + 1;
  const ref = `INST-2026-${String(nextSerial).padStart(4, '0')}`;
  
  // Check for email duplicates
  const emailNorm = (data.email || '').trim().toLowerCase();
  const hasDuplicateEmail = emailNorm && current.some(a => (a.email || '').trim().toLowerCase() === emailNorm);
  
  let issueFlag = 'Clean';
  if (hasDuplicateEmail) {
    issueFlag = 'Duplicate Email';
  } else if (!data.fileName || (data.phone && data.phone.replace(/\D/g, '').length < 9)) {
    issueFlag = 'Verification Notice';
  }

  const newApp = {
    ...data,
    id: `app-inst-${Date.now()}`,
    referenceNo: ref,
    status: 'Accepted', // "they cannot reject. they will always be accepted"
    submittedAt: new Date().toISOString(),
    issueFlag
  };

  const updated = [newApp, ...current];
  localStorage.setItem(INSTITUTION_APPS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_inst_apps_updated', { detail: updated }));
  return newApp;
}

export function updateApplication(id, patch) {
  const current = getInstitutionApplications();
  const updated = current.map(app => app.id === id ? { ...app, ...patch } : app);
  localStorage.setItem(INSTITUTION_APPS_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('mcmca_inst_apps_updated', { detail: updated }));
  return updated;
}

export function getInstituteApplicationCounts() {
  const apps = getInstitutionApplications();
  const counts = {};
  apps.forEach(a => {
    const instName = a.preferredInstitute || 'Unassigned';
    counts[instName] = (counts[instName] || 0) + 1;
  });
  return counts;
}

export function getDuplicatesAndIssues() {
  const apps = getInstitutionApplications();
  const emailMap = {};
  apps.forEach(app => {
    const e = (app.email || '').trim().toLowerCase();
    if (e) {
      if (!emailMap[e]) emailMap[e] = [];
      emailMap[e].push(app);
    }
  });

  const duplicateGroups = Object.entries(emailMap)
    .filter(([_, list]) => list.length > 1)
    .map(([email, items]) => ({ email, items }));

  const invalidOrIncomplete = apps.filter(app => {
    const phoneDigits = (app.phone || '').replace(/\D/g, '');
    const isPhoneShort = phoneDigits.length < 9;
    const isMissingFile = !app.fileName;
    return isPhoneShort || isMissingFile;
  });

  return { duplicateGroups, invalidOrIncomplete };
}
