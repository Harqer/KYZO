import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LikeButton } from '../atoms/LikeButton';
import { AddToCartButton } from '../atoms/AddToCartButton';
import { getResponsiveSpacing } from '../../constants/responsive';

interface ProductCardActionsProps {
  productId: string;
  isLiked: boolean;
  onLike: () => void;
  onAddToCart: () => void;
  loading?: boolean;
  inStock?: boolean;
  showLikeButton?: boolean;
  showAddToCartButton?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  style?: any;
}

export function ProductCardActions({
  productId,
  isLiked,
  onLike,
  onAddToCart,
  loading = false,
  inStock = true,
  showLikeButton = true,
  showAddToCartButton = true,
  variant = 'default',
  style
}: ProductCardActionsProps) {
  
  const renderOutOfStock = () => {
    if (inStock) return null;
    
    return (
      <Text style={styles.outOfStockText}>Out of Stock</Text>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.actionsRow}>
        {showLikeButton && (
          <LikeButton
            isLiked={isLiked}
            onLike={onLike}
            loading={loading}
            size={variant === 'compact' ? 'sm' : 'md'}
            variant="default"
          />
        )}
        
        {showAddToCartButton && (
          <AddToCartButton
            onPress={onAddToCart}
            loading={loading}
            disabled={!inStock}
            size={variant === 'compact' ? 'sm' : 'md'}
            variant="default"
          />
        )}
      </View>
      
      {renderOutOfStock()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: getResponsiveSpacing('xs'),
  },
  
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  outOfStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: getResponsiveSpacing('xs'),
  },
});
