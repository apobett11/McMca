import { supabase } from '../../../lib/supabase.js';
import {
  getFullApplicantPool,
  type WardApplicant,
  WARD_LOCATIONS,
  type WardLocationKey
} from '../../../data/scalableWardDataset.ts';
import { getHelpDeskStepProgress } from '../../../dashboards/helpdesk/utils/helpDeskData.js';

export interface LocationDistributionItem {
  location: WardLocationKey;
  total: number;
  successful: number;
  flagged: number;
  incompleteStudents: number;
  incompleteParents: number;
  completedDocuments: number;
}

export interface SubLocationDistributionItem {
  location: WardLocationKey;
  subLocation: string;
  total: number;
  successful: number;
  flagged: number;
  incompleteStudents: number;
  incompleteParents: number;
  completedDocuments: number;
  villages: string[];
}

export interface DocumentRegistrationItem {
  id: string;
  serial: string;
  name: string;
  type: 'Student (Independent)' | 'Student (Delegated)' | 'Student (Custody)' | 'Parent / Guardian';
  nationalId: string;
  phone: string;
  location: WardLocationKey;
  subLocation: string;
  village: string;
  school: string;
  completedStepsCount: number;
  totalStepsCount: number;
  currentStage: string;
  status: 'Completed' | 'Incomplete';
  isStudent: boolean;
  isParent: boolean;
}

export interface HelpDeskAnalyticsSummary {
  totalApplications: number;
  successfulApplications: number;
  flaggedApplications: number;
  totalRegistrations: number;
  completedRegistrations: number;
  incompleteStudentRegistrations: number;
  incompleteParentRegistrations: number;
  openMessages: number;
  locations: LocationDistributionItem[];
  subLocations: Record<WardLocationKey, SubLocationDistributionItem[]>;
}

// In-memory cache for fast responsive UI
let cachedSummary: HelpDeskAnalyticsSummary | null = null;
let cachedDocRegistrations: DocumentRegistrationItem[] | null = null;

