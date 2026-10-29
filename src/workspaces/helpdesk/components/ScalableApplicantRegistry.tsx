import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cx, fmtDate, fmtDateTime, kes } from '../../lib/format.ts';
import {
  WARD_LOCATIONS,
  type WardLocationKey,
  type WardApplicant,
  fetchScalableApplicants,
  type FetchApplicantsQuery
} from '../../../data/scalableWardDataset.ts';
import { MobileApplicantCard } from './MobileApplicantCard.tsx';
import {
  Badge,
  Button,
  Card,
  Chip,
  DataTable,
  EmptyState,
  FieldLabel,
  PageHeader,
  SearchInput,
  Select,
  Td,
  Th,
  rowCls,
  tbodyCls
} from '../../ui/primitives.tsx';
import { Drawer } from '../../ui/overlays.tsx';
import { Icon } from '../../ui/icons.tsx';

const CLASS_TONE: Record<'IND' | 'DEL' | 'CUS', 'cyan' | 'violet' | 'amber'> = {
  IND: 'cyan',
  DEL: 'violet',
  CUS: 'amber'
};

export function ScalableApplicantRegistry() {
  // Cascading location state
  const [selectedLocation, setSelectedLocation] = useState<WardLocationKey | ''>('');
  const [selectedSubLocation, setSelectedSubLocation] = useState<string>('');

  // Secondary query filters
  const [searchQuery, setSearchQuery] = useState('');
  const [ageBracket, setAgeBracket] = useState<'all' | '14-17' | '18-24' | '25+'>('all');
  const [gender, setGender] = useState<'all' | 'Female' | 'Male'>('all');
  const [institutionCategory, setInstitutionCategory] = useState<'all' | 'Secondary' | 'TVET' | 'University'>('all');
  const [selectedVillage, setSelectedVillage] = useState('all');

  // Server-side cursor/range pagination & sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<25 | 50>(25);
  const [sortBy, setSortBy] = useState<'age' | 'submittedAt' | 'village' | 'feeBalance' | 'name' | 'serial'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Loading & Inspection
  const [loading, setLoading] = useState(false);
  const [activeDossier, setActiveDossier] = useState<WardApplicant | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Available sub-locations based on selected location
  const availableSubLocations = useMemo(() => {
    if (!selectedLocation) return [];
    return WARD_LOCATIONS[selectedLocation] || [];
  }, [selectedLocation]);

  // Handle location change -> reset sub-location and page
  const handleLocationChange = (loc: string) => {
    setSelectedLocation(loc as WardLocationKey | '');
    setSelectedSubLocation('');
    setPage(1);
  };

  const handleSubLocationChange = (sub: string) => {
    setSelectedSubLocation(sub);
    setPage(1);
  };

  // Query execution
  const queryResult = useMemo(() => {
    return fetchScalableApplicants({
      location: selectedLocation || undefined,
      subLocation: selectedSubLocation || undefined,
      search: searchQuery,
      ageBracket,
      gender,
      institutionCategory,
      village: selectedVillage,
      page,
      pageSize,
      sortBy,
      sortOrder
    });
  }, [
    selectedLocation,
    selectedSubLocation,
    searchQuery,
    ageBracket,
    gender,
    institutionCategory,
    selectedVillage,
    page,
    pageSize,
    sortBy,
    sortOrder
  ]);

  // Available villages for current sub-location
  const availableVillages = useMemo(() => {
    if (!selectedSubLocation) return [];
    return [
      `${selectedSubLocation} Village 1`,
      `${selectedSubLocation} Village 2`,
      `${selectedSubLocation} Village 3`,
      `${selectedSubLocation} Village 4`
    ];
  }, [selectedSubLocation]);

  // Virtualizer setup for desktop table body
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: queryResult.items.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 52, // Fixed 52px row height mandate
    overscan: 10 // Fixed overscan 10 mandate
  });

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  };

  return (
    <div className="relative pb-24 md:pb-8">
      <PageHeader
        eyebrow="Registry & dossiers"
        title="Applicant Registry"
        description="Instant applicant lookup and family custody verification."
      />

      {/* Telemetry KPI Strip */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Total Ward Intake</span>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-white">
            {queryResult.telemetry.totalWardIntake.toLocaleString()}
          </p>
          <span className="text-[11px] text-slate-200">Across Tendeno &amp; Sorget</span>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-slate-900/60 p-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Master Verified Pool</span>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-300">
            {queryResult.telemetry.verifiedAndCleared.toLocaleString()}
          </p>
          <span className="text-[11px] text-emerald-300">Passed Chief Clearance</span>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-slate-900/60 p-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Chief Field Triage</span>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-amber-300">
            {queryResult.telemetry.inChiefTriage}
          </p>
          <span className="text-[11px] text-amber-300">Boundary &amp; Flagged Cases</span>
        </div>
        <div className="rounded-xl border border-cyan-500/20 bg-slate-900/60 p-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">Appeals Resolved</span>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-cyan-300">
            {queryResult.telemetry.appealsResolved}
          </p>
          <span className="text-[11px] text-slate-200">{queryResult.telemetry.appealsRejected} dismissed</span>
        </div>
      </div>

      {/* Mandatory Cascading Boundary Filters Card */}
      <Card className="mb-4" flush>
        <div className="border-b border-slate-800/80 bg-slate-950/40 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent-soft">
                1
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Mandatory Boundary Filter Gate (Required Before Render)
              </span>
            </div>
            {queryResult.requiresFilterSelection ? (
              <Badge tone="amber" pulse>
                Data Fetch Blocked
              </Badge>
            ) : (
              <Badge tone="emerald">
                Pipeline Active · {queryResult.totalMatching} Loaded
              </Badge>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
            {/* Step 1: Location */}
            <div>
              <FieldLabel htmlFor="gate-loc">Step 1: Administrative Location *</FieldLabel>
              <Select
                id="gate-loc"
                value={selectedLocation}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full font-medium"
              >
                <option value="">-- Choose Location --</option>
                <option value="Tendeno">Tendeno Location</option>
                <option value="Sorget">Sorget Location</option>
              </Select>
            </div>

            {/* Step 2: Cascading Sub-Location */}
            <div>
              <FieldLabel htmlFor="gate-subloc">Step 2: Sub-Location *</FieldLabel>
              <Select
                id="gate-subloc"
                value={selectedSubLocation}
                disabled={!selectedLocation}
                onChange={(e) => handleSubLocationChange(e.target.value)}
                className="w-full font-medium"
              >
                <option value="">
                  {selectedLocation ? '-- Select Sub-Location --' : 'Select Location First'}
                </option>
                {availableSubLocations.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </Select>
            </div>

            {/* Search */}
            <div className="sm:col-span-2">
              <FieldLabel htmlFor="reg-search">Search Verified Ledger</FieldLabel>
              <SearchInput
                id="reg-search"
                placeholder="National ID / NEMIS / Student Name / Serial…"
                value={searchQuery}
                disabled={queryResult.requiresFilterSelection}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Secondary Query Filters (Only active when Location & Sub-Location resolved) */}
        {!queryResult.requiresFilterSelection ? (
          <div className="p-3 bg-slate-900/40 border-t border-slate-800/60 flex flex-wrap items-center gap-3 text-xs">
            {/* Age Brackets */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">Age:</span>
              {(['all', '14-17', '18-24', '25+'] as const).map((b) => (
                <Chip
                  key={b}
                  active={ageBracket === b}
                  onClick={() => {
                    setAgeBracket(b);
                    setPage(1);
                  }}
                >
                  {b === 'all' ? 'All Ages' : b}
                </Chip>
              ))}
            </div>

            {/* Gender */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">Gender:</span>
              {(['all', 'Female', 'Male'] as const).map((g) => (
                <Chip
                  key={g}
                  active={gender === g}
                  onClick={() => {
                    setGender(g);
                    setPage(1);
                  }}
                >
                  {g}
                </Chip>
              ))}
            </div>

            {/* Institution Category */}
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-200">Level:</span>
              {(['all', 'Secondary', 'TVET', 'University'] as const).map((cat) => (
                <Chip
                  key={cat}
                  active={institutionCategory === cat}
                  onClick={() => {
                    setInstitutionCategory(cat);
                    setPage(1);
                  }}
                >
                  {cat}
                </Chip>
              ))}
            </div>

            {/* Village */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-semibold text-slate-200">Village:</span>
              <Select
                value={selectedVillage}
                onChange={(e) => {
                  setSelectedVillage(e.target.value);
                  setPage(1);
                }}
                className="py-1 text-xs"
              >
                <option value="all">All Villages in {selectedSubLocation}</option>
                {availableVillages.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        ) : null}
      </Card>

      {/* Main Table / Viewport Area */}
      {queryResult.requiresFilterSelection ? (
        /* Ergonomic Initial Filter Placeholder Illustration */
        <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/30">
            <Icon name="shield" size={32} />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">
            Select Administrative Location &amp; Sub-Location to populate applicant ledger.
          </h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-300 leading-relaxed">
            Enterprise Scale Mandate: Unfiltered global datasets (&gt;1,000 records) lock main-thread rendering.
            Please designate both an administrative location (e.g. <span className="font-semibold text-white">Tendeno</span> or <span className="font-semibold text-white">Sorget</span>)
            and sub-location above to stream records into the virtualized engine.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedLocation('Tendeno');
                setSelectedSubLocation('Tendeno Central');
              }}
            >
              Quick Load: Tendeno Central
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedLocation('Sorget');
                setSelectedSubLocation('Sorget Central');
              }}
            >
              Quick Load: Sorget Central
            </Button>
          </div>
        </div>
      ) : queryResult.items.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center">
          <EmptyState
            icon="search"
            title="No Verified Applicants Match Your Filters"
            body="Try broadening search terms or resetting secondary age/gender parameters."
          />
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchQuery('');
                setAgeBracket('all');
                setGender('all');
                setInstitutionCategory('all');
                setSelectedVillage('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile < 768px) */}
          <div className="hidden md:block">
            {/* Sorting Header Bar */}
            <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2 text-xs border border-slate-800/60">
              <span className="text-slate-200">
                Displaying <strong className="text-white">{queryResult.items.length}</strong> of{' '}
                <strong className="text-white">{queryResult.totalMatching}</strong> verified records
                (Page {queryResult.page} of {queryResult.totalPages})
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">Sort by:</span>
                <button
                  type="button"
                  onClick={() => toggleSort('age')}
                  className={cx(
                    'rounded px-2 py-1 font-medium transition-colors',
                    sortBy === 'age' ? 'bg-accent/20 text-accent-soft' : 'text-slate-300 hover:text-white'
                  )}
                >
                  Age {sortBy === 'age' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('submittedAt')}
                  className={cx(
                    'rounded px-2 py-1 font-medium transition-colors',
                    sortBy === 'submittedAt' ? 'bg-accent/20 text-accent-soft' : 'text-slate-300 hover:text-white'
                  )}
                >
                  Date Submitted {sortBy === 'submittedAt' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('village')}
                  className={cx(
                    'rounded px-2 py-1 font-medium transition-colors',
                    sortBy === 'village' ? 'bg-accent/20 text-accent-soft' : 'text-slate-300 hover:text-white'
                  )}
                >
                  Village {sortBy === 'village' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </button>
                <button
                  type="button"
                  onClick={() => toggleSort('feeBalance')}
                  className={cx(
                    'rounded px-2 py-1 font-medium transition-colors',
                    sortBy === 'feeBalance' ? 'bg-accent/20 text-accent-soft' : 'text-slate-300 hover:text-white'
                  )}
                >
                  Fee Balance {sortBy === 'feeBalance' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </button>
              </div>
            </div>

            {/* Virtualized Container */}
            <div
              ref={tableContainerRef}
              className="relative max-h-[calc(100vh-380px)] overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner"
            >
              <table className="w-full text-left text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-950/90 text-xs font-bold uppercase tracking-wider text-slate-200 backdrop-blur-md border-b border-slate-800">
                  <tr>
                    <Th align="right" className="w-32">Serial</Th>
                    <Th>Student Details</Th>
                    <Th align="right">ID / NEMIS</Th>
                    <Th>Institution &amp; Category</Th>
                    <Th align="right">Fee Balance</Th>
                    <Th align="center">Chief Status</Th>
                    <Th align="right" className="w-28">Actions</Th>
                  </tr>
                </thead>
                <tbody
                  className={tbodyCls}
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative'
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const applicant = queryResult.items[virtualRow.index];
                    if (!applicant) return null;

                    return (
                      <tr
                        key={applicant.id}
                        className={rowCls}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`
                        }}
                      >
                        <Td align="right">
                          <span className="font-mono text-xs font-bold tabular-nums text-slate-100">
                            {applicant.serial}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">{applicant.fullName}</span>
                            <Badge tone={CLASS_TONE[applicant.accountClass]}>{applicant.accountClass}</Badge>
                            <span className="text-xs text-slate-300">({applicant.age} yrs, {applicant.gender})</span>
                          </div>
                          <p className="text-xs text-slate-300 truncate">
                            {applicant.village} · {applicant.subLocation}
                          </p>
                        </Td>
                        <Td align="right" mono>
                          <p className="text-xs text-white">ID {applicant.nationalId}</p>
                          <p className="text-[11px] text-cyan-300 font-semibold">{applicant.nemis}</p>
                        </Td>
                        <Td>
                          <p className="text-xs text-white truncate">{applicant.school}</p>
                          <p className="text-[11px] text-slate-300">{applicant.institutionSubCategory}</p>
                        </Td>
                        <Td align="right">
                          <p className="font-mono text-xs font-bold tabular-nums text-amber-200">
                            {kes(applicant.feeBalance)}
                          </p>
                          <p className="text-[11px] text-slate-300">Req: {kes(applicant.requestedKes)}</p>
                        </Td>
                        <Td align="center">
                          <Badge tone="emerald">
                            {applicant.appealStatus === 'Accepted' ? 'Cleared (Appeal)' : 'Cleared'}
                          </Badge>
                        </Td>
                        <Td align="right">
                          <Button
                            variant="ghost"
                            onClick={() => setActiveDossier(applicant)}
                            className="text-xs"
                          >
                            Dossier
                          </Button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Native Mobile Viewport (< 768px): Dedicated Stacked Cards */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 px-1">
              <span>
                Verified records: <strong className="text-white">{queryResult.totalMatching}</strong>
              </span>
              <span>
                Page {queryResult.page}/{queryResult.totalPages}
              </span>
            </div>

            {queryResult.items.map((applicant) => (
              <MobileApplicantCard
                key={applicant.id}
                applicant={applicant}
                onInspect={(app) => setActiveDossier(app)}
                onSms={(app) => alert(`SMS notification queued for ${app.fullName} (${app.guardianPhone})`)}
              />
            ))}
          </div>

          {/* Server-Side Range Pagination Controls */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <span>Rows per page:</span>
              <Select
                value={pageSize.toString()}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as 25 | 50);
                  setPage(1);
                }}
                className="py-1 text-xs"
              >
                <option value="25">25 records</option>
                <option value="50">50 records</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={queryResult.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="min-h-[44px] min-w-[44px]"
              >
                Previous
              </Button>
              <span className="font-mono text-slate-100 px-2">
                Page {queryResult.page} of {queryResult.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={queryResult.page >= queryResult.totalPages}
                onClick={() => setPage((p) => Math.min(queryResult.totalPages, p + 1))}
                className="min-h-[44px] min-w-[44px]"
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Sticky Mobile Action Dock (< 768px thumb-reach) */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-40">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-2 shadow-2xl backdrop-blur-lg">
          <Button
            variant="secondary"
            onClick={() => setMobileFilterOpen((prev) => !prev)}
            className="flex-1 min-h-[44px] text-xs font-semibold"
          >
            <Icon name="sliders" size={14} className="mr-1.5" />
            {selectedSubLocation ? `${selectedSubLocation}` : 'Select Sub-Location'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="min-h-[44px] min-w-[44px] px-3 text-slate-200"
            aria-label="Scroll to top"
          >
            <Icon name="chevron-up" size={18} />
          </Button>

          <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/30 px-3 py-1 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-200 block">Verified</span>
            <span className="font-mono text-xs font-bold text-emerald-300">
              {queryResult.totalMatching}
            </span>
          </div>
        </div>
      </div>

      {/* Applicant Dossier Inspection Drawer */}
      <Drawer
        open={!!activeDossier}
        onClose={() => setActiveDossier(null)}
        title={activeDossier ? `${activeDossier.fullName} (${activeDossier.serial})` : 'Dossier'}
        subtitle={activeDossier ? `${activeDossier.school} · ${activeDossier.subLocation}` : ''}
      >
        {activeDossier ? (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-slate-200">Pipeline Clearance</span>
                <Badge tone="emerald">Master Verified Pool</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-slate-100">
                <div>
                  <span className="text-slate-200 block">National ID</span>
                  <p className="font-mono text-sm font-semibold">{activeDossier.nationalId}</p>
                </div>
                <div>
                  <span className="text-slate-200 block">NEMIS / UPI</span>
                  <p className="font-mono text-sm font-semibold text-cyan-300">{activeDossier.nemis}</p>
                </div>
                <div>
                  <span className="text-slate-200 block">Age &amp; Gender</span>
                  <p className="font-semibold">{activeDossier.age} years · {activeDossier.gender}</p>
                </div>
                <div>
                  <span className="text-slate-200 block">Account Class</span>
                  <Badge tone={CLASS_TONE[activeDossier.accountClass]}>{activeDossier.accountClass}</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-xs uppercase font-bold text-slate-200 block">Chief Field Assessment</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-100">Need Score:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{activeDossier.chiefScore}/99</span>
              </div>
              <p className="text-slate-300">{activeDossier.vulnerabilityCategory}</p>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-slate-100">Residency Status:</span>
                <span className="text-emerald-300 font-medium">Cleared for {activeDossier.subLocation}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-xs uppercase font-bold text-slate-200 block">Financial Ledger</span>
              <div className="flex items-center justify-between">
                <span className="text-slate-100">Fee Balance:</span>
                <span className="font-mono font-bold text-amber-200 text-sm">{kes(activeDossier.feeBalance)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-100">Bursary Requested:</span>
                <span className="font-mono text-slate-100">{kes(activeDossier.requestedKes)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="font-semibold text-white">Committed Allocation:</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">{kes(activeDossier.allocatedKes)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
              <span className="text-xs uppercase font-bold text-slate-200 block">Guardian &amp; Emergency Contact</span>
              <p className="font-medium text-white">{activeDossier.guardianName} ({activeDossier.relationship})</p>
              <p className="font-mono text-slate-300">Phone: {activeDossier.guardianPhone}</p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
