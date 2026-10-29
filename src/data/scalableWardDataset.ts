/**
 * Scalable Ward Dataset Engine (1,000+ Enterprise Dataset)
 * Tendeno / Sorget Ward — NG-CDF Bursary Pipeline
 *
 * Implements:
 * 1. Deterministic generation of 1,200+ realistic applicant records.
 * 2. Strict State Pipeline:
 *    - Ingestion -> Integrity & Residency Check
 *    - Suspicious / Boundary Failures -> Routed strictly to Area Chief
 *    - Chief Decision: Cleared (Master Verified Pool) OR Rejected
 *    - Rejected -> Appeals Loop -> If accepted, rejoins Master Verified Pool
 *    - Help Desk Visibility: Only Active / Cleared applications are in standard ledger
 * 3. Range-based cursor/pagination simulation (.range(from, to)).
 * 4. Aggregated demographic & parity statistics for MCA Executive BI.
 */

export interface WardApplicant {
  id: string;
  serial: string;
  fullName: string;
  initials: string;
  photoUrl?: string;
  nationalId: string;
  birthCert: string;
  upi: string;
  nemis: string;
  age: number;
  gender: 'Female' | 'Male';
  accountClass: 'CUS' | 'DEL' | 'IND';
  location: 'Tendeno' | 'Sorget';
  subLocation: string;
  village: string;
  pollingStation: string;
  school: string;
  institutionCategory: 'Secondary' | 'TVET' | 'University';
  institutionSubCategory: 'Secondary Day' | 'Secondary Boarding' | 'National Polytechnic' | 'Public University' | 'Private/Special Needs';
  feeBalance: number;
  requestedKes: number;
  allocatedKes: number;
  submittedAt: string;
  chiefStatus: 'Cleared' | 'Rejected' | 'Under Review';
  chiefScore: number;
  vulnerabilityCategory: 'Category A: Extreme Need / Total Orphan' | 'Category B: Single Parent / Vulnerable' | 'Category C: Low Income Household';
  guardianName: string;
  guardianPhone: string;
  relationship: string;
  riskFlag: 'Clean' | 'Residency Flagged' | 'NEMIS Discrepancy' | 'Income Cap Query';
  isResidencyFlagged: boolean;
  inMasterVerifiedPool: boolean;
  appealStatus: 'None' | 'Pending' | 'Accepted' | 'Dismissed';
  appealOverturned: boolean;
}

export const WARD_LOCATIONS = {
  Tendeno: ['Tendeno Central', 'Tendeno East', 'Tendeno West', 'Mware'],
  Sorget: ['Sorget Central', 'Sorget Forest', 'Kipchorian', 'Kamuingi']
} as const;

export type WardLocationKey = keyof typeof WARD_LOCATIONS;

const MALE_FIRST = ['Brian', 'Dennis', 'Kevin', 'Collins', 'Geoffrey', 'Titus', 'Emmanuel', 'Kelvin', 'Dominic', 'Erick', 'Victor', 'Amos', 'Kiprono', 'Gideon', 'Felix', 'Silas'];
const FEMALE_FIRST = ['Faith', 'Mercy', 'Sharon', 'Daisy', 'Brenda', 'Naomi', 'Chepkoech', 'Vivian', 'Gladys', 'Winny', 'Cynthia', 'Jackline', 'Diana', 'Dorcas', 'Sheila', 'Beatrice'];
const SURNAMES = ['Kiprono', 'Chebet', 'Koech', 'Langat', 'Rotich', 'Cherono', 'Kiptoo', 'Bett', 'Kipchumba', 'Chepkirui', 'Sang', 'Rono', 'Cheruiyot', 'Korir', 'Keter', 'Kemei'];

const SECONDARY_SCHOOLS = [
  { name: 'Tendeno Secondary School', sub: 'Secondary Day' as const },
  { name: 'Sorget Girls High School', sub: 'Secondary Boarding' as const },
  { name: 'Kipsigis Girls High School', sub: 'Secondary Boarding' as const },
  { name: 'Kericho Boys High School', sub: 'Secondary Boarding' as const },
  { name: 'Chepsir Day Secondary', sub: 'Secondary Day' as const },
  { name: 'Kipkelion Mixed Day School', sub: 'Secondary Day' as const }
];

const TVET_COLLEGES = [
  { name: 'Kericho National Polytechnic', sub: 'National Polytechnic' as const },
  { name: 'Kipkelion TVET Institute', sub: 'National Polytechnic' as const },
  { name: 'Rift Valley Institute of Science & Technology', sub: 'National Polytechnic' as const }
];

