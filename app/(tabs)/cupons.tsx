import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { CupomWithStore, cuponsService, Store } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Interface para compatibilidade com dados do banco
interface CouponItem extends CupomWithStore {
  isUsed?: boolean; // Campo adicional para controle de uso
}

export default function CuponsScreen() {
  const { user } = useAuth();
  const { t, currentLanguage } = useI18n();
  const { showPreloader, hidePreloader } = usePreloader();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [cupons, setCupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados mockados para demonstração (quando não há dados do banco)
  const mockCoupons: CouponItem[] = [
    {
      id: '1',
      title: t('tabs.cupons.items.fashionStore.title'),
      description: t('tabs.cupons.items.fashionStore.description'),
      code: 'FASHION20',
      discount: 20,
      store_id: '1',
      expiry_date: '2024-12-31T23:59:59Z',
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      isUsed: false,
      store: {
        id: '1',
        name: t('tabs.cupons.stores.fashionStore'),
        category: t('tabs.cupons.categories.clothing'),
        description: t('tabs.cupons.stores.fashionStoreDescription'),
        website_url: 'https://fashionstore.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: '2',
      title: t('tabs.cupons.items.sportsShop.title'),
      description: t('tabs.cupons.items.sportsShop.description'),
      code: 'SPORTS15',
      discount: 15,
      store_id: '2',
      expiry_date: '2025-01-15T23:59:59Z',
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      isUsed: false,
      store: {
        id: '2',
        name: t('tabs.cupons.stores.sportsShop'),
        category: t('tabs.cupons.categories.shoes'),
        description: t('tabs.cupons.stores.sportsShopDescription'),
        website_url: 'https://sportsshop.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
    {
      id: '3',
      title: t('tabs.cupons.items.beautyStore.title'),
      description: t('tabs.cupons.items.beautyStore.description'),
      code: 'BEAUTY25',
      discount: 25,
      store_id: '3',
      expiry_date: '2025-02-28T23:59:59Z',
      active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      isUsed: true,
      store: {
        id: '3',
        name: t('tabs.cupons.stores.beautyStore'),
        category: t('tabs.cupons.categories.cosmetics'),
        description: t('tabs.cupons.stores.beautyStoreDescription'),
        website_url: 'https://beautystore.com',
        active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    },
  ];

  const [categories, setCategories] = useState([
    { id: 'todos', title: t('tabs.cupons.categories.all') },
  ]);

  // Carregar categorias das lojas
  const loadCategories = async () => {
    try {
      const storesResponse = await cuponsService.getStores();
      if (storesResponse.success && storesResponse.data.length > 0) {
        // Extrair categorias únicas das lojas
        const uniqueCategories = [...new Set(storesResponse.data.map(store => store.category))];
        
        const categoryOptions = [
          { id: 'todos', title: t('tabs.cupons.categories.all') },
          ...uniqueCategories.map(category => ({
            id: category,
            title: category
          }))
        ];
        
        setCategories(categoryOptions);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      // Manter categorias padrão em caso de erro
      setCategories([
        { id: 'todos', title: t('tabs.cupons.categories.all') },
        { id: t('tabs.cupons.categories.clothing'), title: t('tabs.cupons.categories.clothing') },
        { id: t('tabs.cupons.categories.leather'), title: t('tabs.cupons.categories.leather') },
        { id: t('tabs.cupons.categories.beachwear'), title: t('tabs.cupons.categories.beachwear') },
        { id: t('tabs.cupons.categories.shoes'), title: t('tabs.cupons.categories.shoes') },
        { id: t('tabs.cupons.categories.bags'), title: t('tabs.cupons.categories.bags') },
        { id: t('tabs.cupons.categories.secondHand'), title: t('tabs.cupons.categories.secondHand') },
        { id: t('tabs.cupons.categories.cosmetics'), title: t('tabs.cupons.categories.cosmetics') },
        { id: t('tabs.cupons.categories.nutritionist'), title: t('tabs.cupons.categories.nutritionist') },
        { id: t('tabs.cupons.categories.candles'), title: t('tabs.cupons.categories.candles') },
      ]);
    }
  };

  // Carregar cupons do banco
  const loadCupons = async (category?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (category && category !== 'todos') {
        response = await cuponsService.getCuponsByCategory(category);
      } else {
        response = await cuponsService.getCupons();
      }

      if (response.success) {
        // Adicionar campo isUsed para compatibilidade
        const cuponsWithUsage = response.data.map(cupom => ({
          ...cupom,
          isUsed: false, // Por enquanto sempre false, pode ser implementado depois
        }));
        setCupons(cuponsWithUsage);
      } else {
        setError(response.error || t('tabs.cupons.error.loadCoupons'));
        // Usar dados mockados como fallback
        setCupons(mockCoupons);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
      setError(t('tabs.cupons.error.connection'));
      // Usar dados mockados como fallback
      setCupons(mockCoupons);
    } finally {
      setLoading(false);
    }
  };

  // Carregar cupons e categorias na inicialização
  useEffect(() => {
    loadCategories();
    loadCupons();
  }, []);

  // Carregar cupons quando categoria mudar
  useEffect(() => {
    if (!loading) {
      loadCupons(selectedCategory);
    }
  }, [selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCupons(selectedCategory);
    setRefreshing(false);
  };

  const handleCopyCode = (code: string) => {
    // Implementar cópia do código
    Alert.alert(
      t('tabs.cupons.alert.codeCopiedTitle'),
      `${t('tabs.cupons.alert.codeCopiedMessage')} "${code}"`,
      [{ text: t('tabs.cupons.alert.ok') }]
    );
    console.log('Copiando código:', code);
  };

  const handleUseCoupon = (coupon: CouponItem) => {
    // Implementar uso do cupom
    Alert.alert(
      t('tabs.cupons.alert.useCouponTitle'),
      `${t('tabs.cupons.alert.useCouponMessage')} "${coupon.title}" com código "${coupon.code}"?`,
      [
        { text: t('tabs.cupons.alert.cancel'), style: 'cancel' },
        { 
          text: t('tabs.cupons.alert.use'), 
          onPress: () => {
            Alert.alert(
              t('tabs.cupons.alert.couponUsedTitle'),
              `${t('tabs.cupons.alert.couponUsedMessage')} "${coupon.title}"`,
              [{ text: t('tabs.cupons.alert.ok') }]
            );
          }
        }
      ]
    );
    console.log('Usando cupom:', coupon.code);
  };

  const handleOpenStoreWebsite = (store: Store) => {
    if (store.website_url) {
      Alert.alert(
        t('tabs.cupons.alert.openWebsiteTitle'),
        `${t('tabs.cupons.alert.openWebsiteMessage')} ${store.name}?`,
        [
          { text: t('tabs.cupons.alert.cancel'), style: 'cancel' },
          {
            text: t('tabs.cupons.alert.open'),
            onPress: () => {
              Linking.openURL(store.website_url!).catch(() => {
                Alert.alert(
                  t('tabs.cupons.alert.error'),
                  t('tabs.cupons.alert.websiteError'),
                  [{ text: t('tabs.cupons.alert.ok') }]
                );
              });
            }
          }
        ]
      );
    } else {
      Alert.alert(
        t('tabs.cupons.alert.websiteUnavailableTitle'),
        t('tabs.cupons.alert.websiteUnavailableMessage'),
        [{ text: t('tabs.cupons.alert.ok') }]
      );
    }
  };

  const renderCouponItem = ({ item }: { item: CouponItem }) => {
    // Formatar data de expiração conforme idioma atual
    const resolveLocale = (lang: string) => {
      switch (lang) {
        case 'pt-br':
          return 'pt-BR';
        case 'en-us':
          return 'en-US';
        case 'es':
          return 'es-ES';
        default:
          return 'pt-BR';
      }
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(resolveLocale(currentLanguage));
    };

    // Formatar desconto
    const formatDiscount = (discount: number) => {
      return `${discount}% ${t('tabs.cupons.discount')}`;
    };

    // Status visual: considerar cupom expirado como "apagado"
    const now = new Date();
    const isExpired = item.expiry_date ? new Date(item.expiry_date) < now : false;
    const isInactive = item.isUsed || isExpired || item.active === false;

    return (
      <TouchableOpacity
        style={[styles.couponCard, isInactive && styles.couponCardUsed]}
        onPress={() => !isInactive && handleUseCoupon(item)}
        activeOpacity={0.8}
        disabled={isInactive}
      >
        <LinearGradient
          colors={isInactive ? ['#E5E7EB', '#F3F4F6'] : ['#1a1a1a', '#333333']}
          style={styles.couponGradient}
        >
          <View style={styles.couponHeader}>
            <View style={styles.couponInfo}>
              <Text style={[styles.couponTitle, isInactive && styles.couponTitleUsed]}>
                {item.title}
              </Text>
              <Text style={[styles.couponDescription, isInactive && styles.couponDescriptionUsed]}>
                {item.description}
              </Text>
            </View>
            {item.store?.logo_url && (
              <Image source={{ uri: item.store.logo_url }} style={styles.couponImage} />
            )}
          </View>

          <View style={styles.couponDetails}>
            <View style={styles.discountContainer}>
              <Text style={[styles.discountText, isInactive && styles.discountTextUsed]}>
                {formatDiscount(item.discount)}
              </Text>
            </View>

            <View style={styles.codeContainer}>
              <Text style={[styles.codeLabel, isInactive && styles.codeLabelUsed]}>
                {t('tabs.cupons.codeLabel')}
              </Text>
              <View style={styles.codeRow}>
                <Text style={[styles.codeText, isInactive && styles.codeTextUsed]}>
                  {item.code}
                </Text>
                {!isInactive && (
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={() => handleCopyCode(item.code)}
                  >
                    <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.couponFooter}>
                          <View style={styles.storeInfo}>
              <TouchableOpacity
                onPress={() => item.store && handleOpenStoreWebsite(item.store)}
                disabled={isInactive}
              >
                              <Text style={[styles.storeName, isInactive && styles.storeNameUsed]}>
                {item.store?.name || t('tabs.cupons.storeNameDefault')}
              </Text>
              </TouchableOpacity>
              <Text style={[styles.validUntil, isInactive && styles.validUntilUsed]}>
                {t('tabs.cupons.validUntil')}: {formatDate(item.expiry_date)}
              </Text>
            </View>
              
              {!isInactive ? (
                <TouchableOpacity style={styles.useButton}>
                  <Text style={styles.useButtonText}>{t('tabs.cupons.useButtonText')}</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <View style={styles.usedBadge}>
                  <Text style={styles.usedBadgeText}>{t('tabs.cupons.usedBadgeText')}</Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderCategoryItem = ({ item }: { item: { id: string; title: string } }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.categoryButtonActive,
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.categoryTextActive,
        ]}
      >
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>{t('tabs.cupons.title')}</Text>
                          {user && (
                <Text style={styles.welcomeUser}>
                  {t('tabs.cupons.welcomeUser')} {user.fullName?.split(' ')[0] || t('tabs.cupons.finder')}!
                </Text>
              )}
          </View>
        </View>
      </LinearGradient>

      {/* Categorias */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          renderItem={renderCategoryItem}
        />
      </View>

      {/* Lista de Cupons */}
      <FlatList
        data={cupons}
        keyExtractor={(item) => item.id}
        renderItem={renderCouponItem}
        contentContainerStyle={styles.couponsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1a1a1a']}
            tintColor="#1a1a1a"
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('tabs.cupons.loadingCoupons')}</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{error}</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{t('tabs.cupons.noCouponsFound')}</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
    letterSpacing: 1.5,
  },
  welcomeUser: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
    fontWeight: '500',
  },
  categoriesSection: {
    paddingVertical: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  categoryButton: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryButtonActive: {
    backgroundColor: '#1a1a1a',
    borderColor: '#1a1a1a',
  },
  categoryText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  couponsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  couponCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  couponCardUsed: {
    opacity: 0.7,
  },
  couponGradient: {
    padding: 20,
  },
  couponHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  couponInfo: {
    flex: 1,
    marginRight: 12,
  },
  couponTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  couponTitleUsed: {
    color: '#666666',
  },
  couponDescription: {
    fontSize: 14,
    color: '#E0E7FF',
    lineHeight: 20,
  },
  couponDescriptionUsed: {
    color: '#9CA3AF',
  },
  couponImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  couponDetails: {
    gap: 12,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  discountTextUsed: {
    color: '#666666',
  },
  minValueText: {
    fontSize: 14,
    color: '#E0E7FF',
    fontWeight: '500',
  },
  minValueTextUsed: {
    color: '#9CA3AF',
  },
  codeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
  },
  codeLabel: {
    fontSize: 12,
    color: '#E0E7FF',
    fontWeight: '600',
    marginBottom: 4,
  },
  codeLabelUsed: {
    color: '#9CA3AF',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  codeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  codeTextUsed: {
    color: '#666666',
  },
  copyButton: {
    padding: 4,
  },
  couponFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    textDecorationLine: 'underline',
  },
  storeNameUsed: {
    color: '#666666',
  },
  validUntil: {
    fontSize: 12,
    color: '#E0E7FF',
  },
  validUntilUsed: {
    color: '#9CA3AF',
  },
  useButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  useButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  usedBadge: {
    backgroundColor: '#9CA3AF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  usedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
}); 