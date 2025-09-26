import { Platform } from 'react-native';

export const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
export const isWeb = Platform.OS === 'web';
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// Wrapper para módulos nativos
export const withNativeCheck = <T>(
  nativeModule: () => T,
  fallback: T,
  moduleName?: string
): T => {
  if (isWeb) {
    return fallback;
  }
  
  try {
    return nativeModule();
  } catch (error) {
    console.warn(`Módulo nativo ${moduleName || 'desconhecido'} não disponível:`, error);
    return fallback;
  }
};
