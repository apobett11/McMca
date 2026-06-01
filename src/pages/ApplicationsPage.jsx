import React, { useMemo, useState } from 'react';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { ParentApplicationsTable } from '../components/ParentApplicationsTable.jsx';
import {
  TableFilters,
  applyTableFilters,
  INITIAL_FILTER_VALUES
} from '../components/TableFilters.jsx';
import { APPLICATIONS_AGGREGATE } from '../data/parentMock.js';

export function ApplicationsPage() {
  const [filters, setFilters] = useState(INITIAL_FILTER_VALUES);

  const filtered = useMemo(
    () => applyTableFilters(APPLICATIONS_AGGREGATE, filters),
    [filters]
  );

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <PageShell pageTitle="Applications" userInitials="MK" portalLabel="Parent portal">
      <SectionCard title="Applications overview" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Aggregated view across all linked children. Data updates from student dashboards — no
          editing happens here.
        </p>
      </SectionCard>

      <SectionCard title="Filters" className="page-section--filters">
        <TableFilters values={filters} onChange={handleFilterChange} />
      </SectionCard>

      <SectionCard title="All applications" className="page-section--table">
        <ParentApplicationsTable rows={filtered} />
      </SectionCard>
    </PageShell>
  );
}
