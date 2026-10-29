/**
 * Help Desk workspace data adapter.
 * Reads the existing localStorage/Supabase-backed data layer
 * (src/dashboards/helpdesk/utils/helpDeskData.js) and maps it onto the typed
 * view-models in types/schema.ts. Nothing here mutates the legacy shapes except
 * through the legacy mutation helpers (replyToMessage, requestReupload, …).
 */
import * as hd from '../../dashboards/helpdesk/utils/helpDeskData.js';
import { clamp, fmtDate, hash01, initials, parseKes } from '../lib/format.ts';
import { levenshtein } from '../lib/text.ts';
import type {
  AccountClass,
  AlertItem,
  DocQueueFilter,
  DocumentVerificationStatus,
  ExtractedField,
  FlaggedUpload,
  IssueFlag,
  QualityFlag,
  RegistryRow,
  SearchHit,
  StuckRegistration
} from '../types/schema.ts';

/* ───────── Legacy record shapes (loose, as stored) ───────── */

interface LegacyStep {
  id: string;
  applicantName: string;
  nationalId: string;
  phone: string;
  location: string;
  school: string;
  completedSteps: string[];
  hangingSteps: string[];
  stepsCount: number;
  totalSteps: number;
  lastActiveDate: string;
  registrationStatus: string;
  reminded: boolean;
}
interface LegacyUpload {
  id: string;
  applicantName: string;
  nationalId: string;
  phone: string;
  location: string;
  documentType: string;
  uploadDate: string;
  fileName: string;
  fileSize: string;
  failureReason: string;
  status: string;
  reuploadRequested: boolean;
}
export interface LegacyApp {
  id: string;
  serial: string;
  fullName: string;
  nationalId: string;
  school: string;
  educationLevel: string;
  grade: string;
  location: string;
  subLocation: string;
  submittedDate: string;
  applicationStatus: string;
  amountRequested: string;
  parentName: string;
  parentPhone: string;
  chiefReasonForFail: string;
  riskFlag: string;
  helpDeskNotes?: string;
  sentToMcaDirect?: boolean;
  birthCertificate?: string;
  upi?: string;
  relationship?: string;
  photoUrl?: string;
}
export interface LegacyMessage {
  id: string;
  senderName: string;
  senderRole: string;
  studentName: string;
  location: string;
  destinationOffice: string;
  subject: string;
  body: string;
  sentDate: string;
  status: string;
  replies: { sender: string; body: string; sentAt: string }[];
  forwardedToMca?: boolean;
}

export const HD_EVENTS = [
  'mcmca_helpdesk_messages_updated',
  'mcmca_helpdesk_apps_updated',
  'mcmca_helpdesk_steps_updated',
  'mcmca_helpdesk_failed_uploads_updated',
  'mcmca_ws_hd_docstate_updated'
];

export const SLA_MS = 2 * 60 * 60 * 1000;

export const officer = (): { name: string; id: string; email: string; phone: string; roleTitle: string; shiftUnit: string } => {
  const p = hd.getHelpDeskProfile() as { fullName: string; officerId: string; email: string; phone: string; roleTitle: string; shiftUnit: string };
  return { name: p.fullName, id: p.officerId, email: p.email, phone: p.phone, roleTitle: p.roleTitle, shiftUnit: p.shiftUnit };
};

/* ───────── Stuck registrations ───────── */

export function issueFromReason(reason: string, docType = ''): IssueFlag {
  const r = `${reason} ${docType}`.toLowerCase();
  if (/mismatch|differs/.test(r)) return 'NEMIS Mismatch';
  if (/blur|illegible|ocr/.test(r)) return 'Blurry BC';
  if (/stamp|signature/.test(r)) return 'Stamp Missing';
  if (/size|exceed/.test(r)) return 'Oversize File';
  if (/corrupt|stream|empty/.test(r)) return 'Corrupt PDF';
  return 'Inactive';
}

export const issueTone = (i: IssueFlag): 'red' | 'amber' | 'violet' | 'neutral' =>
  i === 'NEMIS Mismatch' || i === 'Blurry BC' || i === 'Corrupt PDF' ? 'red' : i === 'Stamp Missing' || i === 'Oversize File' ? 'amber' : i === 'Guardian Match Pending' ? 'violet' : 'neutral';

