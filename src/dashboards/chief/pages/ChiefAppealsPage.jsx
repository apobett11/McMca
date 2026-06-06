import React, { useMemo, useState } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../components/SectionCard.jsx';
import { TableFilters } from '../../components/TableFilters.jsx';
import { ChiefAppealsTable } from '../../components/chief/ChiefAppealsTable.jsx';
import {
  TableSearchSort,
  applySearch,
  applySort,
  applyChiefAppealFilters,
  buildDynamicFilterOptions,
  CHIEF_APPEAL_FILTERS,
  CHIEF_APPEAL_FILTER_DEFAULTS
} from '../../components/chief/TableSearchSort.jsx';
import { CHIEF, CHIEF_APPEALS } from '../../data/chiefMock.js';

const SORT_OPTIONS = [
  { value: 'lastUpdated-desc', label: 'Last updated (newest)' },
  { value: 'appealSubmissionDate-desc', label: 'Submission date (newest)' },
  { value: 'fullName-asc', label: 'Student name (A–Z)' }
];

export function ChiefAppealsPage() {
  const [filters, setFilters] = useState(CHIEF_APPEAL_FILTER_DEFAULTS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('lastUpdated-desc');

  const filterConfig = useMemo(
    () => buildDynamicFilterOptions(CHIEF_APPEAL_FILTERS, CHIEF_APPEALS, ['school']),
    []
  );

  const filtered = useMemo(() => {
    let rows = applyChiefAppealFilters(CHIEF_APPEALS, filters);
    rows = applySearch(rows, search, ['fullName', 'school']);
    const [key, dir] = sort.split('-');
    return applySort(rows, key, dir);
  }, [filters, search, sort]);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <ChiefLayout chiefName={CHIEF.fullName} pageTitle="Appeals" layout="list">
      <SectionCard title="Appeals review" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Dedicated workspace for reviewing submitted appeals. Verify supporting evidence and
          resolve appeal cases inside the appeal review workspace.
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

      <SectionCard title="Appeals queue" className="page-section--table">
        <p className="section-card__lead section-card__lead--left">
          {filtered.length} appeal{filtered.length !== 1 ? 's' : ''} in queue — select{' '}
          <strong>Review appeal</strong> to open the verification workspace.
        </p>
        <ChiefAppealsTable rows={filtered} />
      </SectionCard>
    </PageShell>
  );
}
