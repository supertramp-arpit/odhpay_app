// context/UserContext.js
// Simple wrapper component for backwards compatibility
// Original functionality has been migrated to Zustand stores

import React from 'react';

const UserContext = ({ children }) => {
  return <>{children}</>;
};

export default UserContext;
