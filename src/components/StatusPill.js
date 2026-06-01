const STATUS_META = {
  Draft: { color: 'gray', icon: '📝' },
  Submitted: { color: 'blue', icon: '📨' },
  'Under Review': { color: 'orange', icon: '🔎' },
  'Chief Approved': { color: 'green', icon: '✅' },
  'MCA Review': { color: 'orange', icon: '🏛️' },
  Approved: { color: 'green', icon: '🎉' },
  Rejected: { color: 'red', icon: '⛔' },
  'Funds Sent': { color: 'green', icon: '💸' },
};

const colorToVar = {
  green: '--green',
  orange: '--orange',
  red: '--red',
  blue: '--blue',
  gray: '--gray',
};

export function StatusPill({ status }) {
  const meta = STATUS_META[status] || { color: 'gray', icon: 'ℹ️' };
  const cssVar = colorToVar[meta.color] || '--gray';

  return document.createRange().createContextualFragment(`
    <div class="statusPill" role="status" aria-label="Application status: ${status}">
      <div class="badgeIcon" style="background: var(${cssVar})" aria-hidden="true">${meta.icon}</div>
      <div>
        <b>${status}</b>
        <div><span>Current application stage</span></div>
      </div>
    </div>
  `);
}

