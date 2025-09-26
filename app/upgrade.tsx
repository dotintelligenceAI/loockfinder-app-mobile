import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/useToast';
import { subscriptionsService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function UpgradeScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>('');
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    loadUserPlan();
    loadProducts();
  }, []);

  const loadUserPlan = async () => {
    if (!user?.id) return;
    
    try {
      const res = await subscriptionsService.getProfileWithPlan(user.id);
      if (res.success && res.data) {
        setUserPlan(res.data?.plan?.name || (res.data.subscription_status === 'free' ? 'Finder Free' : ''));
      }
    } catch (error) {
      console.error('Erro ao carregar plano:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      
      // Verificar se estamos em ambiente web ou Expo Go
      if (Platform.OS === 'web' || Constants.appOwnership === 'expo') {
        // Usar mock para desenvolvimento
        console.log('🔄 Usando IAP Mock para desenvolvimento...');
        const iapService = require('../services/iapServiceMock').iapService;
        
        const initResult = await iapService.initialize();
        if (initResult.success) {
          const productsResult = await iapService.loadProducts();
          if (productsResult.success) {
            setAvailableProducts(iapService.getAvailableProducts());
          }
        }
      } else {
        // Usar IAP real para builds nativos
        console.log('🔄 Usando IAP real...');
        try {
          const iapService = require('../services/iapService').iapService;
          
          const initResult = await iapService.initialize();
          if (initResult.success) {
            const productsResult = await iapService.loadProducts();
            if (productsResult.success) {
              setAvailableProducts(iapService.getAvailableProducts());
            }
          }
        } catch (nativeError) {
          console.warn('⚠️ IAP nativo não disponível, usando mock:', nativeError);
          // Fallback para mock se IAP nativo falhar
          const iapService = require('../services/iapServiceMock').iapService;
          const initResult = await iapService.initialize();
          if (initResult.success) {
            const productsResult = await iapService.loadProducts();
            if (productsResult.success) {
              setAvailableProducts(iapService.getAvailableProducts());
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
      // Em caso de erro, mostrar produtos mock como fallback
      try {
        const iapService = require('../services/iapServiceMock').iapService;
        const initResult = await iapService.initialize();
        if (initResult.success) {
          const productsResult = await iapService.loadProducts();
          if (productsResult.success) {
            setAvailableProducts(iapService.getAvailableProducts());
          }
        }
      } catch (fallbackError) {
        console.error('❌ Erro no fallback:', fallbackError);
      }
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePurchase = async (productId: string, isSubscription: boolean) => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    try {
      setLoading(true);
      setSelectedPlan(productId);

      const result = await subscriptionsService.prepareCheckout(productId, user.id);

      if (result.success) {
        Alert.alert(
          'Sucesso! 🎉',
          'Sua compra foi processada com sucesso! Agora você tem acesso a todos os recursos premium.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Recarregar dados do usuário
                loadUserPlan();
                // Voltar para o perfil
                router.back();
              }
            }
          ]
        );
      } else {
        if (result.error?.includes('canceled')) {
          return;
        }
        Alert.alert('Erro na compra', result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro na compra:', error);
      Alert.alert('Erro', 'Erro ao processar compra');
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setLoading(true);
      const result = await subscriptionsService.restorePurchases();

      if (result.success) {
        if (result.restoredCount && result.restoredCount > 0) {
          showSuccess('Compras restauradas com sucesso!');
          loadUserPlan();
          router.back();
        } else {
          Alert.alert('Nenhuma compra encontrada', 'Não foram encontradas compras para restaurar.');
        }
      } else {
        showError(result.error || 'Erro ao restaurar compras');
      }
    } catch (error) {
      console.error('Erro ao restaurar compras:', error);
      showError('Erro ao restaurar compras');
    } finally {
      setLoading(false);
    }
  };

  // Mapear produtos IAP para exibição
  const getPlanDisplayInfo = (product: any) => {
    const isSubscription = product.type === 'auto_renewable_subscription';
    const isLifetime = product.productId === 'com.lookfinder.premium.lifetime';
    
    return {
      id: product.productId,
      name: product.title,
      price: product.localizedPrice,
      period: isLifetime ? 'Uma vez' : (isSubscription ? 'por mês' : 'por ano'),
      description: product.description,
      features: [
        'Acesso ilimitado a todos os looks',
        'Filtros avançados de busca',
        'Salvar looks ilimitados',
        'Sem anúncios',
        'Suporte prioritário',
        ...(isLifetime ? [] : ['Renovação automática'])
      ],
      popular: product.productId === 'com.lookfinder.premium.monthly',
      type: isSubscription ? 'subscription' : 'lifetime'
    };
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Premium</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#1a1a1a', '#333333']}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.iconContainer}>
                <Ionicons name="star" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.heroTitle}>Desbloqueie o LookFinder Premium</Text>
              <Text style={styles.heroSubtitle}>
                Acesse todos os recursos premium e transforme sua experiência de moda
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Current Plan */}
        {userPlan && (
          <View style={styles.currentPlanSection}>
            <Text style={styles.currentPlanTitle}>Plano Atual</Text>
            <View style={styles.currentPlanCard}>
              <Text style={styles.currentPlanName}>{userPlan}</Text>
              <Text style={styles.currentPlanDescription}>
                {userPlan === 'Finder Free' 
                  ? 'Plano gratuito com recursos limitados'
                  : 'Você já tem acesso aos recursos premium'
                }
              </Text>
            </View>
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansSection}>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>
          
          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1a1a1a" />
              <Text style={styles.loadingText}>Carregando planos...</Text>
            </View>
          ) : availableProducts.length > 0 ? (
            availableProducts.map((product, index) => {
              const plan = getPlanDisplayInfo(product);
              return (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.popularPlanCard,
                selectedPlan === plan.id && styles.selectedPlanCard
              ]}
              onPress={() => handlePurchase(plan.id, plan.type === 'subscription')}
              disabled={loading}
            >
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Mais Popular</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>
                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                {plan.features.map((feature, featureIndex) => (
                  <View key={featureIndex} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {loading && selectedPlan === plan.id && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Erro ao carregar planos</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={loadProducts}
              >
                <Text style={styles.retryButtonText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Restore Purchases */}
        <View style={styles.restoreSection}>
          <TouchableOpacity 
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Ionicons name="refresh" size={16} color="#666666" />
            <Text style={styles.restoreButtonText}>Restaurar Compras</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            As assinaturas são renovadas automaticamente. Você pode cancelar a qualquer momento nas configurações da sua conta.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  currentPlanSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  currentPlanTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  currentPlanCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  currentPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  currentPlanDescription: {
    fontSize: 14,
    color: '#666666',
  },
  plansSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    position: 'relative',
  },
  popularPlanCard: {
    borderColor: '#1a1a1a',
    backgroundColor: '#F8F9FA',
  },
  selectedPlanCard: {
    borderColor: '#1a1a1a',
    backgroundColor: '#F1F5FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: 20,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
    marginRight: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  planPricing: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  planPeriod: {
    fontSize: 14,
    color: '#666666',
  },
  planFeatures: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#1a1a1a',
    marginLeft: 8,
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreSection: {
    marginHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  footer: {
    marginHorizontal: 20,
    marginBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F3F5',
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
