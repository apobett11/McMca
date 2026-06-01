import React from 'react';
import { Icon } from './Icon.jsx';
import {
  getAccessBadgeClass,
  getDocumentBadgeClass,
  getVerificationBadgeClass
} from '../utils/badges.js';

function formatDate(iso) {
  if (!iso || iso === '—') return '—';
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function demoViewProfile(row) {
  window.alert(`Opening ${row.fullName}'s student dashboard for document tasks. Demo.`);
}

export function ParentDocumentsTable({ rows = [] }) {
  if (!rows.length) {
    return <p className="empty-state">No document records match your filters.</p>;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table data-table--parent" aria-label="Linked children documents">
        <thead>
          <tr>
            <th scope="col">Full name</th>
            <th scope="col">School</th>
            <th scope="col">Level</th>
            <th scope="col">Cycle</th>
            <th scope="col">Doc status</th>
            <th scope="col">Missing</th>
            <th scope="col">Verification</th>
            <th scope="col">Last upload</th>
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
              <td data-label="Cycle">{row.cycle}</td>
              <td data-label="Doc status">
                <span className={getDocumentBadgeClass(row.documentStatus)}>
                  {row.documentStatus}
                </span>
              </td>
              <td data-label="Missing">{row.missingDocuments}</td>
              <td data-label="Verification">
                <span className={getVerificationBadgeClass(row.verificationStatus)}>
                  {row.verificationStatus}
                </span>
              </td>
              <td data-label="Last upload">{formatDate(row.lastUploadDate)}</td>
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
