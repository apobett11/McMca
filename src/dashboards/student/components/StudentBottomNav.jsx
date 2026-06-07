import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '../../../components/Icon.jsx';

const STUDENT_TABS = [
  { label: 'Home', path: '/student/dashboard', icon: 'home' },
  { label: 'Applications', path: '/student/applications', icon: 'applications' },
  { label: 'Documents', path: '/student/documents', icon: 'documents' },
  { label: 'Contact', path: '/student/messages', icon: 'support' },
  { label: 'Profile', path: '/student/profile', icon: 'profile' }
];

export function StudentBottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Student dashboard navigation">
      <div className="bottom-nav__inner bottom-nav__inner--student">
        {STUDENT_TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/student/dashboard'}
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
