import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../../ui/icons.tsx';
import { cx } from '../../lib/format.ts';

interface ActionItem {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: IconName;
  badge?: number;
}

export function FloatingActionBar({ onRefresh, onSearch }: { onRefresh?: () => void; onSearch?: () => void }) {
  const actions: ActionItem[] = [
    { to: '/helpdesk/dashboard', label: 'Dashboard Overview', icon: 'home' },
    { to: '/helpdesk/applications', label: 'Applications Registry', icon: 'users' },
    { to: '/helpdesk/documents', label: 'Document Stages', icon: 'fileCheck' },
    { to: '/helpdesk/messages', label: 'Messages Desk', icon: 'message' },
    { to: '/helpdesk/profile', label: 'Officer Profile', icon: 'pen' }
  ];

  return (
    <div
      role="toolbar"
      aria-label="Help Desk quick actions"
      className="ws-noprint fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-[5px] border border-slate-700/80 bg-ink-900/90 px-3 py-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-200"
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {actions.map((act) => {
          if (act.to) {
            return (
              <NavLink
                key={act.to}
                to={act.to}
                title={act.label}
                aria-label={act.label}
                className={({ isActive }) =>
                  cx(
                    'group relative flex h-9 w-9 items-center justify-center rounded-[5px] transition-all duration-150',
                    isActive
                      ? 'border border-cyan-400/50 bg-cyan-500/20 text-cyan-300 shadow-sm'
                      : 'border border-transparent text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 hover:text-white'
                  )
                }
              >
                <Icon name={act.icon} size={17} />
              </NavLink>
            );
          }
          return null;
        })}

        <span className="mx-1 h-5 w-px bg-slate-700/80" />

        {onSearch ? (
          <button
            type="button"
            onClick={onSearch}
            title="Quick Search applicants, ID, serial"
            aria-label="Quick Search"
            className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-transparent text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-800/80 hover:text-white"
          >
            <Icon name="search" size={16} />
          </button>
        ) : null}

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh Data & Sync"
            aria-label="Refresh Data & Sync"
            className="flex h-9 w-9 items-center justify-center rounded-[5px] border border-transparent text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-800/80 hover:text-white"
          >
            <Icon name="refresh" size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
