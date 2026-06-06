import React from 'react';
import { NavLink } from 'react-router-dom';

const FOOTER_LINKS = [
  { label: 'Privacy Policy', to: '/parent/dashboard' },
  { label: 'Terms', to: '/parent/dashboard' }
];

const VERSION = '1.0.0';

export function ParentFooter() {
  return (
    <footer className="site-footer" role="contentinfo">
      <div className="site-footer__inner">
        <nav className="site-footer__links" aria-label="Footer links">
          {FOOTER_LINKS.map((link) => (
            <NavLink key={link.label} to={link.to} className="site-footer__link">
              {link.label}
            </NavLink>
          ))}
        </nav>
        <p className="site-footer__version">Version {VERSION}</p>
      </div>
    </footer>
  );
}
