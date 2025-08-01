import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface PreloaderState {
  visible: boolean;
  message: string;
}

interface PreloaderContextType {
  preloader: PreloaderState;
  showPreloader: (message?: string) => void;
  hidePreloader: () => void;
  updateMessage: (message: string) => void;
}

const PreloaderContext = createContext<PreloaderContextType | undefined>(undefined);

interface PreloaderProviderProps {
  children: ReactNode;
}

export function PreloaderProvider({ children }: PreloaderProviderProps) {
  const [preloader, setPreloader] = useState<PreloaderState>({
    visible: false,
    message: 'Carregando...',
  });

  const showPreloader = useCallback((message: string = 'Carregando...') => {
    setPreloader({
      visible: true,
      message,
    });
  }, []);

  const hidePreloader = useCallback(() => {
    setPreloader(prev => ({
      ...prev,
      visible: false,
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setPreloader(prev => ({
      ...prev,
      message,
    }));
  }, []);

  return (
    <PreloaderContext.Provider
      value={{
        preloader,
        showPreloader,
        hidePreloader,
        updateMessage,
      }}
    >
      {children}
    </PreloaderContext.Provider>
  );
}

export function usePreloader() {
  const context = useContext(PreloaderContext);
  if (context === undefined) {
    throw new Error('usePreloader must be used within a PreloaderProvider');
  }
  return context;
} 