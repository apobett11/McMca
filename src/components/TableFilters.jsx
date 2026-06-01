import React from 'react';

const DEFAULT_FILTERS = [
  { key: 'applicationStatus', label: 'Application status', options: ['All', 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Appealed', 'Disbursed'] },
  { key: 'educationLevel', label: 'Education level', options: ['All', 'Primary', 'Secondary', 'Tertiary'] },
  { key: 'accessType', label: 'Access type', options: ['All', 'Full Control', 'Delegated Access', 'Viewer Only'] },
  { key: 'cycle', label: 'Application cycle', options: ['All', '2025/2026', '2024/2025', '2023/2024'] },
  { key: 'requiresAttention', label: 'Requires attention', options: ['All', 'Yes', 'No'] }
];

export function TableFilters({ values, onChange, filters = DEFAULT_FILTERS }) {
  return (
    <div className="table-filters" role="group" aria-label="Table filters">
      {filters.map((f) => (
        <div key={f.key} className="table-filters__field">
          <label htmlFor={`filter-${f.key}`}>{f.label}</label>
          <select
            id={`filter-${f.key}`}
            value={values[f.key] ?? 'All'}
            onChange={(e) => onChange(f.key, e.target.value)}
          >
            {f.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export function applyTableFilters(rows, values) {
  return rows.filter((row) => {
    if (values.applicationStatus && values.applicationStatus !== 'All') {
      if (row.applicationStatus !== values.applicationStatus) return false;
    }
    if (values.educationLevel && values.educationLevel !== 'All') {
      if (row.educationLevel !== values.educationLevel) return false;
    }
    if (values.accessType && values.accessType !== 'All') {
      if (row.accessType !== values.accessType) return false;
    }
    if (values.cycle && values.cycle !== 'All') {
      if (row.cycle !== values.cycle) return false;
    }
    if (values.requiresAttention && values.requiresAttention !== 'All') {
      const needs = values.requiresAttention === 'Yes';
      if (Boolean(row.requiresAttention) !== needs) return false;
    }
    return true;
  });
}

export const INITIAL_FILTER_VALUES = {
  applicationStatus: 'All',
  educationLevel: 'All',
  accessType: 'All',
  cycle: 'All',
  requiresAttention: 'All'
};
