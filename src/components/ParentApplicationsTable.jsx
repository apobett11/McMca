import React from 'react';
import { Icon } from './Icon.jsx';
import {
  getAccessBadgeClass,
  getApplicationBadgeClass
} from '../utils/badges.js';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function demoViewProfile(row) {
  window.alert(
    `Switching to ${row.fullName}'s student dashboard (read-only where access limits apply). Demo.`
  );
}

export function ParentApplicationsTable({ rows = [] }) {
  if (!rows.length) {
    return <p className="empty-state">No applications match your filters.</p>;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table data-table--parent" aria-label="Linked children applications">
        <thead>
          <tr>
            <th scope="col">Full name</th>
            <th scope="col">School</th>
            <th scope="col">Level</th>
            <th scope="col">Grade</th>
            <th scope="col">Cycle</th>
            <th scope="col">Submitted</th>
            <th scope="col">Status</th>
            <th scope="col">Requested</th>
            <th scope="col">Allocated</th>
            <th scope="col">Updated</th>
            <th scope="col">Access</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className={row.requiresAttention ? 'data-table__row--attention' : ''}>
              <td data-label="Full name">
                <strong>{row.fullName}</strong>
              </td>
              <td data-label="School">{row.school}</td>
              <td data-label="Level">{row.educationLevel}</td>
              <td data-label="Grade">{row.grade}</td>
              <td data-label="Cycle">{row.cycle}</td>
              <td data-label="Submitted">{formatDate(row.submittedDate)}</td>
              <td data-label="Status">
                <span className={getApplicationBadgeClass(row.applicationStatus)}>
                  {row.applicationStatus}
                </span>
              </td>
              <td data-label="Requested">{row.amountRequested}</td>
              <td data-label="Allocated">{row.amountAllocated}</td>
              <td data-label="Updated">{formatDate(row.lastUpdated)}</td>
              <td data-label="Access">
                <span className={getAccessBadgeClass(row.accessType)}>{row.accessType}</span>
              </td>
              <td data-label="Action">
                <button
                  type="button"
                  className="btn btn--table"
                  onClick={() => demoViewProfile(row)}
                >
                  <Icon name="arrowRight" size={16} />
                  View profile
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
