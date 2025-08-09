import { Button, Input, ProtectedRoute, Toast } from '@/components';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function LoginScreenContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showError } = useToast();
  const { t } = useI18n();

  const handleLogin = async () => {
    if (!email || !password) {
      showError(t('auth.login.emailRequired'));
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        router.replace('/(tabs)/home');
      } else {
        showError(response.error || t('auth.login.loginError'));
      }
    } catch (error) {
      showError(t('auth.login.loginError'));
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = () => {
    router.push('/auth/signup' as any);
  };

  const handleBackToWelcome = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast 
        message={toast.message}
        type={toast.type}
        visible={toast.visible}
      />
      
      {/* Botão de voltar e seleção de linguagem */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBackToWelcome}
        >
          <Ionicons name="chevron-back" size={24} color="#333333" />
        </TouchableOpacity>


      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header com Logo */}
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logoLookfinder/logoLookFinder.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.welcomeBackText}>
            {t('auth.login.title')}
          </Text>
          <Text style={styles.subtitleText}>
            {t('auth.welcome.subtitle')}
          </Text>
        </View>

        {/* Formulário de Login */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Input
              label={t('auth.login.email')}
              placeholder={t('auth.login.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label={t('auth.login.password')}
              placeholder={t('auth.login.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword} onPress={() => router.push('/auth/forgot-password' as any)}>
            <Text style={styles.forgotPasswordText}>
              {t('auth.login.forgotPassword')}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <Button
              title={t('auth.login.loginButton')}
              onPress={handleLogin}
              loading={loading}
              variant="primary"
            />
          </View>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>
              Não tem uma conta?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToSignUp}>
              <Text style={styles.signUpLink}>
                {t('auth.welcome.signup')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      

    </SafeAreaView>
  );
}

export default function LoginScreen() {
  return (
    <ProtectedRoute requireAuth={false}>
      <LoginScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 40,
    marginBottom: 24,
  },
  welcomeBackText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -16,
    paddingHorizontal: 24,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    color: '#4A90E2',
    fontSize: 15,
    fontWeight: '500',
  },
  buttonContainer: {
    marginBottom: 32,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  signUpText: {
    color: '#666666',
    fontSize: 16,
  },
  signUpLink: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 16,
  },
});