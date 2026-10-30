import { useEffect, useState } from 'react';
import { PageHeader, Badge, Button, SearchInput } from '../../ui/primitives.tsx';
import { Icon } from '../../ui/icons.tsx';
import { HierarchyMetricCard } from '../components/HierarchyMetricCard.tsx';
import { LocationDrilldownModal, type DrilldownMetricType } from '../components/LocationDrilldownModal.tsx';
import { fetchHelpDeskAnalytics, getCachedAnalytics, type HelpDeskAnalyticsSummary } from '../services/helpDeskService.ts';

export function ApplicationsPage() {
  const [analytics, setAnalytics] = useState<HelpDeskAnalyticsSummary>(getCachedAnalytics());
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<DrilldownMetricType>('total');

  useEffect(() => {
    fetchHelpDeskAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  const openDrilldown = (metric: DrilldownMetricType) => {
    setSelectedMetric(metric);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-cyan-400">
              <Icon name="users" size={18} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Applications Registry
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">
            Tendeno / Sorget Ward bursary ingestion funnels, geographic breakdowns & village allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="cyan" dot>
            Bursary Cycle 2026/2027
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            icon="mapPin"
            onClick={() => openDrilldown('total')}
          >
            Explore Ward Locations
          </Button>
        </div>
      </div>

      {/* SUMMARY HIERARCHY CARDS (NO CARD TITLE, JUST NUMBER + WHAT IT REPRESENTS + ACTION BUTTON) */}
      <section aria-label="Applications key metrics" className="space-y-3">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* TOTAL APPLICATIONS (PRIMARY - LARGE) */}
          <HierarchyMetricCard
            value={analytics.totalApplications.toLocaleString()}
            label={`${analytics.totalApplications.toLocaleString()} applications submitted across ward`}
            buttonText="View Location Distribution"
            tone="cyan"
            size="lg"
            icon="users"
            onClick={() => openDrilldown('total')}
          />

          {/* SUCCESSFUL APPLICATIONS (MEDIUM - EMERALD) */}
          <HierarchyMetricCard
            value={analytics.successfulApplications.toLocaleString()}
            label={`${analytics.successfulApplications.toLocaleString()} successful applications cleared & approved`}
            buttonText="Inspect Cleared by Location"
            tone="emerald"
            size="md"
            icon="check"
            onClick={() => openDrilldown('successful')}
          />

          {/* FLAGGED APPLICATIONS (MEDIUM - AMBER) */}
          <HierarchyMetricCard
            value={analytics.flaggedApplications.toLocaleString()}
            label={`${analytics.flaggedApplications.toLocaleString()} flagged applications requiring review or appeal`}
            buttonText="Inspect Flagged by Location"
            tone="amber"
            size="md"
            icon="alertTriangle"
            onClick={() => openDrilldown('flagged')}
          />
        </div>
      </section>

      {/* DETAILED DRILLDOWN MODAL */}
      <LocationDrilldownModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="applications"
        metricType={selectedMetric}
        analytics={analytics}
      />
    </div>
  );
}
