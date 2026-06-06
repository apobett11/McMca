import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';

const CHIEF_TABS = [
  { label: 'Home', path: '/chief/dashboard', icon: 'home' },
  { label: 'Applications', path: '/chief/applications', icon: 'applications' },
  { label: 'Appeals', path: '/chief/appeals', icon: 'documents' },
  { label: 'Profile', path: '/chief/profile', icon: 'profile' }
];

export function ChiefBottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Chief dashboard navigation">
      <div className="bottom-nav__inner bottom-nav__inner--chief">
        {CHIEF_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/chief/dashboard'}
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
