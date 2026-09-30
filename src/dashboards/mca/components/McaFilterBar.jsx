import React from 'react';
import { Icon } from '../../../components/Icon.jsx';
import { useMca } from '../context/McaContext.jsx';
import { useMcaFilters } from '../hooks/useMcaFilters.js';

const SELECTS = [
  { key: 'cycle', label: 'Cycle', option: 'cycles', all: 'All cycles' },
  { key: 'ward', label: 'Ward', option: 'wards', all: 'All wards' },
  { key: 'level', label: 'Education level', option: 'levels', all: 'All levels' },
  { key: 'school', label: 'School', option: 'schools', all: 'All schools' }
];

const CHIPS = [
  { key: 'location', label: 'Chief location' },
  { key: 'polling', label: 'Polling station' }
];

export function McaFilterBar() {
  const { options } = useMca();
  const { filters, setParam, resetFilters, activeCount } = useMcaFilters();
  const chips = CHIPS.filter((chip) => filters[chip.key]);

  return (
    <div className="mca-filterbar" role="search" aria-label="Filter chief-approved applications">
      {SELECTS.map((select) => (
        <div key={select.key}>
          <label htmlFor={`mca-filter-${select.key}`}>{select.label}</label>
          <select
            id={`mca-filter-${select.key}`}
            value={filters[select.key]}
            onChange={(event) => setParam(select.key, event.target.value)}
          >
            <option value="">{select.all}</option>
            {(options[select.option] || []).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="button"
        className="btn btn--secondary btn--compact"
        onClick={resetFilters}
        disabled={!activeCount}
        style={{ width: 'auto' }}
      >
        Clear
      </button>
      {chips.length ? (
        <div className="mca-chips">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="mca-chip"
              onClick={() => setParam(chip.key, '')}
              aria-label={`Remove ${chip.label} filter`}
            >
              <Icon name="map" size={14} />
              {chip.label}: {filters[chip.key]}
              <Icon name="rejected" size={12} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
