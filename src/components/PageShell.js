import { BottomNav } from './BottomNav.js';
import { Header } from './Header.js';

export function PageShell({ currentHash, pageTitle, mainEl }) {
  const frag = document.createRange().createContextualFragment(`
    <div class="pagePadBottom">
      <div id="top"></div>
      ${Header({ title: pageTitle })}
      <main class="container" role="main" aria-label="${pageTitle}">
        ${mainEl}
      </main>
      ${BottomNav({ current: currentHash })}
    </div>
  `);
  return frag;
}

