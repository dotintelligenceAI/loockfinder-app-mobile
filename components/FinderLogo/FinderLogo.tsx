import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

interface FinderLogoProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export function FinderLogo({ size = 'large', color = '#000000' }: FinderLogoProps) {
  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'medium':
        return 32;
      case 'large':
        return 40;
      default:
        return 40;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.logoText, { fontSize: getFontSize(), color }]}>
        Finder
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '700',
    letterSpacing: 1,
  },
}); 