import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { cx, kes, num, pct } from '../../lib/format.ts';
import { useDataTick } from '../../lib/hooks.ts';
import { TrendChart, DonutChart, type Slice } from '../../ui/charts.tsx';
import { Icon } from '../../ui/icons.tsx';
import { Badge, Card, PageHeader, Ring, Segmented, StackedBar } from '../../ui/primitives.tsx';
import { CYCLE, MCA_EVENTS, equity, getAwards, getTranche, loadAwardRows, velocity, vetting } from '../store.ts';
import * as mca from '../../../dashboards/mca/utils/mcaData.js';

const VILLAGE_COLORS = mca.VILLAGE_COLORS as Record<string, string>;
const LEVEL_COLORS: Record<string, string> = { Secondary: '#34d399', TVET: '#fbbf24', University: '#a78bfa', Primary: '#22d3ee' };

export function DashboardPage() {
  const tick = useDataTick(MCA_EVENTS);
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const [eqMode, setEqMode] = useState<'sub' | 'level'>('sub');

  const t = useMemo(() => getTranche(), [tick]);
  const rows = useMemo(() => loadAwardRows(), [tick]);
  const vel = useMemo(() => velocity(), [tick]);
  const vet = useMemo(() => vetting(), [tick]);
  const awardsSum = useMemo(() => Object.values(getAwards()).reduce((a, r) => a + r.amount, 0), [tick]);

  const remaining = t.total_amount - t.committed_amount;
  const committedPct = (t.committed_amount / t.total_amount) * 100;
  const remainingPct = 100 - committedPct;
  const remTone = remainingPct <= 10 ? 'red' : remainingPct <= 25 ? 'amber' : 'emerald';
  const remText = { red: 'text-red-300', amber: 'text-amber-300', emerald: 'text-emerald-300' }[remTone];
  const prior = Math.max(0, t.committed_amount - awardsSum);

  const eq = useMemo(() => equity(rows, eqMode), [rows, eqMode]);
  const slices: Slice[] = eq.map((e) => ({ key: e.key, label: e.key, value: e.amount, color: (eqMode === 'sub' ? VILLAGE_COLORS[e.key] : LEVEL_COLORS[e.key]) ?? '#94a3b8', warn: eqMode === 'sub' && e.share < t.min_sublocation_share_pct }));
  const low = eq.filter((e) => eqMode === 'sub' && e.share < t.min_sublocation_share_pct);

  return (
    <>
      <PageHeader eyebrow={`Cycle ${CYCLE}`} title="Executive Command Center" description="Geopolitical equity, budget tracking and tranche liquidity governance." />

      {/* Tranche banner */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-amber-300/20">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Total ward pool</p>
          <p className="mt-2 break-words font-mono text-2xl font-bold tabular-nums text-white">{kes(t.total_amount)}</p>
          <p className="mt-2 text-xs text-slate-200">
            Cycle <span className="font-mono">{CYCLE}</span> · Hard cap <span className="font-mono tabular-nums">{kes(t.hard_cap_amount)}</span>
          </p>
          <p className="mt-1 text-xs text-slate-200">
            Hardship reserve <span className="font-mono tabular-nums text-violet-300">{kes(t.reserve_amount - t.reserve_committed)}</span> available
          </p>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Committed to date</p>
          <p className="mt-2 break-words font-mono text-2xl font-bold tabular-nums text-amber-200">{kes(t.committed_amount)}</p>
          <div className="mt-3">
            <StackedBar
              total={t.total_amount}
              label={`${committedPct.toFixed(1)} percent of the pool is committed`}
              parts={[
                { label: 'Prior sittings', value: prior, tone: 'gold' },
                { label: 'This session', value: awardsSum, tone: 'emerald' }
              ]}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-amber-400" /> Prior {pct((prior / t.total_amount) * 100)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-400" /> Committee {pct((awardsSum / t.total_amount) * 100)}
            </span>
            <strong className="font-mono tabular-nums text-white">{pct(committedPct)} consumed</strong>
          </div>
        </Card>

        <Card className={cx(remTone === 'red' && 'border-red-400/50', remTone === 'amber' && 'border-amber-400/40')}>
          <p className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-200">
            Remaining unallocated pool
            {remTone !== 'emerald' ? (
              <Badge tone={remTone} pulse>
                {remTone === 'red' ? 'Critical' : 'Low'}
              </Badge>
            ) : null}
          </p>
          <p className={cx('mt-2 break-words font-mono text-2xl font-bold tabular-nums', remText)}>{kes(remaining)}</p>
          <p className="mt-2 text-xs text-slate-200">
            <span className="font-mono tabular-nums">{pct(remainingPct)}</span> of pool left · warns at <span className="font-mono">{100 - t.warn_threshold_pct}%</span> remaining, critical at <span className="font-mono">10%</span>
          </p>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-200">Vetting throughput</p>
              <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-white">
                {num(vet.cleared)} / {num(vet.total)}
              </p>
              <p className="mt-1 text-xs text-slate-200">Applications cleared by Chiefs</p>
            </div>
            <Ring value={vet.pct} size={64} tone="emerald" label="Chief vetting throughput">
              <span className="font-mono text-xs font-bold tabular-nums text-white">{vet.pct.toFixed(0)}%</span>
            </Ring>
          </div>
        </Card>
      </div>

      {/* Analytics */}
      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,6fr)_minmax(0,4fr)]">
        <Card
          title="Application intake velocity"
          subtitle="Submissions vs. approvals vs. appeals by month"
          actions={
            <Segmented
              label="Chart type"
              value={chartMode}
              onChange={setChartMode}
              options={[
                { key: 'line', label: 'Line' },
                { key: 'bar', label: 'Bar' }
              ]}
            />
          }
        >
          <TrendChart
            mode={chartMode}
            labels={vel.months}
            ariaLabel="Monthly submissions, approvals and appeals"
            series={[
              { key: 's', label: 'Submissions', color: '#38bdf8', values: vel.submissions },
              { key: 'a', label: 'Approvals', color: '#34d399', values: vel.approvals },
              { key: 'p', label: 'Appeals', color: '#fbbf24', values: vel.appeals }
            ]}
          />
        </Card>

        <Card
          title="Equity parity"
          subtitle="Share of committed + proposed awards"
          actions={
            <Segmented
              label="Breakdown"
              value={eqMode}
              onChange={setEqMode}
              options={[
                { key: 'sub', label: 'Sub-location' },
                { key: 'level', label: 'Education level' }
              ]}
            />
          }
        >
          <div className="flex flex-wrap items-center gap-5">
            <DonutChart
              slices={slices}
              size={180}
              ariaLabel={`Award share by ${eqMode === 'sub' ? 'sub-location' : 'education level'}`}
              center={
                <>
                  <span className="font-mono text-lg font-bold tabular-nums text-white">{eq.length}</span>
                  <span className="text-[11px] text-slate-200">{eqMode === 'sub' ? 'sub-locations' : 'levels'}</span>
                </>
              }
            />
            <ul className="min-w-[200px] flex-1 space-y-1.5">
              {eq.map((e, i) => (
                <li key={e.key} className="flex items-center gap-2 text-sm">
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: slices[i].color }} />
                  <span className="min-w-0 flex-1 truncate text-slate-50">{e.key}</span>
                  {slices[i].warn ? <Icon name="alert" size={14} className="text-amber-300" aria-label="Below equity threshold" /> : null}
                  <span className={cx('font-mono font-bold tabular-nums', slices[i].warn ? 'text-amber-300' : 'text-white')}>{e.share.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </div>
          {low.length ? (
            <div role="alert" className="mt-4 rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-100">
              <strong className="font-bold">Equity warning:</strong> {low.map((l) => `${l.key} (${l.share.toFixed(1)}%)`).join(', ')} {low.length > 1 ? 'fall' : 'falls'} below the {t.min_sublocation_share_pct}% minimum share.{' '}
              <Link to="/mca/applications" className="font-semibold underline">
                Rebalance in Allocation Suite
              </Link>
            </div>
          ) : eqMode === 'sub' ? (
            <p className="mt-4 text-sm text-emerald-300">All sub-locations are above the {t.min_sublocation_share_pct}% minimum share.</p>
          ) : null}
        </Card>
      </div>
    </>
  );
}
