import { useI18n } from '@/contexts/I18nContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom';
  // Novo: posição do botão para calcular onde mostrar o dropdown
  buttonPosition?: { top: number; right: number; } | null;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  visible, 
  onClose, 
  position = 'bottom',
  buttonPosition 
}) => {
  const { t, currentLanguage, setLanguage, languages } = useI18n();
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);

  const handleLanguageSelect = async (language: 'pt-br' | 'en-us' | 'es') => {
    setSelectedLanguage(language);
    await setLanguage(language);
    onClose();
  };

  const languageOptions = [
    { key: 'pt-br' as const, label: languages['pt-br'], flag: '🇧🇷'},
    { key: 'en-us' as const, label: languages['en-us'], flag: '🇺🇸'},
    { key: 'es' as const, label: languages['es'], flag: '🇪🇸'},
  ];

  // Calcular posição do dropdown baseado na posição do botão
  const getDropdownStyle = () => {
    if (buttonPosition) {
      return {
        position: 'absolute' as const,
        top: position === 'bottom' ? buttonPosition.top + 45 : buttonPosition.top - 160,
        right: buttonPosition.right,
      };
    }
    
    // Fallback para posição padrão
    return position === 'top' ? styles.dropdownTop : styles.dropdownBottom;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.dropdown, getDropdownStyle()]}>
          {languageOptions.map((option, index) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.languageOption,
                selectedLanguage === option.key && styles.languageOptionActive,
                index === languageOptions.length - 1 && styles.lastOption
              ]}
              onPress={() => handleLanguageSelect(option.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{option.flag}</Text>
              <Text style={[
                styles.languageText,
                selectedLanguage === option.key && styles.languageTextActive
              ]}>
                {option.label}
              </Text>
              {selectedLanguage === option.key && (
                <Ionicons name="checkmark" size={16} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 25,
    minWidth: 160,
    maxWidth: 200,
    marginRight: 20, // Margem da borda direita
  },
  dropdownTop: {
    bottom: 45,
    right: 0,
  },
  dropdownBottom: {
    top: 120, // Ajuste baseado na altura do header
    right: 0,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  languageOptionActive: {
    backgroundColor: '#F0F8FF',
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  flag: {
    fontSize: 18,
    marginRight: 12,
  },
  languageText: {
    flex: 1,
    fontSize: 15,
    color: '#666666',
    fontWeight: '500',
  },
  languageTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});