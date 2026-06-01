import React from 'react';
import { Icon } from './Icon.jsx';

const VARIANT_ICON = {
  warning: 'clock',
  success: 'approved',
  info: 'info'
};

export function NotificationList({ items = [] }) {
  return (
    <ul className="feed-list" aria-label="Notifications">
      {items.map((item, idx) => (
        <li
          key={idx}
          className={`feed-item ${item.unread ? 'feed-item--unread' : ''}`}
        >
          <div className="feed-item__icon" aria-hidden="true">
            <Icon name={VARIANT_ICON[item.variant] || 'info'} size={20} />
          </div>
          <div>
            <p className="feed-item__title">
              {item.title}
              {item.unread ? (
                <span className="feed-item__tag"> New</span>
              ) : null}
            </p>
            <p className="feed-item__body">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
