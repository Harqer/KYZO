import React from 'react';
import { View, Text, Image, StyleSheet, StyleProp } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface AvatarProps {
  source: string | { uri: string };
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
  fallback?: string;
  style?: StyleProp<any>;
}

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export function Avatar({ source, size = 'md', alt, fallback, style }: AvatarProps) {
  const avatarSize = SIZES[size];
  
  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }, style]}>
      <Image
        source={typeof source === 'string' ? { uri: source } : source}
        style={[styles.image, { width: avatarSize, height: avatarSize }]}
        resizeMode="cover"
      />
      {alt && (
        <Text style={styles.alt} numberOfLines={1}>
          {alt.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  image: {
    borderRadius: 9999,
  },
  
  alt: {
    position: 'absolute',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
});
