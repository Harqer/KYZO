import React from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { ProductCard } from '../base/ProductCard';
import { getResponsiveSpacing, ScreenDimensions } from '../../constants/responsive';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  brand?: string;
  rating?: number;
  category?: string;
  isNew?: boolean;
  discount?: number;
}

interface ProductGridProps {
  products: Product[];
  columns?: number;
  variant?: 'default' | 'compact' | 'featured';
  onProductPress?: (product: Product) => void;
  onLike?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  likedItems?: Set<string>;
  loading?: boolean;
  style?: any;
}

export function ProductGrid({
  products,
  columns = ScreenDimensions.isMobile() ? 2 : 3,
  variant = 'default',
  onProductPress,
  onLike,
  onAddToCart,
  likedItems = new Set(),
  loading = false,
  style
}: ProductGridProps) {
  
  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      {...item}
      variant={variant}
      isLiked={likedItems.has(item.id)}
      onLike={() => onLike?.(item.id)}
      onAddToCart={() => onAddToCart?.(item.id)}
      onPress={() => onProductPress?.(item)}
    />
  );
  
  const getItemLayout = (_: any, index: number) => ({
    length: variant === 'compact' ? 200 : variant === 'featured' ? 300 : 250,
    offset: (variant === 'compact' ? 200 : variant === 'featured' ? 300 : 250) * index,
    index,
  });
  
  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.contentContainer}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  contentContainer: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingBottom: getResponsiveSpacing('xl'),
  },
  
  row: {
    justifyContent: 'space-between',
    gap: getResponsiveSpacing('md'),
  },
});
