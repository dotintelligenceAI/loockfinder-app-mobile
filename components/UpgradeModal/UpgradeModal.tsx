import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionsService } from '../../services/subscriptionsService';

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgradeSuccess?: () => void;
}

interface IAPProduct {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  localizedPrice: string;
  type: 'consumable' | 'non_consumable' | 'auto_renewable_subscription';
}

interface IAPSubscription {
  productId: string;
  price: string;
  currency: string;
  title: string;
  description: string;
  localizedPrice: string;
  introductoryPrice?: string;
  subscriptionPeriod?: string;
}

export default function UpgradeModal({ 
  visible, 
  onClose, 
  onUpgradeSuccess 
}: UpgradeModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [subscriptions, setSubscriptions] = useState<IAPSubscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadIAPProducts();
    }
  }, [visible]);

  const loadIAPProducts = async () => {
    try {
      setLoading(true);
      const result = await subscriptionsService.getIAPProducts();
      
      if (result.success) {
        setProducts(result.products || []);
        setSubscriptions(result.subscriptions || []);
      } else {
        console.error('Erro ao carregar produtos IAP:', result.error);
        Alert.alert('Erro', 'Não foi possível carregar os planos disponíveis');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      Alert.alert('Erro', 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
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

      // Usar subscriptionsService que já tem a lógica inteligente
      const result = await subscriptionsService.prepareCheckout(productId, user.id);

      if (result.success) {
        Alert.alert(
          'Sucesso! 🎉',
          'Sua compra foi processada com sucesso! Agora você tem acesso a todos os recursos premium.',
          [
            {
              text: 'OK',
              onPress: () => {
                onUpgradeSuccess?.();
                onClose();
              }
            }
          ]
        );
      } else {
        if (result.error?.includes('canceled')) {
          // Usuário cancelou, não mostrar erro
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
          Alert.alert(
            'Compras restauradas! 🎉',
            `${result.restoredCount} compra(s) restaurada(s) com sucesso.`
          );
          onUpgradeSuccess?.();
        } else {
          Alert.alert('Nenhuma compra encontrada', 'Não foram encontradas compras para restaurar.');
        }
      } else {
        Alert.alert('Erro', result.error || 'Erro ao restaurar compras');
      }
    } catch (error) {
      console.error('Erro ao restaurar compras:', error);
      Alert.alert('Erro', 'Erro ao restaurar compras');
    } finally {
      setLoading(false);
    }
  };

  const renderProduct = (product: IAPProduct) => (
    <TouchableOpacity
      key={product.productId}
      style={[
        styles.planCard,
        selectedPlan === product.productId && styles.selectedPlan
      ]}
      onPress={() => handlePurchase(product.productId, false)}
      disabled={loading}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{product.title}</Text>
        <Text style={styles.planPrice}>{product.localizedPrice}</Text>
      </View>
      <Text style={styles.planDescription}>{product.description}</Text>
      {selectedPlan === product.productId && (
        <ActivityIndicator size="small" color="#007AFF" style={styles.loading} />
      )}
    </TouchableOpacity>
  );

  const renderSubscription = (subscription: IAPSubscription) => (
    <TouchableOpacity
      key={subscription.productId}
      style={[
        styles.planCard,
        selectedPlan === subscription.productId && styles.selectedPlan
      ]}
      onPress={() => handlePurchase(subscription.productId, true)}
      disabled={loading}
    >
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{subscription.title}</Text>
        <Text style={styles.planPrice}>{subscription.localizedPrice}</Text>
      </View>
      <Text style={styles.planDescription}>{subscription.description}</Text>
      {subscription.introductoryPrice && (
        <Text style={styles.introPrice}>
          Preço introdutório: {subscription.introductoryPrice}
        </Text>
      )}
      {selectedPlan === subscription.productId && (
        <ActivityIndicator size="small" color="#007AFF" style={styles.loading} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upgrade Premium</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>
            Desbloqueie todos os recursos premium do LookFinder
          </Text>

          {loading && !selectedPlan && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Carregando planos...</Text>
            </View>
          )}

          {/* Produtos únicos (ex: lifetime) */}
          {products.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Compra Única</Text>
              {products.map(renderProduct)}
            </View>
          )}

          {/* Assinaturas */}
          {subscriptions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Assinaturas</Text>
              {subscriptions.map(renderSubscription)}
            </View>
          )}

          {/* Botão de restaurar compras */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
            disabled={loading}
          >
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <Text style={styles.restoreButtonText}>Restaurar Compras</Text>
          </TouchableOpacity>

          {/* Informações sobre IAP */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              💳 As compras são processadas pela App Store/Google Play
            </Text>
            <Text style={styles.infoText}>
              🔄 Assinaturas renovam automaticamente
            </Text>
            <Text style={styles.infoText}>
              ⚙️ Gerencie suas assinaturas nas configurações do dispositivo
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  planCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPlan: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  introPrice: {
    fontSize: 12,
    color: '#28a745',
    marginTop: 5,
    fontWeight: '500',
  },
  loading: {
    marginTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  restoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
  },
  restoreButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontWeight: '500',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 15,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
    lineHeight: 16,
  },
});