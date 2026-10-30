import { useEffect, useState } from 'react';
import { Badge, Button } from '../../ui/primitives.tsx';
import { Icon } from '../../ui/icons.tsx';
import { HierarchyMetricCard } from '../components/HierarchyMetricCard.tsx';
import { LocationDrilldownModal, type DrilldownMetricType } from '../components/LocationDrilldownModal.tsx';
import { fetchHelpDeskAnalytics, getCachedAnalytics, type HelpDeskAnalyticsSummary } from '../services/helpDeskService.ts';

export function DocumentsPage() {
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
              <Icon name="fileCheck" size={18} />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Document Stages & Registration Progress
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-300 sm:text-sm">
            Live database verification of incomplete student registrations (all types: independent, delegated, custody) and incomplete parents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge tone="emerald" dot>
            Database Synced
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

      {/* SUMMARY HIERARCHY CARDS IN THE WARD (ALL REGISTRATIONS) */}
      <section aria-label="Document pipeline stages" className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* TOTAL REGISTRATIONS IN WARD (SIZE LG) */}
          <HierarchyMetricCard
            value={analytics.totalRegistrations.toLocaleString()}
            label={`${analytics.totalRegistrations.toLocaleString()} total registrations across ward`}
            buttonText="View Location Distribution"
            tone="cyan"
            size="lg"
            icon="layers"
            onClick={() => openDrilldown('total')}
          />

          {/* COMPLETED STEPS / VERIFIED DOCS (SIZE MD) */}
          <HierarchyMetricCard
            value={analytics.completedRegistrations.toLocaleString()}
            label={`${analytics.completedRegistrations.toLocaleString()} completed document sets fully verified`}
            buttonText="Inspect Completed by Location"
            tone="emerald"
            size="md"
            icon="check"
            onClick={() => openDrilldown('completed')}
          />

          {/* INCOMPLETE STUDENTS REGISTRATION (SIZE MD) */}
          <HierarchyMetricCard
            value={analytics.incompleteStudentRegistrations.toLocaleString()}
            label={`${analytics.incompleteStudentRegistrations.toLocaleString()} incomplete student registrations hanging in pipeline`}
            buttonText="Inspect Students by Location"
            tone="amber"
            size="md"
            icon="alertTriangle"
            onClick={() => openDrilldown('incomplete_students')}
          />

          {/* INCOMPLETE PARENTS REGISTRATION (SIZE MD) */}
          <HierarchyMetricCard
            value={analytics.incompleteParentRegistrations.toLocaleString()}
            label={`${analytics.incompleteParentRegistrations.toLocaleString()} incomplete parent registrations pending verification`}
            buttonText="Inspect Parents by Location"
            tone="violet"
            size="md"
            icon="users"
            onClick={() => openDrilldown('incomplete_parents')}
          />
        </div>
      </section>

      {/* LOCATION DRILLDOWN MODAL */}
      <LocationDrilldownModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode="documents"
        metricType={selectedMetric}
        analytics={analytics}
      />
    </div>
  );
}