const UNIVERSITIES = [
  { name: 'Egerton University', sub: 'Public University' as const },
  { name: 'Moi University', sub: 'Public University' as const },
  { name: 'University of Kabianga', sub: 'Public University' as const },
  { name: 'Dedan Kimathi University of Technology', sub: 'Public University' as const },
  { name: 'St. Paul Special Needs Training Campus', sub: 'Private/Special Needs' as const }
];

function pseudoRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate deterministic enterprise pool of 1,260 applications
let cachedApplicants: WardApplicant[] | null = null;

export function getFullApplicantPool(): WardApplicant[] {
  if (cachedApplicants) return cachedApplicants;

  const pool: WardApplicant[] = [];
  const TOTAL_RECORDS = 1260;

  for (let i = 0; i < TOTAL_RECORDS; i++) {
    const seed = i + 101;
    const isFemale = pseudoRandom(seed * 3) > 0.49; // 51% female parity
    const gender = isFemale ? 'Female' : 'Male';
    const fNames = isFemale ? FEMALE_FIRST : MALE_FIRST;
    const fName = fNames[Math.floor(pseudoRandom(seed * 7) * fNames.length)];
    const sName = SURNAMES[Math.floor(pseudoRandom(seed * 11) * SURNAMES.length)];
    const fullName = `${fName} ${sName}`;
    const initials = `${fName[0]}${sName[0]}`;

    // 52% Tendeno, 48% Sorget
    const isTendeno = pseudoRandom(seed * 13) > 0.48;
    const location: WardLocationKey = isTendeno ? 'Tendeno' : 'Sorget';
    const subLocs = WARD_LOCATIONS[location];
    const subLocation = subLocs[Math.floor(pseudoRandom(seed * 17) * subLocs.length)];
    const village = `${subLocation} Village ${Math.floor(pseudoRandom(seed * 19) * 4) + 1}`;
    const pollingStation = `${subLocation} Polling Station`;

    // Age distribution: 14 to 32
    const ageRoll = pseudoRandom(seed * 23);
    const age = ageRoll < 0.52 ? Math.floor(14 + pseudoRandom(seed * 29) * 4) // 14-17 (Secondary)
      : ageRoll < 0.88 ? Math.floor(18 + pseudoRandom(seed * 31) * 7)       // 18-24 (College/Uni)
      : Math.floor(25 + pseudoRandom(seed * 37) * 7);                        // 25-31 (Adult Continuing)

    let accountClass: 'CUS' | 'DEL' | 'IND' = 'CUS';
    let institutionCategory: 'Secondary' | 'TVET' | 'University' = 'Secondary';
    let schoolInfo: { name: string; sub: WardApplicant['institutionSubCategory'] } = SECONDARY_SCHOOLS[Math.floor(pseudoRandom(seed * 41) * SECONDARY_SCHOOLS.length)];

    if (age <= 17) {
      accountClass = 'CUS';
      institutionCategory = 'Secondary';
      schoolInfo = SECONDARY_SCHOOLS[Math.floor(pseudoRandom(seed * 43) * SECONDARY_SCHOOLS.length)];
    } else if (age <= 22) {
      const isUni = pseudoRandom(seed * 47) > 0.45;
      accountClass = pseudoRandom(seed * 53) > 0.3 ? 'DEL' : 'IND';
      if (isUni) {
        institutionCategory = 'University';
        schoolInfo = UNIVERSITIES[Math.floor(pseudoRandom(seed * 59) * UNIVERSITIES.length)];
      } else {
        institutionCategory = 'TVET';
        schoolInfo = TVET_COLLEGES[Math.floor(pseudoRandom(seed * 61) * TVET_COLLEGES.length)];
      }
    } else {
      accountClass = 'IND';
      institutionCategory = pseudoRandom(seed * 67) > 0.5 ? 'TVET' : 'University';
      schoolInfo = institutionCategory === 'University'
        ? UNIVERSITIES[Math.floor(pseudoRandom(seed * 71) * UNIVERSITIES.length)]
        : TVET_COLLEGES[Math.floor(pseudoRandom(seed * 73) * TVET_COLLEGES.length)];
    }

    // Chief need score & Vulnerability Stratification
    const chiefScore = Math.floor(65 + pseudoRandom(seed * 79) * 34); // 65-98
    let vulnerabilityCategory: WardApplicant['vulnerabilityCategory'] = 'Category C: Low Income Household';
    if (chiefScore >= 90) {
      vulnerabilityCategory = 'Category A: Extreme Need / Total Orphan';
    } else if (chiefScore >= 78) {
      vulnerabilityCategory = 'Category B: Single Parent / Vulnerable';
    }

    // Fee balance and amounts
    const baseFee = institutionCategory === 'Secondary' ? 35000 : institutionCategory === 'TVET' ? 45000 : 75000;
    const feeBalance = Math.round((baseFee + pseudoRandom(seed * 83) * 20000) / 500) * 500;
    const requestedKes = Math.round((feeBalance * 0.6) / 500) * 500;
    const allocatedKes = chiefScore >= 90 ? requestedKes : Math.round((requestedKes * 0.8) / 500) * 500;

    // State machine distribution:
    // ~80% Cleared directly by Chief
    // ~12% Flagged for residency or boundary issue -> routed strictly to Chief
    // ~8% Chief rejected -> enter Appeals loop -> 70% accepted on appeal
    const pipelineRoll = pseudoRandom(seed * 89);
    let chiefStatus: 'Cleared' | 'Rejected' | 'Under Review' = 'Cleared';
    let isResidencyFlagged = false;
    let riskFlag: WardApplicant['riskFlag'] = 'Clean';
    let appealStatus: WardApplicant['appealStatus'] = 'None';
    let appealOverturned = false;
    let inMasterVerifiedPool = true;

    if (pipelineRoll > 0.88) {
      // Flagged by residency/boundary rules
      isResidencyFlagged = true;
      riskFlag = 'Residency Flagged';
      chiefStatus = 'Under Review';
      inMasterVerifiedPool = false;
    } else if (pipelineRoll > 0.79) {
      // Chief rejected initially -> triggered appeal
      chiefStatus = 'Rejected';
      const appealRoll = pseudoRandom(seed * 97);
      if (appealRoll > 0.35) {
        // Appeal Accepted by Chief -> Re-joins Master Verified Pool!
        appealStatus = 'Accepted';
        appealOverturned = true;
        inMasterVerifiedPool = true;
      } else {
        appealStatus = 'Dismissed';
        inMasterVerifiedPool = false;
      }
    } else {
      chiefStatus = 'Cleared';
      inMasterVerifiedPool = true;
    }

    const serialNum = (i + 1).toString().padStart(4, '0');
    const nationalId = (31000000 + Math.floor(pseudoRandom(seed * 103) * 9000000)).toString();
    const nemis = `NEM-${(100000 + i * 7).toString()}`;
    const dateDay = (Math.floor(pseudoRandom(seed * 107) * 28) + 1).toString().padStart(2, '0');
    const submittedAt = `2026-02-${dateDay}T10:30:00Z`;

    pool.push({
      id: `ward-app-${serialNum}`,
      serial: `BUR-26-${serialNum}`,
      fullName,
      initials,
      nationalId,
      birthCert: `BC-2026-${(4000 + i).toString()}`,
      upi: nemis,
      nemis,
      age,
      gender,
      accountClass,
      location,
      subLocation,
      village,
      pollingStation,
      school: schoolInfo.name,
      institutionCategory,
      institutionSubCategory: schoolInfo.sub,
      feeBalance,
      requestedKes,
      allocatedKes,
      submittedAt,
      chiefStatus,
      chiefScore,
      vulnerabilityCategory,
      guardianName: `${fName}'s Guardian`,
      guardianPhone: `07${Math.floor(10000000 + pseudoRandom(seed * 109) * 89999999)}`,
      relationship: accountClass === 'IND' ? 'Self' : isFemale ? 'Mother' : 'Father',
      riskFlag,
      isResidencyFlagged,
      inMasterVerifiedPool,
      appealStatus,
      appealOverturned
    });
  }

  cachedApplicants = pool;
  return pool;
}

