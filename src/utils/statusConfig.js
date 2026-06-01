/** Status labels, colors, icons — never color-only (always paired with text). */
export const STATUS_CONFIG = {
  Draft: {
    label: 'Draft',
    hint: 'Not yet submitted',
    tone: 'neutral',
    icon: 'draft'
  },
  Submitted: {
    label: 'Submitted',
    hint: 'Received by the ward office',
    tone: 'info',
    icon: 'submitted'
  },
  'Under Review': {
    label: 'Under review',
    hint: 'Your application is being checked',
    tone: 'pending',
    icon: 'review'
  },
  'Chief Approved': {
    label: 'Chief approved',
    hint: 'Approved by your area chief',
    tone: 'success',
    icon: 'approved'
  },
  'MCA Review': {
    label: 'MCA review',
    hint: 'With the MCA office committee',
    tone: 'pending',
    icon: 'review'
  },
  Approved: {
    label: 'Approved',
    hint: 'Your bursary has been approved',
    tone: 'success',
    icon: 'approved'
  },
  Rejected: {
    label: 'Not approved',
    hint: 'You may appeal if you disagree',
    tone: 'rejected',
    icon: 'rejected'
  },
  'Funds Sent': {
    label: 'Funds sent',
    hint: 'Disbursement completed',
    tone: 'success',
    icon: 'funds'
  },
  Disbursed: {
    label: 'Disbursed',
    hint: 'Funds have been allocated',
    tone: 'success',
    icon: 'funds'
  },
  Appealed: {
    label: 'Appealed',
    hint: 'Under appeal review',
    tone: 'info',
    icon: 'appeal'
  }
};

export function getStatusConfig(status) {
  return (
    STATUS_CONFIG[status] || {
      label: status,
      hint: 'Status update',
      tone: 'neutral',
      icon: 'info'
    }
  );
}