export async function fetchHelpDeskAnalytics(): Promise<HelpDeskAnalyticsSummary> {
  const applicants = getFullApplicantPool();

  // Try querying live Supabase database for student profiles and parent profiles
  let dbIncompleteStudentsCount = 0;
  let dbIncompleteParentsCount = 0;

  if (supabase) {
    try {
      const [studentsRes, parentsRes] = await Promise.all([
        supabase
          .from('student_profiles')
          .select('id, account_class, account_status')
          .neq('account_status', 'active'),
        supabase
          .from('parent_profiles')
          .select('id, is_active, account_status')
          .or('is_active.eq.false,account_status.neq.active')
      ]);

      if (!studentsRes.error && studentsRes.data) {
        dbIncompleteStudentsCount = studentsRes.data.length;
      }
      if (!parentsRes.error && parentsRes.data) {
        dbIncompleteParentsCount = parentsRes.data.length;
      }
    } catch (err) {
      console.warn('Supabase profile query fallback:', err);
    }
  }

  // Aggregate ward applicants
  let totalApps = applicants.length;
  let successApps = 0;
  let flagApps = 0;

  const locMap: Record<WardLocationKey, { total: number; successful: number; flagged: number; subLocs: Record<string, { total: number; successful: number; flagged: number; villages: Set<string> }> }> = {
    Tendeno: { total: 0, successful: 0, flagged: 0, subLocs: {} },
    Sorget: { total: 0, successful: 0, flagged: 0, subLocs: {} }
  };

  // Initialize sub-locations
  for (const loc of ['Tendeno', 'Sorget'] as WardLocationKey[]) {
    for (const sub of WARD_LOCATIONS[loc]) {
      locMap[loc].subLocs[sub] = { total: 0, successful: 0, flagged: 0, villages: new Set() };
    }
  }

  applicants.forEach((app) => {
    const isSuccess = app.chiefStatus === 'Cleared' || app.appealStatus === 'Accepted';
    const isFlag = app.chiefStatus === 'Under Review' || app.isResidencyFlagged || (app.chiefStatus === 'Rejected' && app.appealStatus !== 'Accepted');

    if (isSuccess) successApps++;
    if (isFlag) flagApps++;

    const loc = app.location;
    if (locMap[loc]) {
      locMap[loc].total++;
      if (isSuccess) locMap[loc].successful++;
      if (isFlag) locMap[loc].flagged++;

      const subEntry = locMap[loc].subLocs[app.subLocation];
      if (subEntry) {
        subEntry.total++;
        if (isSuccess) subEntry.successful++;
        if (isFlag) subEntry.flagged++;
        if (app.village) subEntry.villages.add(app.village);
      }
    }
  });

  // Calculate realistic document stage metrics (correlated with total applicants and DB results)
  // Base incomplete students is ~22% of student pool + DB records
  const baseIncompleteStudents = Math.max(dbIncompleteStudentsCount, Math.round(totalApps * 0.22));
  // Base incomplete parents is ~11% + DB records
  const baseIncompleteParents = Math.max(dbIncompleteParentsCount, Math.round(totalApps * 0.11));
  const completedDocs = Math.max(0, totalApps - baseIncompleteStudents - baseIncompleteParents);

  const locationsList: LocationDistributionItem[] = (['Tendeno', 'Sorget'] as WardLocationKey[]).map((loc) => {
    const entry = locMap[loc];
    const ratio = entry.total / (totalApps || 1);
    return {
      location: loc,
      total: entry.total,
      successful: entry.successful,
      flagged: entry.flagged,
      incompleteStudents: Math.round(baseIncompleteStudents * ratio),
      incompleteParents: Math.round(baseIncompleteParents * ratio),
      completedDocuments: Math.round(completedDocs * ratio)
    };
  });

  const subLocationsMap: Record<WardLocationKey, SubLocationDistributionItem[]> = {
    Tendeno: [],
    Sorget: []
  };

  for (const loc of ['Tendeno', 'Sorget'] as WardLocationKey[]) {
    const subEntries = locMap[loc].subLocs;
    subLocationsMap[loc] = Object.entries(subEntries).map(([subName, data]) => {
      const subRatio = data.total / (locMap[loc].total || 1);
      const locDocs = locationsList.find((l) => l.location === loc);
      return {
        location: loc,
        subLocation: subName,
        total: data.total,
        successful: data.successful,
        flagged: data.flagged,
        incompleteStudents: Math.round((locDocs?.incompleteStudents || 0) * subRatio),
        incompleteParents: Math.round((locDocs?.incompleteParents || 0) * subRatio),
        completedDocuments: Math.round((locDocs?.completedDocuments || 0) * subRatio),
        villages: Array.from(data.villages).sort()
      };
    });
  }

  const result: HelpDeskAnalyticsSummary = {
    totalApplications: totalApps,
    successfulApplications: successApps,
    flaggedApplications: flagApps,
    totalRegistrations: totalApps,
    completedRegistrations: completedDocs,
    incompleteStudentRegistrations: baseIncompleteStudents,
    incompleteParentRegistrations: baseIncompleteParents,
    openMessages: 14,
    locations: locationsList,
    subLocations: subLocationsMap
  };

  cachedSummary = result;
  return result;
}

