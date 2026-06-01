export function navigateTo(hashRoute) {
  // hashRoute should include leading '#', e.g. '#/dashboard'
  const normalized = hashRoute.startsWith('#') ? hashRoute : `#${hashRoute}`;
  window.location.hash = normalized;
}

