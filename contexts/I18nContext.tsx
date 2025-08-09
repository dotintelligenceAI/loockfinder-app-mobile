import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ptBR from '../i18n/pt-br.json';
import enUS from '../i18n/en-us.json';
import es from '../i18n/es.json';

// Tipos para as traduções
type TranslationKeys = typeof ptBR;
type Language = 'pt-br' | 'en-us' | 'es';

interface I18nContextType {
  t: (key: string) => string;
  currentLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  languages: { [key in Language]: string };
}

const translations = {
  'pt-br': ptBR,
  'en-us': enUS,
  'es': es,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('pt-br');
  const [currentTranslations, setCurrentTranslations] = useState<TranslationKeys>(ptBR);

  const languages = {
    'pt-br': 'Português',
    'en-us': 'English',
    'es': 'Español',
  };

  // Função para obter valor aninhado do objeto de traduções
  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : path;
    }, obj);
  };

  // Função de tradução
  const t = (key: string): string => {
    const translation = getNestedValue(currentTranslations, key);
    return typeof translation === 'string' ? translation : key;
  };

  // Função para alterar idioma
  const setLanguage = async (language: Language) => {
    try {
      await AsyncStorage.setItem('@lookfinder_language', language);
      setCurrentLanguage(language);
      setCurrentTranslations(translations[language]);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Carregar idioma salvo no AsyncStorage
  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@lookfinder_language');
        if (savedLanguage && (savedLanguage === 'pt-br' || savedLanguage === 'en-us' || savedLanguage === 'es')) {
          setCurrentLanguage(savedLanguage as Language);
          setCurrentTranslations(translations[savedLanguage as Language]);
        }
      } catch (error) {
        console.error('Error loading saved language:', error);
      }
    };

    loadSavedLanguage();
  }, []);

  const value: I18nContextType = {
    t,
    currentLanguage,
    setLanguage,
    languages,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}; 