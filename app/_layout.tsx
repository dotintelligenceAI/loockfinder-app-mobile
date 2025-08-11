// Importar polyfills primeiro
import '../polyfills';

// import '../global.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GlobalLanguageSelector, GlobalPreloader } from '@/components';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { PreloaderProvider } from '@/contexts/PreloaderContext';
import { TabBarVisibilityProvider } from '@/contexts/TabBarVisibilityContext';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const pathname = usePathname();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <I18nProvider>
      <PreloaderProvider>
        <TabBarVisibilityProvider>
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              <SafeAreaProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="dark" translucent backgroundColor="transparent" hidden={false} />
                <GlobalPreloader />
                {pathname && (pathname === '/(tabs)/home' || pathname.endsWith('/home')) && (
                  <GlobalLanguageSelector />
                )}
              </SafeAreaProvider>
            </ThemeProvider>
          </AuthProvider>
        </TabBarVisibilityProvider>
      </PreloaderProvider>
    </I18nProvider>
  );
}
