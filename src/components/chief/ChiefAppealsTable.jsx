import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../Icon.jsx';
import { getAppealBadgeClass, getDocumentBadgeClass } from '../../utils/badges.js';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ChiefAppealsTable({ rows = [] }) {
  if (!rows.length) {
    return <p className="empty-state">No appeals match your filters.</p>;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table data-table--chief" aria-label="Chief appeals review queue">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">School</th>
            <th scope="col">Level</th>
            <th scope="col">Original status</th>
            <th scope="col">Appeal status</th>
            <th scope="col">Submitted</th>
            <th scope="col">Documents</th>
            <th scope="col">Updated</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.appealStatus === 'Submitted' || row.supportingDocumentsStatus?.includes('Missing')
                  ? 'data-table__row--attention'
                  : ''
              }
            >
              <td data-label="Student">
                <strong>{row.fullName}</strong>
              </td>
              <td data-label="School">{row.school}</td>
              <td data-label="Level">{row.educationLevel}</td>
              <td data-label="Original status">
                <span className="badge badge--rejected">{row.originalApplicationStatus}</span>
              </td>
              <td data-label="Appeal status">
                <span className={getAppealBadgeClass(row.appealStatus)}>{row.appealStatus}</span>
              </td>
              <td data-label="Submitted">{formatDate(row.appealSubmissionDate)}</td>
              <td data-label="Documents">
                <span className={getDocumentBadgeClass(row.supportingDocumentsStatus)}>
                  {row.supportingDocumentsStatus}
                </span>
              </td>
              <td data-label="Updated">{formatDateTime(row.lastUpdated)}</td>
              <td data-label="Action">
                <Link className="btn btn--table" to={`/chief/appeals/${row.id}`}>
                  <Icon name="review" size={16} />
                  Review appeal
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
