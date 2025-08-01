import React, { createContext, useContext, useState } from 'react';

const TabBarVisibilityContext = createContext({
  visible: true,
  setVisible: (v: boolean) => {},
});

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);
  return (
    <TabBarVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export function useTabBarVisibility() {
  return useContext(TabBarVisibilityContext);
} 