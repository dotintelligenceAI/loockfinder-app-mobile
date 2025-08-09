import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { ShoppingCategory, ShoppingLink, shoppingLinksService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
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
  priceLabel: string;
  originalPriceLabel?: string;
  discountLabel?: string;
  store?: string;
}

export default function LinksScreen() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [categories, setCategories] = useState<ShoppingCategory[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar categorias e links do Supabase
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const cats = await shoppingLinksService.getCategories();
        if (cats.success) {
          setCategories([{ id: 'todos', name: t('tabs.links.categories.all'), slug: 'all' } as any, ...cats.data]);
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
  }, [selectedCategory]);

  const mapLinksForDisplay = (data: ShoppingLink[]): LinkItem[] => {
    return data.map((l) => ({
      ...l,
      image: (l as any).image_url || '',
      priceLabel: l.price != null ? formatCurrency(l.price, (l.currency as any) || 'BRL') : '',
      originalPriceLabel:
        l.original_price != null ? formatCurrency(l.original_price, (l.currency as any) || 'BRL') : undefined,
      discountLabel:
        l.price != null && l.original_price != null && l.original_price > 0
          ? `${Math.round(((l.original_price - l.price) / l.original_price) * 100)}% OFF`
          : undefined,
    }));
  };

  const enrichWithPreviewImages = async (items: LinkItem[]): Promise<LinkItem[]> => items;

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
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
      style={styles.linkCard}
      onPress={() => handleLinkPress(item)}
      activeOpacity={0.9}
    >
      {/* Conteúdo (sem imagem) */}
      <View style={styles.linkContent}>
        {/* Cabeçalho: título + domínio e badges */}
        <View style={styles.headerRowTextOnly}>
          <View style={{ flex: 1 }}>
            <Text style={styles.titleTextOnly} numberOfLines={2}>
              {item.title || getHostname(item.url)}
            </Text>
            <Text style={styles.domainTextOnly}>{getHostname(item.url)}</Text>
          </View>
          <View style={styles.badgesRight}>
            {item.discountLabel && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{item.discountLabel}</Text>
              </View>
            )}
            {item.is_url_valid === false && (
              <View style={styles.invalidBadgeInline}>
                <Ionicons name="warning" size={12} color="#fff" />
                <Text style={styles.invalidBadgeText}>Link inválido</Text>
              </View>
            )}
          </View>
        </View>

        {/* Preço atual e original */}
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>{item.priceLabel}</Text>
          {item.originalPriceLabel && (
            <Text style={styles.originalPrice}>{item.originalPriceLabel}</Text>
          )}
        </View>

        {/* Descrição */}
        {!!item.description && (
          <Text style={styles.linkDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        {/* Rodapé: loja, clicks e botão */}
        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            {!!item.store && <Text style={styles.storeName}>{item.store}</Text>}
            {typeof item.click_count === 'number' && (
              <View style={styles.clicksBadge}>
                <Ionicons name="eye-outline" size={14} color="#666" />
                <Text style={styles.clicksText}>{item.click_count}</Text>
            </View>
          )}
        </View>
        
          <TouchableOpacity style={styles.buyButton} onPress={() => handleLinkPress(item)}>
            <Text style={styles.buyButtonText}>Comprar</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
            <Text style={styles.title}>LINKS DE COMPRA</Text>
            {user && (
              <Text style={styles.welcomeUser}>
                Encontre as melhores ofertas, {user.fullName?.split(' ')[0] || 'Finder'}!
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
      <FlatList
        data={links}
        keyExtractor={(item) => item.id}
        renderItem={renderLinkItem}
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  linkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },
  linkContent: {
    padding: 16,
  },
  headerRowTextOnly: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  titleTextOnly: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  domainTextOnly: { color: '#666', fontSize: 12, marginTop: 2 },
  domainText: { color: '#E5E7EB', fontSize: 12, marginTop: 2 },
  linkDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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