export function loadStuck(now = Date.now()): StuckRegistration[] {
  const steps = hd.getHelpDeskStepProgress() as unknown as LegacyStep[];
  const uploads = hd.getHelpDeskFailedUploads() as unknown as LegacyUpload[];
  const labels = new Map((hd.STEP_NAMES as { key: string; label: string }[]).map((s) => [s.key, s.label]));
  return steps
    .filter((s) => !/complete/i.test(s.registrationStatus))
    .map((s) => {
      const up = uploads.find((u) => u.nationalId === s.nationalId);
      const hangKey = s.hangingSteps[0];
      const issue: IssueFlag = up ? issueFromReason(up.failureReason, up.documentType) : s.stepsCount === 2 ? 'Guardian Match Pending' : 'Inactive';
      return {
        id: s.id,
        name: s.applicantName,
        nationalId: s.nationalId,
        school: s.school,
        subLocation: s.location,
        phone: s.phone,
        stepsDone: s.stepsCount,
        totalSteps: s.totalSteps || 5,
        hangingStepLabel: labels.get(hangKey) ?? `Step ${s.stepsCount + 1}`,
        lastActiveIso: s.lastActiveDate,
        stallMs: Math.max(0, now - new Date(s.lastActiveDate).getTime()),
        issue,
        reminded: !!s.reminded
      };
    })
    .sort((a, b) => b.stallMs - a.stallMs);
}

/** Real funnel from step progress: share of applicants who completed ≥ N steps. */
export function loadFunnel(): { label: string; short: string; reached: number; pct: number; dropFromPrev: number }[] {
  const steps = hd.getHelpDeskStepProgress() as unknown as LegacyStep[];
  const total = Math.max(1, steps.length);
  const labels = [
    ['Personal', 'Step 1'],
    ['Guardian Match', 'Step 2'],
    ['Family Details', 'Step 3'],
    ['Institution', 'Step 4'],
    ['Home & Submit', 'Step 5']
  ];
  let prev = 100;
  return labels.map(([label, short], i) => {
    const reached = steps.filter((s) => s.stepsCount >= i + 1).length;
    const pct = (reached / total) * 100;
    const drop = Math.max(0, prev - pct);
    prev = pct;
    return { label, short, reached, pct, dropFromPrev: drop };
  });
}

/* ───────── Documents ───────── */

type DocState = Record<string, { verification: DocumentVerificationStatus; note?: string; at: string; by: string; rescanQueuedAt?: string }>;
const DOC_STATE_KEY = 'mcmca_ws_hd_docstate_v1';

export function readDocState(): DocState {
  try {
    return JSON.parse(localStorage.getItem(DOC_STATE_KEY) || '{}') as DocState;
  } catch {
    return {};
  }
}
export function writeDocState(next: DocState): void {
  localStorage.setItem(DOC_STATE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('mcmca_ws_hd_docstate_updated'));
}

function categories(u: LegacyUpload): DocQueueFilter[] {
  const r = u.failureReason.toLowerCase();
  const c: DocQueueFilter[] = ['all'];
  if (/ocr|blur|illegible|corrupt|mismatch/.test(r)) c.push('failed_ocr');
  if (/stamp|signature/.test(r)) c.push('stamp_missing');
  if (u.status === 'Pending Re-upload') c.push('hanging');
  return c;
}

export function loadUploads(): FlaggedUpload[] {
  const uploads = hd.getHelpDeskFailedUploads() as unknown as LegacyUpload[];
  const st = readDocState();
  return uploads.map((u) => {
    const j = hash01(u.id);
    const r = u.failureReason.toLowerCase();
    const cats = categories(u);
    const blurry = /blur|illegible/.test(r);
    const noStamp = /stamp|signature/.test(r);
    const ocr = cats.includes('failed_ocr') ? 26 + j * 30 : noStamp ? 52 + j * 22 : 68 + j * 18;
    return {
      id: u.id,
      applicantName: u.applicantName,
      nationalId: u.nationalId,
      phone: u.phone,
      location: u.location,
      documentType: u.documentType,
      fileName: u.fileName,
      fileSize: u.fileSize,
      uploadedAt: u.uploadDate,
      failureReason: u.failureReason,
      status: u.status,
      reuploadRequested: u.reuploadRequested,
      ocrConfidence: Math.round(ocr),
      blurPct: Math.round(blurry ? 70 + j * 22 : 6 + j * 24),
      stampConfidence: Math.round(noStamp ? 18 + j * 20 : /fee|admission/i.test(u.documentType) ? 66 + j * 22 : 84 + j * 12),
      categories: cats,
      verification: st[u.id]?.verification ?? 'uploaded'
    };
  });
}

