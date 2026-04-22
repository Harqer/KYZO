import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from '../atoms/Badge';
import { getResponsiveSpacing } from '../../constants/responsive';

interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  discount?: number;
  size?: 'sm' | 'md' | 'lg';
  showDiscount?: boolean;
  style?: any;
}

const PRICE_SIZES = {
  sm: {
    price: 14,
    originalPrice: 12,
    discount: 10,
  },
  md: {
    price: 16,
    originalPrice: 14,
    discount: 12,
  },
  lg: {
    price: 20,
    originalPrice: 16,
    discount: 14,
  },
};

export function ProductPrice({ 
  price, 
  originalPrice, 
  discount, 
  size = 'md', 
  showDiscount = true,
  style 
}: ProductPriceProps) {
  const hasDiscount = discount || (originalPrice && originalPrice > price);
  const displayDiscount = discount || (originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0);
  
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.currentPrice, { fontSize: PRICE_SIZES[size].price }]}>
        ${price.toFixed(2)}
      </Text>
      
      {hasDiscount && originalPrice && (
        <Text style={[styles.originalPrice, { fontSize: PRICE_SIZES[size].originalPrice }]}>
          ${originalPrice.toFixed(2)}
        </Text>
      )}
      
      {hasDiscount && showDiscount && (
        <Badge 
          variant="error" 
          size="sm"
          style={styles.discountBadge}
        >
          -{displayDiscount}%
        </Badge>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('xs'),
  },
  
  currentPrice: {
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  originalPrice: {
    fontWeight: '400',
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  
  discountBadge: {
    marginLeft: getResponsiveSpacing('xs'),
  },
});
