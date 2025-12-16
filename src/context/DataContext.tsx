import React, { createContext, useContext } from 'react';
import { userService } from '../services';

interface DataContextType {
  services: {
    userService: typeof userService;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{
  children: React.ReactNode;
  services?: {
    userService: typeof userService;
  };
}> = ({
  children,
  services = { userService }
}) => {
  const value = {
    services
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};
