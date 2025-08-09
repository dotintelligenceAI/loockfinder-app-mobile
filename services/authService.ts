import { supabase } from './supabase';
import { AuthResponse, LoginCredentials, ResetPasswordRequest, SignUpCredentials, UpdatePasswordRequest, User } from './types/auth';

export interface AuthServiceMethods {
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
  signUp: (credentials: SignUpCredentials) => Promise<AuthResponse>;
  logout: () => Promise<AuthResponse>;
  getCurrentUser: () => Promise<User | null>;
  getSession: () => Promise<any>;
  onAuthStateChange: (callback: (event: string, session: any) => void) => any;
  checkConnection: () => Promise<boolean>;
  requestPasswordReset: (payload: ResetPasswordRequest) => Promise<AuthResponse>;
  updatePassword: (payload: UpdatePasswordRequest) => Promise<AuthResponse>;
}

class AuthService implements AuthServiceMethods {
  /**
   * Verifica conexão com Supabase
   */
  async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('users').select('count').limit(1);
      return !error;
    } catch (error) {
      return false;
    }
  }

  /**
   * Solicita email de recuperação de senha
   */
  async requestPasswordReset({ email }: ResetPasswordRequest): Promise<AuthResponse> {
    try {
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Por favor, insira um email válido.' };
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: 'lookfindermobile://auth/reset',
      });
      if (error) {
        return { success: false, error: this.getErrorMessage(error.message) };
      }
      return { success: true, message: 'Enviamos um email com instruções para redefinir sua senha.' };
    } catch (error) {
      return { success: false, error: 'Erro ao solicitar recuperação de senha.' };
    }
  }

  /**
   * Atualiza senha do usuário (após abrir o link mágico ou sessão ativa)
   */
  async updatePassword({ newPassword }: UpdatePasswordRequest): Promise<AuthResponse> {
    try {
      if (!newPassword || newPassword.length < 6) {
        return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: this.getErrorMessage(error.message) };
      }
      return { success: true, message: 'Senha atualizada com sucesso!' };
    } catch (error) {
      return { success: false, error: 'Erro ao atualizar senha.' };
    }
  }
  /**
   * Realiza login do usuário
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const { email, password } = credentials;

      // Validações básicas
      if (!email || !password) {
        return {
          success: false,
          error: 'Por favor, preencha todos os campos.',
        };
      }

      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Por favor, insira um email válido.',
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error.message),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Erro ao fazer login. Tente novamente.',
        };
      }

      // Usar dados do auth do Supabase diretamente
      const userData = this.mapAuthUserToUser(data.user);

      return {
        success: true,
        user: userData,
        message: 'Login realizado com sucesso!',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Erro interno. Verifique sua conexão e tente novamente.',
      };
    }
  }

  /**
   * Realiza cadastro do usuário
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      const { email, password, fullName } = credentials;

      // Validações básicas
      if (!email || !password) {
        return {
          success: false,
          error: 'Por favor, preencha todos os campos obrigatórios.',
        };
      }

      if (!this.isValidEmail(email)) {
        return {
          success: false,
          error: 'Por favor, insira um email válido.',
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: 'A senha deve ter pelo menos 6 caracteres.',
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
      });

      if (error) {
        return {
          success: false,
          error: this.getErrorMessage(error.message),
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Erro ao criar conta. Tente novamente.',
        };
      }

      // Se o usuário foi criado mas não há sessão, precisa confirmar email
      if (data.user && !data.session) {
        return {
          success: true,
          message: 'Conta criada! Verifique seu email para confirmar.',
        };
      }

      // Se já está logado, usar dados do auth
      const userData = this.mapAuthUserToUser(data.user);

      return {
        success: true,
        user: userData,
        message: 'Conta criada com sucesso!',
      };
    } catch (error) {
      console.error('SignUp error:', error);
      return {
        success: false,
        error: 'Erro interno. Verifique sua conexão e tente novamente.',
      };
    }
  }

  /**
   * Realiza logout do usuário
   */
  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: 'Erro ao fazer logout.',
        };
      }

      return {
        success: true,
        message: 'Logout realizado com sucesso!',
      };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        error: 'Erro interno. Tente novamente mais tarde.',
      };
    }
  }

  /**
   * Obtém o usuário atual
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      return this.mapAuthUserToUser(user);
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Verifica se há uma sessão ativa
   */
  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Mapeia dados do auth do Supabase para o tipo User
   */
  private mapAuthUserToUser(authUser: any): User {
    return {
      id: authUser.id,
      email: authUser.email || '',
      fullName: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
      avatarUrl: authUser.user_metadata?.avatar_url || null,
      createdAt: authUser.created_at,
      updatedAt: authUser.updated_at || authUser.created_at,
    };
  }

  /**
   * Traduz mensagens de erro do Supabase
   */
  private getErrorMessage(error: string): string {
    const errorMessages: { [key: string]: string } = {
      'Invalid login credentials': 'Email ou senha incorretos.',
      'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
      'User already registered': 'Este email já está cadastrado.',
      'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
      'Unable to validate email address: invalid format': 'Formato de email inválido.',
      'signup is disabled': 'Cadastro temporariamente desabilitado.',
      'Email rate limit exceeded': 'Muitas tentativas. Tente novamente mais tarde.',
      'Invalid email or password': 'Email ou senha incorretos.',
      'User not found': 'Usuário não encontrado.',
      'Too many requests': 'Muitas tentativas. Aguarde um momento e tente novamente.',
    };

    return errorMessages[error] || `Erro: ${error}`;
  }

  /**
   * Escuta mudanças no estado de autenticação
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
export default authService; 