export interface FetchApplicantsQuery {
  location?: string | null;
  subLocation?: string | null;
  search?: string;
  ageBracket?: 'all' | '14-17' | '18-24' | '25+';
  gender?: 'all' | 'Female' | 'Male';
  institutionCategory?: 'all' | 'Secondary' | 'TVET' | 'University';
  village?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'age' | 'submittedAt' | 'village' | 'gender' | 'feeBalance' | 'name' | 'serial';
  sortOrder?: 'asc' | 'desc';
  onlyVerifiedPool?: boolean;
}

export interface FetchApplicantsResult {
  requiresFilterSelection: boolean;
  totalMatching: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: WardApplicant[];
  telemetry: {
    totalWardIntake: number;
    verifiedAndCleared: number;
    inChiefTriage: number;
    appealsResolved: number;
    appealsRejected: number;
  };
}

/**
 * Server-side range simulation (.range(from, to)) enforcing:
 * - Table containers MUST mount in an Initial Filter State.
 * - Data fetching is blocked until both Location and Sub-Location are explicitly selected.
 * - Displays only Active / Cleared Applicants in the Master Verified Pool.
 */
export function fetchScalableApplicants(query: FetchApplicantsQuery): FetchApplicantsResult {
  const pool = getFullApplicantPool();

  const totalWardIntake = pool.length;
  const verifiedAndCleared = pool.filter((a) => a.inMasterVerifiedPool).length;
  const inChiefTriage = pool.filter((a) => a.chiefStatus === 'Under Review' || a.isResidencyFlagged).length;
  const appealsResolved = pool.filter((a) => a.appealStatus === 'Accepted').length;
  const appealsRejected = pool.filter((a) => a.appealStatus === 'Dismissed').length;

  const telemetry = {
    totalWardIntake,
    verifiedAndCleared,
    inChiefTriage,
    appealsResolved,
    appealsRejected
  };

  // Zero-Default-Render & Mandatory Cascading Filters
  if (!query.location || !query.subLocation || query.location === 'all' || query.subLocation === 'all') {
    return {
      requiresFilterSelection: true,
      totalMatching: 0,
      page: 1,
      pageSize: query.pageSize || 25,
      totalPages: 0,
      items: [],
      telemetry
    };
  }

  // Help Desk Visibility Rule: General ledger only surfaces Active / Cleared pipeline
  let rows = pool.filter((a) => a.inMasterVerifiedPool);

  // Administrative Boundary Filters
  rows = rows.filter((a) => a.location === query.location && a.subLocation === query.subLocation);

  // Secondary Filters
  if (query.village && query.village !== 'all') {
    rows = rows.filter((a) => a.village === query.village);
  }

  if (query.gender && query.gender !== 'all') {
    rows = rows.filter((a) => a.gender === query.gender);
  }

  if (query.institutionCategory && query.institutionCategory !== 'all') {
    rows = rows.filter((a) => a.institutionCategory === query.institutionCategory);
  }

  if (query.ageBracket && query.ageBracket !== 'all') {
    if (query.ageBracket === '14-17') rows = rows.filter((a) => a.age >= 14 && a.age <= 17);
    else if (query.ageBracket === '18-24') rows = rows.filter((a) => a.age >= 18 && a.age <= 24);
    else if (query.ageBracket === '25+') rows = rows.filter((a) => a.age >= 25);
  }

  if (query.search && query.search.trim()) {
    const q = query.search.trim().toLowerCase();
    rows = rows.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.serial.toLowerCase().includes(q) ||
        a.nationalId.includes(q) ||
        a.nemis.toLowerCase().includes(q) ||
        a.school.toLowerCase().includes(q)
    );
  }

  // Server-side sorting
  const sortBy = query.sortBy || 'submittedAt';
  const sortOrder = query.sortOrder || 'desc';

  rows.sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'age') cmp = a.age - b.age;
    else if (sortBy === 'gender') cmp = a.gender.localeCompare(b.gender);
    else if (sortBy === 'feeBalance') cmp = a.feeBalance - b.feeBalance;
    else if (sortBy === 'village') cmp = a.village.localeCompare(b.village);
    else if (sortBy === 'name') cmp = a.fullName.localeCompare(b.fullName);
    else if (sortBy === 'serial') cmp = a.serial.localeCompare(b.serial);
    else cmp = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const totalMatching = rows.length;
  const pageSize = query.pageSize || 25;
  const page = Math.max(1, query.page || 1);
  const totalPages = Math.ceil(totalMatching / pageSize) || 1;

  // Supabase .range(from, to) simulation
  const from = (page - 1) * pageSize;
  const to = from + pageSize;
  const items = rows.slice(from, to);

  return {
    requiresFilterSelection: false,
    totalMatching,
    page,
    pageSize,
    totalPages,
    items,
    telemetry
  };
}

