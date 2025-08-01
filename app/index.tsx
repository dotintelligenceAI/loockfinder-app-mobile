import { useAuth } from '@/contexts/AuthContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const { isAuthenticated, loading, checkConnection } = useAuth();
  const { showPreloader, hidePreloader, updateMessage } = usePreloader();
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando LookFinder...');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const initializeApp = async () => {
      // Sequência de mensagens de loading
      const messages = [
        'Iniciando LookFinder...',
        'Verificando conexão...',
        'Carregando seu perfil...',
        'Preparando sua experiência...'
      ];

      let messageIndex = 0;
      
      // Mostrar preloader
      showPreloader('Iniciando LookFinder...');
      
      // Atualizar mensagem a cada 800ms
      const messageInterval = setInterval(() => {
        if (messageIndex < messages.length - 1) {
          messageIndex++;
          updateMessage(messages[messageIndex]);
        }
      }, 800);

      // Verificar conexão com backend
      try {
        const isConnected = await checkConnection();
        if (!isConnected) {
          updateMessage('Verificando conectividade...');
        }
      } catch (error) {
        console.error('Connection check failed:', error);
      }

      setConnectionChecked(true);
      clearInterval(messageInterval);

      // Aguardar no mínimo 1.5 segundos para UX
      timeoutId = setTimeout(() => {
        if (!loading) {
          if (isAuthenticated) {
            updateMessage('Redirecionando para home...');
            setTimeout(() => {
              hidePreloader();
              router.replace('/(tabs)/home' as any);
            }, 300);
          } else {
            updateMessage('Redirecionando para boas-vindas...');
            setTimeout(() => {
              hidePreloader();
              router.replace('/auth/welcome' as any);
            }, 300);
          }
        }
      }, 1500);
    };

    initializeApp();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      hidePreloader();
    };
  }, [hidePreloader]);

  // Redirecionar quando loading terminar (mas só após verificação de conexão)
  useEffect(() => {
    if (!loading && connectionChecked) {
      const redirectTimeout = setTimeout(() => {
        if (isAuthenticated) {
          updateMessage('Bem-vinda de volta!');
          setTimeout(() => {
            hidePreloader();
            router.replace('/(tabs)/home' as any);
          }, 500);
        } else {
          updateMessage('Redirecionando...');
          setTimeout(() => {
            hidePreloader();
            router.replace('/auth/welcome' as any);
          }, 500);
        }
      }, 300);

      return () => clearTimeout(redirectTimeout);
    }
  }, [loading, isAuthenticated, connectionChecked, updateMessage, hidePreloader]);

  return null;
} 