import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';
import { useSecureData } from '../../../lib/useSecureData.js';
import { fetchMcaFilterOptions, fetchMcaProfile } from '../../../lib/mcaQueries.js';

const McaContext = createContext(null);

const EMPTY_OPTIONS = { cycles: [], wards: [], levels: [], schools: [], locations: [], pollingStations: [] };

export function McaProvider({ children }) {
  const { user } = useAuth();
  const profileState = useSecureData(fetchMcaProfile);
  const optionsState = useSecureData(fetchMcaFilterOptions);

  const value = useMemo(() => {
    const profile = profileState.data;
    return {
      profile,
      profileLoading: profileState.loading,
      refreshProfile: profileState.refresh,
      displayName: profile?.full_name || user?.user_metadata?.full_name || 'MCA',
      options: optionsState.data || EMPTY_OPTIONS,
      optionsError: optionsState.error,
      refreshOptions: optionsState.refresh
    };
  }, [profileState.data, profileState.loading, profileState.refresh, optionsState.data, optionsState.error, optionsState.refresh, user]);

  return <McaContext.Provider value={value}>{children}</McaContext.Provider>;
}

export function useMca() {
  const value = useContext(McaContext);
  if (!value) throw new Error('useMca must be used within McaProvider');
  return value;
}
