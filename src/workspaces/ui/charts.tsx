import { useState } from 'react';
import { cx } from '../lib/format.ts';

export interface Series {
  key: string;
  label: string;
  color: string;
  values: number[];
}

/** Line / grouped-bar chart. Pure SVG, keyboard-inspectable, data table fallback for screen readers. */
export function TrendChart({
  labels,
  series,
  mode,
  height = 240,
  ariaLabel
}: {
  labels: string[];
  series: Series[];
  mode: 'line' | 'bar';
  height?: number;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { l: 36, r: 12, t: 12, b: 28 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const niceMax = Math.ceil(max / 5) * 5 || 5;
  const n = labels.length;
  const step = n > 1 ? iw / (n - 1) : iw;
  const bandW = iw / n;
  const x = (i: number) => (mode === 'line' ? pad.l + i * step : pad.l + bandW * i + bandW / 2);
  const y = (v: number) => pad.t + ih - (v / niceMax) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(niceMax * t));

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={ariaLabel} onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#1e293b" strokeDasharray={t === 0 ? undefined : '3 4'} />
            <text x={pad.l - 6} y={y(t) + 4} textAnchor="end" className="fill-slate-300 font-mono" fontSize="10">
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l} x={x(i)} y={H - 8} textAnchor="middle" className="fill-slate-300" fontSize="10.5">
            {l}
          </text>
        ))}

        {mode === 'line'
          ? series.map((s) => {
              const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
              const area = `${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;
              return (
                <g key={s.key}>
                  <path d={area} fill={s.color} opacity="0.07" />
                  <path d={d} fill="none" stroke={s.color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
                  {s.values.map((v, i) => (
                    <circle key={i} cx={x(i)} cy={y(v)} r={hover === i ? 5 : 3} fill="#0b1329" stroke={s.color} strokeWidth="2" />
                  ))}
                </g>
              );
            })
          : labels.map((_, i) => {
              const bw = Math.min(16, (bandW - 8) / series.length);
              return series.map((s, si) => {
                const bx = x(i) - (bw * series.length) / 2 + si * bw;
                const h = ih - (y(s.values[i]) - pad.t);
                return <rect key={`${i}-${s.key}`} x={bx + 1} y={y(s.values[i])} width={bw - 2} height={Math.max(0, h)} rx="2" fill={s.color} opacity={hover === null || hover === i ? 1 : 0.45} />;
              });
            })}

        {labels.map((_, i) => (
          <rect key={i} x={pad.l + bandW * i} y={pad.t} width={bandW} height={ih} fill="transparent" onMouseEnter={() => setHover(i)} onFocus={() => setHover(i)} />
        ))}
        {hover !== null ? <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} stroke="#64748b" strokeDasharray="3 3" /> : null}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <ul className="flex flex-wrap gap-4">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-slate-100">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
            </li>
          ))}
        </ul>
        <p className={cx('font-mono tabular-nums text-slate-100', hover === null && 'opacity-0')} aria-live="polite">
          {hover !== null ? `${labels[hover]} — ${series.map((s) => `${s.label}: ${s.values[hover]}`).join(' · ')}` : '.'}
        </p>
      </div>

      <table className="sr-only">
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            <th>Period</th>
            {series.map((s) => (
              <th key={s.key}>{s.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {labels.map((l, i) => (
            <tr key={l}>
              <td>{l}</td>
              {series.map((s) => (
                <td key={s.key}>{s.values[i]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
  warn?: boolean;
}

export function DonutChart({ slices, size = 170, center, ariaLabel }: { slices: Slice[]; size?: number; center?: React.ReactNode; ariaLabel: string }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const r = size / 2 - 14;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={ariaLabel}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="22" />
        {slices.map((s) => {
          const len = (s.value / total) * c;
          const el = (
            <circle
              key={s.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth="22"
              strokeDasharray={`${Math.max(0, len - 2)} ${c - Math.max(0, len - 2)}`}
              strokeDashoffset={-acc}
            />
          );
          acc += len;
          return el;
        })}
      </svg>
      {center ? <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div> : null}
    </div>
  );
}
