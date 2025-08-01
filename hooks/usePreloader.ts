import { useCallback, useState } from 'react';

export interface PreloaderState {
  visible: boolean;
  message: string;
}

export function usePreloader(initialMessage: string = 'Carregando...') {
  const [preloader, setPreloader] = useState<PreloaderState>({
    visible: false,
    message: initialMessage,
  });

  const showPreloader = useCallback((message?: string) => {
    setPreloader({
      visible: true,
      message: message || initialMessage,
    });
  }, [initialMessage]);

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

  const showWithTimeout = useCallback((message?: string, timeout: number = 3000) => {
    showPreloader(message);
    
    const timeoutId = setTimeout(() => {
      hidePreloader();
    }, timeout);

    return () => clearTimeout(timeoutId);
  }, [showPreloader, hidePreloader]);

  return {
    preloader,
    showPreloader,
    hidePreloader,
    updateMessage,
    showWithTimeout,
  };
} 