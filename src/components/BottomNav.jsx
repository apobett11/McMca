import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from './Icon.jsx';

const PARENT_TABS = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' },
  { label: 'Applications', path: '/applications', icon: 'applications' },
  { label: 'Documents', path: '/documents', icon: 'documents' },
  { label: 'Notifications', path: '/notifications', icon: 'bell' },
  { label: 'Profile', path: '/profile', icon: 'profile' }
];

const CHIEF_TABS = [
  { label: 'Home', path: '/chief/dashboard', icon: 'home' },
  { label: 'Applications', path: '/chief/applications', icon: 'applications' },
  { label: 'Appeals', path: '/chief/appeals', icon: 'appeal' },
  { label: 'Profile', path: '/chief/profile', icon: 'profile' }
];

const STUDENT_TABS = [
  { label: 'Home', path: '/student/dashboard', icon: 'home' },
  { label: 'Applications', path: '/student/applications', icon: 'applications' },
  { label: 'Documents', path: '/student/documents', icon: 'documents' },
  { label: 'Support', path: '/student/support', icon: 'support' },
  { label: 'Profile', path: '/student/profile', icon: 'profile' }
];

export function BottomNav({ variant = 'parent', homePath, profilePath }) {
  const tabs =
    variant === 'chief'
      ? CHIEF_TABS.map((tab) => {
          if (tab.path.endsWith('/dashboard') && homePath) {
            return { ...tab, path: homePath };
          }
          if (tab.path.endsWith('/profile') && profilePath) {
            return { ...tab, path: profilePath };
          }
          return tab;
        })
      : variant === 'student'
        ? STUDENT_TABS.map((tab) => {
            if (tab.path.endsWith('/dashboard') && homePath) {
              return { ...tab, path: homePath };
            }
            if (tab.path.endsWith('/profile') && profilePath) {
              return { ...tab, path: profilePath };
            }
            return tab;
          })
        : PARENT_TABS;

  const innerClass =
    variant === 'chief'
      ? 'bottom-nav__inner bottom-nav__inner--chief'
      : variant === 'student'
        ? 'bottom-nav__inner bottom-nav__inner--student'
        : 'bottom-nav__inner bottom-nav__inner--parent';
  const label =
    variant === 'chief'
      ? 'Chief dashboard navigation'
      : variant === 'student'
        ? 'Student dashboard navigation'
        : 'Parent dashboard navigation';

  return (
    <nav className="bottom-nav" aria-label={label}>
      <div className={innerClass}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === homePath || tab.path === '/dashboard'}
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
