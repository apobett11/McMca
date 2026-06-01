import React from 'react';

export function getAccessBadgeClass(accessType) {
  if (accessType === 'Full Control') return 'badge badge--access-full';
  if (accessType === 'Delegated Access') return 'badge badge--access-delegated';
  if (accessType === 'Viewer Only') return 'badge badge--access-viewer';
  return 'badge badge--neutral';
}

export function getApplicationBadgeClass(status) {
  const map = {
    Draft: 'badge badge--draft',
    Submitted: 'badge badge--submitted',
    'Under Review': 'badge badge--review',
    Approved: 'badge badge--approved',
    Rejected: 'badge badge--rejected',
    Appealed: 'badge badge--appealed',
    Disbursed: 'badge badge--disbursed',
    'Funds Sent': 'badge badge--disbursed',
    'Pending Clarification': 'badge badge--warning',
    Escalated: 'badge badge--info'
  };
  return map[status] || 'badge badge--neutral';
}

export function getAppealBadgeClass(status) {
  const map = {
    Submitted: 'badge badge--submitted',
    'Under Review': 'badge badge--review',
    'Clarification Requested': 'badge badge--warning',
    Approved: 'badge badge--approved',
    Rejected: 'badge badge--rejected'
  };
  return map[status] || 'badge badge--neutral';
}

export function getRiskFlagBadgeClass(status) {
  const map = {
    'No Issues': 'badge badge--success',
    'Duplicate Warning': 'badge badge--warning',
    'Incomplete Information': 'badge badge--warning',
    'Verification Needed': 'badge badge--info'
  };
  return map[status] || 'badge badge--neutral';
}

export function getProfileBadgeClass(status) {
  if (status === 'Complete') return 'badge badge--success';
  if (status?.includes('Missing')) return 'badge badge--warning';
  if (status === 'Pending Verification') return 'badge badge--info';
  return 'badge badge--neutral';
}

export function getDocumentBadgeClass(status) {
  if (status === 'Complete') return 'badge badge--success';
  if (status?.includes('Missing')) return 'badge badge--warning';
  if (status?.includes('Pending')) return 'badge badge--info';
  if (status?.includes('Rejected')) return 'badge badge--danger';
  return 'badge badge--neutral';
}

export function getVerificationBadgeClass(status) {
  if (status === 'Verified') return 'badge badge--success';
  if (status === 'Pending Review') return 'badge badge--info';
  if (status === 'Rejected') return 'badge badge--danger';
  return 'badge badge--neutral';
}

export function getNotificationTypeBadgeClass(type) {
  if (type.includes('New Application')) return 'badge badge--submitted';
  if (type.includes('New Appeal')) return 'badge badge--appealed';
  if (type.includes('Clarification')) return 'badge badge--warning';
  if (type.includes('Updated')) return 'badge badge--info';
  if (type.includes('System')) return 'badge badge--neutral';
  return 'badge badge--neutral';
}
