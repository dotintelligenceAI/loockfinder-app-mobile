import { PremiumOverlay } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { ShoppingCategory, ShoppingLink, shoppingLinksService, subscriptionsService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

interface LinkItem extends ShoppingLink {
  // Campos de exibição derivados
  image: string;
  store?: string;
}

export default function LinksScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  
  // Hook para controle de acesso à feature
  const featureAccess = useFeatureAccess(
    t('tabs.links.featureName'),
    t('tabs.links.featureDescription'),
    'link'
  );
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [canAccess, setCanAccess] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar categorias e links do Supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Guard de acesso conforme plano
        if (user?.id) {
          const prof = await subscriptionsService.getProfileWithPlan(user.id);
          if (prof.success && prof.data?.plan?.limits_config) {
            setCanAccess(Boolean(prof.data.plan.limits_config.can_access_shopping_links));
          } else {
            setCanAccess(false);
          }
        }
        const cats = await shoppingLinksService.getCategories();
        if (cats.success) {
          setCategories([{ id: 'todos', name: t('All'), slug: 'all' } as any, ...cats.data]);
        }
        const lk = await shoppingLinksService.getLinksByCategory();
        if (lk.success) {
          const mapped = mapLinksForDisplay(lk.data);
          setLinks(await enrichWithPreviewImages(mapped));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadByCategory = async () => {
      // Verificar se o usuário tem acesso
      if (!featureAccess.canAccess) {
        return; // O modal será mostrado automaticamente pelo hook após 5 segundos
      }

      setLoading(true);
      try {
        const lk = await shoppingLinksService.getLinksByCategory(selectedCategory);
        if (lk.success) {
          const mapped = mapLinksForDisplay(lk.data);
          setLinks(await enrichWithPreviewImages(mapped));
        }
      } finally {
        setLoading(false);
      }
    };
    loadByCategory();
  }, [selectedCategory, featureAccess.canAccess]);

  const mapLinksForDisplay = (data: ShoppingLink[]): LinkItem[] => {
    return data.map((l) => ({
      ...l,
      image: (l as any).image_url || '',
    }));
  };

  const enrichWithPreviewImages = async (items: LinkItem[]): Promise<LinkItem[]> => {
    // Para cada item, tentar extrair preview da URL ou usar fallback
    return Promise.all(items.map(async item => {
      if (item.image) {
        // Se já tem imagem, usar ela
        return item;
      }
      
      // Tentar extrair imagem real do link
      const extractedImage = await extractImageFromUrl(item.url);
      
      return {
        ...item,
        image: extractedImage || generateFallbackImage(item.url, item.title)
      };
    }));
  };

  const extractImageFromUrl = async (url?: string | null): Promise<string | null> => {
    if (!url) return null;
    
    try {
      // Para alguns domínios conhecidos, podemos tentar extrair a imagem diretamente
      const hostname = getHostname(url);
      
      // Amazon - tentar extrair ASIN
      if (hostname.includes('amazon.com')) {
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
          const asin = asinMatch[1];
          return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.L.jpg`;
        }
      }
      
      // Mercado Livre - tentar extrair ID do produto
      if (hostname.includes('mercadolivre.com.br') || hostname.includes('mercadolibre.com')) {
        const mlbMatch = url.match(/MLB-?(\d+)/i);
        if (mlbMatch) {
          // Não temos acesso direto às imagens do ML, usar placeholder
          return null;
        }
      }
      
      // Para outros sites, tentar usar meta tags (simulado)
      // Em uma implementação real, você faria uma requisição HTTP para extrair meta tags
      return null;
      
    } catch (error) {
      console.log('Erro ao extrair imagem:', error);
      return null;
    }
  };

  const generateFallbackImage = (url?: string | null, title?: string | null): string => {
    // Usar ícone do app como fallback para todos os casos
    return 'fallback';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const lk = await shoppingLinksService.getLinksByCategory(selectedCategory);
      if (lk.success) {
        const mapped = mapLinksForDisplay(lk.data);
        setLinks(await enrichWithPreviewImages(mapped));
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleLinkPress = async (link: LinkItem) => {
    if (!link.url) return;
    try {
      await WebBrowser.openBrowserAsync(link.url);
    } catch {
      Linking.openURL(link.url).catch(() => {});
    }
  };

  const getHostname = (url?: string | null) => {
    if (!url) return '';
    try {
      const { hostname } = new URL(url);
      return hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const renderLinkItem = ({ item }: { item: LinkItem }) => (
    <TouchableOpacity
      style={styles.linkItem}
      onPress={() => handleLinkPress(item)}
      activeOpacity={0.8}
    >
      {/* Imagem do produto */}
      {item.image && item.image !== 'fallback' ? (
        <Image 
          source={{ uri: item.image }} 
          style={styles.linkImage}
          resizeMode="cover"
        />
      ) : (
        <Image 
          source={require('@/assets/images/icon-app.png')} 
          style={styles.linkImage}
          resizeMode="contain"
        />
      )}

      {/* Gradiente overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.linkGradient}
      />

      {/* Badges no topo */}
      <View style={styles.linkBadges}>
        {item.is_url_valid === false && (
          <View style={styles.invalidBadge}>
            <Ionicons name="warning" size={10} color="#fff" />
          </View>
        )}
      </View>

      {/* Informações na parte inferior */}
      <View style={styles.linkInfo}>
        <Text style={styles.linkTitle} numberOfLines={2}>
          {item.title || getHostname(item.url)}
        </Text>
        <Text style={styles.linkDomain}>{getHostname(item.url)}</Text>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.title}>{t('tabs.links.headerTitle')}</Text>
            {user && (
              <Text style={styles.welcomeUser}>
                {t('tabs.links.welcomeUserPrefix')} {user.fullName?.split(' ')[0] || 'Finder'}!
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Categorias */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={categories.map((c) => ({ id: c.id, title: c.name }))}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          renderItem={renderCategoryItem}
        />
      </View>

      {/* Lista de Links */}
      <View style={{ flex: 1, position: 'relative' }}>
        <FlatList
          data={links}
          keyExtractor={(item) => item.id}
          renderItem={renderLinkItem}
          numColumns={2}
          columnWrapperStyle={styles.linksGrid}
          contentContainerStyle={styles.linksList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1a1a1a']}
              tintColor="#1a1a1a"
            />
          }
          showsVerticalScrollIndicator={false}
        />
        
        {/* Overlay Premium */}
        {!canAccess && (
          <PremiumOverlay
            featureName={t('tabs.links.featureName')}
            iconName="link"
          />
        )}
      </View>

      
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
  linksList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  linksGrid: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  linkItem: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },
  linkImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  linkGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  linkBadges: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 4,
  },
  linkInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 18,
    marginBottom: 4,
  },
  linkDomain: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  // Manter estilos antigos para compatibilidade
  linkContent: {
    padding: 16,
  },
  headerRowTextOnly: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  titleTextOnly: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  domainTextOnly: { color: '#666', fontSize: 12, marginTop: 2 },
  domainText: { color: '#E5E7EB', fontSize: 12, marginTop: 2 },
  linkDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 8,
  },
  badgesRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  invalidBadgeInline: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invalidBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  invalidBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  storeName: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  clicksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clicksText: { color: '#666', fontSize: 12, fontWeight: '600' },
  buyButton: {
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
}); 