import React from 'react';
import { Navigate } from 'react-router-dom';

/** Legacy route — messages page replaces standalone support navigation. */
export function SupportPage() {
  return <Navigate to="/student/support" replace />;
}
