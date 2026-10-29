/**
 * MCA Executive Workspace Data Adapter & Local Storage Store.
 * Conforms to sql/budget_tranches.sql and src/workspaces/types/schema.ts.
 */
import { clamp, parseKes, hash01 } from '../lib/format.ts';
import type {
  AlertItem,
  AwardRow,
  BudgetTranche,
  InstitutionPayable,
  SearchHit
} from '../types/schema.ts';
import { appendLedger } from '../lib/ledger.ts';

export const MCA_EVENTS = [
  'mcmca_mca_tranche_updated',
  'mcmca_mca_awards_updated',
  'mcmca_mca_appeals_updated',
  'mcmca_mca_disbursements_updated',
  'mcmca_mca_messages_updated'
];

const TRANCHE_KEY = 'mcmca_ws_mca_tranche_v1';
const AWARDS_KEY = 'mcmca_ws_mca_awards_v1';
const DISBURSEMENTS_KEY = 'mcmca_ws_mca_disbursements_v1';
const APPEALS_KEY = 'mcmca_ws_mca_appeals_v1';
const COMMITTEE_KEY = 'mcmca_ws_mca_committee_v1';

export const INITIAL_TRANCHE: BudgetTranche = {
  id: 'tranche-2026-2027-01',
  academic_cycle: '2026/2027',
  title: 'Tendeno/Sorget Ward Main CDF Allocation',
  total_amount: 15_000_000,
  committed_amount: 6_580_000,
  hard_cap_amount: 15_000_000,
  reserve_amount: 1_500_000,
  reserve_committed: 420_000,
  warn_threshold_pct: 80,
  min_sublocation_share_pct: 15,
  is_active: true,
  created_at: '2026-01-10T08:00:00Z',
  updated_at: '2026-10-29T08:00:00Z'
};