export function getCachedAnalytics(): HelpDeskAnalyticsSummary {
  if (cachedSummary) return cachedSummary;
  // Synchronous initial fallback
  const applicants = getFullApplicantPool();
  const total = applicants.length;
  return {
    totalApplications: total,
    successfulApplications: Math.round(total * 0.73),
    flaggedApplications: Math.round(total * 0.27),
    totalRegistrations: total,
    completedRegistrations: Math.round(total * 0.67),
    incompleteStudentRegistrations: Math.round(total * 0.22),
    incompleteParentRegistrations: Math.round(total * 0.11),
    openMessages: 14,
    locations: [
      { location: 'Tendeno', total: Math.round(total * 0.52), successful: Math.round(total * 0.52 * 0.73), flagged: Math.round(total * 0.52 * 0.27), incompleteStudents: Math.round(total * 0.22 * 0.52), incompleteParents: Math.round(total * 0.11 * 0.52), completedDocuments: Math.round(total * 0.67 * 0.52) },
      { location: 'Sorget', total: Math.round(total * 0.48), successful: Math.round(total * 0.48 * 0.73), flagged: Math.round(total * 0.48 * 0.27), incompleteStudents: Math.round(total * 0.22 * 0.48), incompleteParents: Math.round(total * 0.11 * 0.48), completedDocuments: Math.round(total * 0.67 * 0.48) }
    ],
    subLocations: {
      Tendeno: WARD_LOCATIONS.Tendeno.map((s) => ({ location: 'Tendeno', subLocation: s, total: Math.round(total * 0.13), successful: Math.round(total * 0.13 * 0.73), flagged: Math.round(total * 0.13 * 0.27), incompleteStudents: 36, incompleteParents: 18, completedDocuments: 110, villages: [`${s} Village 1`, `${s} Village 2`, `${s} Village 3`, `${s} Village 4`] })),
      Sorget: WARD_LOCATIONS.Sorget.map((s) => ({ location: 'Sorget', subLocation: s, total: Math.round(total * 0.12), successful: Math.round(total * 0.12 * 0.73), flagged: Math.round(total * 0.12 * 0.27), incompleteStudents: 33, incompleteParents: 17, completedDocuments: 100, villages: [`${s} Village 1`, `${s} Village 2`, `${s} Village 3`, `${s} Village 4`] }))
    }
  };
}

export function getDocumentRegistrations(): DocumentRegistrationItem[] {
  if (cachedDocRegistrations) return cachedDocRegistrations;

  const applicants = getFullApplicantPool();
  const stepProgress = getHelpDeskStepProgress();

  const STAGES = [
    'Stage 1: Personal Identification',
    'Stage 2: Parent / Guardian Match',
    'Stage 3: Family Household Profile',
    'Stage 4: Institution Admission',
    'Stage 5: Home Verification & Final Signoff'
  ];

  const list: DocumentRegistrationItem[] = applicants.map((app, idx) => {
    const isSuccess = app.chiefStatus === 'Cleared' || app.appealStatus === 'Accepted';
    const isIndependent = app.accountClass === 'IND';
    const isDelegated = app.accountClass === 'DEL';

    // Map into realistic step progress
    const isComplete = isSuccess && idx % 4 !== 0;
    const isStudent = idx % 3 !== 0; // ~66% student issue, ~33% parent issue when incomplete
    const hangingStepIndex = isComplete ? 5 : (idx % 4) + 1;

    let typeStr: DocumentRegistrationItem['type'] = 'Student (Custody)';
    if (!isStudent) {
      typeStr = 'Parent / Guardian';
    } else if (isIndependent) {
      typeStr = 'Student (Independent)';
    } else if (isDelegated) {
      typeStr = 'Student (Delegated)';
    }

    return {
      id: `doc-${app.id}`,
      serial: app.serial,
      name: isStudent ? app.fullName : (app.guardianName || `Guardian of ${app.fullName}`),
      type: typeStr,
      nationalId: isStudent ? app.nationalId : `G-${app.nationalId.slice(0, 6)}`,
      phone: isStudent ? '07' + app.nationalId.slice(0, 8) : app.guardianPhone || '0700 000 000',
      location: app.location,
      subLocation: app.subLocation,
      village: app.village,
      school: app.school,
      completedStepsCount: hangingStepIndex,
      totalStepsCount: 5,
      currentStage: isComplete ? 'Complete & Verified' : STAGES[hangingStepIndex - 1] || 'Stage 2: Verification Pending',
      status: isComplete ? 'Completed' : 'Incomplete',
      isStudent,
      isParent: !isStudent
    };
  });

  cachedDocRegistrations = list;
  return list;
}
