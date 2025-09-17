import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface FeatureAccessNoticeProps {
  featureName: string;
  onUpgrade: () => void;
  onGoHome: () => void;
}

export default function FeatureAccessNotice({
  featureName,
  onUpgrade,
  onGoHome,
}: FeatureAccessNoticeProps) {
  const { t } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={24} color="#000000" />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>{t('components.featureAccess.title')}</Text>
          <Text style={styles.description}>
            {t('components.featureAccess.description').replace('{featureName}', featureName)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
          <Ionicons name="star" size={16} color="#FFFFFF" />
          <Text style={styles.upgradeButtonText}>{t('components.featureAccess.upgradeButton')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.homeButton} onPress={onGoHome}>
          <Ionicons name="home" size={16} color="#FFFFFF" />
          <Text style={styles.homeButtonText}>{t('components.featureAccess.homeButton')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  upgradeButton: {
    backgroundColor: '#000000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeButton: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333333',
    gap: 8,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
