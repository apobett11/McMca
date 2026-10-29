import { useId } from 'react';
import type { FlaggedUpload } from '../types/schema.ts';

/**
 * Deterministic vector rendering of an uploaded document.
 * Blur follows the recorded blur %, the stamp fades with stamp confidence.
 * Used as the thumbnail and as the raw viewport source when the file bytes
 * (previewUrl) are not available client-side.
 */
export function DocumentArt({ upload, detailed = true }: { upload: FlaggedUpload; detailed?: boolean }) {
  const id = useId().replace(/:/g, '');
  const blur = (upload.blurPct / 100) * 2.6;
  const stampOpacity = Math.max(0.08, upload.stampConfidence / 100);
  const isId = /birth|id/i.test(upload.documentType);
  return (
    <svg viewBox="0 0 400 520" role="img" aria-label={`${upload.documentType} preview for ${upload.applicantName}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id={`b-${id}`}>
          <feGaussianBlur stdDeviation={blur} />
        </filter>
      </defs>
      <rect width="400" height="520" fill="#f8fafc" />
      <rect x="0" y="0" width="400" height="64" fill="#1e3a8a" />
      <text x="200" y="28" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="serif">
        REPUBLIC OF KENYA
      </text>
      <text x="200" y="48" textAnchor="middle" fontSize="12" fill="#bfdbfe" fontFamily="serif">
        {isId ? 'CERTIFICATE OF BIRTH' : upload.documentType.toUpperCase()}
      </text>
      <g filter={`url(#b-${id})`} fontFamily="monospace" fill="#0f172a">
        <text x="28" y="108" fontSize="11" fill="#475569">
          FULL NAME
        </text>
        <text x="28" y="130" fontSize="18" fontWeight="700">
          {upload.applicantName.toUpperCase()}
        </text>
        <text x="28" y="168" fontSize="11" fill="#475569">
          {isId ? 'ENTRY / SERIAL NO.' : 'ADMISSION / ID NO.'}
        </text>
        <text x="28" y="190" fontSize="18" fontWeight="700">
          {upload.nationalId}
        </text>
        <text x="28" y="228" fontSize="11" fill="#475569">
          {isId ? 'DATE OF BIRTH' : 'TERM 3 BALANCE'}
        </text>
        <text x="28" y="250" fontSize="16">
          {isId ? '2009-03-14' : 'KES ******'}
        </text>
        {detailed
          ? Array.from({ length: 9 }).map((_, i) => (
              <rect key={i} x="28" y={290 + i * 18} width={i % 3 === 2 ? 200 : 344} height="6" rx="3" fill="#cbd5e1" />
            ))
          : null}
      </g>
      <g opacity={stampOpacity} transform="rotate(-14 300 440)">
        <circle cx="300" cy="440" r="48" fill="none" stroke="#1d4ed8" strokeWidth="3" />
        <circle cx="300" cy="440" r="38" fill="none" stroke="#1d4ed8" strokeWidth="1.5" />
        <text x="300" y="437" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1d4ed8">
          OFFICIAL
        </text>
        <text x="300" y="451" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1d4ed8">
          STAMP
        </text>
      </g>
      <line x1="28" y1="478" x2="170" y2="478" stroke="#64748b" />
      <text x="28" y="494" fontSize="10" fill="#475569" fontFamily="sans-serif">
        Authorised signature
      </text>
    </svg>
  );
}
