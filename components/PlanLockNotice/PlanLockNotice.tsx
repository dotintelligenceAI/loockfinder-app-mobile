import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
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
    else router.push('/auth/plans' as any);
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
              <Ionicons name="lock-closed" size={16} color="#6B7280" />
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
          colors={['#667EEA', '#764BA2']}
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
              <Ionicons name="arrow-forward" size={16} color="#667EEA" />
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
            <Ionicons name="lock-closed" size={20} color="#6B7280" />
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
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container padrão
  container: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#667EEA',
    fontSize: 14,
    fontWeight: '600',
  },

  // Container compacto
  compactContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  compactButton: {
    backgroundColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  compactButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  textContainer: {
    flex: 1,
    gap: 4,
  },

  title: {
    color: '#111827',
    fontSize: isSmallScreen ? 16 : 18,
    fontWeight: '700',
    lineHeight: 24,
  },

  subtitle: {
    color: '#6B7280',
    fontSize: isSmallScreen ? 13 : 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  button: {
    backgroundColor: '#111827',
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
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});