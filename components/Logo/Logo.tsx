import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
}

export function Logo({ size = 'medium', variant = 'dark' }: LogoProps) {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.containerSmall,
          text: styles.textSmall,
          iconText: styles.iconTextSmall
        };
      case 'medium':
        return {
          container: styles.containerMedium,
          text: styles.textMedium,
          iconText: styles.iconTextMedium
        };
      case 'large':
        return {
          container: styles.containerLarge,
          text: styles.textLarge,
          iconText: styles.iconTextLarge
        };
      default:
        return {
          container: styles.containerMedium,
          text: styles.textMedium,
          iconText: styles.iconTextMedium
        };
    }
  };

  const getColorStyles = () => {
    return variant === 'light' 
      ? {
          background: styles.backgroundLight,
          iconText: styles.iconTextLight,
          text: styles.textLight
        }
      : {
          background: styles.backgroundDark,
          iconText: styles.iconTextDark,
          text: styles.textDark
        };
  };

  const sizeStyles = getSizeStyles();
  const colorStyles = getColorStyles();

  return (
    <View style={styles.container}>
      {/* Logo Icon */}
      <View 
        style={[
          sizeStyles.container,
          colorStyles.background,
          styles.logoIcon
        ]}
      >
        <Text 
          style={[
            sizeStyles.iconText,
            colorStyles.iconText,
            styles.iconText
          ]}
        >
          LF
        </Text>
      </View>
      
      {/* Logo Text */}
      <Text 
        style={[
          sizeStyles.text,
          colorStyles.text,
          styles.logoText
        ]}
      >
        LOOKFINDER
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoIcon: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  iconText: {
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  logoText: {
    fontWeight: '300',
    letterSpacing: 2,
  },
  // Size variants
  containerSmall: {
    width: 64,
    height: 64,
  },
  containerMedium: {
    width: 80,
    height: 80,
  },
  containerLarge: {
    width: 96,
    height: 96,
  },
  iconTextSmall: {
    fontSize: 20,
  },
  iconTextMedium: {
    fontSize: 24,
  },
  iconTextLarge: {
    fontSize: 28,
  },
  textSmall: {
    fontSize: 14,
  },
  textMedium: {
    fontSize: 16,
  },
  textLarge: {
    fontSize: 18,
  },
  // Color variants
  backgroundLight: {
    backgroundColor: '#FFFFFF',
  },
  backgroundDark: {
    backgroundColor: '#000000',
  },
  iconTextLight: {
    color: '#000000',
  },
  iconTextDark: {
    color: '#FFFFFF',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#FFFFFF',
  },
}); 