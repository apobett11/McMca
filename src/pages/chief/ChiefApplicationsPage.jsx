import React, { useMemo, useState } from 'react';
import { PageShell } from '../../components/PageShell.jsx';
import { SectionCard } from '../../components/SectionCard.jsx';
import { TableFilters } from '../../components/TableFilters.jsx';
import { ChiefApplicationsTable } from '../../components/chief/ChiefApplicationsTable.jsx';
import {
  TableSearchSort,
  applySearch,
  applySort,
  applyChiefApplicationFilters,
  buildDynamicFilterOptions,
  CHIEF_APPLICATION_FILTERS,
  CHIEF_APPLICATION_FILTER_DEFAULTS
} from '../../components/chief/TableSearchSort.jsx';
import { CHIEF_APPLICATIONS } from '../../data/chiefMock.js';
import { CHIEF_SHELL } from './chiefShell.js';

const SORT_OPTIONS = [
  { value: 'lastUpdated-desc', label: 'Last updated (newest)' },
  { value: 'lastUpdated-asc', label: 'Last updated (oldest)' },
  { value: 'submittedDate-desc', label: 'Submission date (newest)' },
  { value: 'fullName-asc', label: 'Student name (A–Z)' }
];

export function ChiefApplicationsPage() {
  const [filters, setFilters] = useState(CHIEF_APPLICATION_FILTER_DEFAULTS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('lastUpdated-desc');

  const filterConfig = useMemo(
    () => buildDynamicFilterOptions(CHIEF_APPLICATION_FILTERS, CHIEF_APPLICATIONS, ['school', 'location']),
    []
  );

  const filtered = useMemo(() => {
    let rows = applyChiefApplicationFilters(CHIEF_APPLICATIONS, filters);
    rows = applySearch(rows, search, ['fullName', 'school', 'subLocation', 'location']);
    const [key, dir] = sort.split('-');
    return applySort(rows, key, dir);
  }, [filters, search, sort]);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <PageShell {...CHIEF_SHELL} pageTitle="Applications" layout="list">
      <SectionCard title="Applications review" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Review queue for applications assigned to your ward area. Use the review workspace for
          verification, approval, rejection, and clarification requests.
        </p>
      </SectionCard>

      <SectionCard title="Search & sort" className="page-section--filters">
        <TableSearchSort
          searchValue={search}
          onSearchChange={setSearch}
          sortValue={sort}
          onSortChange={setSort}
          sortOptions={SORT_OPTIONS}
        />
      </SectionCard>

      <SectionCard title="Filters" className="page-section--filters">
        <TableFilters values={filters} onChange={handleFilterChange} filters={filterConfig} />
      </SectionCard>

      <SectionCard title="Applications queue" className="page-section--table">
        <p className="section-card__lead section-card__lead--left">
          {filtered.length} application{filtered.length !== 1 ? 's' : ''} in queue — select{' '}
          <strong>Review</strong> to open the verification workspace.
        </p>
        <ChiefApplicationsTable rows={filtered} />
      </SectionCard>
    </PageShell>
  );
}
