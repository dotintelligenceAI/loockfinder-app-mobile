import { Button } from '@/components';
import { useI18n } from '@/contexts/I18nContext';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  const handleLogin = () => {
    router.push('/auth/login' as any);
  };

  const handleSignUp = () => {
    router.push('/auth/signup' as any);
  };

  const handleGuestAccess = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <View style={styles.container}>
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


        </View>

        {/* Seção inferior com conteúdo */}
        <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 40 }]}>
          {/* Logo centralizado */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logoLookfinder/logoLookFinder.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.welcomeText}>
              {t('auth.welcome.title')}
            </Text>
          </View>

          {/* Botões de ação */}
          <View style={styles.buttonContainer}>
            <View style={styles.loginButton}>
              <Button
                title={t('auth.welcome.login')}
                onPress={handleLogin}
                variant="primary"
              />
            </View>
            
            <View style={styles.signUpButton}>
              <Button
                title={t('auth.welcome.signup')}
                onPress={handleSignUp}
                variant="outline"
              />
            </View>
          </View>
        </View>
      </View>
      

    </>
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
    height: 150,
  },
  bottomSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 32,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
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

});