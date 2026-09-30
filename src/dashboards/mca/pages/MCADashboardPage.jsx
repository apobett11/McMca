import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MCALayout } from '../components/MCALayout.jsx';
import { McaFilterBar } from '../components/McaFilterBar.jsx';
import { SectionCard } from '../../../components/SectionCard.jsx';
import { Icon } from '../../../components/Icon.jsx';
import { BarList } from '../../../components/charts/BarList.jsx';
import { DonutChart } from '../../../components/charts/DonutChart.jsx';
import { TrendChart } from '../../../components/charts/TrendChart.jsx';
import { useSecureData } from '../../../lib/useSecureData.js';
import { fetchMcaSummary } from '../../../lib/mcaQueries.js';
import { useMcaFilters } from '../hooks/useMcaFilters.js';
import { useMca } from '../context/McaContext.jsx';
import { formatCount, formatDays, formatKes, formatPercent, formatWeek } from '../../../utils/format.js';
import { getTimeGreeting } from '../../../utils/greeting.js';

const PLACE_TABS = [
  { key: 'by_ward', label: 'Ward', filter: 'ward', icon: 'map' },
  { key: 'by_location', label: 'Chief location', filter: 'location', icon: 'shield' },
  { key: 'by_polling_station', label: 'Polling station', filter: 'polling', icon: 'users' }
];

const PLACE_LIMIT = 10;

function Kpi({ icon, label, value, hint, to, children }) {
  const body = (
    <>
      <span className="mca-kpi__label">
        <Icon name={icon} size={16} />
        {label}
      </span>
      <span className="mca-kpi__value">{value}</span>
      {children}
      {hint ? <span className="mca-kpi__hint">{hint}</span> : null}
    </>
  );
  return to ? (
    <Link className="mca-kpi" to={to}>
      {body}
    </Link>
  ) : (
    <div className="mca-kpi">{body}</div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="skeleton-wrap">
      <div className="skeleton skeleton--hero" />
      <div className="skeleton skeleton--line" />
      <div className="skeleton skeleton--line-short" />
    </div>
  );
}

