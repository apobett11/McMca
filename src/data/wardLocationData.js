/**
 * Administrative location hierarchy: Ward -> Location -> Sub-Location -> Village & Polling Station.
 * In Kenyan ward administration, the Ward contains Locations, which contain Sub-Locations,
 * which contain distinct Villages and designated Polling Stations.
 */

export const WARD_LOCATION_DATA = {
  'Tendeno/Sorget Ward': {
    county: 'Kericho County',
    constituency: 'Kipkelion West',
    subCounty: 'Kipkelion West',
    locations: {
      'Tendeno': {
        subLocations: {
          'Tendeno Central': {
            villages: ['Tendeno Central Village', 'Kapkures Village', 'Chepsir Village', 'Tendeno Center Village'],
            pollingStations: ['Tendeno Primary School Polling Station', 'Kapkures Primary School Polling Station', 'Tendeno Social Hall']
          },
          'Tendeno East': {
            villages: ['Tendeno East Village', 'Kapsorok Village', 'Chepseon Village', 'Kapkatet Village'],
            pollingStations: ['Tendeno East Primary Polling Station', 'Kapsorok Primary School Polling Station', 'Chepseon Center']
          },
          'Tendeno West': {
            villages: ['Tendeno West Village', 'Kapkawa Village', 'Kipkelion Border Village', 'Sitet Village'],
            pollingStations: ['Tendeno West Primary Polling Station', 'Kapkawa Social Hall Polling Station', 'Sitet Center']
          }
        }
      },
      'Sorget': {
        subLocations: {
          'Sorget Central': {
            villages: ['Sorget Central Village', 'Kapsebet Village', 'Kapchelach Village', 'Chelimo Village'],
            pollingStations: ['Sorget Primary School Polling Station', 'Kapsebet Polytechnic Polling Station', 'Kapchelach Center']
          },
          'Sorget Forest': {
            villages: ['Sorget Forest Station Village', 'Chebangang Village', 'Kipchorian Outpost', 'Kaptumek Village'],
            pollingStations: ['Sorget Forest Station Polling Station', 'Chebangang Primary School Polling Station', 'Kipchorian Outpost Hall']
          },
          'Kipchorian': {
            villages: ['Kipchorian Center Village', 'Tulwet Village', 'Lelu Village', 'Kapchesang Village'],
            pollingStations: ['Kipchorian Primary School Polling Station', 'Tulwet Tea Center Polling Station', 'Lelu Primary School']
          }
        }
      }
    }
  },
  'Parklands Ward': {
    county: 'Nairobi County',
    constituency: 'Westlands',
    subCounty: 'Westlands',
    locations: {
      'Parklands': {
        subLocations: {
          'Highridge': {
            villages: ['Highridge Village', '4th Parklands Avenue', 'Diamond Plaza Enclave'],
            pollingStations: ['Highridge Primary School Polling Station', 'Parklands Arya Girls Polling Station']
          },
          'Spring Valley': {
            villages: ['Spring Valley Village', 'Lower Kabete Enclave', 'Peponi Valley Village'],
            pollingStations: ['Spring Valley Primary School Polling Station', 'Peponi School Polling Station']
          },
          'City Park': {
            villages: ['City Park Village', 'Forest Edge Section', 'Hawkers Market Area'],
            pollingStations: ['City Park Primary School Polling Station', 'Parklands Sports Club Polling Station']
          },
          'Deep Sea': {
            villages: ['Deep Sea Village', 'Westlands Road Settlement', 'Crossroads Section'],
            pollingStations: ['Deep Sea Community Center Polling Station', 'St. Francis Primary School Polling Station']
          }
        }
      }
    }
  },
  'Westlands Ward': {
    county: 'Nairobi County',
    constituency: 'Westlands',
    subCounty: 'Westlands',
    locations: {
      'Westlands': {
        subLocations: {
          'Kangemi': {
            villages: ['Kangemi Central Village', 'Sodom Village', 'Gichagi Village', 'Marenga Village'],
            pollingStations: ['Kangemi Primary School Polling Station', 'Kipande Road Polling Station']
          },
          'Mountain View': {
            villages: ['Mountain View Estate Village', 'Thigiri Ridge Village', 'New Loresho Village'],
            pollingStations: ['Mountain View Academy Polling Station', 'Loresho Primary School Polling Station']
          },
          'Kitisuru': {
            villages: ['Kitisuru Center Village', 'Kyuna Village', 'Spring Valley Road Village'],
            pollingStations: ['Kitisuru Primary School Polling Station', 'Kyuna Kindergarten Polling Station']
          }
        }
      }
    }
  }
};

export function normalizeWardKey(ward) {
  if (!ward) return 'Tendeno/Sorget Ward';
  const clean = String(ward).trim();
  if (WARD_LOCATION_DATA[clean]) return clean;
  // Handle alias variants like 'Tendeno / Sorget Ward'
  const slashed = clean.replace(/\s*\/\s*/g, '/');
  if (WARD_LOCATION_DATA[slashed]) return slashed;
  const spaced = clean.replace(/\//g, ' / ');
  if (WARD_LOCATION_DATA[spaced]) return spaced;
  // Partial match
  const found = Object.keys(WARD_LOCATION_DATA).find((k) => k.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(k.toLowerCase()));
  return found || 'Tendeno/Sorget Ward';
}

export function getWardList() {
  return Object.keys(WARD_LOCATION_DATA);
}

export function getWardData(ward) {
  const key = normalizeWardKey(ward);
  return WARD_LOCATION_DATA[key] || WARD_LOCATION_DATA['Tendeno/Sorget Ward'];
}

export function getLocationsForWard(ward) {
  const wardData = getWardData(ward);
  return Object.keys(wardData.locations || {});
}

export function getSubLocationsForLocation(ward, location) {
  const wardData = getWardData(ward);
  const locObj = wardData.locations?.[location];
  if (!locObj?.subLocations) return [];
  return Object.keys(locObj.subLocations);
}

export function getVillagesForSubLocation(ward, location, subLocation) {
  const wardData = getWardData(ward);
  const locObj = wardData.locations?.[location];
  const subObj = locObj?.subLocations?.[subLocation];
  return subObj?.villages || [];
}

export function getPollingStationsForSubLocation(ward, location, subLocation) {
  const wardData = getWardData(ward);
  const locObj = wardData.locations?.[location];
  const subObj = locObj?.subLocations?.[subLocation];
  return subObj?.pollingStations || [];
}
