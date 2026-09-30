import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';

export const MCA_TABS = [
  { label: 'Overview', path: '/mca/dashboard', icon: 'chart' },
  { label: 'Applications', path: '/mca/applications', icon: 'applications' },
  { label: 'Profile', path: '/mca/profile', icon: 'profile' }
];

export function MCABottomNav() {
  return (
    <nav className="bottom-nav" aria-label="MCA dashboard navigation">
      <div className="bottom-nav__inner bottom-nav__inner--mca">
        {MCA_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/mca/dashboard'}
            className={({ isActive }) => `nav-tab ${isActive ? 'nav-tab--active' : ''}`}
          >
            <Icon name={tab.icon} size={22} />
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
