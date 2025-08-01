import { authService, User } from '@/services';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  checkConnection: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Verificar conexão com Supabase
  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      return await authService.checkConnection();
    } catch (error) {
      console.error('Connection check error:', error);
      return false;
    }
  }, []);

  // Atualizar dados do usuário
  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
    }
  }, []);

  // Verificar estado inicial de autenticação
  const checkInitialAuthState = useCallback(async () => {
    try {
      setLoading(true);
      
      // Verificar conexão primeiro
      const isConnected = await checkConnection();
      if (!isConnected) {
        console.warn('No connection to Supabase');
      }

      const session = await authService.getSession();
      
      if (session) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Se falhar ao obter dados do usuário, criar um usuário básico
          console.warn('Failed to get user data, creating basic user');
          const basicUser = {
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
            avatarUrl: session.user.user_metadata?.avatar_url || null,
            createdAt: session.user.created_at,
            updatedAt: session.user.updated_at || session.user.created_at,
          };
          setUser(basicUser);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Initial auth check error:', error);
      setUser(null);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  }, [checkConnection]);

  useEffect(() => {
    // Verificar estado inicial apenas uma vez
    if (!initialCheckDone) {
      checkInitialAuthState();
    }

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            // Se falhar ao obter dados do usuário, criar um usuário básico
            console.warn('Failed to get user data on sign in, creating basic user');
            const basicUser = {
              id: session.user.id,
              email: session.user.email || '',
              fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Usuário',
              avatarUrl: session.user.user_metadata?.avatar_url || null,
              createdAt: session.user.created_at,
              updatedAt: session.user.updated_at || session.user.created_at,
            };
            setUser(basicUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Atualizar dados do usuário quando token for refreshed
          await refreshUser();
        }
        
        // Só parar loading após o check inicial
        if (initialCheckDone) {
          setLoading(false);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [initialCheckDone, checkInitialAuthState, refreshUser]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.login({ email, password });
      
      if (response.success && response.user) {
        setUser(response.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('SignIn error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await authService.signUp({ email, password, fullName });
      
      if (response.success && response.user) {
        setUser(response.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('SignUp error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('SignOut error:', error);
      // Garantir que o usuário seja removido mesmo se houver erro
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUser,
    checkConnection,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  
  return context;
} 