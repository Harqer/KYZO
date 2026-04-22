import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { getResponsiveSpacing, ScreenDimensions } from '../../constants/responsive';

interface Category {
  id: string;
  name: string;
  image: string;
  itemCount: number;
}

interface CategoryGridProps {
  categories: Category[];
  onCategoryPress?: (category: Category) => void;
  columns?: number;
  style?: any;
}

export function CategoryGrid({ 
  categories, 
  onCategoryPress, 
  columns = ScreenDimensions.isMobile() ? 2 : 3,
  style 
}: CategoryGridProps) {
  
  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryCard}
      onPress={() => onCategoryPress?.(item)}
    >
      <Image
        source={{ uri: item.image }}
        style={styles.categoryImage}
        resizeMode="cover"
      />
      <View style={styles.categoryOverlay}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCount}>{item.itemCount} items</Text>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, style]}>
      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.contentContainer}
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
  
  categoryCard: {
    flex: 1,
    height: ScreenDimensions.isMobile() ? 160 : 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: getResponsiveSpacing('sm'),
  },
  
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  
  categoryCount: {
    fontSize: 12,
    color: '#E5E7EB',
  },
});