export function MCADashboardPage() {
  const navigate = useNavigate();
  const { displayName } = useMca();
  const { filters, setParam, linkWith } = useMcaFilters();
  const [placeTab, setPlaceTab] = useState(PLACE_TABS[0].key);
  const filterKey = JSON.stringify(filters);

  const { data: summary, loading, error, refresh } = useSecureData(() => fetchMcaSummary(filters), [filterKey]);

  const totals = summary?.totals || {};
  const budget = Number(summary?.budget) || 0;
  const allocated = Number(totals.allocated) || 0;
  const budgetShare = budget ? Math.min(100, Math.round((allocated / budget) * 100)) : 0;
  const decided = (totals.approved || 0) + (totals.declined || 0);
  const activeTab = PLACE_TABS.find((tab) => tab.key === placeTab) || PLACE_TABS[0];

  const placeItems = useMemo(
    () =>
      (summary?.[activeTab.key] || []).slice(0, PLACE_LIMIT).map((row) => ({
        ...row,
        value: row.applicants
      })),
    [summary, activeTab.key]
  );

  const levelSegments = useMemo(
    () => (summary?.by_level || []).map((row) => ({ ...row, value: row.applicants })),
    [summary]
  );

  const pipeline = [
    { key: 'awaiting', label: 'Awaiting decision', value: totals.awaiting || 0, series: 0 },
    { key: 'approved', label: 'Approved', value: totals.approved || 0, series: 2 },
    { key: 'declined', label: 'Declined', value: totals.declined || 0, series: 4 }
  ];

  function drill(filterKeyName, label) {
    if (filterKeyName === 'ward') {
      setParam('ward', label);
      return;
    }
    navigate(linkWith('/mca/applications', { [filterKeyName]: label, stage: 'all' }));
  }

  return (
    <MCALayout pageTitle="Dashboard" layout="dashboard" mcaName={displayName}>
      <div className="mca-page">
        <div className="mca-intro">
          <div>
            <h1 className="mca-intro__title">
              {getTimeGreeting()}, {displayName}
            </h1>
            <p className="mca-intro__sub">
              Only applications a chief has approved reach this dashboard. Figures follow the filters below.
            </p>
          </div>
          <Link
            className="btn btn--primary"
            to={linkWith('/mca/applications', { stage: 'awaiting', sort: 'oldest' })}
            style={{ width: 'auto', borderRadius: 999 }}
          >
            <Icon name="review" size={18} />
            Review awaiting ({formatCount(totals.awaiting)})
          </Link>
        </div>

        <McaFilterBar />

        {error ? (
          <div className="notice" role="alert">
            <strong>Analytics unavailable</strong>
            <p>{error.message}</p>
            <button type="button" className="btn btn--secondary btn--compact" onClick={refresh} style={{ width: 'auto' }}>
              Retry
            </button>
          </div>
        ) : loading && !summary ? (
          <DashboardSkeleton />
        ) : (
          <>
            <section className="mca-kpis" aria-label="Key figures">
              <Kpi
                icon="clock"
                label="Awaiting decision"
                value={formatCount(totals.awaiting)}
                hint={
                  totals.awaiting
                    ? `Oldest has waited ${formatDays(totals.oldest_awaiting_days)}`
                    : 'Nothing waiting'
                }
                to={linkWith('/mca/applications', { stage: 'awaiting', sort: 'oldest' })}
              />
              <Kpi
                icon="approved"
                label="Approved"
                value={formatCount(totals.approved)}
                hint={`${formatPercent(totals.approved, decided)} of decided · median ${formatKes(totals.median_allocation)}`}
                to={linkWith('/mca/applications', { stage: 'approved' })}
              />
              <Kpi
                icon="funds"
                label="Allocated"
                value={formatKes(allocated, { compact: true })}
                hint={budget ? `${budgetShare}% of ${formatKes(budget, { compact: true })} budget` : 'No budget set for this cycle'}
              >
                {budget ? (
                  <span className="mca-meter" aria-hidden="true">
                    <span
                      className={`mca-meter__fill ${budgetShare >= 90 ? 'mca-meter__fill--warn' : ''}`}
                      style={{ width: `${budgetShare}%` }}
                    />
                  </span>
                ) : null}
              </Kpi>
              <Kpi
                icon="calendar"
                label="Time to decision"
                value={formatDays(totals.median_days_to_mca)}
                hint={`Median after chief approval · chief took ${formatDays(totals.median_days_to_chief)}`}
              />
            </section>

            <div className="mca-grid-2">
              <SectionCard title="Decision pipeline">
                <div className="mca-stack" role="img" aria-label="Awaiting, approved, and declined applications">
                  {pipeline.map((part) =>
                    part.value ? (
                      <span
                        key={part.key}
                        className={`mca-stack__part mca-series-${part.series}`}
                        style={{ flexGrow: part.value }}
                        title={`${part.label}: ${part.value}`}
                      />
                    ) : null
                  )}
                </div>
                <ul className="mca-legend mca-legend--inline">
                  {pipeline.map((part) => (
                    <li key={part.key} className="mca-legend__item">
                      <span className={`mca-legend__swatch mca-series-${part.series}`} aria-hidden="true" />
                      <span className="mca-legend__label">{part.label}</span>
                      <span className="mca-legend__value">{formatCount(part.value)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mca-facts">
                  <div>
                    <dt>Chief-approved</dt>
                    <dd>{formatCount(totals.verified)}</dd>
                  </div>
                  <div>
                    <dt>Still requested</dt>
                    <dd>{formatKes(totals.requested_awaiting, { compact: true })}</dd>
                  </div>
                  <div>
                    <dt>Returning beneficiaries</dt>
                    <dd>
                      {formatCount(totals.returning)} · {formatPercent(totals.returning, totals.verified)}
                    </dd>
                  </div>
                  <div>
                    <dt>Budget left</dt>
                    <dd>{budget ? formatKes(Math.max(0, budget - allocated), { compact: true }) : '—'}</dd>
                  </div>
                </dl>
              </SectionCard>

              <SectionCard title="Education level">
                <DonutChart
                  segments={levelSegments}
                  centerValue={formatCount(totals.verified)}
                  centerLabel="applicants"
                  format={formatCount}
                  label="Chief-approved applicants by education level"
                  onSelect={(segment) => setParam('level', segment.label)}
                />
              </SectionCard>
            </div>

            <SectionCard title="Where applicants are">
              <div className="filter-tabs mca-stage-tabs" role="tablist" aria-label="Group by place">
                {PLACE_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={tab.key === activeTab.key}
                    className={`filter-tab ${tab.key === activeTab.key ? 'filter-tab--active' : ''}`}
                    onClick={() => setPlaceTab(tab.key)}
                  >
                    <Icon name={tab.icon} size={16} />
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <BarList
                  items={placeItems}
                  format={formatCount}
                  label={`Applicants by ${activeTab.label.toLowerCase()}`}
                  meta={(row) =>
                    `${formatCount(row.approved)} approved · ${formatCount(row.awaiting)} awaiting · ${formatKes(row.allocated, { compact: true })}${row.ward && activeTab.filter !== 'ward' ? ` · ${row.ward}` : ''}`
                  }
                  onSelect={(row) => drill(activeTab.filter, row.label)}
                />
              </div>
              <p className="mca-empty-note" style={{ marginTop: 12 }}>
                Top {PLACE_LIMIT} by applicants. Select a row to narrow the view.
              </p>
            </SectionCard>

            <div className="mca-grid-2">
              <SectionCard title="Top schools">
                {summary?.by_school?.length ? (
                  <div className="data-table-wrap">
                    <table className="data-table" aria-label="Schools with the most chief-approved applicants">
                      <thead>
                        <tr>
                          <th scope="col">School</th>
                          <th scope="col" className="mca-table-number">Applicants</th>
                          <th scope="col" className="mca-table-number">Approved</th>
                          <th scope="col" className="mca-table-number">Allocated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.by_school.map((row) => (
                          <tr key={row.label}>
                            <td data-label="School">
                              <button
                                type="button"
                                className="stitch-table-action"
                                onClick={() => setParam('school', row.label)}
                              >
                                {row.label}
                              </button>
                              <span className="mca-bars__meta" style={{ display: 'block' }}>
                                {row.level} · avg request {formatKes(row.avg_requested, { compact: true })}
                              </span>
                            </td>
                            <td data-label="Applicants" className="mca-table-number">{formatCount(row.applicants)}</td>
                            <td data-label="Approved" className="mca-table-number">{formatCount(row.approved)}</td>
                            <td data-label="Allocated" className="mca-table-number">{formatKes(row.allocated, { compact: true })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="empty-state">No schools in this view.</p>
                )}
              </SectionCard>

              <SectionCard title="Weekly flow">
                <TrendChart
                  points={summary?.weekly || []}
                  series={[
                    { key: 'verified', label: 'Chief approved' },
                    { key: 'decided', label: 'MCA decided' }
                  ]}
                  formatLabel={formatWeek}
                  label="Chief approvals and MCA decisions over the last 12 weeks"
                />
                <p className="mca-empty-note" style={{ marginTop: 8 }}>
                  Last 12 weeks. When chief approvals outpace decisions, the awaiting list grows.
                </p>
              </SectionCard>
            </div>
          </>
        )}
      </div>
    </MCALayout>
  );
}
