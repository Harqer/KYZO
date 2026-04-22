import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { getResponsiveSpacing, ScreenDimensions, IMAGES } from '../../constants/responsive';
import { fashionApi, Product, CartItem } from '../../services/fashionApi';
import { webhookService } from '../../services/webhookService';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  onProductPress?: (product: Product) => void;
  showLikeButton?: boolean;
  showAddToCartButton?: boolean;
  initialLiked?: boolean;
}

export function ProductCard({
  product,
  variant = 'default',
  onProductPress,
  showLikeButton = true,
  showAddToCartButton = true,
  initialLiked = false,
}: ProductCardProps) {
  const [isLiked, setIsLiked] = React.useState(initialLiked);
  const [isLoading, setIsLoading] = React.useState(false);
  const [cartLoading, setCartLoading] = React.useState(false);

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

  // Handle like button press with backend integration
  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (isLiked) {
        await fashionApi.removeFromWishlist(product.id);
        setIsLiked(false);
      } else {
        await fashionApi.addToWishlist(product.id);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      // Revert state on error
      setIsLiked(!isLiked);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle add to cart with backend integration
  const handleAddToCart = async () => {
    if (cartLoading) return;
    
    setCartLoading(true);
    try {
      await fashionApi.addToCart(product.id, 1);
      // The cart count will be updated via webhook
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setCartLoading(false);
    }
  };

  // Setup webhook listeners for real-time updates
  React.useEffect(() => {
    // Listen for cart updates
    const handleCartUpdate = (data: any) => {
      console.log('Cart updated:', data);
      // Could trigger a cart refresh or update local state
    };

    webhookService.registerEventHandler('cart_update', handleCartUpdate);

    return () => {
      webhookService.removeEventHandler('cart_update', handleCartUpdate);
    };
  }, []);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles[variant],
        { width: cardWidth, height: cardHeight }
      ]}
      onPress={() => onProductPress?.(product)}
      activeOpacity={0.8}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={[styles.image, { height: variant === 'compact' ? 120 : 180 }]}
          resizeMode="cover"
        />
        
        {/* Like Button */}
        {showLikeButton && (
          <TouchableOpacity
            style={[styles.likeButton, styles[`${variant}LikeButton`]]}
            onPress={handleLike}
            disabled={isLoading}
          >
            <Heart
              size={variant === 'compact' ? 16 : 20}
              color={isLiked ? '#EF4444' : '#FFFFFF'}
              fill={isLiked ? '#EF4444' : 'none'}
            />
          </TouchableOpacity>
        )}
        
        {/* Discount Badge */}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={[styles.info, styles[`${variant}Info`]]}>
        {product.brand && (
          <Text style={[styles.brand, styles[`${variant}Brand`]]}>{product.brand}</Text>
        )}
        
        <Text 
          style={[styles.name, styles[`${variant}Name`]]}
          numberOfLines={variant === 'compact' ? 1 : 2}
        >
          {product.name}
        </Text>
        
        <View style={styles.priceRow}>
          <Text style={[styles.price, styles[`${variant}Price`]]}>
            ${product.price.toFixed(2)}
          </Text>
          
          {product.original_price && (
            <Text style={[styles.originalPrice, styles[`${variant}OriginalPrice`]]}>
              ${product.original_price.toFixed(2)}
            </Text>
          )}
        </View>
        
        {/* Rating */}
        {product.rating > 0 && (
          <View style={styles.rating}>
            <Text style={styles.ratingStars}>{''.padStart(Math.floor(product.rating), '')}</Text>
            <Text style={styles.ratingNumber}>({product.rating})</Text>
          </View>
        )}
        
        {/* Add to Cart Button */}
        {showAddToCartButton && (
          <TouchableOpacity
            style={[styles.addToCartButton, styles[`${variant}AddToCart`], cartLoading && styles.disabledButton]}
            onPress={handleAddToCart}
            disabled={cartLoading || !product.in_stock}
          >
            <ShoppingCart
              size={variant === 'compact' ? 14 : 18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        )}
        
        {/* Stock Status */}
        {!product.in_stock && (
          <Text style={styles.outOfStock}>Out of Stock</Text>
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
  
  // Discount Badge
  discountBadge: {
    position: 'absolute',
    top: getResponsiveSpacing('sm'),
    left: getResponsiveSpacing('sm'),
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: 2,
  },
  
  discountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
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
    gap: getResponsiveSpacing('xs'),
    marginBottom: getResponsiveSpacing('xs'),
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
  
  // Original Price
  originalPrice: {
    fontSize: 12,
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
  
  ratingNumber: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  // Add to Cart Button
  addToCartButton: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    padding: getResponsiveSpacing('xs'),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveSpacing('xs'),
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
  
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  
  // Out of Stock
  outOfStock: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: getResponsiveSpacing('xs'),
  },
});
