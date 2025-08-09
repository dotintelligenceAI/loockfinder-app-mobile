import { ProtectedRoute } from '@/components';
import { subscriptionsService } from '@/services';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';

function CheckoutContent() {
  const params = useLocalSearchParams<{ url?: string; planId?: string }>();

  useEffect(() => {
    const run = async () => {
      let checkoutUrl = params.url as string | undefined;
      if (!checkoutUrl && params.planId) {
        const res = await subscriptionsService.prepareCheckout(params.planId as string);
        if (res.success) checkoutUrl = res.url;
      }
      if (!checkoutUrl) {
        router.back();
        return;
      }
      const result = await WebBrowser.openBrowserAsync(checkoutUrl);
      // Após fechar o browser, verificar status no backend (simples: voltar para home)
      router.replace('/(tabs)/home');
    };
    run();
  }, [params]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}> 
        <ActivityIndicator size="large" color="#1a1a1a" />
        <Text style={styles.text}>Abrindo checkout...</Text>
      </View>
    </SafeAreaView>
  );
}

export default function CheckoutScreen() {
  return (
    <ProtectedRoute requireAuth={true}>
      <CheckoutContent />
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  text: { color: '#666', fontWeight: '600' },
});


