/**
 * Tailwind is scoped to the new Help Desk / MCA workspaces only.
 * - `content` is limited to src/workspaces so legacy portals are untouched.
 * - `preflight` is disabled (the legacy 240KB styles.css would be clobbered);
 *   a scoped, zero-specificity reset lives in src/workspaces/styles/workspace.css.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/workspaces/**/*.{ts,tsx}'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        ink: { 950: '#030712', 900: '#0b1329', 800: '#0f172a' },
        // Workspace accent driven by CSS variables (.ws-helpdesk / .ws-mca)
        accent: {
          DEFAULT: 'rgb(var(--ws-accent) / <alpha-value>)',
          soft: 'rgb(var(--ws-accent-soft) / <alpha-value>)',
          deep: 'rgb(var(--ws-accent-deep) / <alpha-value>)'
        },
        gold: { DEFAULT: '#f59e0b', deep: '#d97706', soft: '#fcd34d' }
      },
      keyframes: {
        'ws-slide-in': { from: { transform: 'translateX(100%)' }, to: { transform: 'translateX(0)' } },
        'ws-fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'ws-rise': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'ws-pop': { from: { opacity: '0', transform: 'scale(.97)' }, to: { opacity: '1', transform: 'scale(1)' } }
      },
      animation: {
        'ws-slide-in': 'ws-slide-in .22s cubic-bezier(.16,1,.3,1)',
        'ws-fade-in': 'ws-fade-in .18s ease-out',
        'ws-rise': 'ws-rise .2s ease-out',
        'ws-pop': 'ws-pop .16s ease-out'
      }
    }
  },
  plugins: []
};
