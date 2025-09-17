import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import {
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription: string;
  iconName: keyof typeof Ionicons.glyphMap;
  showCountdown?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export default function UpgradeModal({
  visible,
  onClose,
  featureName,
  featureDescription,
  iconName,
  showCountdown = false,
}: UpgradeModalProps) {
  const { t } = useI18n();

  const handleUpgrade = () => {
    onClose();
    router.push('/auth/plans' as any);
  };

  const handleGoHome = () => {
    onClose();
    router.push('/(tabs)/home' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#000000', '#1a1a1a']}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name={iconName} size={32} color="#FFFFFF" />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

             {/* Content */}
             <View style={styles.content}>
               <Text style={styles.title}>{t('components.upgradeModal.title').replace('{featureName}', featureName)}</Text>
               <Text style={styles.description}>{featureDescription}</Text>
               
               {showCountdown && (
                 <View style={styles.countdownContainer}>
                   <Text style={styles.countdownText}>
                     {t('components.upgradeModal.premiumFeatureMessage')}
                   </Text>
                 </View>
               )}

              {/* Features List */}
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>{t('components.upgradeModal.features.unlimitedAccess').replace('{featureName}', featureName)}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>{t('components.upgradeModal.features.aiPersonalizedLooks')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>{t('components.upgradeModal.features.unlimitedFavorites')}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.featureText}>{t('components.upgradeModal.features.prioritySupport')}</Text>
                </View>
              </View>
            </View>

             {/* Actions */}
             <View style={styles.actions}>
               <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
                 <LinearGradient
                   colors={['#FFFFFF', '#F0F0F0']}
                   style={styles.upgradeButtonGradient}
                 >
                   <Ionicons name="star" size={20} color="#000000" />
                   <Text style={styles.upgradeButtonText}>{t('components.upgradeModal.upgradeButton')}</Text>
                 </LinearGradient>
               </TouchableOpacity>
               
               <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                 <LinearGradient
                   colors={['#333333', '#1a1a1a']}
                   style={styles.homeButtonGradient}
                 >
                   <Ionicons name="home" size={20} color="#FFFFFF" />
                   <Text style={styles.homeButtonText}>{t('components.upgradeModal.homeButton')}</Text>
                 </LinearGradient>
               </TouchableOpacity>
             </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxWidth: 400,
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    opacity: 0.8,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  actions: {
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },
  upgradeButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
   upgradeButtonText: {
     fontSize: 18,
     fontWeight: '700',
     color: '#000000',
   },
   homeButton: {
     borderRadius: 16,
     overflow: 'hidden',
   },
   homeButtonGradient: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 16,
     gap: 8,
   },
   homeButtonText: {
     fontSize: 18,
     fontWeight: '700',
     color: '#FFFFFF',
   },
   countdownContainer: {
     backgroundColor: 'rgba(255, 255, 255, 0.1)',
     padding: 12,
     borderRadius: 8,
     marginBottom: 16,
     borderWidth: 1,
     borderColor: 'rgba(255, 255, 255, 0.2)',
   },
   countdownText: {
     fontSize: 14,
     color: '#FFFFFF',
     textAlign: 'center',
     fontWeight: '600',
   },
});
