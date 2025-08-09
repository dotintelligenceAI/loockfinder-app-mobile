import { Button, Input, ProtectedRoute, Toast } from '@/components';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast, showError, showSuccess } = useToast();
  const { t } = useI18n();

  const handleSendEmail = async () => {
    if (!email) {
      showError(t('auth.login.emailRequired'));
      return;
    }
    setLoading(true);
    try {
      const response = await authService.requestPasswordReset({ email });
      if (response.success) {
        showSuccess(response.message || 'Verifique seu email para continuar.');
        setTimeout(() => router.back(), 1200);
      } else {
        showError(response.error || 'Erro ao enviar email.');
      }
    } catch (e) {
      showError('Erro ao enviar email.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => router.back();

  return (
    <SafeAreaView style={styles.container}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />

      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Ionicons name="chevron-back" size={24} color="#333333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/logoLookfinder/logoLookFinder.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.welcomeBackText}>{t('auth.login.forgotPassword')}</Text>
          <Text style={styles.subtitleText}>{t('auth.welcome.subtitle')}</Text>
        </View>

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
          </View>

          <View style={styles.buttonContainer}>
            <Button title={t('common.send') || 'Enviar'} onPress={handleSendEmail} loading={loading} variant="primary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ForgotPasswordScreen() {
  return (
    <ProtectedRoute requireAuth={false}>
      <ForgotPasswordContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40, alignItems: 'center' },
  logoImage: { width: 180, height: 40, marginBottom: 24 },
  welcomeBackText: { fontSize: 28, fontWeight: '700', color: '#1a1a1a', marginBottom: 8, textAlign: 'center' },
  subtitleText: { fontSize: 16, color: '#666666', textAlign: 'center', lineHeight: 22 },
  formContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -16,
    paddingHorizontal: 24,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: { marginBottom: 16 },
  buttonContainer: { marginBottom: 32 },
});


