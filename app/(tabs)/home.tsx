import { Gallery4Item } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { categoriesService, favoritesService, subcategoriesService, subscriptionsService } from '@/services';
import { Look, looksService } from '@/services/looksService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewToken
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import { SafeAreaView as SafeAreaViewCompat } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { user } = useAuth();
  const { showPreloader, hidePreloader } = usePreloader();
  const { t } = useI18n();
  const [categories, setCategories] = useState<Gallery4Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [looksLimit, setLooksLimit] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchEnabled, setIsSearchEnabled] = useState(true);
  const PAGE_SIZE = 100;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Gallery4Item[]>([]);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [favoritedLooks, setFavoritedLooks] = useState<Set<string>>(new Set());
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [isFreeUser, setIsFreeUser] = useState<boolean>(true);

  const onViewableItemsChanged = React.useRef(({
    viewableItems
  }: { viewableItems: Array<ViewToken> }) => {
    setVisibleItems((prev) => {
      const newSet = new Set(prev);
      viewableItems.forEach((vi: ViewToken) => newSet.add((vi.item as Look).id));
      return newSet;
    });
  }).current;

  useEffect(() => {
    loadCategories();
    loadLooks(true);
    loadFavoritedLooks();
    (async () => {
      if (user?.id) {
        const res = await subscriptionsService.getProfileWithPlan(user.id);
        if (res.success) {
          // Usuário é gratuito se tem plano free E status free
          const isFree = res.data?.plan?.slug === 'free' && res.data?.subscription_status === 'free';
          setIsFreeUser(isFree);
          setIsSearchEnabled(!isFree);
        }
      }
    })();
  }, []);

  useEffect(() => {
    // Se está em modo busca, não disparar carregamento por subcategoria
    if (searchQuery.trim().length > 0) return;
    if (selectedSubcategory) {
      loadLooksBySubcategory(selectedSubcategory);
    } else {
      loadLooks(true);
    }
  }, [selectedSubcategory, searchQuery]);

  // Função para executar busca manual
  const handleSearch = async () => {
    if (!isSearchEnabled) return;
    const query = searchQuery.trim();
    
    if (query.length === 0) {
      if (selectedSubcategory) await loadLooksBySubcategory(selectedSubcategory);
      else await loadLooks(true);
      return;
    }

    // Só buscar se tiver pelo menos 3 caracteres
    if (query.length >= 3) {
      await performIntelligentSearch(query);
    }
  };

  const loadCategories = async () => {
    try {
      setLoading(true);
      showPreloader('Carregando categorias...');
      const response = await categoriesService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
      hidePreloader();
    }
  };

  const loadLooks = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setHasMore(true);
        setLooksLimit(PAGE_SIZE);
        setLoading(true);
        showPreloader('Carregando looks...');
      } else {
        // Para "carregar mais", não mostrar preloader para manter fluidez
        setLoading(true);
      }
      
      let data: Look[] = [];
      if (selectedCategory && selectedCategory !== 'todos') {
        data = await looksService.getLooksByCategory(selectedCategory, user?.id);
      } else {
        data = await looksService.getLooks(user?.id);
      }
      
      const paginated = data.slice(0, looksLimit);
      
      if (reset) {
        // Reset: substitui todos os looks
        setLooks(paginated);
      } else {
        // Carregar mais: adiciona novos looks aos existentes
        const currentLooksCount = looks.length;
        const newLooks = paginated.slice(currentLooksCount);
        setLooks(prev => [...prev, ...newLooks]);
      }
      
      setHasMore(data.length > paginated.length);
      if (!reset) setPage((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao carregar looks:', error);
    } finally {
      setLoading(false);
      if (reset) hidePreloader();
    }
  };

  const loadLooksBySubcategory = async (subcategoryId: string) => {
    try {
      setLoading(true);
      const data = await looksService.getLooksBySubcategory(subcategoryId, user?.id);
      const paginated = data.slice(0, looksLimit);
      setLooks(paginated);
      setHasMore(data.length > paginated.length);
    } catch (error) {
      console.error('Erro ao carregar looks da subcategoria:', error);
    } finally {
      setLoading(false);
    }
  };

  const performIntelligentSearch = async (query: string) => {
    try {
      setLoading(true);
      showPreloader('Buscando looks...');

      console.log('🔍 Busca inteligente para:', query);

      // Criar dicionário de palavras-chave para matching inteligente
      const keywords = {
        // Ocasiões
        casamento: ['ocasiao_uso'],
        festa: ['ocasiao_uso'],
        trabalho: ['ocasiao_uso'],
        casual: ['ocasiao_uso'],
        formal: ['ocasiao_uso'],
        praia: ['ocasiao_uso'],
        academia: ['ocasiao_uso'],
        
        // Cores
        preto: ['cores'],
        branco: ['cores'],
        vermelho: ['cores'],
        azul: ['cores'],
        verde: ['cores'],
        rosa: ['cores'],
        amarelo: ['cores'],
        
        // Peças
        vestido: ['partes'],
        blusa: ['partes'],
        calça: ['partes'],
        saia: ['partes'],
        shorts: ['partes'],
        jaqueta: ['partes'],
        blazer: ['partes'],
        
        // Acessórios
        bolsa: ['acessorios'],
        sapato: ['acessorios'],
        óculos: ['acessorios'],
        colar: ['acessorios'],
        brinco: ['acessorios'],
        
        // Estilo/Tendências
        vintage: ['tendencias'],
        moderno: ['tendencias'],
        boho: ['tendencias'],
        minimalista: ['tendencias'],
      };

      // Analisar query para identificar categorias relevantes
      const queryWords = query.toLowerCase().split(' ');
      const matchedCategories = new Set<string>();
      
      queryWords.forEach(word => {
        Object.entries(keywords).forEach(([keyword, categories]) => {
          if (word.includes(keyword) || keyword.includes(word)) {
            categories.forEach(cat => matchedCategories.add(cat));
            console.log(`✅ Palavra "${word}" → Categoria "${categories.join(', ')}"`);
          }
        });
      });

      // Se não encontrou categorias específicas, buscar em todas
      if (matchedCategories.size === 0) {
        console.log('🔍 Busca geral em todas as categorias');
        await performGeneralSearch(query);
        return;
      }

      console.log('🎯 Categorias identificadas:', Array.from(matchedCategories));

      // Buscar looks nas categorias identificadas
      let collected: Look[] = [];
      const categoriesRes = await categoriesService.getCategories();
      const categoriesList = categoriesRes?.data || [];

      for (const categoryType of matchedCategories) {
        // Encontrar categoria pelo type
        const category = categoriesList.find(cat => cat.type === categoryType);
        if (category) {
          try {
            const categoryLooks = await looksService.getLooksByCategory(category.id, user?.id);
            collected = collected.concat(categoryLooks);
            
            // Buscar também nas subcategorias
            const subcats = await subcategoriesService.getSubcategoriesByCategory(category.id);
            for (const subcat of subcats) {
              // Verificar se subcategoria é relevante para a busca
              if (subcats.some(s => queryWords.some(word => 
                s.title?.toLowerCase().includes(word) || word.includes(s.title?.toLowerCase() || '')
              ))) {
                const subcatLooks = await looksService.getLooksBySubcategory(subcat.id, user?.id);
                collected = collected.concat(subcatLooks);
              }
            }
          } catch (error) {
            console.error(`Erro ao buscar looks da categoria ${categoryType}:`, error);
          }
        }
      }

      // Remover duplicados
      const dedupMap = new Map<string, Look>();
      collected.forEach((l) => dedupMap.set(l.id, l));
      const deduped = Array.from(dedupMap.values());

      console.log(`🎯 Encontrados ${deduped.length} looks para "${query}"`);

      setLooks(deduped.slice(0, 100));
      setHasMore(deduped.length > 100);
      setLooksLimit(100);
    } catch (error) {
      console.error('Erro na busca inteligente:', error);
      await performGeneralSearch(query);
    } finally {
      setLoading(false);
      hidePreloader();
    }
  };

  const performGeneralSearch = async (query: string) => {
    try {
      // Busca geral (código original como fallback)
      const matchedSubcatIds: string[] = [];
      const matchedCategoryIds: string[] = [];

      const categoriesRes = await categoriesService.getCategories();
      const categoriesList = categoriesRes?.data || [];
      for (const cat of categoriesList) {
        if (cat.title?.toLowerCase().includes(query.toLowerCase())) {
          matchedCategoryIds.push(cat.id);
        }
        try {
          const subs = await subcategoriesService.getSubcategoriesByCategory(cat.id);
          subs.forEach((s) => {
            if (s.title?.toLowerCase().includes(query.toLowerCase())) {
              matchedSubcatIds.push(s.id);
            }
          });
        } catch {}
      }

      const uniqueSubIds = Array.from(new Set(matchedSubcatIds));
      const uniqueCatIds = Array.from(new Set(matchedCategoryIds));

      let collected: Look[] = [];
      for (const subId of uniqueSubIds) {
        try {
          const ls = await looksService.getLooksBySubcategory(subId, user?.id);
          collected = collected.concat(ls);
        } catch {}
      }
      for (const catId of uniqueCatIds) {
        try {
          const lc = await looksService.getLooksByCategory(catId, user?.id);
          collected = collected.concat(lc);
        } catch {}
      }

      // Remover duplicados por id
      const dedupMap = new Map<string, Look>();
      collected.forEach((l) => dedupMap.set(l.id, l));
      const deduped = Array.from(dedupMap.values());

      setLooks(deduped.slice(0, 100));
      setHasMore(deduped.length > 100);
      setLooksLimit(100);
    } catch (error) {
      console.error('Erro ao buscar looks:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    await loadLooks(true);
    await loadFavoritedLooks();
    setRefreshing(false);
  };

  const handleCategoryPress = async (category: Gallery4Item | null) => {
    setSelectedCategory(category ? category.id : null);
    setShowSubcategories(false);
    setSubcategories([]);
    setSelectedSubcategory(null);
    if (category && category.id !== 'todos') {
      try {
        setLoading(true);
        const data = await subcategoriesService.getSubcategoriesByCategory(category.id);
        setSubcategories(data);
        setShowSubcategories(true);
      } catch (error) {
        console.error('Erro ao carregar subcategorias:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLoadMore = () => {
    // Só carregar mais se não estiver carregando e houver mais conteúdo
    if (!loading && hasMore) {
      console.log('📱 Carregando mais 100 looks...');
      setLooksLimit(prev => prev + PAGE_SIZE);
      loadLooks();
    }
  };

  // Função otimizada para mudança de texto de busca
  const handleSearchChange = useCallback((text: string) => {
    if (!isSearchEnabled) return;
    setSearchQuery(text);
  }, [isSearchEnabled]);

  const checkIfLookIsFavorited = async (lookId: string) => {
    if (!user?.id) return false;
    try {
      return await favoritesService.isLookFavorited(user.id, lookId);
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  };

  const loadFavoritedLooks = async () => {
    if (!user?.id) return;
    try {
      const favoritesResponse = await favoritesService.getUserFavorites(user.id);
      if (favoritesResponse.success) {
        const favoritedIds = new Set(favoritesResponse.data.map(fav => fav.look_id));
        setFavoritedLooks(favoritedIds);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    }
  };

  const handleToggleFavorite = async (lookId: string) => {
    if (!user?.id) return;
    
    try {
      const result = await favoritesService.toggleFavorite(user.id, lookId);
      
      if (result.success) {
        // Atualizar estado local
        setFavoritedLooks(prev => {
          const newSet = new Set(prev);
          if (result.isFavorited) {
            newSet.add(lookId);
          } else {
            newSet.delete(lookId);
          }
          return newSet;
        });
      } else {
        console.error('Erro ao favoritar:', result.error);
      }
    } catch (error) {
      console.error('Erro ao favoritar:', error);
    }
  };

  const renderLook = ({ item }: { item: Look }) => {
    const isFavorited = favoritedLooks.has(item.id);
    
    return (
      <Animatable.View 
        animation="fadeInUp" 
        duration={600}
        style={styles.lookItem}
      >
        <TouchableOpacity 
          onPress={() => {
            setSelectedImage(item.image_url);
            setSelectedLookId(item.id);
            setModalVisible(true);
          }}
          style={styles.lookTouchable}
        >
          <Image
            source={{ uri: item.image_url }}
            style={styles.lookImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.lookGradient}
          />
          <TouchableOpacity 
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              handleToggleFavorite(item.id);
            }}
          >
            <Ionicons 
              name={isFavorited ? "heart" : "heart-outline"} 
              size={20} 
              color={isFavorited ? "#FF6B6B" : "#FFFFFF"} 
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animatable.View>
    );
  };


  const renderSubcategories = () => (
    showSubcategories && subcategories.length > 0 && (
      <View style={styles.subcategoriesWrapper}>
        <FlatList
          data={subcategories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subcategoriesContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.subcategoryButton,
                selectedSubcategory === item.id && styles.subcategoryButtonActive,
              ]}
              onPress={() => setSelectedSubcategory(item.id)}
            >
              <Text
                style={[
                  styles.subcategoryText,
                  selectedSubcategory === item.id && styles.subcategoryTextActive,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    )
  );

  const renderHeader = useCallback(() => (
    <View style={styles.headerWrapper}>
      {/* Header principal */}
      <LinearGradient
        colors={['#FFFFFF', '#F8F9FA']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.title}>LOOKFINDER</Text>
              {user && (
                <Text style={styles.welcomeUser}>
                  {t('tabs.home.welcome')}, {user.fullName?.split(' ')[0] || 'Finder'}! 
                </Text>
              )}
            </View>

          </View>

          {/* Barra de busca melhorada */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999999" />
              <TextInput
                style={styles.searchInput}
                placeholder={t('tabs.home.searchPlaceholder')}
                placeholderTextColor="#999999"
                value={searchQuery}
                onChangeText={handleSearchChange}
                editable={isSearchEnabled}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
            </View>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={!isSearchEnabled || loading}
            >
              <Ionicons name="search" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
        </View>
      </LinearGradient>

      {/* Categorias */}
      <View style={styles.categoriesSection}>
                  <FlatList
            data={[{ id: 'todos', title: t('tabs.home.allCategories'), description: '', type: '', image_url: '' }, ...categories]}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.categoryButtonActive,
              ]}
              onPress={() => handleCategoryPress(item.id === 'todos' ? null : item)}
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
          )}
        />
      </View>

      {/* Subcategorias */}
      {renderSubcategories()}

      {/* Stats e inspiração */}
      <View style={styles.statsSection}>
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{looks.length}</Text>
            <Text style={styles.statsLabel}>{t('tabs.home.noLooks')}</Text>
          </View>
          <View style={styles.inspirationContainer}>
            <View style={styles.inspirationIcon}>
              <Ionicons name="sparkles" size={18} color="#000000" />
            </View>
            <Text style={styles.inspirationText}>{t('tabs.home.inspiration')}</Text>
          </View>
        </View>
      </View>
    </View>
  ), [user, t, searchQuery, isSearchEnabled, categories, subcategories, showSubcategories, selectedCategory, selectedSubcategory, looks, handleSearchChange]);

  return (
    <SafeAreaViewCompat style={styles.container} edges={['top','left','right']}>
      <FlatList
        data={looks}
        keyExtractor={(item) => item.id}
        renderItem={renderLook}
        numColumns={2}
        columnWrapperStyle={styles.looksGrid}
        ListFooterComponent={
          <>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#1a1a1a" />
                <Text style={styles.loadingText}>Carregando looks...</Text>
              </View>
            ) : null}
            
            {/* Mensagem informativa para usuários free quando visualizando categoria */}
            {isFreeUser && (selectedCategory && selectedCategory !== 'todos') && (
              <View style={styles.upgradeNoticeContainer}>
                <Text style={styles.upgradeNoticeText}>
                  {t('tabs.home.upgrade.categoryMessage')}
                </Text>
              </View>
            )}

            {/* Botão discreto para carregar mais looks */}
            {hasMore && !loading && (
              <TouchableOpacity 
                style={styles.loadMoreButton} 
                onPress={handleLoadMore}
              >
                <Text style={styles.loadMoreText}>
                  {t('tabs.home.loadMore.button')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#999999" />
              </TouchableOpacity>
            )}

          </>
        }
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#1a1a1a']}
            tintColor="#1a1a1a"
          />
        }
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={{ paddingBottom: 16 }}
        style={styles.flatList}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
      />

      {/* Modal melhorado */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            {selectedImage && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity
                    style={styles.favoriteButtonModal}
                    onPress={() => {
                      if (selectedLookId) {
                        handleToggleFavorite(selectedLookId);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={selectedLookId && favoritedLooks.has(selectedLookId) ? "heart" : "heart-outline"} 
                      size={28} 
                      color={selectedLookId && favoritedLooks.has(selectedLookId) ? "#FF6B6B" : "#fff"} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.shareButtonModal}
                    onPress={() => {}}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share-outline" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
                <View style={styles.modalImageFrame}>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={styles.modalImage} 
                    resizeMode="contain" 
                  />
                </View>
              </>
            )}
          </View>
        </Pressable>
      </Modal>


    </SafeAreaViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flatList: {
    flex: 1,
  },
  headerWrapper: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingBottom: 20,
    zIndex: 99999,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    zIndex: 99999,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    zIndex: 99999,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 1.5,
  },
  welcomeUser: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
    fontWeight: '500',
  },
  profileButton: {
    padding: 4,
  },
  searchContainer: {
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  searchButton: {
    backgroundColor: '#1a1a1a',
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    backgroundColor: '#1a1a1a',
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
  subcategoriesWrapper: {
    paddingVertical: 8,
  },
  subcategoriesContainer: {
    paddingHorizontal: 20,
  },
  subcategoryButton: {
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  subcategoryButtonActive: {
    backgroundColor: '#1a1a1a',
  },
  subcategoryText: {
    color: '#666666',
    fontSize: 13,
    fontWeight: '500',
  },
  subcategoryTextActive: {
    color: '#FFFFFF',
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsItem: {
    alignItems: 'flex-start',
  },
  statsNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statsLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 2,
  },
  inspirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  inspirationIcon: {
    marginRight: 8,
  },
  inspirationText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  looksGrid: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  lookItem: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lookTouchable: {
    position: 'relative',
  },
  lookImage: {
    width: '100%',
    height: 220,
  },
  lookGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
    fontSize: 14,
  },
  loadMoreButton: {
    alignSelf: 'center',
    marginVertical: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  loadMoreText: {
    color: '#999999',
    fontWeight: '500',
    fontSize: 14,
  },
  categoriesGallery: {
    marginVertical: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '75%',
    position: 'relative',
  },
  modalHeader: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    gap: 12,
    zIndex: 10,
  },
  favoriteButtonModal: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 12,
  },
  shareButtonModal: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    padding: 12,
  },
  modalImageFrame: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    padding: 4,
  },
  modalImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  // Estilos para mensagem discreta de upgrade
  upgradeNoticeContainer: {
    backgroundColor: 'rgba(52, 52, 53, 0.05)',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 56, 56, 0.1)',
  },
  upgradeNoticeText: {
    fontSize: 13,
    color: '#616161',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    fontStyle: 'italic',
  },

});