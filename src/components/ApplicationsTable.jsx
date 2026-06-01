import React from 'react';
import { getStatusConfig } from '../utils/statusConfig.js';

function formatDateTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function ApplicationsTable({ applications = [] }) {
  const sorted = [...applications].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  return (
    <div className="data-table-wrap">
      <table className="data-table" aria-label="Your applications">
        <thead>
          <tr>
            <th scope="col">Date &amp; time</th>
            <th scope="col">Cycle</th>
            <th scope="col">Student</th>
            <th scope="col">Institution</th>
            <th scope="col">Status</th>
            <th scope="col">Amount</th>
            <th scope="col">Tracking</th>
            <th scope="col">Decision</th>
            <th scope="col">Disbursed</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((app) => {
            const status = getStatusConfig(app.status);
            return (
              <tr key={app.id}>
                <td data-label="Date & time">{formatDateTime(app.submittedAt)}</td>
                <td data-label="Cycle">{app.cycle}</td>
                <td data-label="Student">{app.studentName}</td>
                <td data-label="Institution">{app.institution}</td>
                <td data-label="Status">
                  <span className={`data-table__status data-table__status--${status.tone}`}>
                    {app.status}
                  </span>
                </td>
                <td data-label="Amount">{app.amount}</td>
                <td data-label="Tracking">{app.trackingCode}</td>
                <td data-label="Decision">{app.decision}</td>
                <td data-label="Disbursed">{app.disbursed}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
