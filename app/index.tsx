import { useAuth } from '@/contexts/AuthContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  const { isAuthenticated, loading, checkConnection } = useAuth();
  const { showPreloader, hidePreloader, updateMessage } = usePreloader();
  const [connectionChecked, setConnectionChecked] = useState(false);
  const [initializationComplete, setInitializationComplete] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let messageInterval: ReturnType<typeof setInterval>;

    const initializeApp = async () => {
      try {
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
        messageInterval = setInterval(() => {
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
          // Continuar mesmo se a verificação de conexão falhar
        }

        setConnectionChecked(true);
        clearInterval(messageInterval);

        // Aguardar no mínimo 1.5 segundos para UX
        timeoutId = setTimeout(() => {
          setInitializationComplete(true);
        }, 1500);
      } catch (error) {
        console.error('App initialization error:', error);
        // Em caso de erro, ainda permitir que o app continue
        setConnectionChecked(true);
        setInitializationComplete(true);
      }
    };

    initializeApp();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (messageInterval) {
        clearInterval(messageInterval);
      }
      hidePreloader();
    };
  }, [showPreloader, hidePreloader, updateMessage, checkConnection]);

  // Redirecionar quando inicialização estiver completa e loading terminar
  useEffect(() => {
    if (initializationComplete && !loading && connectionChecked) {
      const redirectTimeout = setTimeout(() => {
        try {
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
        } catch (error) {
          console.error('Navigation error:', error);
          // Fallback: tentar navegar mesmo com erro
          hidePreloader();
          if (isAuthenticated) {
            router.replace('/(tabs)/home' as any);
          } else {
            router.replace('/auth/welcome' as any);
          }
        }
      }, 300);

      return () => clearTimeout(redirectTimeout);
    }
  }, [initializationComplete, loading, isAuthenticated, connectionChecked, updateMessage, hidePreloader]);

  return null;
} 