import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../styles/workspace.css';
import { useAuth } from '../../context/AuthContext.jsx';
import { useDebounced, useHotkeys } from '../lib/hooks.ts';
import { cx, fmtDateTime } from '../lib/format.ts';
import { ToastProvider } from '../lib/toast.tsx';
import type { AlertItem, SearchHit, Tone } from '../types/schema.ts';
import { Drawer } from '../ui/overlays.tsx';
import { Icon, type IconName } from '../ui/icons.tsx';
import { Avatar, Badge, IconButton, Kbd } from '../ui/primitives.tsx';

export interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  count?: number;
  countTone?: 'red' | 'amber' | 'accent';
  end?: boolean;
}
export interface NavGroup {
  title: string;
  items: NavItem[];
}
export interface ShortcutAction {
  label: string;
  icon: IconName;
  to?: string;
  onClick?: () => void;
}

export interface ShellConfig {
  workspace: 'helpdesk' | 'mca';
  brand: { title: string; division: string; seal: IconName };
  groups: NavGroup[];
  /** Pinned telemetry card at the foot of the sidebar */
  footer: ReactNode;
  /** Centre of the command strip */
  banner: ReactNode;
  shortcuts: ShortcutAction[];
  user: { name: string; role: string };
  search: (q: string) => SearchHit[];
  alerts: AlertItem[];
  switchTargets: { label: string; to: string; icon: IconName }[];
}

const countTone: Record<NonNullable<NavItem['countTone']>, string> = {
  red: 'bg-red-400 text-ink-950',
  amber: 'bg-amber-400 text-ink-950',
  accent: 'bg-accent text-ink-950'
};