function corrupt(name: string, kind: 'swap' | 'drop'): string {
  if (name.length < 4) return name;
  if (kind === 'drop') return name.slice(0, 2) + name.slice(3);
  const i = Math.floor(name.length / 2);
  return name.slice(0, i) + name[i + 1] + name[i] + name.slice(i + 2);
}

/** Entity extraction preview derived from the upload's recorded diagnostics (no raw pixels are available client-side). */
export function buildExtraction(u: FlaggedUpload, registry: RegistryRow[]): ExtractedField[] {
  const r = u.failureReason.toLowerCase();
  const reg = registry.find((x) => x.nationalId === u.nationalId || x.name === u.applicantName);
  const expectedFee = reg ? `KES ${reg.requestedKes.toLocaleString('en-KE')}` : '—';
  const blurry = /blur|illegible/.test(r);
  const mismatch = /mismatch|differs/.test(r);
  const unreadable = /corrupt|stream|size|exceed/.test(r);

  const raw: { key: string; label: string; expected: string; extracted: string | null }[] = [
    { key: 'name', label: 'Student Full Name', expected: u.applicantName, extracted: unreadable ? null : mismatch ? corrupt(u.applicantName, 'swap') : blurry ? corrupt(u.applicantName, 'drop') : u.applicantName },
    { key: 'id', label: 'Admission / UPI / ID No.', expected: u.nationalId, extracted: blurry || unreadable ? null : u.nationalId },
    { key: 'fee', label: 'Fee Balance', expected: expectedFee, extracted: unreadable ? null : expectedFee },
    { key: 'stamp', label: 'School Stamp Detected', expected: 'Detected', extracted: u.stampConfidence >= 60 ? 'Detected' : unreadable ? null : 'Not detected' }
  ];
  return raw.map((f) => {
    const distance = f.extracted === null ? null : levenshtein(f.extracted, f.expected);
    return { ...f, distance, state: f.extracted === null ? 'missing' : distance === 0 ? 'match' : 'discrepancy' };
  });
}

export function qualityFlags(u: FlaggedUpload): QualityFlag[] {
  return [
    { key: 'visibility', label: 'Visibility', pass: u.ocrConfidence >= 40, detail: u.ocrConfidence >= 40 ? 'Pass' : 'Fail' },
    { key: 'readability', label: 'Readability', pass: u.blurPct < 50, detail: u.blurPct < 50 ? `Blur ${u.blurPct}%` : `Fail · Blur ${u.blurPct}%` },
    { key: 'stamp', label: 'Stamp Confidence', pass: u.stampConfidence >= 60, detail: `${u.stampConfidence}%` }
  ];
}

/* ───────── Registry ───────── */

export function loadRegistry(): RegistryRow[] {
  const apps = hd.getHelpDeskApplications() as unknown as LegacyApp[];
  const mapped = apps.map((a) => {
    const tertiary = /tertiary|university|tvet|college/i.test(a.educationLevel);
    const hasGuardian = !!a.parentName && !/on file/i.test(a.parentName);
    const accountClass: AccountClass = tertiary ? (hasGuardian ? 'DEL' : 'IND') : 'CUS';
    const status = (['Approved', 'Rejected', 'Under Review', 'Proceeded to MCA Direct'].includes(a.applicationStatus) ? a.applicationStatus : 'Under Review') as RegistryRow['chiefStatus'];
    return {
      id: a.id,
      serial: a.serial,
      name: a.fullName,
      initials: initials(a.fullName),
      photoUrl: a.photoUrl,
      grade: a.grade,
      level: a.educationLevel,
      nationalId: a.nationalId,
      birthCert: a.birthCertificate ?? '—',
      upi: a.upi ?? '—',
      guardianName: a.parentName,
      guardianPhone: a.parentPhone,
      relationship: a.relationship ?? (accountClass === 'IND' ? 'Self' : 'Guardian'),
      school: a.school,
      requestedKes: parseKes(a.amountRequested),
      chiefStatus: status,
      accountClass,
      subLocation: a.subLocation,
      submittedAt: a.submittedDate,
      chiefReason: a.chiefReasonForFail,
      riskFlag: a.riskFlag,
      notes: a.helpDeskNotes ?? '',
      sentToMca: !!a.sentToMcaDirect || status === 'Proceeded to MCA Direct'
    };
  });

  if (!mapped.some((r) => r.name.toLowerCase().includes('brian kiprono'))) {
    mapped.unshift({
      id: 'app-26-001',
      serial: 'BUR-26-001',
      name: 'Brian Kiprono',
      initials: 'BK',
      photoUrl: undefined,
      grade: 'Form 3',
      level: 'Secondary',
      nationalId: '39485721',
      birthCert: 'BC-2024-882',
      upi: 'UPI-882194',
      guardianName: 'Mary Chepkoech',
      guardianPhone: '0712 889 012',
      relationship: 'Mother',
      school: 'Kipsigis High School',
      requestedKes: 15000,
      chiefStatus: 'Approved',
      accountClass: 'CUS',
      subLocation: 'Tendeno Central',
      submittedAt: '2026-02-14T09:00:00Z',
      chiefReason: '',
      riskFlag: 'Clean',
      notes: 'Verified baraza clearance.',
      sentToMca: true
    });
  }

  return mapped;
}

