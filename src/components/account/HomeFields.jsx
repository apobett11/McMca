import React, { useEffect, useMemo } from 'react';
import {
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

  const normalizedWard = useMemo(() => normalizeWardKey(selectedWard), [selectedWard]);
  const wardData = useMemo(() => getWardData(normalizedWard), [normalizedWard]);

  // Ensure ward, county, constituency, subCounty are always synced
  useEffect(() => {
    if (!values.ward) {
      onChange('ward', 'Tendeno/Sorget Ward');
    }
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
  }, [wardData, values.ward, values.county, values.constituency, values.subCounty, onChange]);

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

  function handleLocationChange(e) {
    const nextLoc = e.target.value;
    onChange('location', nextLoc);
    // Cascading reset: sub-location, village, and polling station
    onChange('subLocation', '');
    onChange('village', '');
    onChange('pollingStation', '');
  }

  function handleSubLocationChange(e) {
    const nextSub = e.target.value;
    onChange('subLocation', nextSub);
    // Cascading reset: village and polling station
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
    <div className="home-fields-group" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Row 1: Location & Sub-Location side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {/* Location Dropdown */}
        <div className={`field ${errors.location ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
          <label htmlFor={`${idPrefix}location`}>
            Location <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <select
            id={`${idPrefix}location`}
            value={selectedLocation}
            onChange={handleLocationChange}
            className={`stitch-profile-form__input ${errors.location ? 'is-invalid' : ''}`}
            required
            aria-invalid={Boolean(errors.location)}
          >
            <option value="">Select Location...</option>
            {availableLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {errors.location ? <p className="field__error-msg">{errors.location}</p> : null}
        </div>

        {/* Sub-Location Dropdown (disabled until Location is selected) */}
        <div className={`field ${errors.subLocation ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
          <label htmlFor={`${idPrefix}subLocation`}>
            Sub-Location <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <select
            id={`${idPrefix}subLocation`}
            value={selectedSubLocation}
            onChange={handleSubLocationChange}
            className={`stitch-profile-form__input ${errors.subLocation ? 'is-invalid' : ''}`}
            required
            aria-invalid={Boolean(errors.subLocation)}
            disabled={!selectedLocation || availableSubLocations.length === 0}
            style={{
              opacity: !selectedLocation ? 0.6 : 1,
              cursor: !selectedLocation ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">{selectedLocation ? 'Select Sub-Location...' : 'Select Location first'}</option>
            {availableSubLocations.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          {errors.subLocation ? <p className="field__error-msg">{errors.subLocation}</p> : null}
        </div>
      </div>

      {/* Row 2: Village & Polling Station side by side */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16
      }}>
        {/* Village Dropdown (disabled until Sub-Location is selected) */}
        <div className={`field ${errors.village ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
          <label htmlFor={`${idPrefix}village`}>
            Village / Neighborhood <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <select
            id={`${idPrefix}village`}
            value={selectedVillage}
            onChange={handleVillageChange}
            className={`stitch-profile-form__input ${errors.village ? 'is-invalid' : ''}`}
            required
            aria-invalid={Boolean(errors.village)}
            disabled={!selectedSubLocation || availableVillages.length === 0}
            style={{
              opacity: !selectedSubLocation ? 0.6 : 1,
              cursor: !selectedSubLocation ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">{selectedSubLocation ? 'Select Village...' : 'Select Sub-Location first'}</option>
            {availableVillages.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {errors.village ? <p className="field__error-msg">{errors.village}</p> : null}
        </div>

        {/* Polling Station Dropdown (disabled until Sub-Location is selected) */}
        <div className={`field ${errors.pollingStation ? 'field--invalid' : ''}`} style={{ margin: 0 }}>
          <label htmlFor={`${idPrefix}pollingStation`}>
            Designated Polling Station <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <select
            id={`${idPrefix}pollingStation`}
            value={selectedPolling}
            onChange={handlePollingChange}
            className={`stitch-profile-form__input ${errors.pollingStation ? 'is-invalid' : ''}`}
            required
            aria-invalid={Boolean(errors.pollingStation)}
            disabled={!selectedSubLocation || availablePollingStations.length === 0}
            style={{
              opacity: !selectedSubLocation ? 0.6 : 1,
              cursor: !selectedSubLocation ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">{selectedSubLocation ? 'Select Polling Station...' : 'Select Sub-Location first'}</option>
            {availablePollingStations.map((ps) => (
              <option key={ps} value={ps}>{ps}</option>
            ))}
          </select>
          {errors.pollingStation ? <p className="field__error-msg">{errors.pollingStation}</p> : null}
        </div>
      </div>
    </div>
  );
}
