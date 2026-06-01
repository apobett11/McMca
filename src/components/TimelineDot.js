const STATE = {
  completed: { label: '✓', bg: 'rgba(22,163,74,0.12)', border: 'rgba(22,163,74,0.45)', color: '#0f7a32' },
  current: { label: '●', bg: 'rgba(245,158,11,0.14)', border: 'rgba(245,158,11,0.55)', color: '#9a5b06' },
  upcoming: { label: '○', bg: '#fff', border: 'rgba(100,116,139,0.45)', color: '#475569' },
};

export function StatusDot({ label, state }) {
  const s = STATE[state] || STATE.upcoming;
  return `
    <div class="timelineItem">
      <div class="dot" style="background:${s.bg}; border-color:${s.border}; color:${s.color}" aria-hidden="true">${s.label}</div>
      <div>
        <b>${label}</b>
        <p>${state === 'completed' ? 'Completed' : state === 'current' ? 'Happening now' : 'Next step'}</p>
      </div>
    </div>
  `;
}

