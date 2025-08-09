import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useI18n } from '@/contexts/I18nContext';
import { LanguageSelector } from '@/components/LanguageSelector';

interface GlobalLanguageSelectorProps {
  style?: any;
}

export const GlobalLanguageSelector: React.FC<GlobalLanguageSelectorProps> = ({ style }) => {
  const { currentLanguage } = useI18n();
  const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false);

  const openLanguageSelector = () => {
    setLanguageSelectorVisible(true);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.languageButton}
        onPress={openLanguageSelector}
      >
        <Ionicons name="language-outline" size={20} color="#666666" />
        <Text style={styles.languageText}>
          {currentLanguage === 'pt-br' ? 'PT' : currentLanguage === 'en-us' ? 'EN' : 'ES'}
        </Text>
        <Ionicons 
          name="chevron-down" 
          size={14} 
          color="#666666" 
        />
      </TouchableOpacity>
      
      <LanguageSelector 
        visible={languageSelectorVisible}
        onClose={() => setLanguageSelectorVisible(false)}
        position="bottom"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 9999,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  languageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
}); 