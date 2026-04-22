import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface ProductImageProps {
  source: string;
  width?: number;
  height?: number;
  variant?: 'default' | 'compact' | 'featured';
  style?: any;
}

export function ProductImage({ 
  source, 
  width, 
  height, 
  variant = 'default',
  style 
}: ProductImageProps) {
  const getImageHeight = () => {
    if (height) return height;
    switch (variant) {
      case 'compact': return 120;
      case 'featured': return 180;
      default: return 160;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri: source }}
        style={[
          styles.image,
          { 
            width: width || '100%', 
            height: getImageHeight() 
          }
        ]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  
  image: {
    width: '100%',
  },
});