export const INITIAL_AWARDS: AwardRow[] = [
  {
    id: 'mca-aw-01',
    serial: 'BUR-26-001',
    name: 'Brian Kiprono',
    subLocation: 'Tendeno Central',
    pollingStation: 'Tendeno Primary Polling Station',
    school: 'Kipsigis High School',
    course: 'KCSE Secondary Form 3',
    level: 'Secondary',
    feeBalance: 48000,
    needScore: 94,
    needLabel: 'Extreme Need',
    requested: 15000,
    chiefRecommended: 12000,
    proposed: 12000,
    state: 'approved',
    justification: 'Total orphan under elderly grandmother custody. Approved full recommended award.',
    appealable: false,
    chiefReason: 'Extreme vulnerability confirmed by village elders baraza.',
    parentName: 'Mary Chepkoech',
    phone: '+254 712 889 012',
    admissionNo: 'KHS-2024-882'
  },
  {
    id: 'mca-aw-02',
    serial: 'BUR-26-002',
    name: 'Faith Cherotich',
    subLocation: 'Sorget Central',
    pollingStation: 'Sorget Forest Polling Station',
    school: 'Moi University',
    course: 'BSc Computer Science (Yr 2)',
    level: 'University',
    feeBalance: 65000,
    needScore: 88,
    needLabel: 'High Need',
    requested: 30000,
    chiefRecommended: 25000,
    proposed: 25000,
    state: 'awaiting',
    justification: 'Single parent peasant farmer household.',
    appealable: false,
    chiefReason: 'Confirmed genuine resident of Sorget Central.',
    parentName: 'Eunice Cherotich',
    phone: '+254 723 445 667',
    admissionNo: 'COM/0024/23'
  },
  {
    id: 'mca-aw-03',
    serial: 'BUR-26-003',
    name: 'Dennis Koech',
    subLocation: 'Mware',
    pollingStation: 'Mware Primary Polling Station',
    school: 'Rift Valley Institute of Science & Tech',
    course: 'Diploma in Electrical Engineering',
    level: 'TVET / Vocational',
    feeBalance: 38000,
    needScore: 82,
    needLabel: 'High Need',
    requested: 20000,
    chiefRecommended: 15000,
    proposed: 15000,
    state: 'awaiting',
    justification: 'Technical education priority allocation.',
    appealable: false,
    chiefReason: 'Residency verified in Mware.',
    parentName: 'Joseph Koech',
    phone: '+254 734 556 778',
    admissionNo: 'RVIST-EE-890'
  },
  {
    id: 'mca-aw-04',
    serial: 'BUR-26-004',
    name: 'Mercy Chepkirui',
    subLocation: 'Kamuingi/Kabirong',
    pollingStation: 'Kamuingi ECDE Polling Station',
    school: 'Kipsigis Girls High School',
    course: 'KCSE Secondary Form 2',
    level: 'Secondary',
    feeBalance: 52000,
    needScore: 96,
    needLabel: 'Extreme Need',
    requested: 25000,
    chiefRecommended: 20000,
    proposed: 20000,
    state: 'awaiting',
    justification: 'Critical equity allocation for Kamuingi sub-location.',
    appealable: false,
    chiefReason: 'Destitute household, mother chronically ill.',
    parentName: 'Rael Chepkirui',
    phone: '+254 701 223 344',
    admissionNo: 'KGHS-9912'
  },
  {
    id: 'mca-aw-05',
    serial: 'BUR-26-005',
    name: 'Emmanuel Langat',
    subLocation: 'Tendeno Central',
    pollingStation: 'Kapkures Tea Nursery Polling Station',
    school: 'University of Nairobi',
    course: 'Bachelor of Medicine & Surgery (MBChB)',
    level: 'University',
    feeBalance: 120000,
    needScore: 89,
    needLabel: 'High Need',
    requested: 40000,
    chiefRecommended: 30000,
    proposed: 30000,
    state: 'approved',
    justification: 'High medical tuition burden, brilliant scholar from needy background.',
    appealable: false,
    chiefReason: 'Verified candidate for ward merit bursary.',
    parentName: 'David Langat',
    phone: '+254 711 998 877',
    admissionNo: 'MED/4412/22'
  },
  {
    id: 'mca-aw-06',
    serial: 'BUR-26-006',
    name: 'Beatrice Chebet',
    subLocation: 'Kamuingi/Kabirong',
    pollingStation: 'Kabirong Primary Polling Station',
    school: 'Kericho Township Technical College',
    course: 'Certificate in Food & Beverage',
    level: 'TVET / Vocational',
    feeBalance: 28000,
    needScore: 74,
    needLabel: 'Moderate Need',
    requested: 15000,
    chiefRecommended: 10000,
    proposed: 10000,
    state: 'awaiting',
    justification: 'Vocational sponsorship.',
    appealable: false,
    chiefReason: 'Verified resident.',
    parentName: 'Samson Chebet',
    phone: '+254 745 667 889',
    admissionNo: 'KTTC-2025-019'
  },
  {
    id: 'mca-aw-07',
    serial: 'BUR-26-007',
    name: 'Collins Kipkemoi',
    subLocation: 'Mware',
    pollingStation: 'Chepsir Primary Polling Station',
    school: 'Kipsigis High School',
    course: 'KCSE Secondary Form 4',
    level: 'Secondary',
    feeBalance: 42000,
    needScore: 91,
    needLabel: 'Extreme Need',
    requested: 18000,
    chiefRecommended: 15000,
    proposed: 15000,
    state: 'approved',
    justification: 'Candidate facing exam registration lockout due to arrears.',
    appealable: false,
    chiefReason: 'High priority examination class.',
    parentName: 'Grace Kipkemoi',
    phone: '+254 722 110 099',
    admissionNo: 'KHS-2023-412'
  },
  {
    id: 'mca-aw-08',
    serial: 'BUR-26-008',
    name: 'Purity Cherono',
    subLocation: 'Sorget Central',
    pollingStation: 'Kapchelach Dispensary Polling Station',
    school: 'Egerton University',
    course: 'BSc Agriculture',
    level: 'University',
    feeBalance: 54000,
    needScore: 78,
    needLabel: 'Moderate Need',
    requested: 25000,
    chiefRecommended: 18000,
    proposed: 18000,
    state: 'awaiting',
    justification: 'Agri-science tuition support.',
    appealable: false,
    chiefReason: 'Verified baraza clearance.',
    parentName: 'Wilson Cherono',
    phone: '+254 756 778 899',
    admissionNo: 'AGR/9021/24'
  }
];

