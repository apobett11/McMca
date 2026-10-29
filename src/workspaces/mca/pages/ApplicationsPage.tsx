import { McaAnalyticsHub } from '../components/McaAnalyticsHub.tsx';

/**
 * MCA Applications Analytics Hub (/mca/applications)
 * Strict Pure Analytics Shift:
 * - ZERO row-by-row transaction tables or queue approvals.
 * - Displays Comparative Sub-Location Matrix, Interactive Demographics, Anomaly Audit sub-view,
 *   and Pinned Download Verified Master Roster export engine.
 */
export function ApplicationsPage() {
  return <McaAnalyticsHub />;
}
