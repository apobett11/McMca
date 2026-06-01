import React from 'react';
import { Icon } from '../Icon.jsx';

export function PageIntro({ greeting, meta, cycle, lead }) {
  return (
    <header className="page-intro page-section--full" aria-label="Page introduction">
      <div className="page-intro__main">
        {greeting ? <h2 className="page-intro__greeting">{greeting}</h2> : null}
        {meta ? <p className="page-intro__meta">{meta}</p> : null}
        {lead ? <p className="page-intro__lead">{lead}</p> : null}
      </div>
      {cycle ? (
        <span className="page-intro__cycle">
          <Icon name="approved" size={16} />
          {cycle}
        </span>
      ) : null}
    </header>
  );
}