export const INITIAL_INSTITUTIONS: InstitutionPayable[] = [
  {
    code: 'INST-KHS-01',
    name: 'Kipsigis High School',
    bank: 'Kenya Commercial Bank (KCB)',
    branch: 'Kericho Main Branch',
    accountNo: '1102938475',
    accountVerified: true,
    status: 'Draft',
    roster: [
      { id: 'mca-aw-01', name: 'Brian Kiprono', admissionNo: 'KHS-2024-882', award: 12000 },
      { id: 'mca-aw-07', name: 'Collins Kipkemoi', admissionNo: 'KHS-2023-412', award: 15000 },
      { id: 'mca-aw-101', name: 'Geoffrey Rotich', admissionNo: 'KHS-2025-102', award: 14000 },
      { id: 'mca-aw-102', name: 'Victor Bett', admissionNo: 'KHS-2024-512', award: 12000 }
    ],
    total: 53000
  },
  {
    code: 'INST-KGHS-02',
    name: 'Kipsigis Girls High School',
    bank: 'Co-operative Bank of Kenya',
    branch: 'Kericho Branch',
    accountNo: '01129384750100',
    accountVerified: true,
    status: 'Cheque Drawn',
    roster: [
      { id: 'mca-aw-04', name: 'Mercy Chepkirui', admissionNo: 'KGHS-9912', award: 20000 },
      { id: 'mca-aw-103', name: 'Brenda Chepkemoi', admissionNo: 'KGHS-8841', award: 18000 },
      { id: 'mca-aw-104', name: 'Sharon Cherotich', admissionNo: 'KGHS-9102', award: 16000 }
    ],
    total: 54000
  },
  {
    code: 'INST-MOI-03',
    name: 'Moi University',
    bank: 'National Bank of Kenya (NBK)',
    branch: 'Eldoret Branch',
    accountNo: '01001239847100',
    accountVerified: true,
    status: 'Draft',
    roster: [
      { id: 'mca-aw-02', name: 'Faith Cherotich', admissionNo: 'COM/0024/23', award: 25000 },
      { id: 'mca-aw-105', name: 'Hilary Kiptoo', admissionNo: 'ENG/0192/22', award: 30000 }
    ],
    total: 55000
  },
  {
    code: 'INST-UON-04',
    name: 'University of Nairobi',
    bank: 'Absa Bank Kenya',
    branch: 'University Way Branch',
    accountNo: '0309485712',
    accountVerified: true,
    status: 'EFT Dispatched',
    roster: [
      { id: 'mca-aw-05', name: 'Emmanuel Langat', admissionNo: 'MED/4412/22', award: 30000 }
    ],
    total: 30000
  },
  {
    code: 'INST-RVIST-05',
    name: 'Rift Valley Institute of Science & Tech',
    bank: 'Equity Bank Kenya',
    branch: 'Nakuru Kenyatta Ave',
    accountNo: '031029384756',
    accountVerified: true,
    status: 'Draft',
    roster: [
      { id: 'mca-aw-03', name: 'Dennis Koech', admissionNo: 'RVIST-EE-890', award: 15000 }
    ],
    total: 15000
  }
];

export interface AppealPetition {
  id: string;
  serial: string;
  applicantName: string;
  school: string;
  subLocation: string;
  rejectionReason: string;
  petitionNotes: string;
  feeBalance: number;
  requested: number;
  status: 'pending' | 'approved_reserve' | 'upheld_rejection';
  awardedAmount?: number;
  decidedAt?: string;
}

export const INITIAL_APPEALS: AppealPetition[] = [
  {
    id: 'app-pet-01',
    serial: 'BUR-26-901',
    applicantName: 'Sharon Chepkoech',
    school: 'Londiani Girls High School',
    subLocation: 'Sorget Central',
    rejectionReason: 'Chief noted family resided across sub-county boundary 2 years ago.',
    petitionNotes: 'Family relocated permanently to Sorget in 2024 following landslide. Mother presented valid baraza land agreement.',
    feeBalance: 36000,
    requested: 15000,
    status: 'pending'
  },
  {
    id: 'app-pet-02',
    serial: 'BUR-26-902',
    applicantName: 'Titus Kiprotich',
    school: 'Kabarak University',
    subLocation: 'Mware',
    rejectionReason: 'Exceeded standard college bursary threshold.',
    petitionNotes: 'Father passed away unexpectedly in August 2026. Family lost sole provider and student faces deregistration.',
    feeBalance: 88000,
    requested: 35000,
    status: 'pending'
  }
];

/* ───────── LocalStorage Loaders and Savers ───────── */

