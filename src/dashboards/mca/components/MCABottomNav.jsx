import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';

const MCA_TABS = [
  { label: 'Home', path: '/mca/dashboard', icon: 'home' },
  { label: 'Applications', path: '/mca/applications', icon: 'applications' },
  { label: 'Issues', path: '/mca/issues', icon: 'calendar' },
  { label: 'Messages', path: '/mca/messages', icon: 'bell' },
  { label: 'Profile', path: '/mca/profile', icon: 'profile' }
];

export function MCABottomNav() {
  return (
    <nav className="mca-bottom-nav" aria-label="MCA Mobile Navigation">
      {MCA_TABS.map((tab) => (
        <NavLink
          key={tab.path}
          to={tab.path}
          end={tab.path === '/mca/dashboard'}
          className={({ isActive }) =>
            `mca-bottom-nav__link ${isActive ? 'mca-bottom-nav__link--active' : ''}`
          }
        >
          <Icon name={tab.icon} size={20} />
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
