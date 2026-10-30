import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button } from '../../ui/primitives.tsx';
import { Icon } from '../../ui/icons.tsx';
import { HierarchyMetricCard } from '../components/HierarchyMetricCard.tsx';
import { fetchHelpDeskAnalytics, getCachedAnalytics, type HelpDeskAnalyticsSummary } from '../services/helpDeskService.ts';
import { officer } from '../data.ts';

export function DashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<HelpDeskAnalyticsSummary>(getCachedAnalytics());
  const off = useMemo(() => officer(), []);

  useEffect(() => {
    fetchHelpDeskAnalytics().then(setAnalytics).catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* HOMEPAGE HERO STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/40 text-cyan-400 shadow-md">
              <Icon name="shield" size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Help Desk Operations Overview
              </h1>
              <p className="text-xs text-slate-300 sm:text-sm">
                Tendeno / Sorget Ward NG-CDF Bursary Administration · Operations Terminal
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge tone="cyan" dot pulse>
            Live Terminal
          </Badge>
          <div className="rounded-lg border border-slate-700/80 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-300">
            Officer on duty: <span className="font-semibold text-white">{off.name}</span>
          </div>
        </div>
      </div>

      {/* OVERVIEW CARDS WITH STRICT HIERARCHY (NO CARD TITLE, JUST NUMBER + WHAT IT REPRESENTS + ACTION BUTTON) */}
      <section aria-label="Module overview cards" className="space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Operations & Pages Overview
          </h2>
          <p className="text-xs text-slate-300">
            Click any card to reveal and navigate to its dedicated workspace page.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* APPLICATIONS PAGE OVERVIEW CARD */}
          <HierarchyMetricCard
            value={analytics.totalApplications.toLocaleString()}
            label={`${analytics.totalApplications.toLocaleString()} applications submitted in ward · ${analytics.successfulApplications.toLocaleString()} successful & ${analytics.flaggedApplications.toLocaleString()} flagged`}
            buttonText="Open Applications Page"
            tone="cyan"
            size="lg"
            icon="users"
            onClick={() => navigate('/helpdesk/applications')}
          />

          {/* DOCUMENTS PAGE OVERVIEW CARD */}
          <HierarchyMetricCard
            value={analytics.incompleteStudentRegistrations.toLocaleString()}
            label={`${analytics.incompleteStudentRegistrations.toLocaleString()} incomplete student registrations hanging · ${analytics.incompleteParentRegistrations.toLocaleString()} incomplete parents & ${analytics.completedRegistrations.toLocaleString()} completed sets`}
            buttonText="Open Document Stages"
            tone="amber"
            size="lg"
            icon="fileCheck"
            onClick={() => navigate('/helpdesk/documents')}
          />

          {/* MESSAGES PAGE OVERVIEW CARD */}
          <HierarchyMetricCard
            value={analytics.openMessages.toLocaleString()}
            label={`${analytics.openMessages.toLocaleString()} open tickets & resident inquiries pending response or escalation`}
            buttonText="Open Messages Desk"
            tone="emerald"
            size="md"
            icon="message"
            onClick={() => navigate('/helpdesk/messages')}
          />

          {/* PROFILE PAGE OVERVIEW CARD */}
          <HierarchyMetricCard
            value="1"
            label="Active officer session · Day Shift (08:00 - 17:00) · Tendeno/Sorget assigned jurisdiction"
            buttonText="View Officer Profile"
            tone="violet"
            size="md"
            icon="pen"
            onClick={() => navigate('/helpdesk/profile')}
          />
        </div>
      </section>

      {/* QUICK WORKSPACE DIRECT JUMP SECTION */}
      <section aria-label="Direct module access" className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Quick Direct Navigation
        </h2>
        <p className="mt-0.5 text-xs text-slate-300">
          Instant jump to specific operational sections
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            icon="users"
            onClick={() => navigate('/helpdesk/applications')}
          >
            Applications Page
          </Button>
          <Button
            variant="secondary"
            icon="fileCheck"
            onClick={() => navigate('/helpdesk/documents')}
          >
            Documents Page
          </Button>
          <Button
            variant="secondary"
            icon="message"
            onClick={() => navigate('/helpdesk/messages')}
          >
            Messages Desk
          </Button>
          <Button
            variant="secondary"
            icon="pen"
            onClick={() => navigate('/helpdesk/profile')}
          >
            Profile & Settings
          </Button>
        </div>
      </section>
    </div>
  );
}
