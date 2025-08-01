import { useAuth } from '@/contexts/AuthContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  redirectTo = '/auth/login',
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const { showPreloader, hidePreloader } = usePreloader();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Aguardar carregar o estado de autenticação
    if (loading) {
      setShouldRender(false);
      showPreloader('Verificando autenticação...');
      return;
    }

    // Esconder preloader quando não estiver carregando
    if (!loading) {
      hidePreloader();
    }

    if (requireAuth) {
      // Rota protegida - requer autenticação
      if (!isAuthenticated) {
        // Usuário não autenticado, redirecionar para login
        showPreloader('Redirecionando...');
        router.replace(redirectTo as any);
        setShouldRender(false);
        return;
      }
      
      // Usuário autenticado, pode renderizar
      setShouldRender(true);
    } else {
      // Rota pública - não requer autenticação
      if (isAuthenticated) {
        // Usuário já está logado, redirecionar para home
        showPreloader('Redirecionando...');
        router.replace('/(tabs)/home' as any);
        setShouldRender(false);
        return;
      }
      
      // Usuário não autenticado, pode renderizar (ex: login/signup)
      setShouldRender(true);
    }
  }, [isAuthenticated, loading, requireAuth, redirectTo, showPreloader, hidePreloader]);

  // Renderizar conteúdo protegido
  return <>{children}</>;
} 