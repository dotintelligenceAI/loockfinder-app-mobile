import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface PlanLockNoticeProps {
  style?: ViewStyle;
  variant?: 'default' | 'premium' | 'compact';
}

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function PlanLockNotice({ 
  style, 
  variant = 'default' 
}: PlanLockNoticeProps) {
  const { t } = useI18n();

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
          <Text style={styles.compactDetails}>
            {t('components.planLock.freeDetails')}
          </Text>
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
              <Text style={styles.premiumTitle}>
                {t('components.planLock.heading')}
              </Text>
            </View>
            <Text style={styles.premiumText}>
              {t('components.planLock.freeMessage')}
            </Text>
            <Text style={styles.premiumDetails}>
              {t('components.planLock.freeDetails')}
            </Text>
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
            <Text style={styles.title}>{t('components.planLock.heading')}</Text>
            <Text style={styles.subtitle}>
              {t('components.planLock.freeMessage')}
            </Text>
            <Text style={styles.subtitleMuted}>
              {t('components.planLock.freeDetails')}
            </Text>
          </View>
        </View>
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

  premiumDetails: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    lineHeight: 18,
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

  compactDetails: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '500',
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

  subtitleMuted: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: isSmallScreen ? 12 : 13,
    lineHeight: 18,
  },
});