function SidebarContent({ config, onNavigate }: { config: ShellConfig; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-slate-800/80 px-4 py-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/50 bg-accent/10 text-accent-soft">
          <Icon name={config.brand.seal} size={24} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-accent-soft">NG-CDF · Ward Seal</p>
          <p className="truncate text-sm font-bold text-white">{config.brand.division}</p>
          <p className="truncate text-xs text-slate-300">{config.brand.title}</p>
        </div>
      </div>

      <nav aria-label={`${config.brand.title} navigation`} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {config.groups.map((g) => (
          <div key={g.title}>
            <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">{g.title}</p>
            <ul className="space-y-0.5">
              {g.items.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to}
                    end={it.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cx(
                        'group flex min-h-[40px] items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors',
                        isActive ? 'bg-accent/15 text-accent-soft ring-1 ring-inset ring-accent/40' : 'text-slate-100 hover:bg-slate-800/70'
                      )
                    }
                  >
                    <Icon name={it.icon} size={18} />
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.count ? (
                      <span
                        aria-label={`${it.count} pending`}
                        className={cx('min-w-[22px] rounded-full px-1.5 py-0.5 text-center font-mono text-[11px] font-bold tabular-nums', countTone[it.countTone ?? 'accent'])}
                      >
                        {it.count}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800/80 p-3">{config.footer}</div>
    </div>
  );
}

function OmniSearch({ config }: { config: ShellConfig }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const dq = useDebounced(q, 180);

  const hits = useMemo<SearchHit[]>(() => {
    const term = dq.trim();
    if (!term) return [];
    const pages: SearchHit[] = config.groups
      .flatMap((g) => g.items)
      .filter((i) => i.label.toLowerCase().includes(term.toLowerCase()))
      .map((i) => ({ id: `nav-${i.to}`, title: i.label, subtitle: 'Go to page', kind: 'Page', to: i.to }));
    return [...config.search(term).slice(0, 8), ...pages].slice(0, 10);
  }, [dq, config]);

  useHotkeys([
    {
      combo: 'ctrl+/',
      allowInInput: true,
      handler: (e) => {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    },
    {
      combo: 'mod+/',
      allowInInput: true,
      handler: (e) => {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    },
    {
      combo: 'ctrl+i',
      allowInInput: true,
      handler: (e) => {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setOpen(true);
      }
    }
  ]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    setActive(0);
  }, [dq]);

  const go = (h: SearchHit) => {
    setOpen(false);
    setQ('');
    inputRef.current?.blur();
    navigate(h.to);
  };

  return (
    <div ref={boxRef} className="relative w-full max-w-[300px] min-w-[140px] 2xl:max-w-md">
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls="ws-omni-list"
        aria-activedescendant={hits[active] ? `omni-${hits[active].id}` : undefined}
        aria-label="Universal search (Ctrl + /)"
        placeholder="Search applicants, ID, serial, pages…"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((a) => Math.min(hits.length - 1, a + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive((a) => Math.max(0, a - 1));
          } else if (e.key === 'Enter' && hits[active]) {
            e.preventDefault();
            go(hits[active]);
          } else if (e.key === 'Escape') {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        className="min-h-[40px] w-full rounded-lg border border-slate-700 bg-ink-950/70 pl-9 pr-24 text-sm text-slate-50 hover:border-slate-500 focus-visible:border-accent"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-1 sm:flex">
        <Kbd>Ctrl</Kbd>
        <Kbd>/</Kbd>
      </span>
      {open && q.trim() ? (
        <ul
          id="ws-omni-list"
          role="listbox"
          aria-label="Search results"
          className="absolute left-0 right-0 top-[46px] z-40 max-h-[60vh] animate-ws-pop overflow-auto rounded-xl border border-slate-700 bg-ink-900 p-1.5 shadow-2xl"
        >
          {dq !== q ? <li className="px-3 py-2 text-sm text-slate-300">Searching…</li> : null}
          {dq === q && hits.length === 0 ? <li className="px-3 py-3 text-sm text-slate-200">No matches for “{dq}”.</li> : null}
          {hits.map((h, i) => (
            <li key={h.id} id={`omni-${h.id}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                data-testid="omni-search-hit"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(h)}
                className={cx('flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left', i === active ? 'bg-accent/15' : 'hover:bg-slate-800/60')}
              >
                <Badge tone="neutral">[{h.kind.toUpperCase()}]</Badge>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">{h.title}</span>
                  <span className="block truncate font-mono text-xs text-slate-300">{h.subtitle}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const alertBadge: Record<string, Tone> = { red: 'red', amber: 'amber', emerald: 'emerald', neutral: 'neutral', accent: 'accent', cyan: 'cyan', violet: 'violet', gold: 'gold' };

function UserMenu({ config }: { config: ShellConfig }) {
  const navigate = useNavigate();
  const { signOut } = useAuth() as { signOut?: () => Promise<void> };
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Session menu for ${config.user.name}`}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 py-1 pl-1 pr-2.5 hover:border-slate-500"
      >
        <Avatar name={config.user.name} size={30} />
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-[150px] truncate text-sm font-semibold text-white">{config.user.name}</span>
          <span className="block text-[11px] text-slate-300">{config.user.role}</span>
        </span>
        <Icon name="chevronDown" size={14} />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 top-[46px] z-40 w-64 animate-ws-pop rounded-xl border border-slate-700 bg-ink-900 p-1.5 shadow-2xl">
          {config.switchTargets && config.switchTargets.length > 0 ? (
            <>
              <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-300">Switch session</p>
              {config.switchTargets.map((t) => (
                <button
                  key={t.to}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    navigate(t.to);
                  }}
                  className="flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-slate-100 hover:bg-slate-800/70"
                >
                  <Icon name={t.icon} size={16} />
                  {t.label}
                </button>
              ))}
              <div className="my-1.5 border-t border-slate-800" />
            </>
          ) : null}
          <button
            role="menuitem"
            type="button"
            onClick={async () => {
              try {
                await signOut?.();
              } finally {
                navigate('/login');
              }
            }}
            className="flex min-h-[40px] w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function WorkspaceShell({ config, children }: { config: ShellConfig; children: ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth() as { signOut?: () => Promise<void> };
  const [mobileNav, setMobileNav] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const critical = config.alerts.filter((a) => a.tone === 'red').length;

  return (
    <ToastProvider>
      <div className={cx('ws min-h-screen bg-ink-950 text-slate-100', config.workspace === 'helpdesk' ? 'ws-helpdesk' : 'ws-mca')}>
        <a
          href="#ws-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>

        {/* Left sidebar – 260px (helpdesk) / 280px (mca) fixed */}
        <aside className={cx('ws-noprint fixed inset-y-0 left-0 z-30 hidden border-r border-slate-800/80 bg-ink-900 lg:block', config.workspace === 'mca' ? 'w-[280px]' : 'w-[260px]')}>
          <SidebarContent config={config} />
        </aside>

        {mobileNav ? (
          <div className="ws-noprint fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink-950/80" onClick={() => setMobileNav(false)} aria-hidden="true" />
            <aside className={cx('absolute inset-y-0 left-0 animate-ws-slide-in border-r border-slate-800 bg-ink-900', config.workspace === 'mca' ? 'w-[280px]' : 'w-[260px]')} style={{ animationDirection: 'normal' }}>
              <SidebarContent config={config} onNavigate={() => setMobileNav(false)} />
            </aside>
          </div>
        ) : null}

        {/* Top command strip – sticky 64px */}
        <header className={cx('ws-noprint sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-800/80 bg-ink-950/85 px-4 backdrop-blur-xl lg:px-6', config.workspace === 'mca' ? 'lg:ml-[280px]' : 'lg:ml-[260px]')}>
          <IconButton label="Open navigation" icon="menu" className="lg:hidden" onClick={() => setMobileNav(true)} />
          
          {config.workspace === 'helpdesk' ? (
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/40 bg-accent/10 text-accent-soft shadow-inner">
                <Icon name={config.brand.seal} size={18} />
              </span>
              <div className="hidden sm:block leading-tight min-w-0">
                <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-accent-soft">{config.brand.division}</span>
                <span className="block truncate text-sm font-bold text-white">{config.brand.title}</span>
              </div>
            </div>
          ) : null}

          <OmniSearch config={config} />
          <div className="mx-auto hidden min-w-0 whitespace-nowrap xl:block">{config.banner}</div>
          <div className="ml-auto flex items-center gap-1.5">
            {config.shortcuts.map((s) => (
              <IconButton key={s.label} label={s.label} icon={s.icon} variant="secondary" className="hidden sm:inline-flex" onClick={() => (s.to ? navigate(s.to) : s.onClick?.())} />
            ))}
            <IconButton label={`Critical alerts${critical ? `, ${critical} critical` : ''}`} icon="bell" variant="secondary" badge={config.alerts.length} onClick={() => setAlertsOpen(true)} />
            
            {/* Direct Logout Button */}
            <button
              type="button"
              onClick={async () => {
                try {
                  await signOut?.();
                } finally {
                  navigate('/login');
                }
              }}
              title="Sign out of Help Desk"
              aria-label="Sign out of Help Desk"
              className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:border-red-500/50 hover:bg-red-500/20"
            >
              <Icon name="logout" size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>

            <UserMenu config={config} />
          </div>
        </header>

        <main id="ws-main" tabIndex={-1} className={cx('px-4 pb-32 pt-5 lg:px-6', config.workspace === 'mca' ? 'lg:ml-[280px]' : 'lg:ml-[260px]')}>
          <div className="mx-auto w-full max-w-[1640px]">{children}</div>
        </main>

        <Drawer open={alertsOpen} onClose={() => setAlertsOpen(false)} title="Critical alerts" subtitle={`${config.alerts.length} active · ordered by severity`} width={560}>
          <ul className="divide-y divide-slate-800/60">
            {config.alerts.length === 0 ? <li className="px-5 py-10 text-center text-sm text-slate-200">All clear. No active alerts.</li> : null}
            {config.alerts.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => {
                    setAlertsOpen(false);
                    if (a.to) navigate(a.to);
                  }}
                  className="flex min-h-[64px] w-full items-start gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-800/40"
                >
                  <Badge tone={alertBadge[a.tone] ?? 'neutral'} dot pulse={a.tone === 'red'}>
                    {a.tone === 'red' ? 'Critical' : a.tone === 'amber' ? 'Warning' : 'Info'}
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{a.title}</span>
                    <span className="mt-0.5 block text-sm text-slate-200">{a.body}</span>
                    <span className="mt-1 block font-mono text-xs text-slate-300">{fmtDateTime(a.at)}</span>
                  </span>
                  {a.to ? <Icon name="chevronRight" size={16} className="mt-1 text-slate-300" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </Drawer>
      </div>
    </ToastProvider>
  );
}
