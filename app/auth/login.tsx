import { Button, Input, ProtectedRoute, Toast } from '@/components';
import { useToast } from '@/hooks/useToast';
import { authService } from '@/services';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

function LoginScreenContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
  const { toast, showError } = useToast();

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handlePressOutside = () => {
      if (languageDropdownVisible) {
        setLanguageDropdownVisible(false);
      }
    };

    // Adicionar listener para fechar dropdown
    const subscription = { remove: () => {} };
    
    return () => {
      subscription.remove();
    };
  }, [languageDropdownVisible]);

  const handleLogin = async () => {
    if (!email || !password) {
      showError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        router.replace('/(tabs)/home');
      } else {
        showError(response.error || 'Email ou senha incorretos');
      }
    } catch (error) {
      showError('Email ou senha incorretos');
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

        <View style={styles.languageContainer}>
          <TouchableOpacity 
            style={styles.languageButton}
            onPress={() => setLanguageDropdownVisible(!languageDropdownVisible)}
          >
            <Ionicons name="language-outline" size={24} color="#666666" />
            <Text style={styles.languageText}>
              {selectedLanguage === 'pt-BR' ? 'PT' : selectedLanguage === 'en' ? 'EN' : 'ES'}
            </Text>
            <Ionicons 
              name={languageDropdownVisible ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#666666" 
            />
          </TouchableOpacity>
          
          {languageDropdownVisible && (
            <View style={styles.languageDropdown}>
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'pt-BR' && styles.languageOptionActive]}
                onPress={() => {
                  setSelectedLanguage('pt-BR');
                  setLanguageDropdownVisible(false);
                }}
              >
                <Text style={[styles.languageOptionText, selectedLanguage === 'pt-BR' && styles.languageOptionTextActive]}>
                  Português
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'en' && styles.languageOptionActive]}
                onPress={() => {
                  setSelectedLanguage('en');
                  setLanguageDropdownVisible(false);
                }}
              >
                <Text style={[styles.languageOptionText, selectedLanguage === 'en' && styles.languageOptionTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
              
                              <TouchableOpacity 
                  style={[styles.languageOption, selectedLanguage === 'es' && styles.languageOptionActive, { borderBottomWidth: 0 }]}
                  onPress={() => {
                    setSelectedLanguage('es');
                    setLanguageDropdownVisible(false);
                  }}
                >
                  <Text style={[styles.languageOptionText, selectedLanguage === 'es' && styles.languageOptionTextActive]}>
                    Español
                  </Text>
                </TouchableOpacity>
            </View>
          )}
        </View>
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
            Bem-vinda de volta!
          </Text>
          <Text style={styles.subtitleText}>
            Entre na sua conta para continuar
          </Text>
        </View>

        {/* Formulário de Login */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Input
              label="Email"
              placeholder="Digite seu email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <Button
              title="Entrar"
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
                Registre-se agora
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
  languageContainer: {
    position: 'relative',
    zIndex: 9999,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  languageText: {
    marginHorizontal: 8,
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  languageDropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999,
    minWidth: 140,
  },
  languageOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  languageOptionActive: {
    backgroundColor: '#E0E0E0',
  },
  languageOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333333',
  },
  languageOptionTextActive: {
    color: '#4A90E2',
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