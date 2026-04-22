import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { ProductImage } from '../atoms/ProductImage';
import { ProductInfo } from '../atoms/ProductInfo';
import { LikeButton } from '../atoms/LikeButton';
import { AddToCartButton } from '../atoms/AddToCartButton';
import { GlassCard } from '../atoms/GlassCard';
import { getResponsiveSpacing, IMAGES, ScreenDimensions } from '../../constants/responsive';
import { fashionApi, Product } from '../../services/fashionApi';
import { webhookService } from '../../services/webhookService';

interface GlassProductCardProps {
  product: Product;
  variant?: 'minimal' | 'premium' | 'agent';
  onProductPress?: (product: Product) => void;
  showLikeButton?: boolean;
  showAddToCartButton?: boolean;
  initialLiked?: boolean;
  style?: any;
}

export function GlassProductCard({
  product,
  variant = 'premium',
  onProductPress,
  showLikeButton = true,
  showAddToCartButton = true,
  initialLiked = false,
  style
}: GlassProductCardProps) {
  const [isLiked, setIsLiked] = React.useState(initialLiked);
  const [isLoading, setIsLoading] = React.useState(false);

  const getCardDimensions = () => {
    const cardWidth = IMAGES.card.width;
    const cardHeight = variant === 'minimal' ? 180 : IMAGES.card.height;
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
      setIsLiked(!isLiked);
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

  React.useEffect(() => {
    const handleInventoryChange = (data: any) => {
      if (data.product_id === product.id) {
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
      style={[styles.card, { width, height }]}
      onPress={() => onProductPress?.(product)}
      activeOpacity={0.8}
    >
      <GlassCard
        variant={variant === 'minimal' ? 'minimal' : variant === 'agent' ? 'agent' : 'card'}
        style={styles.glassContainer}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <ProductImage
            source={product.image}
            variant={variant === 'minimal' ? 'compact' : 'default'}
            style={styles.image}
          />
          
          {/* Like Button Overlay */}
          {showLikeButton && (
            <View style={styles.likeButtonOverlay}>
              <LikeButton
                isLiked={isLiked}
                onLike={handleLike}
                loading={isLoading}
                size="sm"
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
            variant={variant === 'minimal' ? 'compact' : 'default'}
          />
          
          {/* Action Buttons */}
          {showAddToCartButton && (
            <View style={styles.actionContainer}>
              <AddToCartButton
                onPress={handleAddToCart}
                loading={isLoading}
                disabled={!product.in_stock}
                size="sm"
                variant="default"
              />
            </View>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: getResponsiveSpacing('xs'),
    marginBottom: getResponsiveSpacing('md'),
  },
  
  glassContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  // Image Container
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  
  image: {
    width: '100%',
    height: '100%',
  },
  
  likeButtonOverlay: {
    position: 'absolute',
    top: getResponsiveSpacing('sm'),
    right: getResponsiveSpacing('sm'),
  },
  
  discountBadge: {
    position: 'absolute',
    top: getResponsiveSpacing('sm'),
    left: getResponsiveSpacing('sm'),
    backgroundColor: '#F59E0B',
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
  
  minimalInfo: {
    padding: getResponsiveSpacing('sm'),
  },
  
  premiumInfo: {
    padding: getResponsiveSpacing('md'),
  },
  
  agentInfo: {
    padding: getResponsiveSpacing('lg'),
  },
  
  actionContainer: {
    alignSelf: 'flex-start',
    marginTop: getResponsiveSpacing('xs'),
  },
});
