import { ProtectedRoute } from '@/components';
import { useI18n } from '@/contexts/I18nContext';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function TabLayoutContent() {
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

  return (
    <Animated.View style={{ transform: [{ translateY }], flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['left','right','bottom']}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#1a1a1a',
            tabBarInactiveTintColor: '#999999',
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#E5E5E5',
              height: Platform.OS === 'ios' ? 90 : 70,
              paddingBottom: Platform.OS === 'ios' ? 30 : 10,
              paddingTop: 10,
              shadowColor: '#000000',
              shadowOffset: {
                width: 0,
                height: -2,
              },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 8,
              position: 'relative',
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
            tabBarBackground: () => null,
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: t('tabs.home.title'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                  name={focused ? 'home' : 'home-outline'} 
                  size={24} 
                  color={color} 
                />
              ),
            }}
          />
          <Tabs.Screen
            name="links"
            options={{
              title: t('tabs.links.title'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                  name={focused ? 'link' : 'link-outline'} 
                  size={24} 
                  color={color} 
                />
              ),
            }}
          />
          <Tabs.Screen
            name="cupons"
            options={{
              title: t('tabs.cupons.title'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                  name={focused ? 'pricetags' : 'pricetags-outline'} 
                  size={24} 
                  color={color} 
                />
              ),
            }}
          />
          <Tabs.Screen
            name="chat-ia"
            options={{
              title: t('tabs.chat.title'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                  name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} 
                  size={24} 
                  color={color} 
                />
              ),
            }}
          />
          <Tabs.Screen
            name="perfil"
            options={{
              title: t('tabs.perfil.title'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons 
                  name={focused ? 'person' : 'person-outline'} 
                  size={24} 
                  color={color} 
                />
              ),
            }}
          />
        </Tabs>
      </SafeAreaView>
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <ProtectedRoute requireAuth={true}>
      <TabLayoutContent />
    </ProtectedRoute>
  );
} 