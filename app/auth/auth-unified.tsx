import { Button, Input, ProtectedRoute, Toast } from '@/components';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/useToast';
import { authService, profilesService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type AuthMode = 'signin' | 'register';

function AuthUnifiedScreenContent() {
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const { toast, showError, showSuccess } = useToast();
  const { t } = useI18n();

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: -50,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, [slideAnim]);

  const handleSignIn = async () => {
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

  const handleRegister = async () => {
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
          await profilesService.createMinimalProfile(response.user.id, fullName || null, null);
          showSuccess(t('auth.signup.signupSuccess'));
          setTimeout(() => {
            router.replace('/(tabs)/home');
          }, 800);
        } else {
          showSuccess(response.message || t('auth.signup.signupSuccess'));
          setTimeout(() => {
            router.replace('/(tabs)/home');
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

  const handleBackToWelcome = () => {
    router.back();
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    resetForm();
  };

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <Toast 
          message={toast.message}
          type={toast.type}
          visible={toast.visible}
        />
        
        {/* Seção superior com imagem de fundo */}
        <Animated.View 
          style={[
            styles.topSection,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Image
            source={require('@/assets/images/logoLookfinder/image-boasvindas.jpg')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          <View style={styles.overlay} />
          
          {/* LinearGradient para suavizar a transição */}
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'rgba(255, 255, 255, 0.8)', '#FFFFFF']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.gradientOverlay}
          />

          {/* Botão de voltar */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBackToWelcome}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Logo e título no canto esquerdo */}
          {/* <View style={styles.headerContent}>
            <Text style={styles.lookfinderTitle}>
              LOOKFINDER
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Welcome
            </Text>
          </View> */}
        </Animated.View>

        {/* Seção inferior com formulário */}
        <Animated.View 
          style={[
            styles.bottomSection,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Abas de navegação */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === 'signin' && styles.activeTabButton
              ]}
              onPress={() => switchAuthMode('signin')}
            >
              <Text style={[
                styles.tabText,
                authMode === 'signin' && styles.activeTabText
              ]}>
                {t('auth.welcome.login').toUpperCase()}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.tabButton,
                authMode === 'register' && styles.activeTabButton
              ]}
              onPress={() => switchAuthMode('register')}
            >
              <Text style={[
                styles.tabText,
                authMode === 'register' && styles.activeTabText
              ]}>
                {t('auth.welcome.signup').toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.formScrollView}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Formulário de entrada */}
            <View style={styles.inputContainer}>
              {authMode === 'register' && (
                <Input
                  label={t('auth.signup.name')}
                  placeholder={t('auth.signup.name')}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              )}
              
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

              {authMode === 'register' && (
                <Input
                  label={t('auth.signup.confirmPassword')}
                  placeholder={t('auth.signup.confirmPassword')}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              )}
            </View>

            {/* Link "Esqueceu a senha" apenas no modo signin */}
            {authMode === 'signin' && (
              <TouchableOpacity 
                style={styles.forgotPassword} 
                onPress={() => router.push('/auth/forgot-password' as any)}
              >
                <Text style={styles.forgotPasswordText}>
                  {t('auth.login.forgotPassword')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Botão principal */}
            <View style={styles.mainButtonContainer}>
              <Button
                title={authMode === 'signin' ? t('auth.login.loginButton') : t('auth.signup.signupButton')}
                onPress={authMode === 'signin' ? handleSignIn : handleRegister}
                loading={loading}
                variant="primary"
              />
            </View>

            {/* Divisor OR */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t('auth.login.or').toUpperCase()}</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Botões de login social */}
            {/* <View style={styles.socialButtonsContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-facebook" size={20} color="#1877F2" />
                <Text style={styles.socialButtonText}>Continue with Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                <Ionicons name="logo-apple" size={20} color="#000000" />
                <Text style={styles.socialButtonText}>Continue with Apple</Text>
              </TouchableOpacity>
            </View> */}

            {/* Termos e condições */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                {t('auth.signup.termsText')}{' '}
                <Text style={styles.termsLink}>{t('auth.signup.termsAndConditions')}</Text>
                {'\n'}{t('auth.signup.andThe')}{' '}
                <Text style={styles.termsLink}>{t('auth.signup.privacyPolicy')}</Text>
              </Text>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

export default function AuthUnifiedScreen() {
  return (
    <ProtectedRoute requireAuth={false}>
      <AuthUnifiedScreenContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    height: '45%',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    height: 150,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  headerContent: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    alignItems: 'flex-start',
  },
  lookfinderTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#000000',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabText: {
    color: '#000000',
  },
  formScrollView: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  inputContainer: {
    marginBottom: 12,
  },
  forgotPassword: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  forgotPasswordLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  mainButtonContainer: {
    marginBottom: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  socialButtonsContainer: {
    marginBottom: 20,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 25,
    height: 50,
    marginBottom: 12,
  },
  socialButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  termsContainer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
});