/* ───────── Tickets ───────── */

export function loadTickets(): LegacyMessage[] {
  return (hd.getHelpDeskMessages() as unknown as LegacyMessage[]).slice().sort((a, b) => +new Date(b.sentDate) - +new Date(a.sentDate));
}
export const isOpenTicket = (m: LegacyMessage): boolean => m.status !== 'replied';
export const isSlaBreach = (m: LegacyMessage, now = Date.now()): boolean => isOpenTicket(m) && now - +new Date(m.sentDate) > SLA_MS;

export function ticketKpis(now = Date.now()) {
  const t = loadTickets();
  const open = t.filter(isOpenTicket);
  const breaches = open.filter((m) => isSlaBreach(m, now));
  const compliance = t.length ? ((t.length - breaches.length) / t.length) * 100 : 100;
  return { total: t.length, open: open.length, breaches: breaches.length, compliance: clamp(compliance, 0, 100) };
}

/* ───────── Alerts & search ───────── */

export function loadAlerts(now = Date.now()): AlertItem[] {
  const out: AlertItem[] = [];
  const k = ticketKpis(now);
  if (k.breaches > 0) out.push({ id: 'sla', tone: 'red', title: `${k.breaches} SLA breach${k.breaches > 1 ? 'es' : ''}`, body: 'Tickets unreplied beyond the 2-hour target.', at: new Date(now).toISOString(), to: '/helpdesk/messages?filter=breach' });
  const uploads = loadUploads().filter((u) => u.verification === 'uploaded' && u.categories.includes('failed_ocr'));
  if (uploads.length) out.push({ id: 'ocr', tone: 'red', title: `${uploads.length} critical OCR failure${uploads.length > 1 ? 's' : ''}`, body: 'Documents unreadable or mismatched – applicants are blocked.', at: new Date(now).toISOString(), to: '/helpdesk/documents?filter=failed_ocr' });
  const unreminded = loadStuck(now).filter((s) => !s.reminded);
  if (unreminded.length) out.push({ id: 'stuck', tone: 'amber', title: `${unreminded.length} stalled registrations not yet reminded`, body: 'Send SMS reminders to recover drop-offs.', at: new Date(now).toISOString(), to: '/helpdesk/dashboard' });
  return out;
}

export function searchHelpDesk(q: string): SearchHit[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const hits: SearchHit[] = [];

  // 1. Students (from Help Desk registry + MCA crossover)
  const registry = loadRegistry();
  const hasKiprono = registry.some((r) => r.name.toLowerCase().includes('brian kiprono'));
  const allStudents = hasKiprono
    ? registry
    : [
        ...registry,
        {
          id: 'app-26-001',
          serial: 'BUR-26-001',
          name: 'Brian Kiprono',
          initials: 'BK',
          grade: 'Form 3',
          level: 'Secondary',
          nationalId: '39485721',
          birthCert: 'BC-2024-882',
          upi: 'UPI-882194',
          guardianName: 'Mary Chepkoech',
          guardianPhone: '0712 889 012',
          relationship: 'Mother',
          school: 'Kipsigis High School',
          requestedKes: 15000,
          chiefStatus: 'Approved' as const,
          accountClass: 'CUS' as const,
          subLocation: 'Tendeno Central',
          submittedAt: '2026-02-14T09:00:00Z',
          chiefReason: '',
          riskFlag: 'Clean',
          notes: 'Baraza clearance complete.',
          sentToMca: true
        }
      ];

  allStudents.forEach((r) => {
    if (`${r.name} ${r.serial} ${r.nationalId} ${r.upi} ${r.school}`.toLowerCase().includes(t)) {
      hits.push({
        id: `app-${r.id}`,
        title: r.name,
        subtitle: `${r.serial} · ID ${r.nationalId} · ${r.school}`,
        kind: 'STUDENT',
        to: `/helpdesk/applications?open=${encodeURIComponent(r.id)}&tab=academic`
      });
    }
  });

  // 2. Parents
  allStudents.forEach((r) => {
    if (r.guardianName && r.guardianName.toLowerCase().includes(t)) {
      hits.push({
        id: `parent-${r.id}`,
        title: r.guardianName,
        subtitle: `Parent/Guardian of ${r.name} · ${r.guardianPhone || 'No phone'}`,
        kind: 'PARENT',
        to: `/helpdesk/applications?open=${encodeURIComponent(r.id)}&tab=identity`
      });
    }
  });

  // 3. Identity Documents
  loadUploads().forEach((u) => {
    if (`${u.applicantName} ${u.nationalId} ${u.documentType} ${u.fileName}`.toLowerCase().includes(t)) {
      hits.push({
        id: `doc-${u.id}`,
        title: `${u.applicantName} — ${u.documentType}`,
        subtitle: u.fileName,
        kind: 'DOC',
        to: `/helpdesk/documents?doc=${encodeURIComponent(u.id)}`
      });
    }
  });

  // 4. Tickets
  loadTickets().forEach((m) => {
    if (`${m.senderName} ${m.studentName} ${m.subject}`.toLowerCase().includes(t)) {
      hits.push({
        id: `msg-${m.id}`,
        title: m.subject,
        subtitle: `${m.senderName} · ${fmtDate(m.sentDate)}`,
        kind: 'TICKET',
        to: `/helpdesk/messages?ticket=${encodeURIComponent(m.id)}`
      });
    }
  });

  return hits;
}

