export function NotificationList({ items = [] }) {
  return document.createRange().createContextualFragment(`
    <div class="list" role="list" aria-label="Notifications">
      ${(items || []).map((n) => {
        const unreadClass = n.unread ? 'unread' : '';
        const iconBg = n.variant === 'success' ? 'var(--green)'
          : n.variant === 'warning' ? 'var(--orange)'
          : n.variant === 'error' ? 'var(--red)'
          : 'var(--blue)';
        return `
          <div class="item ${unreadClass}" role="listitem" aria-label="${n.title}">
            <div class="itemTop">
              <div class="itemIcon" style="background:${iconBg}" aria-hidden="true">${n.icon || '🔔'}</div>
              <div>
                <p class="itemTitle">${n.title}${n.unread ? ' (New)' : ''}</p>
                <p class="itemDesc">${n.body}</p>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `);
}

