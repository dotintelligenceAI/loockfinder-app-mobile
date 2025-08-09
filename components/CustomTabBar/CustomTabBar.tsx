import { useI18n } from '@/contexts/I18nContext';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabItem {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { visible } = useTabBarVisibility();
  const { t } = useI18n();
  const translateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : 100, // 100 = altura da tab bar
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  // Definir ordem e configuração das abas com traduções
  // ATENÇÃO: nomes devem bater com os arquivos/rotas em app/(tabs)
  const tabsConfig: TabItem[] = [
    { name: 'home', title: t('tabs.home.title'), icon: 'home-outline' },
    { name: 'links', title: t('tabs.links.title'), icon: 'link-outline' },
    { name: 'cupons', title: t('tabs.cupons.title'), icon: 'pricetags-outline' },
    { name: 'chat-ia', title: t('tabs.chat.title'), icon: 'chatbubble-outline' },
    { name: 'perfil', title: t('tabs.perfil.title'), icon: 'person-outline' },
  ];

  return (
    <Animated.View style={{ transform: [{ translateY }], position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 10 }}>
      <BlurView
        intensity={20}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 18, borderTopRightRadius: 18, zIndex: 1 }]} />
      <View style={[
        styles.tabBar,
        { paddingBottom: insets.bottom + 10, backgroundColor: 'transparent' }
      ]}>
        {tabsConfig.map((tab, index) => {
          const routeIndex = state.routes.findIndex((route: any) => route.name === tab.name);
          if (routeIndex === -1) return null;

          const isFocused = state.index === routeIndex;
          const { options } = descriptors[state.routes[routeIndex].key];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: state.routes[routeIndex].key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(state.routes[routeIndex].name);
            }
          };

          return (
            <TouchableOpacity
              key={tab.name}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {/* Container do ícone com indicador ativo */}
              <View style={[
                styles.iconContainer,
                isFocused && styles.iconContainerActive
              ]}>
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={isFocused ? '#6B46C1' : '#9CA3AF'}
                  style={styles.icon}
                />
                
                {/* Indicador de aba ativa */}
                {isFocused && (
                  <View style={styles.activeIndicator} />
                )}
              </View>

              {/* Label */}
              <Text style={[
                styles.label,
                { color: isFocused ? '#6B46C1' : '#9CA3AF' }
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    paddingHorizontal: 20,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 4,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(107, 70, 193, 0.1)', // Fundo sutil para aba ativa
  },
  icon: {
    // Opcional: adicionar estilos específicos para o ícone
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6B46C1',
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 