import { Button, ProtectedRoute } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { Currency, GeolocationData, geolocationService, SubscriptionPlan, subscriptionsService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function PlansContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { showPreloader, hidePreloader, updateMessage } = usePreloader();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsPlan, setDetailsPlan] = useState<SubscriptionPlan | null>(null);
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(true);

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

  const handleSelectFree = async () => {
    setLoading(true);
    try {
      showPreloader('Atualizando plano...');
      const userId = user?.id;
      if (!userId) return;
      const r = await subscriptionsService.selectFreePlan(userId);
      if (r.success) router.replace('/(tabs)/home');
    } finally {
      hidePreloader();
      setLoading(false);
    }
  };

  const handleSelectPaid = async (plan: SubscriptionPlan) => {
    setLoading(true);
    try {
      showPreloader('Preparando checkout...');
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

  const renderPlan = ({ item }: { item: SubscriptionPlan }) => (
    <View style={[styles.planCard, item.slug === 'semiannual' && styles.planPopular]}>
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{item.name}</Text>
        {item.is_popular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
      </View>
      <Text style={styles.planPrice}>
        {item.price_cents === 0 
          ? 'Grátis' 
          : geolocationService.formatCurrency(item.price_cents / 100, (item.currency as Currency) || 'BRL')
        }
      </Text>
      <View style={styles.actionsRow}>
        {item.slug === 'free' ? (
          <Button title="Continuar Grátis" onPress={handleSelectFree} loading={loading} />
        ) : (
          <TouchableOpacity
            style={[styles.ctaButton, loading && { opacity: 0.6 }]}
            onPress={() => handleSelectPaid(item)}
            disabled={loading}
          >
            <Text style={styles.ctaText}>Assinar Agora</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity style={styles.detailsButton} onPress={() => openDetails(item)}>
        <Text style={styles.detailsButtonText}>Ver descrição do plano</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Escolha seu plano</Text>
        
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
            <Text style={styles.locationText}>Detectando sua localização...</Text>
          </View>
        )}
      </View>
      
      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        renderItem={renderPlan}
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 12 }}
      />
      <TouchableOpacity onPress={handleSelectFree} style={styles.secondary}>
        <Text style={styles.secondaryText}>Pular por enquanto</Text>
      </TouchableOpacity>

      {/* Modal de detalhes do plano */}
      <Modal visible={detailsVisible} animationType="slide" transparent onRequestClose={closeDetails}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{detailsPlan?.name || 'Detalhes do plano'}</Text>
              <TouchableOpacity onPress={closeDetails} style={styles.modalClose}>
                <Ionicons name="close" size={22} color="#111" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              {!!detailsPlan?.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Descrição</Text>
                  <Text style={styles.sectionText}>{detailsPlan.description}</Text>
                </View>
              )}

              {/* Features (se vier como array) */}
              {Array.isArray(detailsPlan?.features) && detailsPlan?.features?.length ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recursos inclusos</Text>
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
                  <Text style={styles.sectionTitle}>Limites do plano</Text>
                  {typeof detailsPlan.limits_config === 'object' && (
                    <View style={{ gap: 6 }}>
                      {detailsPlan.limits_config.daily_chat_messages != null && (
                        <Text style={styles.sectionText}>Mensagens diárias no chat: {detailsPlan.limits_config.daily_chat_messages}</Text>
                      )}
                      {detailsPlan.limits_config.max_favorites != null && (
                        <Text style={styles.sectionText}>Favoritos máximos: {detailsPlan.limits_config.max_favorites}</Text>
                      )}
                      {detailsPlan.limits_config.can_access_shopping_links != null && (
                        <Text style={styles.sectionText}>Acesso a links de compra: {detailsPlan.limits_config.can_access_shopping_links ? 'Sim' : 'Não'}</Text>
                      )}
                      {detailsPlan.limits_config.can_access_premium_looks != null && (
                        <Text style={styles.sectionText}>Looks premium: {detailsPlan.limits_config.can_access_premium_looks ? 'Sim' : 'Não'}</Text>
                      )}
                      {detailsPlan.limits_config.looks_initial_limit != null && (
                        <Text style={styles.sectionText}>Looks iniciais na Home: {detailsPlan.limits_config.looks_initial_limit}</Text>
                      )}
                      {detailsPlan.limits_config.daily_look_reload_limit != null && (
                        <Text style={styles.sectionText}>Recarregamentos diários de looks: {detailsPlan.limits_config.daily_look_reload_limit}</Text>
                      )}
                    </View>
                  )}
                </View>
              ) : null}
            </ScrollView>
            <TouchableOpacity style={styles.modalPrimaryButton} onPress={closeDetails}>
              <Text style={styles.modalPrimaryButtonText}>Fechar</Text>
            </TouchableOpacity>
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
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  popularBadge: { backgroundColor: '#6B46C1', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  popularText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  planPrice: { marginTop: 6, fontSize: 20, fontWeight: '800', color: '#1a1a1a' },
  actionsRow: { marginTop: 12 },
  ctaButton: { backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  ctaText: { color: '#fff', fontWeight: '700' },
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
});


