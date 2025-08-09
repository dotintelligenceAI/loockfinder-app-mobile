import { CustomTabBar, ProtectedRoute } from '@/components';
import { useTabBarVisibility } from '@/contexts/TabBarVisibilityContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import React from 'react';
import { Animated, Platform, View } from 'react-native';

function TabLayoutContent() {
  const { visible } = useTabBarVisibility();
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
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            // Usa a TabBar personalizada com traduções
            tabBar: (props) => <CustomTabBar {...props} />,
            tabBarActiveTintColor: '#FFFFFF',
            tabBarInactiveTintColor: '#666666',
            tabBarStyle: {
              backgroundColor: 'transparent',
              borderTopWidth: 1,
              borderTopColor: '#333333',
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
            tabBarBackground: () => (
              <BlurView
                intensity={60}
                tint="dark"
                style={{ flex: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18 }}
              />
            ),
          }}
        >
          <Tabs.Screen
            name="home"
            options={{
              title: 'Home',
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
              title: 'Links',
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
              title: 'Cupons',
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
              title: 'Chat IA',
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
              title: 'Perfil',
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
      </View>
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