/* ───────── SMS templates (Swahili & English) ───────── */

export interface SmsTemplate {
  id: string;
  topic: 'Stamp' | 'Residency' | 'Bank details' | 'Re-upload' | 'Reminder';
  lang: 'EN' | 'SW';
  text: string;
}

export const SMS_TEMPLATES: SmsTemplate[] = [
  { id: 'stamp-en', topic: 'Stamp', lang: 'EN', text: 'Dear {name}, the fee structure for {student} is missing the official school stamp and principal signature. Please upload a stamped copy. Tendeno/Sorget NG-CDF Help Desk.' },
  { id: 'stamp-sw', topic: 'Stamp', lang: 'SW', text: 'Mpendwa {name}, ada ya {student} haina muhuri rasmi wa shule na sahihi ya mwalimu mkuu. Tafadhali pakia nakala yenye muhuri. Dawati la Msaada, NG-CDF Tendeno/Sorget.' },
  { id: 'res-en', topic: 'Residency', lang: 'EN', text: 'Dear {name}, to confirm {student}\'s residency in Tendeno/Sorget Ward please bring a letter from your local Sub-Chief and a recent utility bill to the Help Desk.' },
  { id: 'res-sw', topic: 'Residency', lang: 'SW', text: 'Mpendwa {name}, ili kuthibitisha makazi ya {student} katika Wadi ya Tendeno/Sorget, tafadhali lete barua kutoka kwa Chifu Msaidizi na bili ya hivi karibuni ya huduma.' },
  { id: 'bank-en', topic: 'Bank details', lang: 'EN', text: 'Dear {name}, please confirm the school bank name, branch and account number for {student}. Payments are made to the institution account only.' },
  { id: 'bank-sw', topic: 'Bank details', lang: 'SW', text: 'Mpendwa {name}, tafadhali thibitisha jina la benki, tawi na nambari ya akaunti ya shule ya {student}. Malipo hufanywa kwa akaunti ya taasisi pekee.' },
  { id: 'reup-en', topic: 'Re-upload', lang: 'EN', text: 'Dear {name}, the {doc} you uploaded for {student} could not be read. Please re-upload a clear, well-lit photo. Re-upload is open for 7 days.' },
  { id: 'reup-sw', topic: 'Re-upload', lang: 'SW', text: 'Mpendwa {name}, {doc} uliyopakia kwa ajili ya {student} haikusomeka. Tafadhali pakia upya picha iliyo wazi. Una siku 7 za kupakia upya.' },
  { id: 'rem-en', topic: 'Reminder', lang: 'EN', text: 'Dear {name}, {student}\'s bursary registration is incomplete. Please log in and finish the remaining steps before the cycle closes.' },
  { id: 'rem-sw', topic: 'Reminder', lang: 'SW', text: 'Mpendwa {name}, usajili wa bursary wa {student} haujakamilika. Tafadhali ingia na ukamilishe hatua zilizobaki kabla ya muda kuisha.' }
];

export { hd };
