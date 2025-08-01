import { Button, Input, ProtectedRoute, Toast } from '@/components';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function SignUpScreenContent() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showError, showSuccess } = useToast();

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    if (password !== confirmPassword) {
      showError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      showError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.signUp({ 
        email, 
        password, 
        fullName,
        confirmPassword 
      });
      
      if (response.success) {
        if (response.user) {
          // Usuário criado e logado - navegar diretamente para home
          showSuccess('Conta criada com sucesso!');
          setTimeout(() => {
            router.replace('/(tabs)/home');
          }, 1500); // Dar tempo para mostrar a mensagem de sucesso
        } else {
          // Precisa confirmar email
          showSuccess(response.message || 'Conta criada! Verifique seu email para confirmar.');
          setTimeout(() => {
            router.back();
          }, 2000);
        }
      } else {
        showError(response.error || 'Erro ao criar conta');
      }
    } catch (error) {
      showError('Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast 
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com padrão geométrico */}
        <View style={styles.header}>
          {/* Padrão geométrico de fundo */}
          <View style={styles.patternContainer}>
            <View style={styles.patternRow}>
              {Array.from({ length: 30 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.patternSquare,
                    { transform: [{ rotate: '45deg' }] }
                  ]}
                />
              ))}
            </View>
          </View>
          
          {/* Botão de voltar */}
          <TouchableOpacity 
            onPress={navigateToLogin}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          
          {/* Título */}
          <Text style={styles.headerTitle}>Crie sua conta</Text>
        </View>
 
        {/* Formulário de Cadastro */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Input
              label="Nome Completo"
              placeholder="Seu nome completo"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Input
              label="Email"
              placeholder="exemplo@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label="Confirmar Senha"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <Button
            title="Criar Conta"
            onPress={handleSignUp}
            loading={loading}
            variant="primary"
          />

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>
              Já tem uma conta?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.signInLink}>
                Entrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function SignUpScreen() {
  return (
    <ProtectedRoute requireAuth={false}>
      <SignUpScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#000000',
    position: 'relative',
    height: 192,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  patternRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  patternSquare: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    margin: 4,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  signInText: {
    color: '#666666',
    fontSize: 16,
  },
  signInLink: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
}); 