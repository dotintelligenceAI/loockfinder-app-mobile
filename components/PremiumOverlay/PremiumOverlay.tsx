import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface PremiumOverlayProps {
  featureName: string;
  iconName?: keyof typeof Ionicons.glyphMap;
}

export default function PremiumOverlay({ 
  featureName,
  iconName = 'sparkles'
}: PremiumOverlayProps) {
  const { t } = useI18n();

  return (
    <View style={styles.overlay}>
      {/* Fundo com opacidade muito baixa */}
      <View style={styles.backgroundOverlay} />
      
      {/* Tarja superior elegante */}
      <View style={styles.topBanner}>
        <LinearGradient
          colors={['rgba(107, 70, 193, 0.95)', 'rgba(79, 70, 229, 0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.bannerGradient}
        >
           <View style={styles.bannerContent}>
             <View style={styles.bannerLeft}>
               <View style={styles.iconContainer}>
                 <Ionicons name={iconName} size={20} color="#FFFFFF" />
               </View>
               <View style={styles.bannerText}>
                 <Text style={styles.bannerTitle}>
                   {t('premium.overlay.title')}
                 </Text>
                 <Text style={styles.bannerSubtitle}>
                   {t('premium.overlay.subtitle').replace('{feature}', featureName)}
                 </Text>
                 <Text style={styles.bannerNotice}>
                   {t('premium.overlay.notice')}
                 </Text>
               </View>
             </View>
           </View>
        </LinearGradient>
      </View>

      {/* Gradiente sutil na parte inferior para destacar a tarja */}
      <View style={styles.bottomGradient}>
        <LinearGradient
          colors={['transparent', 'rgba(107, 70, 193, 0.03)', 'rgba(107, 70, 193, 0.08)']}
          style={styles.gradientOverlay}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none', // Permite interação com o conteúdo por baixo
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // Opacidade muito baixa
  },
  topBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    shadowColor: '#6B46C1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  bannerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    marginBottom: 4,
  },
  bannerNotice: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '400',
    fontStyle: 'italic',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.3, // 30% da altura da tela
    pointerEvents: 'none',
  },
  gradientOverlay: {
    flex: 1,
  },
});