/**
 * Aggregated Sub-Location Comparative Matrix for MCA BI Hub
 */
export interface SubLocationMatrixRow {
  subLocation: string;
  location: string;
  totalRegistered: number;
  clearedCount: number;
  clearedPct: number;
  secondaryCount: number;
  tertiaryCount: number;
  fundsCommittedKes: number;
  paritySharePct: number;
}

export function getSubLocationMatrixStats(): { rows: SubLocationMatrixRow[]; totals: SubLocationMatrixRow } {
  const pool = getFullApplicantPool();
  const subLocList: { loc: 'Tendeno' | 'Sorget'; sub: string }[] = [
    { loc: 'Tendeno', sub: 'Tendeno Central' },
    { loc: 'Tendeno', sub: 'Tendeno East' },
    { loc: 'Tendeno', sub: 'Tendeno West' },
    { loc: 'Tendeno', sub: 'Mware' },
    { loc: 'Sorget', sub: 'Sorget Central' },
    { loc: 'Sorget', sub: 'Sorget Forest' },
    { loc: 'Sorget', sub: 'Kipchorian' },
    { loc: 'Sorget', sub: 'Kamuingi' }
  ];

  const totalWardPoolFunds = 15_000_000;
  const totalCommittedOverall = pool.filter((a) => a.inMasterVerifiedPool).reduce((acc, a) => acc + a.allocatedKes, 0);

  const rows: SubLocationMatrixRow[] = subLocList.map(({ loc, sub }) => {
    const list = pool.filter((a) => a.location === loc && a.subLocation === sub);
    const totalRegistered = list.length;
    const cleared = list.filter((a) => a.inMasterVerifiedPool);
    const clearedCount = cleared.length;
    const clearedPct = totalRegistered > 0 ? (clearedCount / totalRegistered) * 100 : 0;
    const secondaryCount = cleared.filter((a) => a.institutionCategory === 'Secondary').length;
    const tertiaryCount = cleared.filter((a) => a.institutionCategory === 'TVET' || a.institutionCategory === 'University').length;
    const fundsCommittedKes = cleared.reduce((sum, a) => sum + a.allocatedKes, 0);
    const paritySharePct = totalCommittedOverall > 0 ? (fundsCommittedKes / totalCommittedOverall) * 100 : 0;

    return {
      subLocation: sub,
      location: loc,
      totalRegistered,
      clearedCount,
      clearedPct,
      secondaryCount,
      tertiaryCount,
      fundsCommittedKes,
      paritySharePct
    };
  });

  const totals: SubLocationMatrixRow = {
    subLocation: 'Ward Aggregate Total',
    location: 'Tendeno/Sorget Ward',
    totalRegistered: pool.length,
    clearedCount: pool.filter((a) => a.inMasterVerifiedPool).length,
    clearedPct: (pool.filter((a) => a.inMasterVerifiedPool).length / pool.length) * 100,
    secondaryCount: pool.filter((a) => a.inMasterVerifiedPool && a.institutionCategory === 'Secondary').length,
    tertiaryCount: pool.filter((a) => a.inMasterVerifiedPool && (a.institutionCategory === 'TVET' || a.institutionCategory === 'University')).length,
    fundsCommittedKes: totalCommittedOverall,
    paritySharePct: 100
  };

  return { rows, totals };
}

