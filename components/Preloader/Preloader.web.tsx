import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface PreloaderProps {
  visible: boolean;
  message?: string;
}

export default function Preloader({ visible, message = 'Carregando...' }: PreloaderProps) {
  if (!visible) return null;
  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1a1a1a" />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  message: {
    marginTop: 4,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    fontWeight: '600',
  },
});


