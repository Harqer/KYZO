import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface ProductInfoProps {
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewsCount?: number;
  variant?: 'default' | 'compact' | 'featured';
  style?: any;
}

export function ProductInfo({ 
  name, 
  brand, 
  price, 
  originalPrice, 
  rating, 
  reviewsCount,
  variant = 'default',
  style 
}: ProductInfoProps) {
  
  const renderBrand = () => (
    <Text style={[styles.brand, styles[`${variant}Brand`]]}>
      {brand}
    </Text>
  );
  
  const renderName = () => (
    <Text 
      style={[styles.name, styles[`${variant}Name`]]}
      numberOfLines={variant === 'compact' ? 1 : 2}
    >
      {name}
    </Text>
  );
  
  const renderPrice = () => (
    <View style={styles.priceRow}>
      <Text style={[styles.price, styles[`${variant}Price`]]}>
        ${price.toFixed(2)}
      </Text>
      {originalPrice && (
        <Text style={[styles.originalPrice, styles[`${variant}OriginalPrice`]]}>
          ${originalPrice.toFixed(2)}
        </Text>
      )}
    </View>
  );
  
  const renderRating = () => {
    if (!rating) return null;
    
    return (
      <View style={styles.rating}>
        <Text style={styles.ratingStars}>
          {'\u2605'.repeat(Math.floor(rating))}
        </Text>
        {reviewsCount && (
          <Text style={styles.ratingCount}>({reviewsCount})</Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderBrand()}
      {renderName()}
      {renderPrice()}
      {renderRating()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  // Brand
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  defaultBrand: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  compactBrand: {
    fontSize: 10,
    marginBottom: 2,
  },
  
  featuredBrand: {
    fontSize: 14,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  // Name
  name: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  defaultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  compactName: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  
  featuredName: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  // Price
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('xs'),
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  defaultPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  compactPrice: {
    fontSize: 14,
  },
  
  featuredPrice: {
    fontSize: 20,
  },
  
  originalPrice: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  
  defaultOriginalPrice: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  
  compactOriginalPrice: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  
  featuredOriginalPrice: {
    fontSize: 14,
    fontWeight: '400',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  
  // Rating
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getResponsiveSpacing('xs'),
  },
  
  ratingStars: {
    fontSize: 12,
    color: '#F59E0B',
    marginRight: getResponsiveSpacing('xs'),
  },
  
  ratingCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