/**
 * Interactive Demographic Analytics for MCA BI Hub
 */
export function getDemographicAnalytics() {
  const pool = getFullApplicantPool().filter((a) => a.inMasterVerifiedPool);
  const total = pool.length || 1;

  // 1. Gender breakdown
  const femaleCount = pool.filter((a) => a.gender === 'Female').length;
  const maleCount = pool.filter((a) => a.gender === 'Male').length;
  const gender = {
    female: { count: femaleCount, pct: (femaleCount / total) * 100 },
    male: { count: maleCount, pct: (maleCount / total) * 100 },
    parityRatio: (femaleCount / maleCount).toFixed(2)
  };

  // 2. Age Demographics
  const under18 = pool.filter((a) => a.age < 18);
  const age18to24 = pool.filter((a) => a.age >= 18 && a.age <= 24);
  const age25plus = pool.filter((a) => a.age >= 25);
  const ageGroups = [
    { label: 'Under 18 [CUS]', range: '14 - 17 yrs', count: under18.length, pct: (under18.length / total) * 100, tone: 'emerald' },
    { label: '18–24 [DEL/IND]', range: '18 - 24 yrs', count: age18to24.length, pct: (age18to24.length / total) * 100, tone: 'cyan' },
    { label: '25+ Adult Continuing', range: '25+ yrs', count: age25plus.length, pct: (age25plus.length / total) * 100, tone: 'violet' }
  ];

  // 3. Institution Split
  const secDay = pool.filter((a) => a.institutionSubCategory === 'Secondary Day').length;
  const secBoarding = pool.filter((a) => a.institutionSubCategory === 'Secondary Boarding').length;
  const polytechnic = pool.filter((a) => a.institutionSubCategory === 'National Polytechnic').length;
  const pubUni = pool.filter((a) => a.institutionSubCategory === 'Public University').length;
  const privSpecial = pool.filter((a) => a.institutionSubCategory === 'Private/Special Needs').length;

  const institutions = [
    { label: 'Secondary Day', count: secDay, pct: (secDay / total) * 100, color: '#34d399' },
    { label: 'Secondary Boarding', count: secBoarding, pct: (secBoarding / total) * 100, color: '#10b981' },
    { label: 'National Polytechnics', count: polytechnic, pct: (polytechnic / total) * 100, color: '#fbbf24' },
    { label: 'Public Universities', count: pubUni, pct: (pubUni / total) * 100, color: '#818cf8' },
    { label: 'Private / Special Needs', count: privSpecial, pct: (privSpecial / total) * 100, color: '#f43f5e' }
  ];

  // 4. Vulnerability Stratification
  const catA = pool.filter((a) => a.chiefScore >= 90);
  const catB = pool.filter((a) => a.chiefScore >= 78 && a.chiefScore < 90);
  const catC = pool.filter((a) => a.chiefScore < 78);

  const vulnerability = [
    {
      category: 'Category A',
      title: 'Extreme Need / Total Orphan',
      scoreRange: 'Score 90–99',
      count: catA.length,
      pct: (catA.length / total) * 100,
      fundsAllocated: catA.reduce((sum, a) => sum + a.allocatedKes, 0),
      tone: 'gold' as const
    },
    {
      category: 'Category B',
      title: 'Single Parent / Severe Hardship',
      scoreRange: 'Score 78–89',
      count: catB.length,
      pct: (catB.length / total) * 100,
      fundsAllocated: catB.reduce((sum, a) => sum + a.allocatedKes, 0),
      tone: 'emerald' as const
    },
    {
      category: 'Category C',
      title: 'Low Income Baseline Household',
      scoreRange: 'Score 65–77',
      count: catC.length,
      pct: (catC.length / total) * 100,
      fundsAllocated: catC.reduce((sum, a) => sum + a.allocatedKes, 0),
      tone: 'cyan' as const
    }
  ];

  return { gender, ageGroups, institutions, vulnerability, totalVerified: total };
}

