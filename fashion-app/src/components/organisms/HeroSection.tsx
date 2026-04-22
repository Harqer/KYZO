import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Heading } from '../base/Heading';
import { Button } from '../base/Button';
import { getResponsiveSpacing, ScreenDimensions } from '../../constants/responsive';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  buttonText?: string;
  onButtonPress?: () => void;
  variant?: 'default' | 'centered' | 'overlay';
}

export function HeroSection({
  title = 'New Collection',
  subtitle = 'Summer 2024',
  description = 'Discover our latest fashion trends with up to 50% off',
  image = 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
  buttonText = 'Shop Now',
  onButtonPress,
  variant = 'default'
}: HeroSectionProps) {
  
  return (
    <View style={[styles.container, styles[variant]]}>
      <View style={styles.content}>
        <Heading level={2} style={styles.title}>
          {title}
        </Heading>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.description}>{description}</Text>
        <Button onPress={onButtonPress} style={styles.button}>
          {buttonText}
        </Button>
      </View>
      <Image
        source={{ uri: image }}
        style={styles.heroImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: getResponsiveSpacing('lg'),
    marginBottom: getResponsiveSpacing('xl'),
    borderRadius: 16,
    overflow: 'hidden',
    height: ScreenDimensions.isMobile() ? 200 : 250,
    position: 'relative',
  },
  
  default: {
    backgroundColor: '#FEF3C7',
  },
  
  centered: {
    backgroundColor: '#F3F4F6',
  },
  
  overlay: {
    backgroundColor: '#1F2937',
  },
  
  content: {
    position: 'absolute',
    left: getResponsiveSpacing('lg'),
    top: getResponsiveSpacing('lg'),
    zIndex: 1,
    width: ScreenDimensions.isMobile() ? '60%' : '50%',
  },
  
  title: {
    color: '#92400E',
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B45309',
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  description: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: getResponsiveSpacing('md'),
  },
  
  button: {
    backgroundColor: '#92400E',
  },
  
  heroImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: ScreenDimensions.isMobile() ? '50%' : '60%',
    height: '100%',
  },
});
