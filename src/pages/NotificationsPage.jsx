import React, { useMemo, useState } from 'react';
import { PageShell } from '../components/PageShell.jsx';
import { SectionCard } from '../components/SectionCard.jsx';
import { Icon } from '../components/Icon.jsx';
import { NOTIFICATIONS_AGGREGATE } from '../data/parentMock.js';

const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'applications', label: 'Applications' },
  { id: 'documents', label: 'Documents' },
  { id: 'appeals', label: 'Appeals' }
];

const TYPE_ICONS = {
  'Application Approved': 'approved',
  'Missing Document': 'upload',
  'Appeal Update': 'appeal',
  'Deadline Reminder': 'calendar',
  'Login Activity': 'profile',
  'Allocation Notice': 'funds',
  'System Announcement': 'info'
};

function filterNotifications(items, tab) {
  if (tab === 'all') return items;
  if (tab === 'urgent') return items.filter((n) => n.urgent);
  if (tab === 'applications') return items.filter((n) => n.group === 'applications');
  if (tab === 'documents') return items.filter((n) => n.group === 'documents');
  if (tab === 'appeals') return items.filter((n) => n.type === 'Appeal Update');
  return items;
}

function groupLabel(item) {
  if (!item.studentName) return 'System alert';
  return item.studentName;
}

export function NotificationsPage({
  portalVariant = 'parent',
  portalLabel = 'Parent portal',
  homePath,
  profilePath
} = {}) {
  const [tab, setTab] = useState('all');
  const items = useMemo(() => filterNotifications(NOTIFICATIONS_AGGREGATE, tab), [tab]);

  const grouped = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      const key = groupLabel(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return [...map.entries()];
  }, [items]);

  return (
    <PageShell
      pageTitle="Notifications"
      notificationBadge
      userInitials="MK"
      portalVariant={portalVariant}
      portalLabel={portalLabel}
      homePath={homePath}
      profilePath={profilePath}
    >
      <SectionCard title="Notifications" titleLevel="h1">
        <p className="section-card__lead section-card__lead--left">
          Updates aggregated from all linked student dashboards and system announcements.
        </p>
      </SectionCard>

      <div className="filter-tabs page-section--full" role="tablist" aria-label="Notification filters">
        {FILTER_TABS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={tab === f.id}
            className={`filter-tab ${tab === f.id ? 'filter-tab--active' : ''}`}
            onClick={() => setTab(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="empty-state page-section--full">No notifications in this filter.</p>
      ) : (
        grouped.map(([group, groupItems]) => (
          <SectionCard key={group} title={group} className="page-section--full">
            <ul className="feed-list">
              {groupItems.map((item) => (
                <li
                  key={item.id}
                  className={`feed-item feed-item--notify ${item.urgent ? 'feed-item--urgent' : ''}`}
                >
                  <div className="feed-item__icon" aria-hidden="true">
                    <Icon name={TYPE_ICONS[item.type] || 'info'} size={20} />
                  </div>
                  <div className="feed-item__body-wrap">
                    <span className="feed-item__tag">{item.type}</span>
                    <p className="feed-item__title">{item.title}</p>
                    <p className="feed-item__body">{item.body}</p>
                    <time className="feed-item__time">{item.time}</time>
                  </div>
                </li>
              ))}
            </ul>
          </SectionCard>
        ))
      )}
    </PageShell>
  );
}
