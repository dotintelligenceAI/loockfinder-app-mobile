import { Gallery4, Gallery4Item } from '@/components';
import { useAuth } from '@/contexts/AuthContext';
import { usePreloader } from '@/contexts/PreloaderContext';
import { categoriesService, favoritesService } from '@/services';
import { looksService, Look } from '@/services/looksService';
import { subcategoriesService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Image,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  ViewToken,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

export default function HomeScreen() {
  const { user } = useAuth();
  const { showPreloader, hidePreloader } = usePreloader();
  const [categories, setCategories] = useState<Gallery4Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [looksLimit, setLooksLimit] = useState(100);
  const PAGE_SIZE = 12;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [subcategories, setSubcategories] = useState<Gallery4Item[]>([]);
  const [showSubcategories, setShowSubcategories] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [languageDropdownVisible, setLanguageDropdownVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('pt-BR');
  const [favoritedLooks, setFavoritedLooks] = useState<Set<string>>(new Set());
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);

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
  }, []);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handlePressOutside = () => {
      if (languageDropdownVisible) {
        setLanguageDropdownVisible(false);
      }
    };

    // Adicionar listener para fechar dropdown
    const subscription = { remove: () => {} };
    
    return () => {
      subscription.remove();
    };
  }, [languageDropdownVisible]);

  useEffect(() => {
    if (selectedSubcategory) {
      loadLooksBySubcategory(selectedSubcategory);
    } else {
      loadLooks(true);
    }
  }, [selectedSubcategory]);

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
        setLooksLimit(100);
      }
      setLoading(true);
      showPreloader('Carregando looks...');
      let data: Look[] = [];
      if (selectedCategory && selectedCategory !== 'todos') {
        data = await looksService.getLooksByCategory(selectedCategory);
      } else {
        data = await looksService.getLooks();
      }
      const paginated = data.slice(0, looksLimit);
      setLooks(paginated);
      setHasMore(data.length > paginated.length);
      if (!reset) setPage((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao carregar looks:', error);
    } finally {
      setLoading(false);
      hidePreloader();
    }
  };

  const loadLooksBySubcategory = async (subcategoryId: string) => {
    try {
      setLoading(true);
      const data = await looksService.getLooksBySubcategory(subcategoryId);
      const paginated = data.slice(0, looksLimit);
      setLooks(paginated);
      setHasMore(data.length > paginated.length);
    } catch (error) {
      console.error('Erro ao carregar looks da subcategoria:', error);
    } finally {
      setLoading(false);
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
    if (!loading && hasMore) {
      loadLooks();
    }
  };

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

  const renderSeeMore = () => (
    hasMore && (
      <TouchableOpacity 
        style={styles.seeMoreButton} 
        onPress={() => {
          setLooksLimit(looksLimit + 100);
          loadLooks();
        }}
      >
        <LinearGradient
          colors={['#1a1a1a', '#333333']}
          style={styles.seeMoreGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.seeMoreText}>Ver mais looks</Text>
          <Ionicons name="arrow-down" size={16} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    )
  );

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

  const renderHeader = () => (
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
                  Olá, {user.fullName?.split(' ')[0] || 'Finder'}! 
                </Text>
              )}
            </View>
            <View style={styles.languageContainer}>
              <TouchableOpacity 
                style={styles.languageButton}
                onPress={() => setLanguageDropdownVisible(!languageDropdownVisible)}
              >
                <Ionicons name="language-outline" size={24} color="#666666" />
                <Text style={styles.languageText}>
                  {selectedLanguage === 'pt-BR' ? 'PT' : selectedLanguage === 'en' ? 'EN' : 'ES'}
                </Text>
                <Ionicons 
                  name={languageDropdownVisible ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#666666" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Barra de busca melhorada */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#999999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Busque looks, estilos, ocasiões..."
                placeholderTextColor="#999999"
              />
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="options-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Categorias */}
      <View style={styles.categoriesSection}>
        <FlatList
          data={[{ id: 'todos', title: 'Todos', description: '', type: '', image_url: '' }, ...categories]}
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
            <Text style={styles.statsLabel}>looks encontrados</Text>
          </View>
          <View style={styles.inspirationContainer}>
            <View style={styles.inspirationIcon}>
              <Ionicons name="sparkles" size={18} color="#000000" />
            </View>
            <Text style={styles.inspirationText}>SER UMA FINDER É SER TUDO</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
            {renderSeeMore()}
            
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

      {/* Language Dropdown usando Modal */}
      <Modal
        visible={languageDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageDropdownVisible(false)}
      >
        <Pressable 
          style={styles.dropdownOverlay} 
          onPress={() => setLanguageDropdownVisible(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.languageDropdownModal}>
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'pt-BR' && styles.languageOptionActive]}
                onPress={() => {
                  setSelectedLanguage('pt-BR');
                  setLanguageDropdownVisible(false);
                }}
              >
                <Text style={[styles.languageOptionText, selectedLanguage === 'pt-BR' && styles.languageOptionTextActive]}>
                  Português
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'en' && styles.languageOptionActive]}
                onPress={() => {
                  setSelectedLanguage('en');
                  setLanguageDropdownVisible(false);
                }}
              >
                <Text style={[styles.languageOptionText, selectedLanguage === 'en' && styles.languageOptionTextActive]}>
                  English
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'es' && styles.languageOptionActive, { borderBottomWidth: 0 }]}
                onPress={() => {
                  setSelectedLanguage('es');
                  setLanguageDropdownVisible(false);
                }}
              >
                <Text style={[styles.languageOptionText, selectedLanguage === 'es' && styles.languageOptionTextActive]}>
                  Español
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
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
  profileButton: {
    padding: 4,
  },
  searchContainer: {
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
    backgroundColor: '#4A90E2',
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
  seeMoreButton: {
    alignSelf: 'center',
    marginVertical: 24,
    borderRadius: 28,
    overflow: 'hidden',
  },
  seeMoreGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
  },
  seeMoreText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
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
  // Estilos do botão de idiomas
  languageContainer: {
    zIndex: 99999,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  languageDropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
    minWidth: 140,
    zIndex: 99999,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  languageOptionActive: {
    backgroundColor: '#F8F9FA',
  },
  languageOptionText: {
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  languageOptionTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  // Estilos para o dropdown modal
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 120,
    right: 20,
    zIndex: 99999,
  },
  languageDropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 20,
    minWidth: 140,
  },
});