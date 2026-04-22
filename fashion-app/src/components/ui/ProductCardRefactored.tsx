import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { ProductImage } from '../atoms/ProductImage';
import { ProductInfo } from '../atoms/ProductInfo';
import { LikeButton } from '../atoms/LikeButton';
import { ProductCardActions } from '../molecules/ProductCardActions';
import { getResponsiveSpacing, IMAGES, ScreenDimensions } from '../../constants/responsive';
import { fashionApi, Product } from '../../services/fashionApi';
import { webhookService } from '../../services/webhookService';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'featured';
  onProductPress?: (product: Product) => void;
  showLikeButton?: boolean;
  showAddToCartButton?: boolean;
  initialLiked?: boolean;
  style?: any;
}

export function ProductCardRefactored({
  product,
  variant = 'default',
  onProductPress,
  showLikeButton = true,
  showAddToCartButton = true,
  initialLiked = false,
  style
}: ProductCardProps) {
  const [isLiked, setIsLiked] = React.useState(initialLiked);
  const [isLoading, setIsLoading] = React.useState(false);

  const getCardDimensions = () => {
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
      
    return { width: cardWidth, height: cardHeight };
  };

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
      setIsLiked(!isLiked); // Revert on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await fashionApi.addToCart(product.id, 1);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup webhook listeners
  React.useEffect(() => {
    const handleInventoryChange = (data: any) => {
      if (data.product_id === product.id) {
        // Product updated - could trigger a refresh if needed
        console.log('Product inventory updated:', data);
      }
    };

    webhookService.registerEventHandler('inventory_change', handleInventoryChange);

    return () => {
      webhookService.removeEventHandler('inventory_change', handleInventoryChange);
    };
  }, [product.id]);

  const { width, height } = getCardDimensions();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        styles[variant],
        { width, height }
      ]}
      onPress={() => onProductPress?.(product)}
      activeOpacity={0.8}
    >
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        <ProductImage
          source={product.image}
          variant={variant}
          style={styles.image}
        />
        
        {/* Like Button Overlay */}
        {showLikeButton && (
          <View style={styles.likeButtonOverlay}>
            <LikeButton
              isLiked={isLiked}
              onLike={handleLike}
              loading={isLoading}
              size={variant === 'compact' ? 'sm' : 'md'}
              variant="overlay"
            />
          </View>
        )}
        
        {/* Discount Badge */}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={[styles.infoContainer, styles[`${variant}Info`]]}>
        <ProductInfo
          name={product.name}
          brand={product.brand}
          price={product.price}
          originalPrice={product.original_price}
          rating={product.rating}
          reviewsCount={product.reviews_count}
          variant={variant}
        />
        
        {/* Action Buttons */}
        <ProductCardActions
          productId={product.id}
          isLiked={isLiked}
          onLike={handleLike}
          onAddToCart={handleAddToCart}
          loading={isLoading}
          inStock={product.in_stock}
          showLikeButton={false} // Already shown in overlay
          showAddToCartButton={showAddToCartButton}
          variant={variant}
        />
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
  },
  
  // Like Button Overlay
  likeButtonOverlay: {
    position: 'absolute',
    top: getResponsiveSpacing('sm'),
    right: getResponsiveSpacing('sm'),
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
  
  // Info Container
  infoContainer: {
    padding: getResponsiveSpacing('md'),
    flex: 1,
    justifyContent: 'space-between',
  },
  
  defaultInfo: {
    minHeight: 80,
    padding: getResponsiveSpacing('md'),
  },
  
  compactInfo: {
    padding: getResponsiveSpacing('sm'),
    minHeight: 60,
  },
  
  featuredInfo: {
    padding: getResponsiveSpacing('lg'),
    minHeight: 100,
  },
});