export function loadTranche(): BudgetTranche {
  try {
    const raw = localStorage.getItem(TRANCHE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TRANCHE;
  } catch {
    return INITIAL_TRANCHE;
  }
}

export function saveTranche(t: BudgetTranche) {
  localStorage.setItem(TRANCHE_KEY, JSON.stringify(t));
  window.dispatchEvent(new CustomEvent('mcmca_mca_tranche_updated'));
}

export function loadAwards(): AwardRow[] {
  try {
    const raw = localStorage.getItem(AWARDS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_AWARDS;
  } catch {
    return INITIAL_AWARDS;
  }
}

export function saveAwards(awards: AwardRow[]) {
  localStorage.setItem(AWARDS_KEY, JSON.stringify(awards));
  window.dispatchEvent(new CustomEvent('mcmca_mca_awards_updated'));
}

export function loadDisbursements(): InstitutionPayable[] {
  try {
    const raw = localStorage.getItem(DISBURSEMENTS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_INSTITUTIONS;
  } catch {
    return INITIAL_INSTITUTIONS;
  }
}

export function saveDisbursements(list: InstitutionPayable[]) {
  localStorage.setItem(DISBURSEMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('mcmca_mca_disbursements_updated'));
}

export function loadAppeals(): AppealPetition[] {
  try {
    const raw = localStorage.getItem(APPEALS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_APPEALS;
  } catch {
    return INITIAL_APPEALS;
  }
}

export function saveAppeals(list: AppealPetition[]) {
  localStorage.setItem(APPEALS_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('mcmca_mca_appeals_updated'));
}

/* ───────── Analytics Calculations ───────── */

export function getSubLocationShares(awards: AwardRow[]) {
  const subLocations = ['Tendeno Central', 'Mware', 'Sorget Central', 'Kamuingi/Kabirong'];
  const totalProposed = awards.reduce((acc, a) => acc + (a.proposed || 0), 0) || 1;

  return subLocations.map((loc) => {
    const locAwards = awards.filter((a) => a.subLocation === loc);
    const amount = locAwards.reduce((acc, a) => acc + (a.proposed || 0), 0);
    const count = locAwards.length;
    const sharePct = (amount / totalProposed) * 100;
    const belowFloor = sharePct < 15.0; // Statutory 15% equity floor

    return {
      subLocation: loc,
      amount,
      count,
      sharePct,
      belowFloor
    };
  });
}

export function getEducationShares(awards: AwardRow[]) {
  const levels = ['Secondary', 'TVET / Vocational', 'University'];
  const totalProposed = awards.reduce((acc, a) => acc + (a.proposed || 0), 0) || 1;

  return levels.map((lvl) => {
    const lvlAwards = awards.filter((a) => a.level.toLowerCase().includes(lvl.toLowerCase().slice(0, 4)));
    const amount = lvlAwards.reduce((acc, a) => acc + (a.proposed || 0), 0);
    const count = lvlAwards.length;
    const sharePct = (amount / totalProposed) * 100;

    return {
      level: lvl,
      amount,
      count,
      sharePct
    };
  });
}

export function getWeeklyIntakeCurves() {
  return {
    labels: ['W1 Feb', 'W2 Feb', 'W3 Feb', 'W4 Feb', 'W1 Mar', 'W2 Mar'],
    series: [
      { key: 'subs', label: 'Submissions', color: '#06b6d4', values: [120, 240, 410, 680, 890, 990] },
      { key: 'appr', label: 'Approvals', color: '#10b981', values: [80, 180, 320, 560, 780, 842] },
      { key: 'appl', label: 'Appeals', color: '#f59e0b', values: [5, 12, 19, 28, 36, 42] }
    ]
  };
}

export function searchMca(q: string): SearchHit[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const hits: SearchHit[] = [];

  loadAwards().forEach((a) => {
    if (`${a.name} ${a.serial} ${a.school} ${a.subLocation}`.toLowerCase().includes(t)) {
      hits.push({
        id: `mca-app-${a.id}`,
        title: a.name,
        subtitle: `${a.serial} · ${a.school} · KES ${a.proposed.toLocaleString()}`,
        kind: 'Award',
        to: `/mca/applications?open=${a.id}`
      });
    }
  });

  loadDisbursements().forEach((inst) => {
    if (`${inst.name} ${inst.code} ${inst.bank}`.toLowerCase().includes(t)) {
      hits.push({
        id: `mca-inst-${inst.code}`,
        title: inst.name,
        subtitle: `${inst.bank} · ${inst.roster.length} Beneficiaries`,
        kind: 'Payable',
        to: `/mca/disbursements`
      });
    }
  });

  return hits;
}

export function loadMcaAlerts(): AlertItem[] {
  const alerts: AlertItem[] = [];
  const tranche = loadTranche();
  const awards = loadAwards();
  const subShares = getSubLocationShares(awards);

  // Check equity floor breaches
  const lowShare = subShares.find((s) => s.belowFloor);
  if (lowShare) {
    alerts.push({
      id: 'equity-breach',
      tone: 'amber',
      title: `Equity Parity Flag: ${lowShare.subLocation}`,
      body: `Allocation share is ${lowShare.sharePct.toFixed(1)}%, below statutory 15% floor.`,
      at: new Date().toISOString(),
      to: '/mca/dashboard'
    });
  }

  // Check budget warn threshold
  const commitPct = (tranche.committed_amount / tranche.total_amount) * 100;
  if (commitPct >= tranche.warn_threshold_pct) {
    alerts.push({
      id: 'budget-warn',
      tone: 'red',
      title: 'Tranche Liquidity Alert',
      body: `Committed funds reached ${commitPct.toFixed(1)}% of total pool.`,
      at: new Date().toISOString(),
      to: '/mca/dashboard'
    });
  }

  return alerts;
}
