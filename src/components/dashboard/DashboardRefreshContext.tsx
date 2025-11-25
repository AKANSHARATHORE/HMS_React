import React, { createContext, useContext, useState, ReactNode } from "react";

interface DashboardRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const DashboardRefreshContext = createContext<DashboardRefreshContextType>({
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const useDashboardRefresh = () => useContext(DashboardRefreshContext);

export const DashboardRefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((k) => k + 1);

  return (
    <DashboardRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </DashboardRefreshContext.Provider>
  );
};
