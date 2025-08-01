import { Button } from '@/components';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');

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

  const handleLogin = () => {
    router.push('/auth/login' as any);
  };

  const handleSignUp = () => {
    router.push('/auth/signup' as any);
  };

  const handleGuestAccess = () => {
    // Implementar acesso como convidado
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Seção superior com imagem de fundo */}
      <View style={styles.topSection}>
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

        {/* Header com botão de linguagem */}
        <View style={styles.headerContainer}>
          <View style={styles.languageContainer}>
            <TouchableOpacity 
              style={styles.languageButton}
              onPress={() => setLanguageDropdownVisible(!languageDropdownVisible)}
            >
              <Ionicons name="language-outline" size={24} color="#FFFFFF" />
              <Text style={styles.languageText}>
                {selectedLanguage === 'pt-BR' ? 'PT' : selectedLanguage === 'en' ? 'EN' : 'ES'}
              </Text>
              <Ionicons 
                name={languageDropdownVisible ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#FFFFFF" 
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
      </View>

      {/* Seção inferior com conteúdo */}
      <View style={styles.bottomSection}>
        {/* Logo centralizado */}
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logoLookfinder/logoLookFinder.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>
            Bem-vinda Finder!
          </Text>
        </View>

        {/* Botões de ação */}
        <View style={styles.buttonContainer}>
          <View style={styles.loginButton}>
            <Button
              title="Entrar"
              onPress={handleLogin}
              variant="primary"
            />
          </View>
          
          <View style={styles.signUpButton}>
            <Button
              title="Criar conta"
              onPress={handleSignUp}
              variant="outline"
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    flex: 1,
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
    height: 150, // Altura do gradiente aumentada para transição mais suave
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    borderTopLeftRadius: 25,   // Bordas arredondadas na parte superior
    borderTopRightRadius: 25,  // Bordas arredondadas na parte superior
    marginTop: -25,           // Sobrepõe um pouco a imagem para criar continuidade
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoImage: {
    width: 210,
    height: 45,
  },
  welcomeText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  loginButton: {
    marginBottom: 16,
  },
  signUpButton: {
    marginBottom: 16,
  },
  guestContainer: {
    alignItems: 'center',
  },
  guestText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 40,
    zIndex: 10,
  },
  languageContainer: {
    position: 'relative',
    zIndex: 9999,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  languageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  languageDropdown: {
    position: 'absolute',
    top: 40, // Ajuste para posicionar abaixo do botão
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999,
    width: 140,
    paddingVertical: 8,
  },
  languageOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  languageOptionActive: {
    backgroundColor: '#F0F0F0',
    borderBottomColor: 'transparent',
  },
  languageOptionText: {
    color: '#333333',
    fontSize: 15,
    fontWeight: '500',
  },
  languageOptionTextActive: {
    color: '#007BFF',
  },
});