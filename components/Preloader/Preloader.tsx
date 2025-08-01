import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

interface PreloaderProps {
  visible: boolean;
  message?: string;
}

export default function Preloader({ visible, message = 'Carregando...' }: PreloaderProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Spinning animation
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );

      // Scale pulse animation
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );

      spinAnimation.start();
      scaleAnimation.start();

      return () => {
        spinAnimation.stop();
        scaleAnimation.stop();
      };
    } else {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim, spinValue, scaleValue]);

  if (!visible) return null;

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <View style={styles.container}>
        {/* Logo central */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          <View style={styles.logo}>
            <View style={styles.logoInner} />
          </View>
        </Animated.View>

        {/* Spinner externo */}
        <Animated.View
          style={[
            styles.spinner,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
          <View style={[styles.dot, styles.dot4]} />
          <View style={[styles.dot, styles.dot5]} />
          <View style={[styles.dot, styles.dot6]} />
        </Animated.View>
      </View>
    </Animated.View>
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
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    backgroundColor: '#000000',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  logoInner: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  spinner: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  dot: {
    position: 'absolute',
    width: 6,
    height: 6,
    backgroundColor: '#000000',
    borderRadius: 3,
    top: 5,
    left: '50%',
    marginLeft: -3,
  },
  dot2: {
    transform: [{ rotate: '60deg' }],
    backgroundColor: '#333333',
  },
  dot3: {
    transform: [{ rotate: '120deg' }],
    backgroundColor: '#666666',
  },
  dot4: {
    transform: [{ rotate: '180deg' }],
    backgroundColor: '#999999',
  },
  dot5: {
    transform: [{ rotate: '240deg' }],
    backgroundColor: '#BBBBBB',
  },
  dot6: {
    transform: [{ rotate: '300deg' }],
    backgroundColor: '#DDDDDD',
  },
}); 