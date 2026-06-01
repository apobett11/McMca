import React from 'react';

const paths = {
  home: 'M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z',
  applications:
    'M6 4h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 6h8M8 14h6',
  documents: 'M8 4h8l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 4h8',
  support:
    'M12 3a9 9 0 0 0-4 17.2V22l3.6-1.8A9 9 0 1 0 12 3Zm0 5v4m0 4h.01',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
  bell: 'M12 3a5 5 0 0 1 5 5v3l2 2v1H5v-1l2-2V8a5 5 0 0 1 5-5Zm-2 16h4',
  upload: 'M12 4v12m0 0-4-4m4 4 4-4M5 20h14',
  appeal: 'M6 6h12v12H6V6Zm3 3h6M9 12h6',
  calendar: 'M6 5h12v14H6V5Zm3-2v4m6-4v4M8 11h8',
  check: 'M6 12.5 9.5 16 18 8',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  chevronLeft: 'M14 6 8 12l6 6',
  chevronRight: 'M10 6l6 6-6 6',
  info: 'M12 8h.01M11 12h2v6h-2v-6Z M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  shield: 'M12 3 5 6v6c0 4.5 3 7.7 7 9 4-1.3 7-4.5 7-9V6l-7-3Z',
  logout: 'M10 6H6v12h4M14 12H8m6-4 4 4-4 4',
  plus: 'M12 6v12M6 12h12',
  funds: 'M4 8h16v8H4V8Zm4 4h8',
  draft: 'M8 6h8v12H8V6Zm2 4h4',
  review: 'M6 18 12 6l6 12H6Z',
  approved: 'M6 12.5 9.5 16 18 8',
  rejected: 'M8 8l8 8m0-8-8 8',
  submitted: 'M6 12l4 4 8-8',
  arrowRight: 'M8 12h8m0 0-4-4m4 4-4 4'
};

export function Icon({ name, size = 22, className = '', label }) {
  const d = paths[name] || paths.info;
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      <path d={d} />
    </svg>
  );
}
