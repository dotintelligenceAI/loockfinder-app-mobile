import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');
const CARD_SIZE = 160; // Tamanho quadrado dos cards

export interface Gallery4Item {
  id: string;
  title: string;
  description: string;
  href?: string;
  image_url?: string;
  type: string;
}

export interface Gallery4Props {
  title: string;
  description: string;
  items: Gallery4Item[];
  onItemPress?: (item: Gallery4Item) => void;
}

export function Gallery4({ title, description, items, onItemPress }: Gallery4Props) {
  const handleItemPress = (item: Gallery4Item) => {
    if (onItemPress) {
      onItemPress(item);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {/* Horizontal Gallery */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {items.map((item, index) => (
          <Animatable.View
            key={item.id}
            animation="fadeInUp"
            delay={index * 80}
            duration={500}
            useNativeDriver
            style={[
              styles.card,
              index === 0 && styles.firstCard,
              index === items.length - 1 && styles.lastCard
            ]}
          >
            <TouchableOpacity
              onPress={() => handleItemPress(item)}
              activeOpacity={0.9}
              style={{ flex: 1 }}
            >
              <ImageBackground
                source={{ 
                  uri: item.image_url || 'https://via.placeholder.com/160x160/E0E0E0/999999?text=' + item.title.charAt(0)
                }}
                style={styles.imageBackground}
                resizeMode="cover"
              >
                {/* Dark Overlay */}
                <View style={styles.overlay}>
                  <View style={styles.titleContainer}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                  </View>
                </View>
              </ImageBackground>
            </TouchableOpacity>
          </Animatable.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
  },
  scrollView: {
    paddingBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 15,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    marginRight: 15,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  firstCard: {
    marginLeft: 5,
  },
  lastCard: {
    marginRight: 20,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  titleContainer: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
    lineHeight: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
}); 