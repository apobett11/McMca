import { StatusDot } from './TimelineDot.js';

export function Timeline({ stages, currentStageIndex = 0 }) {
  // stages: [{ label, state: 'completed'|'current'|'upcoming' }]
  return document.createRange().createContextualFragment(`
    <div class="timeline" aria-label="Application progress timeline">
      ${(stages || []).map((s) => StatusDot(s)).join('')}
    </div>
  `);
}

