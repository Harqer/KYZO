import React from 'react';
import { TouchableOpacity, View, StyleSheet, Text } from 'react-native';
import { ProductImage } from '../atoms/ProductImage';
import { ProductInfo } from '../atoms/ProductInfo';
import { ProductCardActions } from '../molecules/ProductCardActions';
import { getResponsiveSpacing, IMAGES, ScreenDimensions } from '../../constants/responsive';
import { fashionApi, Product } from '../../services/fashionApi';
import { webhookService } from '../../services/webhookService';

interface MinimalistProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
  onProductPress?: (product: Product) => void;
  showLikeButton?: boolean;
  showAddToCartButton?: boolean;
  initialLiked?: boolean;
  style?: any;
}

export function MinimalistProductCard({
  product,
  variant = 'default',
  onProductPress,
  showLikeButton = true,
  showAddToCartButton = true,
  initialLiked = false,
  style
}: MinimalistProductCardProps) {
  const [isLiked, setIsLiked] = React.useState(initialLiked);
  const [isLoading, setIsLoading] = React.useState(false);

  const getCardDimensions = () => {
    const cardWidth = variant === 'compact' 
      ? IMAGES.card.width * 0.8
      : IMAGES.card.width;
      
    const cardHeight = variant === 'compact'
      ? 180
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

  // Setup webhook listeners for real-time updates
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
      style={[
        styles.card,
        styles[variant],
        { width, height }
      ]}
      onPress={() => onProductPress?.(product)}
      activeOpacity={0.7}
    >
      {/* Product Image */}
      <View style={styles.imageContainer}>
        <ProductImage
          source={product.image}
          variant={variant}
          style={styles.image}
        />
        
        {/* Minimalist Like Badge */}
        {showLikeButton && isLiked && (
          <View style={styles.likedBadge}>
            <Text style={styles.likedText}>Liked</Text>
          </View>
        )}
        
        {/* Discount Badge */}
        {product.discount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}
      </View>

      {/* Product Info - Minimalist */}
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
        
        {/* Minimalist Actions */}
        <ProductCardActions
          productId={product.id}
          isLiked={isLiked}
          onLike={handleLike}
          onAddToCart={handleAddToCart}
          loading={isLoading}
          inStock={product.in_stock}
          showLikeButton={false}
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
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: getResponsiveSpacing('xs'),
  },
  
  // Variants
  default: {
    marginBottom: getResponsiveSpacing('md'),
  },
  
  compact: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  // Image Container
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  
  image: {
    width: '100%',
  },
  
  // Liked Badge
  likedBadge: {
    position: 'absolute',
    top: getResponsiveSpacing('xs'),
    right: getResponsiveSpacing('xs'),
    backgroundColor: '#EF4444',
    paddingHorizontal: getResponsiveSpacing('xs'),
    paddingVertical: 2,
    borderRadius: 4,
  },
  
  likedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Discount Badge
  discountBadge: {
    position: 'absolute',
    top: getResponsiveSpacing('xs'),
    left: getResponsiveSpacing('xs'),
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
    padding: getResponsiveSpacing('sm'),
    flex: 1,
    justifyContent: 'space-between',
  },
  
  defaultInfo: {
    minHeight: 70,
    padding: getResponsiveSpacing('sm'),
  },
  
  compactInfo: {
    padding: getResponsiveSpacing('xs'),
    minHeight: 50,
  },
});
