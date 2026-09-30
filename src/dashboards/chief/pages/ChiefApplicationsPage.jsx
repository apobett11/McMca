import React, { useEffect, useMemo, useState } from 'react';
import { ChiefLayout } from '../components/ChiefLayout.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { TableFilters } from '../../../components/TableFilters.jsx';
import { ChiefApplicationsTable } from '../../../components/chief/ChiefApplicationsTable.jsx';
import {
  TableSearchSort,
  applySearch,
  applySort,
  applyChiefApplicationFilters,
  buildDynamicFilterOptions,
  CHIEF_APPLICATION_FILTERS,
  CHIEF_APPLICATION_FILTER_DEFAULTS
} from '../../../components/chief/TableSearchSort.jsx';
import { fetchChiefQueue } from '../../../lib/queries.js';
import { useAuth } from '../../../context/AuthContext.jsx';

function toQueueRow(row) {
  const profile = row.student_profiles || {};
  const fullName = [profile.first_name, profile.middle_name, profile.last_name].filter(Boolean).join(' ') || 'Student';
  return {
    id: row.id,
    fullName,
    school: profile.school_name || row.institution_name || '—',
    educationLevel: profile.student_type || '—',
    grade: '—',
    location: '—',
    subLocation: '—',
    cycle: row.cycle || '—',
    submittedDate: row.submitted_at || row.created_at,
    applicationStatus: 'Pending',
    documentStatus: 'Pending Review',
    riskFlagStatus: 'Verification Needed',
    lastUpdated: row.submitted_at || row.created_at
  };
}

const SORT_OPTIONS = [
  { value: 'lastUpdated-desc', label: 'Last updated (newest)' },
  { value: 'lastUpdated-asc', label: 'Last updated (oldest)' },
  { value: 'submittedDate-desc', label: 'Submission date (newest)' },
  { value: 'fullName-asc', label: 'Student name (A–Z)' }
];

export function ChiefApplicationsPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState(CHIEF_APPLICATION_FILTER_DEFAULTS);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('lastUpdated-desc');
  const [page, setPage] = useState(0);
  const [queue, setQueue] = useState([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchChiefQueue({ page, search });
        if (!active) return;
        setQueue(result.rows.map(toQueueRow));
        setTotal(result.count);
        setPageSize(result.pageSize);
        setLoadError('');
      } catch (err) {
        if (active) setLoadError(err.message || 'Could not load the chief queue.');
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [page, search]);

  const filterConfig = useMemo(
    () => buildDynamicFilterOptions(CHIEF_APPLICATION_FILTERS, queue, ['school', 'location', 'cycle']),
    [queue]
  );

  const filtered = useMemo(() => {
    let rows = applyChiefApplicationFilters(queue, filters);
    rows = applySearch(rows, search, ['fullName', 'school', 'subLocation', 'location']);
    const [key, dir] = sort.split('-');
    return applySort(rows, key, dir);
  }, [queue, filters, search, sort]);

  const chiefName = user?.user_metadata?.full_name || 'Chief';
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <ChiefLayout chiefName={chiefName} pageTitle="Applications" layout="list">
      <SectionCard title="Applications review" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Review queue for applications assigned to your ward area. Use the review workspace for
          verification, approval, rejection, and clarification requests.
        </p>
      </SectionCard>

      <SectionCard title="Search & sort" className="page-section--filters">
        <TableSearchSort
          searchValue={search}
          onSearchChange={(value) => {
            setPage(0);
            setSearch(value);
          }}
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
          {loading
            ? 'Loading the pending queue…'
            : `${filtered.length} on this page · ${total} pending with the chief.`}
        </p>
        {loadError ? (
          <div className="notice" role="alert">
            <strong>Queue unavailable</strong>
            <p>{loadError}</p>
          </div>
        ) : (
          <ChiefApplicationsTable rows={filtered} />
        )}
        <div className="btn-row">
          <button type="button" className="btn btn--secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>
            Previous
          </button>
          <button type="button" className="btn btn--secondary" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)}>
            Next
          </button>
        </div>
      </SectionCard>
    </ChiefLayout>
  );
}
