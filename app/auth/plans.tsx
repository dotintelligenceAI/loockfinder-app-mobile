import { Button, ProtectedRoute } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { SubscriptionPlan, subscriptionsService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function PlansContent() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await subscriptionsService.getActivePlans();
      if (res.success) setPlans(res.data);
    };
    load();
  }, []);

  const handleSelectFree = async () => {
    setLoading(true);
    try {
      const userId = user?.id;
      if (!userId) return;
      const r = await subscriptionsService.selectFreePlan(userId);
      if (r.success) router.replace('/(tabs)/home');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPaid = async (plan: SubscriptionPlan) => {
    setLoading(true);
    try {
      const res = await subscriptionsService.prepareCheckout(plan.id);
      if (res.success && res.url) {
        router.replace({ pathname: '/auth/checkout', params: { url: res.url } } as any);
      }
    } finally {
      setLoading(false);
    }
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
      <Text style={styles.planPrice}>{item.price_cents === 0 ? 'Grátis' : `R$ ${(item.price_cents / 100).toFixed(2)}`}</Text>
      <View style={styles.actionsRow}>
        {item.slug === 'free' ? (
          <Button title="Continuar Grátis" onPress={handleSelectFree} loading={loading} />
        ) : (
          <TouchableOpacity style={styles.ctaButton} onPress={() => handleSelectPaid(item)}>
            <Text style={styles.ctaText}>Assinar Agora</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Escolha seu plano</Text>
      <FlatList
        data={plans}
        keyExtractor={(p) => p.id}
        renderItem={renderPlan}
        contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 12 }}
      />
      <TouchableOpacity onPress={handleSelectFree} style={styles.secondary}>
        <Text style={styles.secondaryText}>Pular por enquanto</Text>
      </TouchableOpacity>
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
  title: { fontSize: 24, fontWeight: '800', padding: 20 },
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
});


