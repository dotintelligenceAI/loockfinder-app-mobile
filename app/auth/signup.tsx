import { Button, Input, ProtectedRoute, Toast } from '@/components';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function SignUpScreenContent() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showError, showSuccess } = useToast();
  const { t } = useI18n();

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      showError(t('auth.signup.nameRequired'));
      return;
    }

    if (password !== confirmPassword) {
      showError(t('auth.signup.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      showError(t('auth.signup.passwordMinLength'));
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
          showSuccess(t('auth.signup.signupSuccess'));
          setTimeout(() => {
            router.replace('/auth/plans');
          }, 800);
        } else {
          showSuccess(response.message || t('auth.signup.signupSuccess'));
          setTimeout(() => {
            router.replace('/auth/plans');
          }, 800);
        }
      } else {
        showError(response.error || t('auth.signup.signupError'));
      }
    } catch (error) {
      showError(t('auth.signup.signupError'));
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

      {/* Barra superior com voltar */}
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={navigateToLogin}
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
            {t('auth.signup.title')}
          </Text>
          <Text style={styles.subtitleText}>
            {t('auth.welcome.subtitle')}
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Input
              label={t('auth.signup.name')}
              placeholder={t('auth.signup.name')}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Input
              label={t('auth.signup.email')}
              placeholder={t('auth.signup.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label={t('auth.signup.password')}
              placeholder={t('auth.signup.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Input
              label={t('auth.signup.confirmPassword')}
              placeholder={t('auth.signup.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title={t('auth.signup.signupButton')}
              onPress={handleSignUp}
              loading={loading}
              variant="primary"
            />
          </View>

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>
              {t('auth.welcome.alreadyHaveAccount')}{' '}
            </Text>
            <TouchableOpacity onPress={navigateToLogin}>
              <Text style={styles.signInLink}>
                {t('auth.welcome.login')}
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
  buttonContainer: {
    marginBottom: 32,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 40,
  },
  signInText: {
    color: '#666666',
    fontSize: 16,
  },
  signInLink: {
    color: '#4A90E2',
    fontWeight: '600',
    fontSize: 16,
  },
});