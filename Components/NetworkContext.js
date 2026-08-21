import React from 'react';

const NetworkContext = React.createContext({
  isOffline: false,
  setOffline: () => {},
});

export default NetworkContext;
