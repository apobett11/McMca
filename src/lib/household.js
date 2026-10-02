/** Household details asked once, then used as the default for each child. */

export const HOME_FIELDS = [
  { key: 'constituency', label: 'Constituency' },
  { key: 'ward', label: 'Ward' },
  { key: 'county', label: 'County' },
  { key: 'subCounty', label: 'Sub-county' },
  { key: 'pollingStation', label: 'Polling station' }
];

export const PARENT_STATUS_OPTIONS = [
  { value: 'both_alive', label: 'Both parents alive' },
  { value: 'single_parent', label: 'Single parent' },
  { value: 'father_deceased', label: 'Father deceased' },
  { value: 'mother_deceased', label: 'Mother deceased' },
  { value: 'both_deceased', label: 'Both parents deceased' }
];

export const INCOME_OPTIONS = [
  { value: 'none', label: 'No regular income' },
  { value: 'under_10k', label: 'Under KES 10,000' },
  { value: '10_30k', label: 'KES 10,000 – 30,000' },
  { value: '30_60k', label: 'KES 30,000 – 60,000' },
  { value: 'over_60k', label: 'Over KES 60,000' }
];

export function emptyHousehold() {
  return {
    constituency: '',
    ward: '',
    county: '',
    subCounty: '',
    pollingStation: '',
    childrenInFamily: '',
    childrenInSchool: '',
    childrenPrimary: '',
    childrenSecondary: '',
    childrenTertiary: '',
    parentStatus: '',
    fatherOccupation: '',
    motherOccupation: '',
    monthlyIncome: '',
    disability: '',
    disabilityNote: '',
    otherBursary: ''
  };
}

export function readHousehold(profile) {
  const saved = profile?.wizard_completed?.household;
  if (!saved || typeof saved !== 'object') return emptyHousehold();
  return { ...emptyHousehold(), ...saved };
}

export function homeComplete(household) {
  return HOME_FIELDS.every((field) => String(household?.[field.key] || '').trim());
}

export function familyComplete(household) {
  return Boolean(String(household?.childrenInFamily || '').trim())
    && Boolean(household?.parentStatus)
    && Boolean(household?.monthlyIncome);
}

export function latestBursaryCycle(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();
  if (month >= 6) return `${year}/${year + 1}`;
  return `${year - 1}/${year}`;
}

export function formatMoney(value) {
  if (value == null || value === '') return '—';
  const amount = Number(value);
  if (Number.isNaN(amount)) return '—';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0
  }).format(amount);
}

export function cycleTitle(application, windows, fallbackDate) {
  const window = (windows || []).find((row) => row.id === application?.application_window_id);
  if (window?.title) return String(window.title).replace(/\s*bursary cycle\s*/i, '').trim();
  if (window?.academic_year) return `${Number(window.academic_year) - 1}/${window.academic_year}`;
  return latestBursaryCycle(fallbackDate ? new Date(fallbackDate) : new Date());
}

export function applicationSerial(application) {
  if (!application?.id) return '—';
  const year = application.created_at
    ? new Date(application.created_at).getFullYear()
    : new Date().getFullYear();
  const tail = String(application.id).replace(/-/g, '').slice(-4).toUpperCase();
  return `MCA-${year}-${tail}`;
}

export function latestCycleFromWindows(windows) {
  const active = (windows || []).find((row) => row.is_active);
  if (active?.title) return String(active.title).replace(/\s*bursary cycle\s*/i, '').trim();
  const sorted = [...(windows || [])].sort((a, b) => Number(b.academic_year || 0) - Number(a.academic_year || 0));
  if (sorted[0]?.title) return String(sorted[0].title).replace(/\s*bursary cycle\s*/i, '').trim();
  if (sorted[0]?.academic_year) return `${Number(sorted[0].academic_year) - 1}/${sorted[0].academic_year}`;
  return latestBursaryCycle();
}

/** One row per submitted application, grouped by bursary cycle. */
export function groupApplicationsByCycle(children, applications, windows) {
  const groups = new Map();

  function bucket(label) {
    if (!groups.has(label)) groups.set(label, []);
    return groups.get(label);
  }

  const appsByStudent = new Map();
  (applications || []).forEach((app) => {
    const list = appsByStudent.get(app.student_profile_id) || [];
    list.push(app);
    appsByStudent.set(app.student_profile_id, list);
  });

  (children || []).forEach((child) => {
    const apps = appsByStudent.get(child.id) || [];
    apps.forEach((application) => {
      const cycle = cycleTitle(application, windows, application.created_at);
      bucket(cycle).push({ child, application, cycle });
    });
  });

  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([cycle, rows]) => ({ cycle, rows }));
}
