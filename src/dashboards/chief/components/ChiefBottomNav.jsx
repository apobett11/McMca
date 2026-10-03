import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';
import { getChiefUpdateCounts } from '../utils/chiefData.js';

const CHIEF_TABS = [
  { label: 'Home', path: '/chief/dashboard', icon: 'home', key: 'home' },
  { label: 'Applications', path: '/chief/applications', icon: 'applications', key: 'applications' },
  { label: 'Appeals', path: '/chief/appeals', icon: 'documents', key: 'appeals' },
  { label: 'Messages', path: '/chief/messages', icon: 'bell', key: 'messages' },
  { label: 'Profile', path: '/chief/profile', icon: 'profile', key: 'profile' }
];

export function ChiefBottomNav() {
  const [counts, setCounts] = useState(() => getChiefUpdateCounts());

  useEffect(() => {
    function refreshCounts() {
      setCounts(getChiefUpdateCounts());
    }
    window.addEventListener('mcmca_chief_apps_updated', refreshCounts);
    window.addEventListener('mcmca_chief_appeals_updated', refreshCounts);
    window.addEventListener('mcmca_chief_messages_updated', refreshCounts);
    return () => {
      window.removeEventListener('mcmca_chief_apps_updated', refreshCounts);
      window.removeEventListener('mcmca_chief_appeals_updated', refreshCounts);
      window.removeEventListener('mcmca_chief_messages_updated', refreshCounts);
    };
  }, []);

  return (
    <nav className="bottom-nav" aria-label="Chief dashboard navigation">
      <div className="bottom-nav__inner bottom-nav__inner--chief">
        {CHIEF_TABS.map((tab) => {
          const hasUpdate =
            (tab.key === 'applications' && counts.applications > 0) ||
            (tab.key === 'appeals' && counts.appeals > 0) ||
            (tab.key === 'messages' && counts.messages > 0);

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/chief/dashboard'}
              className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab--active' : ''}`}
              style={{ position: 'relative' }}
            >
              <div style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon name={tab.icon} size={22} />
                {hasUpdate && (
                  <span
                    className="card-update-dot"
                    style={{ position: 'absolute', top: -2, right: -4 }}
                    title="Updates available"
                  />
                )}
              </div>
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
