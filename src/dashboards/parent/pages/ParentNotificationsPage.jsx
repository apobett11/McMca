import React from 'react';
import { Link } from 'react-router-dom';
import { ParentLayout } from '../components/ParentLayout.jsx';
import { Icon } from '../../../components/Icon.jsx';

export function ParentNotificationsPage() {
  return (
    <ParentLayout pageTitle="Notifications" layout="dashboard">
      <Link className="back-link" to="/parent/dashboard">
        <Icon name="chevronLeft" size={18} />
        Back to home
      </Link>

      <div className="stitch-docs-header">
        <h1 className="stitch-docs-header__title">Notifications</h1>
        <p className="stitch-docs-header__sub">
          Alerts about your children, their documents, and application deadlines will collect here.
        </p>
      </div>

      <div className="notice">
        <strong>No notifications</strong>
        <p>You have no alerts right now. Updates appear after a child is linked and an application moves forward.</p>
      </div>
    </ParentLayout>
  );
}