/**
 * Anomaly and Audit Statistics for /mca/applications/anomalies
 */
export function getAuditAnomaliesData() {
  const pool = getFullApplicantPool();
  const flaggedResidency = pool.filter((a) => a.isResidencyFlagged);
  const rejectedDirect = pool.filter((a) => a.chiefStatus === 'Rejected' && a.appealStatus === 'None');
  const appeals = pool.filter((a) => a.appealStatus !== 'None');
  const appealsOverturned = appeals.filter((a) => a.appealStatus === 'Accepted');
  const appealsDismissed = appeals.filter((a) => a.appealStatus === 'Dismissed');

  return {
    intakeTotal: pool.length,
    flaggedResidencyCount: flaggedResidency.length,
    rejectedDirectCount: rejectedDirect.length,
    appealsTotal: appeals.length,
    appealsOverturnedCount: appealsOverturned.length,
    appealsDismissedCount: appealsDismissed.length,
    appealOverturnRatePct: appeals.length > 0 ? (appealsOverturned.length / appeals.length) * 100 : 0,
    clusters: [
      {
        location: 'Tendeno',
        subLocation: 'Tendeno West',
        anomalyType: 'Kipkelion Border Residency Disputes',
        flaggedCount: 42,
        status: 'Under Area Chief Field Audit',
        severity: 'amber' as const
      },
      {
        location: 'Sorget',
        subLocation: 'Sorget Forest',
        anomalyType: 'Forest Outpost Declaration Gap',
        flaggedCount: 29,
        status: 'Sub-Chief Baraza Affidavit Required',
        severity: 'cyan' as const
      },
      {
        location: 'Tendeno',
        subLocation: 'Mware',
        anomalyType: 'Duplicate Household Claims',
        flaggedCount: 16,
        status: 'Resolved via National ID Cross-Check',
        severity: 'emerald' as const
      }
    ]
  };
}
