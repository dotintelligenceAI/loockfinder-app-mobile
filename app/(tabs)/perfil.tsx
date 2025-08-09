import { Toast } from '@/components/Toast/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/I18nContext';
import { useToast } from '@/hooks/useToast';
import { favoritesService, supabase, userProfilesService } from '@/services';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

const { height: screenHeight } = Dimensions.get('window');

export default function PerfilScreen() {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState(t('tabs.perfil.tabs.favorites'));
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState<string | null>(null);
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [uploading, setUploading] = useState(false);
  const toastHook = useToast();
  const { toast, showSuccess, showError } = toastHook;

  // Bottom Sheet Animation
  const [bottomSheetY] = useState(new Animated.Value(screenHeight));

  React.useEffect(() => {
    if (user?.id) {
      loadProfile();
      loadFavorites();
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (editModalVisible) {
      openBottomSheet();
    } else {
      closeBottomSheet();
    }
  }, [editModalVisible]);

  const openBottomSheet = () => {
    Animated.timing(bottomSheetY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeBottomSheet = () => {
    Animated.timing(bottomSheetY, {
      toValue: screenHeight,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Pan Responder for dragging
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        bottomSheetY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100) {
        setEditModalVisible(false);
      } else {
        openBottomSheet();
      }
    },
  });

  const loadProfile = async () => {
    if (!user?.id) return;
    const data = await userProfilesService.getUserProfile(user.id);
    setProfile(data);
    setEditFullName(data?.full_name || '');
    setEditBio(data?.bio || '');
    setEditAvatar(data?.avatar_url || null);
    setEditPhone(data?.phone || '');
    setEditLocation(data?.location || '');
    setEditInstagram(data?.instagram_link || '');
  };

  const loadFavorites = async () => {
    if (!user?.id) return;
    
    try {
      setLoadingFavorites(true);
      
      // Carregar favoritos
      const favoritesResponse = await favoritesService.getUserFavorites(user.id);
      if (favoritesResponse.success) {
        setFavorites(favoritesResponse.data);
      } else {
        console.error('Erro ao carregar favoritos:', favoritesResponse.error);
        setFavorites([]);
      }

      // Carregar contagem de favoritos
      const countResponse = await favoritesService.getFavoritesCount(user.id);
      if (countResponse.success) {
        setFavoritesCount(countResponse.count);
      } else {
        console.error('Erro ao contar favoritos:', countResponse.error);
        setFavoritesCount(0);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
      setFavorites([]);
      setFavoritesCount(0);
    } finally {
      setLoadingFavorites(false);
    }
  };

  const handleRemoveFavorite = async (lookId: string) => {
    if (!user?.id) return;
    
    try {
      const result = await favoritesService.removeFromFavorites(user.id, lookId);
      
      if (result.success) {
        // Remover do estado local
        setFavorites(prev => prev.filter(fav => fav.look_id !== lookId));
        setFavoritesCount(prev => prev - 1);
        showSuccess(t('tabs.perfil.favoriteRemoved'));
      } else {
        console.error('Erro ao remover favorito:', result.error);
        showError(t('tabs.perfil.errorRemovingFavorite'));
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      showError(t('tabs.perfil.errorRemovingFavorite'));
    }
  };

  const renderFavoriteLook = ({ item }: { item: any }) => {
    return (
      <Animatable.View 
        animation="fadeInUp" 
        duration={600}
        style={styles.lookItem}
      >
        <TouchableOpacity 
          onPress={() => {
            setSelectedImage(item.look?.image_url || 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look');
            setSelectedLookId(item.look_id);
            setModalVisible(true);
          }}
          style={styles.lookTouchable}
        >
          <Image
            source={{ uri: item.look?.image_url || 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look' }}
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
              handleRemoveFavorite(item.look_id);
            }}
          >
            <Ionicons 
              name="heart" 
              size={20} 
              color="#FF6B6B" 
            />
          </TouchableOpacity>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  const openImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('tabs.perfil.permissionRequired'), t('tabs.perfil.permissionMessage'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploading(true);
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) throw new Error('Arquivo de imagem não encontrado');
      const fileUri = fileInfo.uri;
      const response = await fetch(fileUri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${user?.id || 'user'}_avatar.${fileExt}`;
      const filePath = `foto_perfil/${fileName}`;
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, blob, { upsert: true });
      if (error) throw error;
      const { data: publicUrlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);
      return publicUrlData.publicUrl;
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    let avatarUrl = profile?.avatar_url || null;
    try {
      if (editAvatar && editAvatar !== profile?.avatar_url && !editAvatar.startsWith('http')) {
        avatarUrl = await uploadAvatar(editAvatar);
      }
      const updated = await userProfilesService.updateUserProfile(user.id, {
        full_name: editFullName,
        bio: editBio,
        avatar_url: avatarUrl,
        phone: editPhone,
        location: editLocation,
        instagram_link: editInstagram,
      });
      setProfile(updated);
      showSuccess(t('tabs.perfil.profileUpdated'));
      setEditModalVisible(false);
    } catch (e) {
      showError(t('tabs.perfil.errorUpdating'));
    }
  };
  
  const tabs = [
    { name: t('tabs.perfil.tabs.favorites'), count: `(${favoritesCount})`, icon: 'heart-outline' }
  ];
  
  // Dados mockados para fallback
  const mockLooks = [
    { id: 1, image: 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look+1' },
    { id: 2, image: 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look+2' },
    { id: 3, image: 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look+3' },
    { id: 4, image: 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look+4' },
    { id: 5, image: 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look+5' },
    { id: 6, image: 'https://via.placeholder.com/150x200/8B4513/FFFFFF?text=Look+6' },
  ];

  const handleLogout = async () => {
    Alert.alert(
      t('tabs.perfil.logout.title'),
      t('tabs.perfil.logout.message'),
      [
        { text: t('tabs.perfil.logout.cancel'), style: 'cancel' },
        {
          text: t('tabs.perfil.logout.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              // Ignora erro, sempre redireciona
            } finally {
              router.replace('/auth/login');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      


      <FlatList
        style={styles.scrollView}
        data={[{ key: 'content' }]}
        renderItem={() => (
          <>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.profileImage} />
                ) : (
                  <LinearGradient
                    colors={['#4A90E2', '#357ABD']}
                    style={styles.profileImage}
                  >
                    <Text style={styles.profileImageText}>
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'F'}
                    </Text>
                  </LinearGradient>
                )}
                <View style={styles.statusIndicator} />
              </View>
              
              <Text style={styles.profileName}>
                {profile?.full_name || user?.fullName || 'Finder'}
              </Text>
              <Text style={styles.profileBio}>
                {profile?.bio || t('tabs.perfil.defaultBio')}
              </Text>
              
              {profile?.location && (
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#666666" />
                  <Text style={styles.locationText}>{profile.location}</Text>
                </View>
              )}

              {/* Stats melhorados */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{favoritesCount}</Text>
                  <Text style={styles.statLabel}>{t('tabs.perfil.favorites')}</Text>
                </View>
              </View>

              {/* Botões de ação */}
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editProfileButton} onPress={() => setEditModalVisible(true)}>
                  <Ionicons name="pencil" size={16} color="#FFFFFF" />
                  <Text style={styles.editProfileText}>{t('tabs.perfil.editProfile')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={16} color="#666666" />
                  <Text style={styles.logoutButtonText}>{t('tabs.perfil.logout.confirm')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tabs melhoradas */}
            <View style={styles.tabsContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity
                  key={`${tab.name}`}
                  style={[
                    styles.tabButton,
                    activeTab === tab.name && styles.tabButtonActive
                  ]}
                  onPress={() => setActiveTab(tab.name)}
                >
                  <Ionicons 
                    name={tab.icon as any} 
                    size={20} 
                    color={activeTab === tab.name ? '#1a1a1a' : '#666666'} 
                  />
                  <Text style={[
                    styles.tabText,
                    activeTab === tab.name && styles.tabTextActive
                  ]}>
                    {tab.name} {tab.count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Inspirational Text */}
            <View style={styles.inspirationContainer}>
              <LinearGradient
                colors={['#1a1a1a', '#1a1a1a']}
                style={styles.inspirationIcon}
              >
                <Ionicons name="sparkles" size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.inspirationText}>{t('tabs.home.inspiration')}</Text>
            </View>

            {/* Favoritos Grid */}
            <View style={styles.looksGridContainer}>
              {loadingFavorites ? (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Carregando favoritos...</Text>
                </View>
              ) : favorites.length > 0 ? (
                <FlatList
                  data={favorites}
                  keyExtractor={(item) => String(item.look_id || item.id)}
                  renderItem={({ item }) => renderFavoriteLook({ item })}
                  numColumns={2}
                  columnWrapperStyle={styles.looksGridRow}
                  contentContainerStyle={{ paddingBottom: 100 }}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhum favorito encontrado</Text>
                </View>
              )}
            </View>
          </>
        )}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom Sheet Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.bottomSheetContainer,
              {
                transform: [{ translateY: bottomSheetY }],
              },
            ]}
            {...panResponder.panHandlers}
          >
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.modalTitle}>Editar Perfil</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.bottomSheetContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Avatar Editor */}
              <View style={styles.avatarSection}>
                <TouchableOpacity onPress={openImagePicker} style={styles.avatarEditButton}>
                  {editAvatar ? (
                    <Image source={{ uri: editAvatar }} style={styles.avatarEditImage} />
                  ) : (
                    <LinearGradient
                      colors={['#4A90E2', '#357ABD']}
                      style={styles.avatarEditImage}
                    >
                      <Ionicons name="camera" size={32} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                  <View style={styles.cameraOverlay}>
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nome</Text>
                  <TextInput
                    style={styles.input}
                    value={editFullName}
                    onChangeText={setEditFullName}
                    placeholder={t('tabs.perfil.namePlaceholder')}
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Bio</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editBio}
                    onChangeText={setEditBio}
                    placeholder={t('tabs.perfil.bioPlaceholder')}
                    placeholderTextColor="#999999"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Telefone</Text>
                  <TextInput
                    style={styles.input}
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder={t('tabs.perfil.phonePlaceholder')}
                    placeholderTextColor="#999999"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Localização</Text>
                  <TextInput
                    style={styles.input}
                    value={editLocation}
                    onChangeText={setEditLocation}
                    placeholder={t('tabs.perfil.locationPlaceholder')}
                    placeholderTextColor="#999999"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Instagram</Text>
                  <TextInput
                    style={styles.input}
                    value={editInstagram}
                    onChangeText={setEditInstagram}
                    placeholder={t('tabs.perfil.instagramPlaceholder')}
                    placeholderTextColor="#999999"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonSection}>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSaveProfile} 
                  disabled={uploading}
                >
                  <LinearGradient
                    colors={['#1a1a1a', '#333333']}
                    style={styles.saveButtonGradient}
                  >
                    {uploading ? (
                      <>
                        <Ionicons name="cloud-upload-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Salvando...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.saveButtonText}>Salvar Alterações</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setEditModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Modal de visualização de imagem */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity 
            style={styles.imageModalBackground}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.imageModalContent}>
              <TouchableOpacity 
                style={styles.closeModalButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              {selectedImage && (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.modalFavoriteButton}
                  onPress={() => {
                    if (selectedLookId) {
                      handleRemoveFavorite(selectedLookId);
                      setModalVisible(false);
                    }
                  }}
                >
                  <Ionicons name="heart" size={24} color="#FF6B6B" />
                  <Text style={styles.modalFavoriteText}>Remover dos favoritos</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '700',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    textAlign: 'center',
  },
  profileBio: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  locationText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  statsContainer: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  editProfileButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  editProfileText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  logoutButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    marginHorizontal: 20,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#1a1a1a',
    fontWeight: '600',
  },
  inspirationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#F8F9FA',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  inspirationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  inspirationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
  looksGrid: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  looksGridContainer: {
    paddingHorizontal: 16,
  },
  looksGridRow: {
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
    backgroundColor: '#F5F5F5',
  },
  lookGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  favoriteIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: screenHeight * 0.9,
    minHeight: screenHeight * 0.7,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  bottomSheetHandle: {
    position: 'absolute',
    top: 8,
    left: '50%',
    marginLeft: -24,
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarEditButton: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarEditImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  formSection: {
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#F8F9FA',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  buttonSection: {
    paddingVertical: 24,
    gap: 12,
  },
  saveButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
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
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  favoritesList: {
    paddingBottom: 30,
  },
  favoritesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 30,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  closeModalButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  modalActions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  modalFavoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  modalFavoriteText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});