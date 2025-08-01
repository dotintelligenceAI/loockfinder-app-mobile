import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LinkItem {
  id: string;
  title: string;
  description: string;
  url: string;
  image: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  store: string;
  category: string;
}

export default function LinksScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('todos');

  // Dados mockados para demonstração
  const mockLinks: LinkItem[] = [
    {
      id: '1',
      title: 'Vestido Floral Primavera',
      description: 'Vestido elegante com estampa floral, perfeito para a primavera',
      url: 'https://exemplo.com/vestido-floral',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
      price: 'R$ 89,90',
      originalPrice: 'R$ 129,90',
      discount: '31% OFF',
      store: 'Fashion Store',
      category: 'vestidos'
    },
    {
      id: '2',
      title: 'Tênis Esportivo Comfort',
      description: 'Tênis confortável para atividades físicas e uso casual',
      url: 'https://exemplo.com/tenis-esportivo',
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      price: 'R$ 159,90',
      originalPrice: 'R$ 199,90',
      discount: '20% OFF',
      store: 'Sports Shop',
      category: 'calcados'
    },
    {
      id: '3',
      title: 'Bolsa Transversal Couro',
      description: 'Bolsa elegante em couro genuíno, ideal para o dia a dia',
      url: 'https://exemplo.com/bolsa-couro',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
      price: 'R$ 129,90',
      originalPrice: 'R$ 179,90',
      discount: '28% OFF',
      store: 'Leather Goods',
      category: 'acessorios'
    },
    {
      id: '4',
      title: 'Blazer Feminino Slim',
      description: 'Blazer moderno e elegante para ocasiões especiais',
      url: 'https://exemplo.com/blazer-feminino',
      image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
      price: 'R$ 199,90',
      originalPrice: 'R$ 249,90',
      discount: '20% OFF',
      store: 'Elegance Fashion',
      category: 'blazers'
    },
  ];

  const categories = [
    { id: 'todos', title: 'Todos' },
    { id: 'vestidos', title: 'Vestidos' },
    { id: 'calcados', title: 'Calçados' },
    { id: 'acessorios', title: 'Acessórios' },
    { id: 'blazers', title: 'Blazers' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // Simular carregamento
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLinkPress = (link: LinkItem) => {
    // Implementar abertura do link
    console.log('Abrindo link:', link.url);
  };

  const renderLinkItem = ({ item }: { item: LinkItem }) => (
    <TouchableOpacity
      style={styles.linkCard}
      onPress={() => handleLinkPress(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} style={styles.linkImage} />
      
      <View style={styles.linkContent}>
        <View style={styles.linkHeader}>
          <Text style={styles.linkTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity style={styles.favoriteButton}>
            <Ionicons name="heart-outline" size={20} color="#666666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.linkDescription} numberOfLines={2}>
          {item.description}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>{item.price}</Text>
          {item.originalPrice && (
            <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          )}
          {item.discount && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{item.discount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.storeContainer}>
          <Text style={styles.storeName}>{item.store}</Text>
          <TouchableOpacity style={styles.buyButton}>
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
          data={categories}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          renderItem={renderCategoryItem}
        />
      </View>

      {/* Lista de Links */}
      <FlatList
        data={mockLinks}
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
  linkImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  linkContent: {
    padding: 16,
  },
  linkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  linkTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  favoriteButton: {
    padding: 4,
  },
  linkDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 12,
  },
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
  storeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
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