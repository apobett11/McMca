import { useMemo, useState, useEffect } from 'react';
import { cx } from '../../lib/format.ts';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Button, IconButton, SearchInput, Select } from '../../ui/primitives.tsx';
import { Modal } from '../../ui/overlays.tsx';
import { HierarchyMetricCard } from './HierarchyMetricCard.tsx';
import {
  type HelpDeskAnalyticsSummary,
  type LocationDistributionItem,
  type SubLocationDistributionItem,
  type DocumentRegistrationItem,
  getDocumentRegistrations
} from '../services/helpDeskService.ts';
import {
  getFullApplicantPool,
  type WardApplicant,
  type WardLocationKey
} from '../../../data/scalableWardDataset.ts';

export type DrilldownMetricType =
  | 'total'
  | 'successful'
  | 'flagged'
  | 'completed'
  | 'incomplete_students'
  | 'incomplete_parents';

export interface LocationDrilldownModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'applications' | 'documents';
  metricType: DrilldownMetricType;
  analytics: HelpDeskAnalyticsSummary;
}

export function LocationDrilldownModal({
  open,
  onClose,
  mode,
  metricType,
  analytics
}: LocationDrilldownModalProps) {
  // Navigation stack: 'locations' -> 'subLocations' -> 'villages' -> 'table'
  const [step, setStep] = useState<'locations' | 'subLocations' | 'villages' | 'table'>('locations');
  const [selectedLocation, setSelectedLocation] = useState<WardLocationKey | null>(null);
  const [selectedSubLocation, setSelectedSubLocation] = useState<string | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<string>('all');

  // Table filters & sorting
  const [tableSort, setTableSort] = useState<'all' | 'successful' | 'failed'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Reset drill-down path when opening with a new metric
  useEffect(() => {
    if (open) {
      setStep('locations');
      setSelectedLocation(null);
      setSelectedSubLocation(null);
      setSelectedVillage('all');
      setTableSort(
        metricType === 'successful' || metricType === 'completed'
          ? 'successful'
          : metricType === 'flagged' || metricType === 'incomplete_students' || metricType === 'incomplete_parents'
          ? 'failed'
          : 'all'
      );
      setSearch('');
      setPage(1);
    }
  }, [open, metricType]);

  const allApplicants = useMemo(() => getFullApplicantPool(), []);
  const allDocRegistrations = useMemo(() => getDocumentRegistrations(), []);

  // Title and description based on current metric
  const metricLabel = useMemo(() => {
    switch (metricType) {
      case 'total':
        return mode === 'applications' ? 'Total Applications' : 'Total Registrations';
      case 'successful':
        return 'Successful Applications';
      case 'flagged':
        return 'Flagged Applications';
      case 'completed':
        return 'Completed Document Stages';
      case 'incomplete_students':
        return 'Incomplete Student Registrations';
      case 'incomplete_parents':
        return 'Incomplete Parent Registrations';
      default:
        return 'Distribution Breakdown';
    }
  }, [metricType, mode]);

  // Extract count for a location entry
  const getLocationCount = (loc: LocationDistributionItem): number => {
    switch (metricType) {
      case 'total':
        return loc.total;
      case 'successful':
        return loc.successful;
      case 'flagged':
        return loc.flagged;
      case 'completed':
        return loc.completedDocuments;
      case 'incomplete_students':
        return loc.incompleteStudents;
      case 'incomplete_parents':
        return loc.incompleteParents;
      default:
        return loc.total;
    }
  };

  // Extract count for a sub-location entry
  const getSubLocationCount = (sub: SubLocationDistributionItem): number => {
    switch (metricType) {
      case 'total':
        return sub.total;
      case 'successful':
        return sub.successful;
      case 'flagged':
        return sub.flagged;
      case 'completed':
        return sub.completedDocuments;
      case 'incomplete_students':
        return sub.incompleteStudents;
      case 'incomplete_parents':
        return sub.incompleteParents;
      default:
        return sub.total;
    }
  };

  // Active sublocations list
  const subLocationsList = useMemo(() => {
    if (!selectedLocation) return [];
    return analytics.subLocations[selectedLocation] || [];
  }, [selectedLocation, analytics]);

  // Available villages in selected sub-location
  const currentSubLocationEntry = useMemo(() => {
    if (!selectedLocation || !selectedSubLocation) return null;
    return subLocationsList.find((s) => s.subLocation === selectedSubLocation);
  }, [selectedLocation, selectedSubLocation, subLocationsList]);

  const availableVillages = useMemo(() => {
    return currentSubLocationEntry?.villages || [];
  }, [currentSubLocationEntry]);

  // Filtered rows for the applications / documents table
  const tableRows = useMemo(() => {
    if (mode === 'applications') {
      return allApplicants.filter((app) => {
        if (selectedLocation && app.location !== selectedLocation) return false;
        if (selectedSubLocation && app.subLocation !== selectedSubLocation) return false;
        if (selectedVillage && selectedVillage !== 'all' && app.village !== selectedVillage) return false;

        const isSuccess = app.chiefStatus === 'Cleared' || app.appealStatus === 'Accepted';
        if (tableSort === 'successful' && !isSuccess) return false;
        if (tableSort === 'failed' && isSuccess) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            app.fullName.toLowerCase().includes(q) ||
            app.serial.toLowerCase().includes(q) ||
            app.nationalId.toLowerCase().includes(q) ||
            app.school.toLowerCase().includes(q) ||
            app.village.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      });
    } else {
      // Documents mode
      return allDocRegistrations.filter((doc) => {
        if (selectedLocation && doc.location !== selectedLocation) return false;
        if (selectedSubLocation && doc.subLocation !== selectedSubLocation) return false;
        if (selectedVillage && selectedVillage !== 'all' && doc.village !== selectedVillage) return false;

        if (metricType === 'incomplete_students' && !doc.isStudent) return false;
        if (metricType === 'incomplete_parents' && !doc.isParent) return false;

        const isComplete = doc.status === 'Completed';
        if (tableSort === 'successful' && !isComplete) return false;
        if (tableSort === 'failed' && isComplete) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const match =
            doc.name.toLowerCase().includes(q) ||
            doc.serial.toLowerCase().includes(q) ||
            doc.nationalId.toLowerCase().includes(q) ||
            doc.school.toLowerCase().includes(q) ||
            doc.village.toLowerCase().includes(q);
          if (!match) return false;
        }

        return true;
      });
    }
  }, [
    mode,
    allApplicants,
    allDocRegistrations,
    selectedLocation,
    selectedSubLocation,
    selectedVillage,
    tableSort,
    search,
    metricType
  ]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return tableRows.slice(start, start + pageSize);
  }, [tableRows, page]);

  // Back navigation handler
  const handleBack = () => {
    if (step === 'table') {
      setStep('villages');
    } else if (step === 'villages') {
      setStep('subLocations');
    } else if (step === 'subLocations') {
      setStep('locations');
      setSelectedLocation(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      width={1040}
      title={
        <div className="flex items-center gap-2 text-base font-bold text-white sm:text-lg">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-950/40 text-cyan-400">
            <Icon name="mapPin" size={16} />
          </span>
          <span>{metricLabel} · Geographic Distribution</span>
        </div>
      }
      subtitle={
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
          <button
            type="button"
            onClick={() => {
              setStep('locations');
              setSelectedLocation(null);
              setSelectedSubLocation(null);
            }}
            className={cx('hover:underline', step === 'locations' ? 'font-bold text-accent-soft' : 'text-slate-400')}
          >
            Ward Locations
          </button>
          {selectedLocation ? (
            <>
              <Icon name="chevronRight" size={12} className="text-slate-300" />
              <button
                type="button"
                onClick={() => {
                  setStep('subLocations');
                  setSelectedSubLocation(null);
                }}
                className={cx('hover:underline', step === 'subLocations' ? 'font-bold text-accent-soft' : 'text-slate-400')}
              >
                {selectedLocation}
              </button>
            </>
          ) : null}
          {selectedSubLocation ? (
            <>
              <Icon name="chevronRight" size={12} className="text-slate-300" />
              <button
                type="button"
                onClick={() => setStep('villages')}
                className={cx('hover:underline', step === 'villages' ? 'font-bold text-accent-soft' : 'text-slate-400')}
              >
                {selectedSubLocation}
              </button>
            </>
          ) : null}
          {step === 'table' ? (
            <>
              <Icon name="chevronRight" size={12} className="text-slate-300" />
              <span className="font-bold text-accent-soft">
                {selectedVillage === 'all' ? 'All Villages' : selectedVillage}
              </span>
            </>
          ) : null}
        </div>
      }
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {step !== 'locations' ? (
              <Button variant="ghost" size="sm" icon="chevronLeft" onClick={handleBack}>
                Back
              </Button>
            ) : null}
            <span>Tendeno / Sorget NG-CDF Ingestion Funnel</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* STEP 1: LOCATIONS CARDS SIDE BY SIDE */}
        {step === 'locations' ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Select a Location to view Sub-Location breakdown
              </p>
              <span className="text-xs text-slate-300">2 Administrative Locations in Ward</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {analytics.locations.map((loc) => {
                const count = getLocationCount(loc);
                return (
                  <HierarchyMetricCard
                    key={loc.location}
                    value={count.toLocaleString()}
                    label={`${count} records in ${loc.location} Location (${mode === 'applications' ? 'Applications' : 'Registrations'})`}
                    buttonText="View Sub-Locations"
                    tone={loc.location === 'Tendeno' ? 'cyan' : 'emerald'}
                    size="lg"
                    icon="mapPin"
                    onClick={() => {
                      setSelectedLocation(loc.location);
                      setStep('subLocations');
                    }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* STEP 2: SUB-LOCATIONS CARDS (SMALLER HIERARCHY) */}
        {step === 'subLocations' && selectedLocation ? (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  {selectedLocation} Sub-Locations
                </p>
                <p className="text-xs text-slate-300">Click a sub-location to inspect its villages</p>
              </div>
              <Button variant="ghost" size="sm" icon="chevronLeft" onClick={handleBack}>
                Change Location
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {subLocationsList.map((sub, idx) => {
                const count = getSubLocationCount(sub);
                const tones: Array<'cyan' | 'emerald' | 'amber' | 'violet'> = ['cyan', 'emerald', 'amber', 'violet'];
                const tone = tones[idx % tones.length];
                return (
                  <HierarchyMetricCard
                    key={sub.subLocation}
                    value={count.toLocaleString()}
                    label={`${count} in ${sub.subLocation} Sub-Location`}
                    buttonText="Select Village"
                    tone={tone}
                    size="sm"
                    icon="layers"
                    onClick={() => {
                      setSelectedSubLocation(sub.subLocation);
                      setStep('villages');
                    }}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {/* STEP 3: VILLAGE SELECTOR */}
        {step === 'villages' && selectedLocation && selectedSubLocation ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {selectedSubLocation} · Village Selection
                </h3>
                <p className="text-xs text-slate-300">
                  Choose a village to view the detailed table of applications
                </p>
              </div>
              <Button variant="ghost" size="sm" icon="chevronLeft" onClick={handleBack}>
                Back to Sub-Locations
              </Button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="max-w-md">
                <label htmlFor="village-dropdown" className="mb-1.5 block text-xs font-semibold text-slate-300">
                  Select Village Dropdown
                </label>
                <select
                  id="village-dropdown"
                  value={selectedVillage}
                  onChange={(e) => setSelectedVillage(e.target.value)}
                  className="min-h-[42px] w-full rounded-lg border border-slate-700 bg-ink-950 px-3 text-sm text-white focus:border-accent"
                >
                  <option value="all">All Villages in {selectedSubLocation} ({currentSubLocationEntry?.total || 0} total)</option>
                  {availableVillages.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  icon="list"
                  onClick={() => setStep('table')}
                >
                  View Table for {selectedVillage === 'all' ? `All Villages in ${selectedSubLocation}` : selectedVillage}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* STEP 4: APPLICATIONS / DOCUMENTS TABLE POPUP VIEW */}
        {step === 'table' ? (
          <div className="space-y-3">
            {/* TABLE HEADER & SORTS AT THE TABLE HEAD */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/80 px-4 py-2.5">
              <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Table sort filters">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tableSort === 'all'}
                  onClick={() => {
                    setTableSort('all');
                    setPage(1);
                  }}
                  className={cx(
                    'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                    tableSort === 'all'
                      ? 'bg-accent/20 text-accent-soft ring-1 ring-accent/50'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  All ({tableRows.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tableSort === 'successful'}
                  onClick={() => {
                    setTableSort('successful');
                    setPage(1);
                  }}
                  className={cx(
                    'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                    tableSort === 'successful'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {mode === 'applications' ? 'Successful' : 'Completed'}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tableSort === 'failed'}
                  onClick={() => {
                    setTableSort('failed');
                    setPage(1);
                  }}
                  className={cx(
                    'rounded-md px-3 py-1.5 text-xs font-bold transition-all',
                    tableSort === 'failed'
                      ? 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/50'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  {mode === 'applications' ? 'Failed / Flagged' : 'Incomplete Steps'}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-56">
                  <SearchInput
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Search name, ID, serial…"
                  />
                </div>
                <Button variant="ghost" size="sm" icon="chevronLeft" onClick={handleBack}>
                  Villages
                </Button>
              </div>
            </div>

            {/* SCROLLABLE TABLE CONTAINER */}
            <div className="max-h-[50vh] overflow-auto rounded-lg border border-slate-800 bg-ink-950">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900 text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  <tr>
                    <th scope="col" className="px-3 py-2.5">Serial</th>
                    <th scope="col" className="px-3 py-2.5">Name</th>
                    <th scope="col" className="px-3 py-2.5">National ID / UPI</th>
                    <th scope="col" className="px-3 py-2.5">{mode === 'applications' ? 'School / Category' : 'Stage / Step'}</th>
                    <th scope="col" className="px-3 py-2.5">Village</th>
                    <th scope="col" className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center font-sans text-sm text-slate-400">
                        No records match the active criteria in this village.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row: any) => {
                      const isApp = mode === 'applications';
                      const isSuccess = isApp
                        ? (row.chiefStatus === 'Cleared' || row.appealStatus === 'Accepted')
                        : row.status === 'Completed';

                      return (
                        <tr key={row.id} className="transition-colors hover:bg-slate-900/60">
                          <td className="whitespace-nowrap px-3 py-2 text-cyan-300 font-bold">
                            {row.serial}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-sans font-semibold text-white">
                            {isApp ? row.fullName : row.name}
                            <span className="ml-1.5 text-[10px] text-slate-400">
                              [{isApp ? row.accountClass : (row.isParent ? 'PARENT' : 'STUDENT')}]
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                            {row.nationalId}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-sans text-slate-200">
                            {isApp ? `${row.school} · ${row.institutionCategory}` : row.currentStage}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-sans text-slate-300">
                            {row.village}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-sans">
                            <Badge tone={isSuccess ? 'emerald' : 'amber'}>
                              {isApp
                                ? (isSuccess ? 'Cleared' : (row.riskFlag || 'Flagged'))
                                : row.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION STRIP */}
            {totalPages > 1 ? (
              <div className="flex items-center justify-between px-2 text-xs text-slate-400">
                <span>
                  Showing {Math.min(tableRows.length, (page - 1) * pageSize + 1)}–
                  {Math.min(tableRows.length, page * pageSize)} of {tableRows.length} records
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="font-mono text-white">
                    {page} / {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
