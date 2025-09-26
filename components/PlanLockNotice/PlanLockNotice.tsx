import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Dimensions,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle
} from 'react-native';

interface PlanLockNoticeProps {
  onUpgrade?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'premium' | 'compact';
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function PlanLockNotice({ 
  onUpgrade, 
  style, 
  variant = 'default' 
}: PlanLockNoticeProps) {
  const { t } = useI18n();
  
  const handlePress = () => {
    if (onUpgrade) onUpgrade();
    else {
      // Redirecionar para o site externo para upgrade
      const websiteUrl = 'https://lookfinder.app/upgrade';
      Linking.openURL(websiteUrl).catch(() => {
        console.error('Erro ao abrir URL de upgrade');
      });
    }
  };

  const getContainerStyle = () => {
    switch (variant) {
      case 'premium':
        return styles.premiumContainer;
      case 'compact':
        return styles.compactContainer;
      default:
        return styles.container;
    }
  };

  if (variant === 'compact') {
    return (
      <View style={[getContainerStyle(), style]}>
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
            </View>
            <Text style={styles.compactText}>
              {t('components.planLock.freeMessage')}
            </Text>
          </View>
          <TouchableOpacity style={styles.compactButton} onPress={handlePress}>
            <Text style={styles.compactButtonText}>
              {t('components.planLock.upgradeCta')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (variant === 'premium') {
    return (
      <View style={[getContainerStyle(), style]}>
        <LinearGradient
          colors={['#000000', '#1a1a1a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContainer}
        >
          <View style={styles.premiumContent}>
            <View style={styles.premiumHeader}>
              <View style={styles.premiumIconContainer}>
                <Ionicons name="diamond" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.premiumTitle}>Premium Feature</Text>
            </View>
            <Text style={styles.premiumText}>
              {t('components.planLock.freeMessage')}
            </Text>
            <TouchableOpacity style={styles.premiumButton} onPress={handlePress}>
              <Text style={styles.premiumButtonText}>
                {t('components.planLock.upgradeCta')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#000000" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[getContainerStyle(), style]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Recurso Premium</Text>
            <Text style={styles.subtitle}>
              {t('components.planLock.freeMessage')}
            </Text>
          </View>
        </View>
        
          <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>
            {t('components.planLock.upgradeCta')}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container padrão
  container: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  // Container premium
  premiumContainer: {
    borderRadius: 16,
    marginVertical: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#667EEA',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  gradientContainer: {
    padding: 20,
  },

  premiumContent: {
    gap: 16,
  },

  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  premiumIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  premiumText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
  },

  premiumButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },

  premiumButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },

  // Container compacto
  compactContainer: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },

  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  compactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },

  compactText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    opacity: 0.8,
  },

  compactButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  compactButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '600',
  },

  // Estilos do layout padrão
  content: {
    gap: 16,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainer: {
    flex: 1,
    gap: 4,
  },

  title: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    lineHeight: 24,
  },

  subtitle: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 13 : 14,
    lineHeight: 20,
    fontWeight: '500',
    opacity: 0.8,
  },

  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#111827',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },

  buttonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});