import React, { useEffect, useMemo } from 'react';
import {
  getWardList,
  getWardData,
  getLocationsForWard,
  getSubLocationsForLocation,
  getVillagesForSubLocation,
  getPollingStationsForSubLocation,
  normalizeWardKey
} from '../../data/wardLocationData.js';

export function HomeFields({ values = {}, onChange, errors = {}, idPrefix = 'home-' }) {
  const selectedWard = values.ward || 'Tendeno/Sorget Ward';
  const selectedLocation = values.location || '';
  const selectedSubLocation = values.subLocation || '';
  const selectedVillage = values.village || '';
  const selectedPolling = values.pollingStation || '';

  const wardOptions = useMemo(() => getWardList(), []);
  const normalizedWard = useMemo(() => normalizeWardKey(selectedWard), [selectedWard]);
  const wardData = useMemo(() => getWardData(normalizedWard), [normalizedWard]);

  // Keep county, constituency, subCounty in sync with selected ward
  useEffect(() => {
    if (wardData) {
      if (!values.county || values.county !== wardData.county) {
        onChange('county', wardData.county);
      }
      if (!values.constituency || values.constituency !== wardData.constituency) {
        onChange('constituency', wardData.constituency);
      }
      if (!values.subCounty || values.subCounty !== wardData.subCounty) {
        onChange('subCounty', wardData.subCounty);
      }
    }
  }, [wardData, values.county, values.constituency, values.subCounty, onChange]);

  const availableLocations = useMemo(() => {
    return getLocationsForWard(normalizedWard);
  }, [normalizedWard]);

  const availableSubLocations = useMemo(() => {
    if (!selectedLocation) return [];
    return getSubLocationsForLocation(normalizedWard, selectedLocation);
  }, [normalizedWard, selectedLocation]);

  const availableVillages = useMemo(() => {
    if (!selectedLocation || !selectedSubLocation) return [];
    return getVillagesForSubLocation(normalizedWard, selectedLocation, selectedSubLocation);
  }, [normalizedWard, selectedLocation, selectedSubLocation]);

  const availablePollingStations = useMemo(() => {
    if (!selectedLocation || !selectedSubLocation) return [];
    return getPollingStationsForSubLocation(normalizedWard, selectedLocation, selectedSubLocation);
  }, [normalizedWard, selectedLocation, selectedSubLocation]);

  function handleWardChange(e) {
    const nextWard = e.target.value;
    onChange('ward', nextWard);
    // Reset lower cascading fields
    onChange('location', '');
    onChange('subLocation', '');
    onChange('village', '');
    onChange('pollingStation', '');
  }

  function handleLocationChange(e) {
    const nextLoc = e.target.value;
    onChange('location', nextLoc);
    // Reset sub-location, village, and polling station
    onChange('subLocation', '');
    onChange('village', '');
    onChange('pollingStation', '');
  }

  function handleSubLocationChange(e) {
    const nextSub = e.target.value;
    onChange('subLocation', nextSub);
    // Reset village and polling station
    onChange('village', '');
    onChange('pollingStation', '');
  }

  function handleVillageChange(e) {
    onChange('village', e.target.value);
  }

  function handlePollingChange(e) {
    onChange('pollingStation', e.target.value);
  }

  return (
    <div className="home-fields-group" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Ward Dropdown */}
      <div className={`field ${errors.ward ? 'field--invalid' : ''}`}>
        <label htmlFor={`${idPrefix}ward`}>Ward *</label>
        <select
          id={`${idPrefix}ward`}
          value={selectedWard}
          onChange={handleWardChange}
          className="stitch-profile-form__input"
          required
        >
          {wardOptions.map((w) => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>
        {errors.ward ? <span className="field__error">{errors.ward}</span> : null}
      </div>

      {/* Location Dropdown */}
      <div className={`field ${errors.location ? 'field--invalid' : ''}`}>
        <label htmlFor={`${idPrefix}location`}>Location *</label>
        <select
          id={`${idPrefix}location`}
          value={selectedLocation}
          onChange={handleLocationChange}
          className="stitch-profile-form__input"
          required
          disabled={availableLocations.length === 0}
        >
          <option value="">{availableLocations.length ? 'Select Location...' : 'Select Ward first'}</option>
          {availableLocations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>
        {errors.location ? <span className="field__error">{errors.location}</span> : null}
      </div>

      {/* Sub-Location Dropdown */}
      <div className={`field ${errors.subLocation ? 'field--invalid' : ''}`}>
        <label htmlFor={`${idPrefix}subLocation`}>Sub-Location *</label>
        <select
          id={`${idPrefix}subLocation`}
          value={selectedSubLocation}
          onChange={handleSubLocationChange}
          className="stitch-profile-form__input"
          required
          disabled={!selectedLocation || availableSubLocations.length === 0}
        >
          <option value="">{selectedLocation ? 'Select Sub-Location...' : 'Select Location first'}</option>
          {availableSubLocations.map((sub) => (
            <option key={sub} value={sub}>{sub}</option>
          ))}
        </select>
        {errors.subLocation ? <span className="field__error">{errors.subLocation}</span> : null}
      </div>

      {/* Village Dropdown */}
      <div className={`field ${errors.village ? 'field--invalid' : ''}`}>
        <label htmlFor={`${idPrefix}village`}>Village / Neighborhood *</label>
        <select
          id={`${idPrefix}village`}
          value={selectedVillage}
          onChange={handleVillageChange}
          className="stitch-profile-form__input"
          required
          disabled={!selectedSubLocation || availableVillages.length === 0}
        >
          <option value="">{selectedSubLocation ? 'Select Village...' : 'Select Sub-Location first'}</option>
          {availableVillages.map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        {errors.village ? <span className="field__error">{errors.village}</span> : null}
      </div>

      {/* Polling Station Dropdown */}
      <div className={`field ${errors.pollingStation ? 'field--invalid' : ''}`}>
        <label htmlFor={`${idPrefix}pollingStation`}>Designated Polling Station *</label>
        <select
          id={`${idPrefix}pollingStation`}
          value={selectedPolling}
          onChange={handlePollingChange}
          className="stitch-profile-form__input"
          required
          disabled={!selectedSubLocation || availablePollingStations.length === 0}
        >
          <option value="">{selectedSubLocation ? 'Select Polling Station...' : 'Select Sub-Location first'}</option>
          {availablePollingStations.map((ps) => (
            <option key={ps} value={ps}>{ps}</option>
          ))}
        </select>
        {errors.pollingStation ? <span className="field__error">{errors.pollingStation}</span> : null}
      </div>

      {/* Jurisdiction Meta Info */}
      <div style={{
        padding: '10px 14px',
        borderRadius: 8,
        background: 'rgba(148, 163, 184, 0.08)',
        border: '1px solid rgba(148, 163, 184, 0.15)',
        fontSize: '0.82rem',
        color: 'var(--text-muted, #94a3b8)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <span>County: <strong>{wardData.county}</strong></span>
        <span>Constituency / Sub-County: <strong>{wardData.constituency}</strong></span>
      </div>
    </div>
  );
}
