import React, { useMemo, useState } from 'react';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { ParentDocumentsTable } from '../components/ParentDocumentsTable.jsx';
import { TableFilters } from '../components/TableFilters.jsx';
import { DOCUMENTS_AGGREGATE } from '../data/parentMock.js';

const DOC_FILTERS = [
  {
    key: 'documentStatus',
    label: 'Document status',
    options: [
      'All',
      'Complete',
      'Missing Fee Structure',
      'Missing Admission Letter',
      'Pending Verification',
      'Rejected Document'
    ]
  },
  {
    key: 'educationLevel',
    label: 'Education level',
    options: ['All', 'Primary', 'Secondary', 'Tertiary']
  },
  { key: 'accessType', label: 'Access type', options: ['All', 'Full Control', 'Delegated Access', 'Viewer Only'] },
  { key: 'cycle', label: 'Application cycle', options: ['All', '2025/2026', '2024/2025'] },
  { key: 'requiresAttention', label: 'Requires attention', options: ['All', 'Yes', 'No'] }
];

const INITIAL_DOC_FILTERS = {
  documentStatus: 'All',
  educationLevel: 'All',
  accessType: 'All',
  cycle: 'All',
  requiresAttention: 'All'
};

function applyDocFilters(rows, values) {
  return rows.filter((row) => {
    if (values.documentStatus !== 'All' && row.documentStatus !== values.documentStatus) {
      return false;
    }
    if (values.educationLevel !== 'All' && row.educationLevel !== values.educationLevel) {
      return false;
    }
    if (values.accessType !== 'All' && row.accessType !== values.accessType) return false;
    if (values.cycle !== 'All' && row.cycle !== values.cycle) return false;
    if (values.requiresAttention !== 'All') {
      const needs = values.requiresAttention === 'Yes';
      if (Boolean(row.requiresAttention) !== needs) return false;
    }
    return true;
  });
}

export function DocumentsPage({
  portalVariant = 'parent',
  portalLabel = 'Parent portal',
  homePath,
  profilePath
} = {}) {
  const [filters, setFilters] = useState(INITIAL_DOC_FILTERS);
  const hasAttention = DOCUMENTS_AGGREGATE.some((d) => d.requiresAttention);

  const filtered = useMemo(() => applyDocFilters(DOCUMENTS_AGGREGATE, filters), [filters]);

  return (
    <PageShell
      pageTitle="Documents"
      notificationBadge={hasAttention}
      userInitials="MK"
      portalVariant={portalVariant}
      portalLabel={portalLabel}
      homePath={homePath}
      profilePath={profilePath}
    >
      <SectionCard title="Documents overview" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Document status across your household. Uploads and corrections are done only inside each
          student&apos;s dashboard.
        </p>
        <div className="notice notice--warm">
          <strong>Read-only overview</strong>
          Use <em>View profile</em> on a row to open the student workspace for uploads.
        </div>
      </SectionCard>

      <SectionCard title="Filters" className="page-section--filters">
        <TableFilters
          values={filters}
          onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
          filters={DOC_FILTERS}
        />
      </SectionCard>

      <SectionCard title="Document status by student" className="page-section--table">
        <ParentDocumentsTable rows={filtered} />
      </SectionCard>
    </PageShell>
  );
}
