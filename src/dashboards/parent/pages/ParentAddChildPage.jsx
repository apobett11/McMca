import React from 'react';
import { Navigate } from 'react-router-dom';

export function ParentAddChildPage() {
  return <Navigate to="/parent/documents" replace state={{ addChild: true }} />;
}
