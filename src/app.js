import { renderRoute, initRouter } from './router.js';

const root = document.getElementById('app');
initRouter((route) => renderRoute(route, root));

