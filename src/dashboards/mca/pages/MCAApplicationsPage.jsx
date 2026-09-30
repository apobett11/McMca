import React, { useCallback, useEffect, useState } from 'react';
import { MCALayout } from '../components/MCALayout.jsx';
import { McaFilterBar } from '../components/McaFilterBar.jsx';
import { McaApplicationDrawer } from '../components/McaApplicationDrawer.jsx';
import { MCA_STAGE_BADGES } from '../components/mcaStage.js';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { useSecureData } from '../../../lib/useSecureData.js';
import {
  MCA_PAGE_SIZE,
  MCA_SORTS,
  MCA_STAGES,
  exportMcaApplications,
  fetchMcaApplications,
  fetchMcaSummary
} from '../../../lib/mcaQueries.js';
import { useMcaFilters } from '../hooks/useMcaFilters.js';
import { useMca } from '../context/McaContext.jsx';
import { formatCount, formatDate, formatKes } from '../../../utils/format.js';

const SEARCH_DELAY_MS = 350;
const DEFAULT_STAGE = 'awaiting';
const DEFAULT_SORT = 'oldest';

const STAGE_TOTAL_KEY = { awaiting: 'awaiting', approved: 'approved', declined: 'declined', all: 'verified' };

function downloadCsv(csv, filename) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function MCAApplicationsPage() {
  const { displayName } = useMca();
  const { filters, params, setParam } = useMcaFilters();
  const stage = MCA_STAGES.some((item) => item.value === params.get('stage')) ? params.get('stage') : DEFAULT_STAGE;
  const sort = MCA_SORTS.some((item) => item.value === params.get('sort')) ? params.get('sort') : DEFAULT_SORT;
  const search = params.get('q') || '';
  const page = Math.max(0, Number.parseInt(params.get('page') || '0', 10) || 0);
  const openId = params.get('open');

  const [searchInput, setSearchInput] = useState(search);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState('');

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    if (searchInput.trim() === search) return undefined;
    const timer = setTimeout(() => setParam('q', searchInput.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput, search, setParam]);

  const filterKey = JSON.stringify(filters);
  const list = useSecureData(
    () => fetchMcaApplications({ filters, stage, sort, search, page }),
    [filterKey, stage, sort, search, page]
  );
  const summary = useSecureData(() => fetchMcaSummary(filters), [filterKey]);

  const rows = list.data?.rows || [];
  const total = list.data?.total || 0;
  const pageCount = Math.max(1, Math.ceil(total / MCA_PAGE_SIZE));
  const firstRow = total ? page * MCA_PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(total, (page + 1) * MCA_PAGE_SIZE);
  const totals = summary.data?.totals || {};

  const closeDrawer = useCallback(() => setParam('open', '', { resetPage: false }), [setParam]);
  const refreshAll = useCallback(() => {
    list.refresh();
    summary.refresh();
  }, [list.refresh, summary.refresh]);

  async function handleExport() {
    setExporting(true);
    setExportNote('');
    try {
      const { csv, rows: exported, capped } = await exportMcaApplications({ filters, stage, sort, search });
      downloadCsv(csv, `mca-applications-${stage}-${new Date().toISOString().slice(0, 10)}.csv`);
      setExportNote(
        capped
          ? `Exported the first ${formatCount(exported)} rows. Narrow the filters to export the rest.`
          : `Exported ${formatCount(exported)} rows.`
      );
    } catch (err) {
      setExportNote(err.message || 'Export failed.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <MCALayout pageTitle="Applications" layout="list" mcaName={displayName}>
      <div className="mca-page">
        <div className="filter-tabs mca-stage-tabs" role="tablist" aria-label="Decision stage">
          {MCA_STAGES.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={item.value === stage}
              className={`filter-tab ${item.value === stage ? 'filter-tab--active' : ''}`}
              onClick={() => setParam('stage', item.value === DEFAULT_STAGE ? '' : item.value)}
            >
              {item.label}
              <span className="mca-count">{formatCount(totals[STAGE_TOTAL_KEY[item.value]])}</span>
            </button>
          ))}
        </div>

        <McaFilterBar />

        <div className="mca-toolbar">
          <div>
            <label className="sr-only" htmlFor="mca-search">Search</label>
            <input
              id="mca-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search student, admission no. or school"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="mca-sort">Sort</label>
            <select
              id="mca-sort"
              value={sort}
              onChange={(event) => setParam('sort', event.target.value === DEFAULT_SORT ? '' : event.target.value)}
            >
              {MCA_SORTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--compact"
            onClick={handleExport}
            disabled={exporting || !total}
            style={{ width: 'auto' }}
          >
            <Icon name="download" size={16} />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>
        {exportNote ? <p className="mca-empty-note" role="status">{exportNote}</p> : null}

        <SectionCard title={MCA_STAGES.find((item) => item.value === stage)?.label}>
          {list.error ? (
            <div className="notice" role="alert">
              <strong>Applications unavailable</strong>
              <p>{list.error.message}</p>
              <button type="button" className="btn btn--secondary btn--compact" onClick={list.refresh} style={{ width: 'auto' }}>
                Retry
              </button>
            </div>
          ) : list.loading && !list.data ? (
            <div className="skeleton-wrap">
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line-short" />
            </div>
          ) : rows.length ? (
            <>
              <div className="data-table-wrap">
                <table className="data-table" aria-label="Chief-approved applications" aria-busy={list.loading}>
                  <thead>
                    <tr>
                      <th scope="col">Student</th>
                      <th scope="col">School</th>
                      <th scope="col">Ward · Location</th>
                      <th scope="col">Polling station</th>
                      <th scope="col" className="mca-table-number">Requested</th>
                      <th scope="col">Chief approved</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="sr-only">Open</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const badge = MCA_STAGE_BADGES[row.mca_stage];
                      return (
                        <tr key={row.id}>
                          <td data-label="Student">
                            {row.student_name}
                            <span className="mca-bars__meta" style={{ display: 'block' }}>
                              {row.admission_number || '—'}
                            </span>
                          </td>
                          <td data-label="School">
                            {row.school || '—'}
                            <span className="mca-bars__meta" style={{ display: 'block' }}>
                              {row.education_level}
                            </span>
                          </td>
                          <td data-label="Ward · Location">
                            {[row.ward, row.location].filter(Boolean).join(' · ') || '—'}
                          </td>
                          <td data-label="Polling station">{row.polling_station || '—'}</td>
                          <td data-label="Requested" className="mca-table-number">
                            {formatKes(row.amount_requested)}
                            {row.amount_allocated ? (
                              <span className="mca-bars__meta" style={{ display: 'block' }}>
                                {formatKes(row.amount_allocated)} allocated
                              </span>
                            ) : null}
                          </td>
                          <td data-label="Chief approved">{formatDate(row.chief_approved_at)}</td>
                          <td data-label="Status">
                            {badge ? <span className={badge.className}>{badge.label}</span> : null}
                          </td>
                          <td data-label="">
                            <button
                              type="button"
                              className="stitch-table-action"
                              onClick={() => setParam('open', row.id, { resetPage: false })}
                            >
                              {row.mca_stage === 'awaiting' ? 'Decide' : 'View'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mca-pager">
                <span>
                  {formatCount(firstRow)}–{formatCount(lastRow)} of {formatCount(total)}
                </span>
                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn--secondary btn--compact"
                    disabled={page === 0}
                    onClick={() => setParam('page', page - 1 || '', { resetPage: false })}
                    style={{ width: 'auto' }}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--compact"
                    disabled={page + 1 >= pageCount}
                    onClick={() => setParam('page', page + 1, { resetPage: false })}
                    style={{ width: 'auto' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="empty-state">
              {search ? `No applications match “${search}”.` : 'No chief-approved applications in this view.'}
            </p>
          )}
        </SectionCard>
      </div>

      {openId ? (
        <McaApplicationDrawer applicationId={openId} onClose={closeDrawer} onDecided={refreshAll} />
      ) : null}
    </MCALayout>
  );
}
