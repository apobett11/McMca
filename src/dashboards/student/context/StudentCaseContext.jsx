import React, { createContext, useContext } from 'react';
import { useSecureData } from '../../../lib/useSecureData.js';
import { fetchStudentCase } from '../../../lib/queries.js';

const StudentCaseContext = createContext(null);

export function StudentCaseProvider({ children }) {
  const state = useSecureData(fetchStudentCase);
  return <StudentCaseContext.Provider value={state}>{children}</StudentCaseContext.Provider>;
}

export function useStudentCase() {
  const value = useContext(StudentCaseContext);
  if (!value) {
    throw new Error('useStudentCase must be used within StudentCaseProvider');
  }
  return value;
}
