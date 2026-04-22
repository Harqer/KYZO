import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { getResponsiveSpacing, ScreenDimensions, IMAGES } from '../../constants/responsive';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  brand?: string;
  rating?: number;
  isLiked?: boolean;
  onLike?: () => void;
  onAddToCart?: () => void;
  onPress?: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export function ProductCard({
  id,
  name,
  price,
  image,
  brand,
  rating,
  isLiked = false,
  onLike,
  onAddToCart,
  onPress,
  variant = 'default'
}: ProductCardProps) {
  const isMobile = ScreenDimensions.isMobile();
  
  const cardWidth = variant === 'compact' 
    ? IMAGES.card.width * 0.8
    : variant === 'featured'
    ? ScreenDimensions.width - getResponsiveSpacing('lg') * 2
    : IMAGES.card.width;
    
  const cardHeight = variant === 'compact'
    ? 200
    : variant === 'featured'
    ? 300
    : IMAGES.card.height;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles[variant],
        { width: cardWidth, height: cardHeight }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image }}
          style={[styles.image, { height: variant === 'compact' ? 120 : 180 }]}
          resizeMode="cover"
        />
        
        {/* Like Button */}
        <TouchableOpacity
          style={[styles.likeButton, styles[`${variant}LikeButton`]]}
          onPress={onLike}
        >
          <Heart
            size={variant === 'compact' ? 16 : 20}
            color={isLiked ? '#EF4444' : '#FFFFFF'}
            fill={isLiked ? '#EF4444' : 'none'}
          />
        </TouchableOpacity>
      </View>

      {/* Product Info */}
      <View style={[styles.info, styles[`${variant}Info`]]}>
        {brand && (
          <Text style={[styles.brand, styles[`${variant}Brand`]]}>{brand}</Text>
        )}
        
        <Text 
          style={[styles.name, styles[`${variant}Name`]]}
          numberOfLines={variant === 'compact' ? 1 : 2}
        >
          {name}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.price, styles[`${variant}Price`]]}>
            ${price.toFixed(2)}
          </Text>
          
          {onAddToCart && (
            <TouchableOpacity
              style={[styles.addToCartButton, styles[`${variant}AddToCart`]]}
              onPress={onAddToCart}
            >
              <ShoppingCart
                size={variant === 'compact' ? 14 : 18}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </View>
        
        {rating && (
          <View style={styles.rating}>
            <Text style={styles.ratingText}>{'\u2605'.repeat(Math.floor(rating))}</Text>
            <Text style={styles.ratingNumber}>({rating})</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: getResponsiveSpacing('xs'),
  },
  
  // Variants
  default: {
    marginBottom: getResponsiveSpacing('md'),
  },
  
  compact: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  featured: {
    marginBottom: getResponsiveSpacing('lg'),
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  
  // Image Container
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  
  image: {
    width: '100%',
    backgroundColor: '#F3F4F6',
  },
  
  // Like Button
  likeButton: {
    position: 'absolute',
    top: getResponsiveSpacing('sm'),
    right: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: getResponsiveSpacing('xs'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  defaultLikeButton: {
    width: 40,
    height: 40,
  },
  
  compactLikeButton: {
    width: 32,
    height: 32,
  },
  
  featuredLikeButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  
  // Product Info
  info: {
    padding: getResponsiveSpacing('md'),
    flex: 1,
    justifyContent: 'space-between',
  },
  
  defaultInfo: {
    minHeight: 80,
  },
  
  compactInfo: {
    padding: getResponsiveSpacing('sm'),
    minHeight: 60,
  },
  
  featuredInfo: {
    padding: getResponsiveSpacing('lg'),
    minHeight: 100,
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
    flex: 1,
  },
  
  defaultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 18,
    marginBottom: getResponsiveSpacing('xs'),
    flex: 1,
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
  
  // Price Row
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('xs'),
  },
  
  // Price
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
  
  // Add to Cart Button
  addToCartButton: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    padding: getResponsiveSpacing('xs'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  defaultAddToCart: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    padding: getResponsiveSpacing('xs'),
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  
  compactAddToCart: {
    width: 28,
    height: 28,
  },
  
  featuredAddToCart: {
    width: 40,
    height: 40,
  },
  
  // Rating
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: getResponsiveSpacing('xs'),
  },
  
  ratingText: {
    fontSize: 12,
    color: '#F59E0B',
    marginRight: getResponsiveSpacing('xs'),
  },
  
  ratingNumber: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
