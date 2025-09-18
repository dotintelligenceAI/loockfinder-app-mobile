import { ProtectedRoute } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { useToast } from '@/hooks/useToast';
import { Currency, GeolocationData, geolocationService, ProfileSubscriptionInfo, SubscriptionPlan, subscriptionsService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function PlansContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { showPreloader, hidePreloader, updateMessage } = usePreloader();
  const { showError, showSuccess } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsPlan, setDetailsPlan] = useState<SubscriptionPlan | null>(null);
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(true);
  const [currentUserPlan, setCurrentUserPlan] = useState<ProfileSubscriptionInfo | null>(null);
  const [loadingUserPlan, setLoadingUserPlan] = useState(true);
  const [hasPaidPlan, setHasPaidPlan] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelingPlan, setCancelingPlan] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setDetectingLocation(true);
        console.log('🔍 Detectando localização do usuário...');
        
        // Detectar localização do usuário
        const detectedLocation = await geolocationService.detectLocation();
        console.log('📍 Localização detectada:', {
          country: detectedLocation.country,
          region: detectedLocation.region,
          currency: detectedLocation.currency
        });
        
        setLocation(detectedLocation);
        
        // Salvar localização no perfil do usuário (opcional)
        if (user?.id) {
          await geolocationService.saveUserLocation(user.id, detectedLocation);
        }
        
        // Carregar planos baseados na região detectada
        console.log(`💳 Carregando planos para região: ${detectedLocation.region}`);
        const res = await subscriptionsService.getActivePlans(detectedLocation.region);
        
        if (res.success && res.data.length > 0) {
          console.log(`✅ Encontrados ${res.data.length} planos para ${detectedLocation.region}`);
          setPlans(res.data);
        } else {
          console.log(`⚠️ Nenhum plano encontrado para ${detectedLocation.region}, usando fallback BR`);
          // Fallback: carregar planos do Brasil se não encontrar para a região
          const fallbackRes = await subscriptionsService.getActivePlans('BR');
          if (fallbackRes.success) {
            setPlans(fallbackRes.data);
            console.log(`🔄 Carregados ${fallbackRes.data.length} planos do Brasil como fallback`);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar planos:', error);
        // Fallback: carregar planos do Brasil
        const fallbackRes = await subscriptionsService.getActivePlans('BR');
        if (fallbackRes.success) {
          setPlans(fallbackRes.data);
          console.log('🔄 Usando planos do Brasil como fallback devido ao erro');
        }
      } finally {
        setDetectingLocation(false);
      }
    };
    load();
  }, [user?.id]);

  // Carregar plano atual do usuário
  useEffect(() => {
    const loadUserPlan = async () => {
      if (!user?.id) {
        setLoadingUserPlan(false);
        return;
      }

      try {
        setLoadingUserPlan(true);
        console.log('📋 Carregando plano atual do usuário...');
        
        const response = await subscriptionsService.getProfileWithPlan(user.id);
        
        if (response.success && response.data) {
          setCurrentUserPlan(response.data);
          console.log('✅ Plano atual carregado:', {
            planId: response.data.current_plan_id,
            planName: response.data.plan?.name,
            status: response.data.subscription_status
          });

          // Verificar se tem plano pago para mostrar botão de cancelamento
          const hasPaid = await subscriptionsService.hasPaidPlan(user.id);
          setHasPaidPlan(hasPaid);
          console.log('💳 Usuário tem plano pago:', hasPaid);
        } else {
          console.log('⚠️ Erro ao carregar plano atual:', response.error);
        }
      } catch (error) {
        console.error('❌ Erro ao carregar plano atual do usuário:', error);
      } finally {
        setLoadingUserPlan(false);
      }
    };

    loadUserPlan();
  }, [user?.id]);


  const handleSelectPaid = async (plan: SubscriptionPlan) => {
    setLoading(true);
    try {
      showPreloader(t('tabs.perfil.plans.preparingCheckout'));
      const res = await subscriptionsService.prepareCheckout(
        plan.id,
        user?.id,
        plan.stripe_price_id || undefined,
        location?.region
      );
      if (res.success && res.url) {
        hidePreloader();
        router.replace({ pathname: '/auth/checkout', params: { url: res.url } } as any);
      }
    } finally {
      hidePreloader();
      setLoading(false);
    }
  };

  const openDetails = (plan: SubscriptionPlan) => {
    setDetailsPlan(plan);
    setDetailsVisible(true);
  };

  const closeDetails = () => {
    setDetailsVisible(false);
    setDetailsPlan(null);
  };

  const isCurrentPlan = (planId: string): boolean => {
    return currentUserPlan?.current_plan_id === planId;
  };

  const isFreePlan = (plan: SubscriptionPlan): boolean => {
    return plan.slug === 'free' || plan.price_cents === 0;
  };

  const handleCancelPlan = () => {
    setCancelModalVisible(true);
  };

  const confirmCancelPlan = async () => {
    if (!user?.id) return;

    setCancelingPlan(true);
    setCancelModalVisible(false);

    try {
      showPreloader(t('tabs.perfil.plans.cancelingPlan'));
      
      const response = await subscriptionsService.cancelSubscription(user.id);
      
      if (response.success) {
        showSuccess(t('tabs.perfil.plans.planCanceled'));
        
        // Recarregar dados do usuário
        const updatedResponse = await subscriptionsService.getProfileWithPlan(user.id);
        if (updatedResponse.success && updatedResponse.data) {
          setCurrentUserPlan(updatedResponse.data);
        }
        
        // Atualizar status de plano pago
        setHasPaidPlan(false);
        
        // Recarregar a tela para atualizar a interface
        setTimeout(() => {
          router.replace('/auth/plans');
        }, 1500);
      } else {
        showError(response.error || t('tabs.perfil.plans.cancelError'));
      }
    } catch (error) {
      showError(t('tabs.perfil.plans.cancelError'));
    } finally {
      hidePreloader();
      setCancelingPlan(false);
    }
  };

  const closeCancelModal = () => {
    setCancelModalVisible(false);
  };

  const renderPlan = ({ item }: { item: SubscriptionPlan }) => {
    const isCurrentUserPlan = isCurrentPlan(item.id);
    
    return (
      <View style={[
        styles.planCard, 
        item.slug === 'semiannual' && styles.planPopular,
        isCurrentUserPlan && styles.planCurrent
      ]}>
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{item.name}</Text>
          <View style={styles.badgeContainer}>
            {isCurrentUserPlan && (
              <View style={styles.currentBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#fff" />
                <Text style={styles.currentText}>{t('tabs.perfil.plans.currentBadge')}</Text>
              </View>
            )}
            {item.is_popular && !isCurrentUserPlan && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>{t('tabs.perfil.plans.popular')}</Text>
              </View>
            )}
          </View>
        </View>
      <Text style={styles.planPrice}>
        {item.price_cents === 0 
          ? t('tabs.perfil.plans.free')
          : geolocationService.formatCurrency(item.price_cents / 100, (item.currency as Currency) || 'BRL')
        }
      </Text>
      <View style={styles.actionsRow}>
        {isCurrentUserPlan ? (
          <View style={styles.currentPlanActions}>
            <View style={styles.currentPlanButton}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={styles.currentPlanText}>{t('tabs.perfil.plans.activePlan')}</Text>
            </View>
            {/* Botão de cancelamento dentro do card do plano atual */}
            {!isFreePlan(item) && (
              <TouchableOpacity onPress={handleCancelPlan} style={styles.cancelPlanButton}>
                <Text style={styles.cancelPlanButtonText}>
                  {t('tabs.perfil.plans.cancelPlan')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : !isFreePlan(item) ? (
          <TouchableOpacity
            style={[styles.ctaButton, loading && { opacity: 0.6 }]}
            onPress={() => handleSelectPaid(item)}
            disabled={loading}
          >
            <Text style={styles.ctaText}>{t('tabs.perfil.plans.subscribeNow')}</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
        <TouchableOpacity style={styles.detailsButton} onPress={() => openDetails(item)}>
          <Text style={styles.detailsButtonText}>{t('tabs.perfil.plans.planDetails')}</Text>
        </TouchableOpacity>
      </View>
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('tabs.perfil.plans.title')}</Text>
        
        {/* Indicador do plano atual */}
        {/* {!loadingUserPlan && currentUserPlan?.plan && (
          <View style={styles.currentPlanIndicator}>
            <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
            <Text style={styles.currentPlanIndicatorText}>
              Plano atual: {currentUserPlan.plan.name}
            </Text>
          </View>
        )} */}
        
        {/* Indicador de localização */}
        {location && (
          <View style={styles.locationIndicator}>
            <Ionicons name="location" size={16} color="#4CAF50" />
            <Text style={styles.locationText}>
              {location.country} • {location.currency}
            </Text>
          </View>
        )}
        
        {detectingLocation && (
          <View style={styles.locationIndicator}>
            <Ionicons name="location-outline" size={16} color="#FF9800" />
            <Text style={styles.locationText}>{t('tabs.perfil.plans.detectingLocation')}</Text>
          </View>
        )}
      </View>
      
      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        renderItem={renderPlan}
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 12 }}
      />

      {/* Modal de detalhes do plano */}
      <Modal visible={detailsVisible} animationType="slide" transparent onRequestClose={closeDetails}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailsPlan?.name || t('tabs.perfil.plans.modalTitle')}</Text>
              <TouchableOpacity onPress={closeDetails} style={styles.modalClose}>
                <Ionicons name="close" size={22} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {!!detailsPlan?.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('tabs.perfil.plans.description')}</Text>
                  <Text style={styles.sectionText}>{detailsPlan.description}</Text>
                </View>
              )}

              {/* Features (se vier como array) */}
              {Array.isArray(detailsPlan?.features) && detailsPlan?.features?.length ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('tabs.perfil.plans.featuresIncluded')}</Text>
                  {detailsPlan!.features.map((feat: any, idx: number) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                      <Text style={styles.bulletText}>{String(feat)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* limits_config conhecido */}
              {detailsPlan?.limits_config ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{t('tabs.perfil.plans.planLimits')}</Text>
                  {typeof detailsPlan.limits_config === 'object' && (
                    <View style={{ gap: 6 }}>
                      {detailsPlan.limits_config.daily_chat_messages != null && (
                        <Text style={styles.sectionText}>{t('tabs.perfil.plans.dailyChatMessages')}: {detailsPlan.limits_config.daily_chat_messages}</Text>
                      )}
                      {detailsPlan.limits_config.max_favorites != null && (
                        <Text style={styles.sectionText}>{t('tabs.perfil.plans.maxFavorites')}: {detailsPlan.limits_config.max_favorites}</Text>
                      )}
                      {detailsPlan.limits_config.can_access_shopping_links != null && (
                        <Text style={styles.sectionText}>{t('tabs.perfil.plans.shoppingLinksAccess')}: {detailsPlan.limits_config.can_access_shopping_links ? t('tabs.perfil.plans.yes') : t('tabs.perfil.plans.no')}</Text>
                      )}
                      {detailsPlan.limits_config.can_access_premium_looks != null && (
                        <Text style={styles.sectionText}>{t('tabs.perfil.plans.premiumLooks')}: {detailsPlan.limits_config.can_access_premium_looks ? t('tabs.perfil.plans.yes') : t('tabs.perfil.plans.no')}</Text>
                      )}
                      {detailsPlan.limits_config.looks_initial_limit != null && (
                        <Text style={styles.sectionText}>{t('tabs.perfil.plans.initialLooksHome')}: {detailsPlan.limits_config.looks_initial_limit}</Text>
                      )}
                      {detailsPlan.limits_config.daily_look_reload_limit != null && (
                        <Text style={styles.sectionText}>{t('tabs.perfil.plans.dailyLookReloads')}: {detailsPlan.limits_config.daily_look_reload_limit}</Text>
                      )}
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeDetails}>
              <Text style={styles.modalPrimaryButtonText}>{t('tabs.perfil.plans.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de confirmação de cancelamento */}
      <Modal visible={cancelModalVisible} animationType="fade" transparent onRequestClose={closeCancelModal}>
        <View style={styles.modalBackdrop}>
          <View style={styles.cancelModalContainer}>
            <View style={styles.cancelModalHeader}>
              <Ionicons name="warning-outline" size={48} color="#FF6B6B" />
              <Text style={styles.cancelModalTitle}>
                {t('tabs.perfil.plans.cancelPlanTitle')}
              </Text>
            </View>
            
            <Text style={styles.cancelModalMessage}>
              {t('tabs.perfil.plans.cancelPlanMessage')}
            </Text>
            
            <View style={styles.cancelModalButtons}>
              <TouchableOpacity 
                style={styles.cancelModalKeepButton} 
                onPress={closeCancelModal}
                disabled={cancelingPlan}
              >
                <Text style={styles.cancelModalKeepButtonText}>
                  {t('tabs.perfil.plans.cancelPlanCancel')}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.cancelModalConfirmButton, cancelingPlan && { opacity: 0.6 }]} 
                onPress={confirmCancelPlan}
                disabled={cancelingPlan}
              >
                <Text style={styles.cancelModalConfirmButtonText}>
                  {t('tabs.perfil.plans.cancelPlanConfirm')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function PlansScreen() {
  return (
    <ProtectedRoute requireAuth={true}>
      <PlansContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center'
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 10 },
  currentPlanIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#a8a8a8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4CAF50'
  },
  currentPlanIndicatorText: {
    fontSize: 13,
    color: '#5e5e5e',
    marginLeft: 6,
    fontWeight: '600'
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E3F2FD'
  },
  locationText: {
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 6,
    fontWeight: '600'
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  planPopular: { borderWidth: 1, borderColor: '#6B46C1' },
  planCurrent: { borderWidth: 2, borderColor: '#ffffff', backgroundColor: '#ffffff' },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  popularBadge: { backgroundColor: '#6B46C1', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  popularText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  currentBadge: { backgroundColor: '#4CAF50', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  currentText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  planPrice: { marginTop: 6, fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  actionsRow: { marginTop: 12 },
  ctaButton: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  ctaText: { color: '#fff', fontWeight: '700' },
  currentPlanActions: { gap: 8 },
  currentPlanButton: { backgroundColor: '#F0F8FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#4CAF50' },
  currentPlanText: { color: '#4CAF50', fontWeight: '700' },
  cancelPlanButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF6B6B', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  cancelPlanButtonText: { color: '#FF6B6B', fontWeight: '600', fontSize: 14 },
  secondary: { alignItems: 'center', paddingVertical: 16 },
  secondaryText: { color: '#666', fontWeight: '600' },
  // Botão "Ver descrição do plano"
  detailsButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  detailsButtonText: {
    color: '#6B46C1',
    fontWeight: '600',
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalClose: {
    padding: 8,
  },
  modalContent: {
    paddingVertical: 8,
    gap: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bulletText: {
    fontSize: 14,
    color: '#1f2937',
  },
  modalPrimaryButton: {
    marginTop: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalPrimaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Botão de cancelamento
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  cancelButtonText: {
    color: '#999999',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  // Modal de cancelamento
  cancelModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: '90%',
    alignSelf: 'center',
  },
  cancelModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cancelModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 12,
    textAlign: 'center',
  },
  cancelModalMessage: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  cancelModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalKeepButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelModalKeepButtonText: {
    color: '#666666',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelModalConfirmButton: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelModalConfirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});


