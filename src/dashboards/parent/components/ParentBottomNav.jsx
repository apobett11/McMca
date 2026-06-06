import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';

const PARENT_TABS = [
  { label: 'Home', path: '/parent/dashboard', icon: 'home' },
  { label: 'Applications', path: '/parent/applications', icon: 'applications' },
  { label: 'Documents', path: '/parent/documents', icon: 'documents' },
  { label: 'Notifications', path: '/parent/notifications', icon: 'notifications' },
  { label: 'Profile', path: '/parent/profile', icon: 'profile' }
];

export function ParentBottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Parent dashboard navigation">
      <div className="bottom-nav__inner bottom-nav__inner--parent">
        {PARENT_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/parent/dashboard'}
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
