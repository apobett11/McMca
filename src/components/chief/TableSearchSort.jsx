import React from 'react';

export function TableSearchSort({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  sortOptions,
  searchPlaceholder = 'Search by name or school…'
}) {
  return (
    <div className="table-search-sort" role="group" aria-label="Search and sort">
      <div className="table-search-sort__search field">
        <label htmlFor="table-search">Search</label>
        <input
          id="table-search"
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
      </div>
      <div className="table-search-sort__sort field">
        <label htmlFor="table-sort">Sort by</label>
        <select id="table-sort" value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function applySearch(rows, search, keys) {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) =>
    keys.some((key) => String(row[key] ?? '').toLowerCase().includes(q))
  );
}

export function applySort(rows, sortKey, direction = 'desc') {
  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey] ?? '';
    const bv = b[sortKey] ?? '';
    if (av < bv) return direction === 'asc' ? -1 : 1;
    if (av > bv) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  return sorted;
}

export function applyChiefApplicationFilters(rows, values) {
  return rows.filter((row) => {
    if (values.applicationStatus && values.applicationStatus !== 'All') {
      if (row.applicationStatus !== values.applicationStatus) return false;
    }
    if (values.educationLevel && values.educationLevel !== 'All') {
      if (row.educationLevel !== values.educationLevel) return false;
    }
    if (values.school && values.school !== 'All') {
      if (row.school !== values.school) return false;
    }
    if (values.location && values.location !== 'All') {
      if (row.subLocation !== values.location && row.location !== values.location) return false;
    }
    if (values.riskFlagStatus && values.riskFlagStatus !== 'All') {
      if (row.riskFlagStatus !== values.riskFlagStatus) return false;
    }
    if (values.cycle && values.cycle !== 'All') {
      if (row.cycle !== values.cycle) return false;
    }
    return true;
  });
}

export function applyChiefAppealFilters(rows, values) {
  return rows.filter((row) => {
    if (values.appealStatus && values.appealStatus !== 'All') {
      if (row.appealStatus !== values.appealStatus) return false;
    }
    if (values.educationLevel && values.educationLevel !== 'All') {
      if (row.educationLevel !== values.educationLevel) return false;
    }
    if (values.school && values.school !== 'All') {
      if (row.school !== values.school) return false;
    }
    if (values.cycle && values.cycle !== 'All') {
      if (row.cycle !== values.cycle) return false;
    }
    return true;
  });
}

export const CHIEF_APPLICATION_FILTERS = [
  {
    key: 'applicationStatus',
    label: 'Application status',
    options: [
      'All',
      'Submitted',
      'Under Review',
      'Pending Clarification',
      'Approved',
      'Rejected',
      'Escalated'
    ]
  },
  {
    key: 'educationLevel',
    label: 'Education level',
    options: ['All', 'Primary', 'Secondary', 'Tertiary']
  },
  { key: 'school', label: 'School', options: ['All'] },
  { key: 'location', label: 'Sub-location', options: ['All'] },
  {
    key: 'riskFlagStatus',
    label: 'Risk flag',
    options: ['All', 'No Issues', 'Duplicate Warning', 'Incomplete Information', 'Verification Needed']
  },
  { key: 'cycle', label: 'Application cycle', options: ['All', '2025/2026', '2024/2025'] }
];

export const CHIEF_APPEAL_FILTERS = [
  {
    key: 'appealStatus',
    label: 'Appeal status',
    options: ['All', 'Submitted', 'Under Review', 'Clarification Requested', 'Approved', 'Rejected']
  },
  {
    key: 'educationLevel',
    label: 'Education level',
    options: ['All', 'Primary', 'Secondary', 'Tertiary']
  },
  { key: 'school', label: 'School', options: ['All'] },
  { key: 'cycle', label: 'Application cycle', options: ['All', '2025/2026', '2024/2025'] }
];

export const CHIEF_APPLICATION_FILTER_DEFAULTS = {
  applicationStatus: 'All',
  educationLevel: 'All',
  school: 'All',
  location: 'All',
  riskFlagStatus: 'All',
  cycle: 'All'
};

export const CHIEF_APPEAL_FILTER_DEFAULTS = {
  appealStatus: 'All',
  educationLevel: 'All',
  school: 'All',
  cycle: 'All'
};

export function buildDynamicFilterOptions(baseFilters, rows, dynamicKeys) {
  return baseFilters.map((filter) => {
    if (!dynamicKeys.includes(filter.key)) return filter;
    const values = [...new Set(rows.map((r) => r[filter.key === 'location' ? 'subLocation' : filter.key]))].sort();
    return { ...filter, options: ['All', ...values] };
  });
}
