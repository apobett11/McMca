import React from 'react';

/**
 * Section title + body in one card so headers feel part of the page.
 * titleLevel: 'h1' for page identity, 'h2' for sections.
 */
export function SectionCard({
  title,
  titleLevel = 'h2',
  children,
  className = '',
  id
}) {
  const Tag = titleLevel === 'h1' ? 'h1' : 'h2';

  return (
    <section
      id={id}
      className={`section-card ${className}`.trim()}
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="section-card__header">
        <Tag className="section-card__title" id={id ? `${id}-title` : undefined}>
          {title}
        </Tag>
      </div>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

/** @deprecated Use SectionCard */
export function PageH1({ children, className = '' }) {
  return (
    <section className={`section-card ${className}`.trim()}>
      <div className="section-card__header">
        <h1 className="section-card__title">{children}</h1>
      </div>
    </section>
  );
}

/** @deprecated Use SectionCard */
export function SectionH2({ children, className = '' }) {
  return null;
}
