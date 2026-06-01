import React, { useEffect } from 'react';
import { NotificationList } from './NotificationList.jsx';

export function NotificationModal({ open, onClose, items = [] }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-root" role="presentation">
      <button type="button" className="modal-root__backdrop" onClick={onClose} aria-label="Close notifications" />
      <div
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
      >
        <header className="modal-panel__header">
          <h2 id="notification-modal-title" className="modal-panel__title">
            Notifications
          </h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="modal-panel__body">
          <NotificationList items={items} />
        </div>
      </div>
    </div>
  );
}
