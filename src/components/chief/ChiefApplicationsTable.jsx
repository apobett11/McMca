import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../Icon.jsx';
import {
  getApplicationBadgeClass,
  getDocumentBadgeClass,
  getRiskFlagBadgeClass
} from '../../utils/badges.js';

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

export function ChiefApplicationsTable({ rows = [] }) {
  if (!rows.length) {
    return <p className="empty-state">No applications match your filters.</p>;
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table data-table--chief" aria-label="Chief applications review queue">
        <thead>
          <tr>
            <th scope="col">Student</th>
            <th scope="col">School</th>
            <th scope="col">Level</th>
            <th scope="col">Grade</th>
            <th scope="col">Location</th>
            <th scope="col">Cycle</th>
            <th scope="col">Submitted</th>
            <th scope="col">App status</th>
            <th scope="col">Documents</th>
            <th scope="col">Risk flag</th>
            <th scope="col">Updated</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={
                row.riskFlagStatus !== 'No Issues' || row.applicationStatus === 'Submitted'
                  ? 'data-table__row--attention'
                  : ''
              }
            >
              <td data-label="Student">
                <strong>{row.fullName}</strong>
              </td>
              <td data-label="School">{row.school}</td>
              <td data-label="Level">{row.educationLevel}</td>
              <td data-label="Grade">{row.grade}</td>
              <td data-label="Location">
                {row.location} / {row.subLocation}
              </td>
              <td data-label="Cycle">{row.cycle}</td>
              <td data-label="Submitted">{formatDate(row.submittedDate)}</td>
              <td data-label="App status">
                <span className={getApplicationBadgeClass(row.applicationStatus)}>
                  {row.applicationStatus}
                </span>
              </td>
              <td data-label="Documents">
                <span className={getDocumentBadgeClass(row.documentStatus)}>{row.documentStatus}</span>
              </td>
              <td data-label="Risk flag">
                <span className={getRiskFlagBadgeClass(row.riskFlagStatus)}>{row.riskFlagStatus}</span>
              </td>
              <td data-label="Updated">{formatDateTime(row.lastUpdated)}</td>
              <td data-label="Action">
                <Link className="btn btn--table" to={`/chief/applications/${row.id}`}>
                  <Icon name="review" size={16} />
                  Review
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
