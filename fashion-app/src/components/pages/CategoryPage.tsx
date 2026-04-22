import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Search, Filter, Heart, ShoppingBag, ArrowLeft } from 'lucide-react-native';
import { Heading } from '../base/Heading';
import { Button } from '../base/Button';
import { ProductCard } from '../base/ProductCard';
import { getResponsiveSpacing, ScreenDimensions, TYPOGRAPHY } from '../../constants/responsive';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  rating: number;
  category: string;
  isNew?: boolean;
  discount?: number;
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Elegant Summer Dress',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400',
    brand: 'Chic Style',
    rating: 4.8,
    category: 'Dresses',
    isNew: true,
  },
  {
    id: '2',
    name: 'Floral Print Maxi Dress',
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400',
    brand: 'Bloom Fashion',
    rating: 4.6,
    category: 'Dresses',
  },
  {
    id: '3',
    name: 'Cocktail Evening Dress',
    price: 150.00,
    image: 'https://images.unsplash.com/photo-1569163139739-f5dea6c9d5a6?w=400',
    brand: 'Elegant Wear',
    rating: 4.9,
    category: 'Dresses',
    discount: 15,
  },
  {
    id: '4',
    name: 'Casual Summer Dress',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1495385799359-7d6e2e4c7ea0?w=400',
    brand: 'Comfort Style',
    rating: 4.4,
    category: 'Dresses',
  },
  {
    id: '5',
    name: 'Business Formal Dress',
    price: 95.00,
    image: 'https://images.unsplash.com/photo-1572800078895-c98b0167352a?w=400',
    brand: 'Professional',
    rating: 4.7,
    category: 'Dresses',
  },
  {
    id: '6',
    name: 'Beach Vacation Dress',
    price: 55.00,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    brand: 'Summer Vibes',
    rating: 4.5,
    category: 'Dresses',
  },
];

const FILTER_OPTIONS: FilterOption[] = [
  { id: '1', label: 'All', value: 'all' },
  { id: '2', label: 'New Arrivals', value: 'new' },
  { id: '3', label: 'On Sale', value: 'sale' },
  { id: '4', label: 'Price: Low to High', value: 'price-low' },
  { id: '5', label: 'Price: High to Low', value: 'price-high' },
  { id: '6', label: 'Top Rated', value: 'rating' },
];

export function CategoryPage({ route, navigation }: any) {
  const { categoryId } = route.params;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [cartCount, setCartCount] = useState(3);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleLike = (productId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleAddToCart = (productId: string) => {
    setCartCount(prev => prev + 1);
    console.log(`Added product ${productId} to cart`);
  };

  const handleProductPress = (product: Product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
  };

  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.categoryName}>Dresses</Text>
          <Text style={styles.productCount}>156 items</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cartButton}>
            <ShoppingBag size={20} color="#1F2937" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.searchBar}>
        <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search dresses..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.filterChip,
                selectedFilter === option.value && styles.filterChipActive,
              ]}
              onPress={() => handleFilterPress(option.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === option.value && styles.filterChipTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSortBar = () => (
    <View style={styles.sortBar}>
      <Text style={styles.resultsText}>Showing {SAMPLE_PRODUCTS.length} results</Text>
      
      <View style={styles.sortActions}>
        <TouchableOpacity style={styles.sortButton}>
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.viewModeButton}
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          <Text style={styles.viewModeText}>
            {viewMode === 'grid' ? 'List' : 'Grid'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductGrid = () => (
    <FlatList
      data={SAMPLE_PRODUCTS}
      numColumns={ScreenDimensions.isMobile() ? 2 : 3}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.productGrid}
      columnWrapperStyle={styles.productRow}
      renderItem={({ item }) => (
        <ProductCard
          {...item}
          variant="compact"
          isLiked={likedItems.has(item.id)}
          onLike={() => handleLike(item.id)}
          onAddToCart={() => handleAddToCart(item.id)}
          onPress={() => handleProductPress(item)}
        />
      )}
    />
  );

  const renderProductList = () => (
    <FlatList
      data={SAMPLE_PRODUCTS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.productList}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.productListItem}
          onPress={() => handleProductPress(item)}
        >
          <Image
            source={{ uri: item.image }}
            style={styles.productListImage}
            resizeMode="cover"
          />
          <View style={styles.productListInfo}>
            <Text style={styles.productListName}>{item.name}</Text>
            <Text style={styles.productListBrand}>{item.brand}</Text>
            <View style={styles.productListPriceRow}>
              <Text style={styles.productListPrice}>${item.price.toFixed(2)}</Text>
              {item.discount && (
                <Text style={styles.productListDiscount}>
                  {item.discount}% OFF
                </Text>
              )}
            </View>
            <View style={styles.productListActions}>
              <TouchableOpacity
                style={styles.productListLikeButton}
                onPress={() => handleLike(item.id)}
              >
                <Heart
                  size={16}
                  color={likedItems.has(item.id) ? '#EF4444' : '#9CA3AF'}
                  fill={likedItems.has(item.id) ? '#EF4444' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.productListCartButton}
                onPress={() => handleAddToCart(item.id)}
              >
                <ShoppingBag size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderHeader()}
        {renderSortBar()}
        {viewMode === 'grid' ? renderProductGrid() : renderProductList()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Header
  header: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingTop: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('sm'),
  },
  
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveSpacing('md'),
  },
  
  backButton: {
    padding: getResponsiveSpacing('xs'),
  },
  
  headerTitle: {
    flex: 1,
    alignItems: 'center',
  },
  
  categoryName: {
    ...TYPOGRAPHY.responsive.h2,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  
  productCount: {
    ...TYPOGRAPHY.responsive.caption,
    color: '#6B7280',
    marginTop: 2,
  },
  
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('sm'),
  },
  
  searchButton: {
    padding: getResponsiveSpacing('xs'),
  },
  
  cartButton: {
    padding: getResponsiveSpacing('xs'),
    position: 'relative',
  },
  
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  cartBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  // Search Bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('md'),
  },
  
  searchIcon: {
    marginRight: getResponsiveSpacing('sm'),
  },
  
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  
  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('sm'),
  },
  
  filterContainer: {
    flex: 1,
    gap: getResponsiveSpacing('sm'),
  },
  
  filterChip: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('xs'),
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  
  filterChipActive: {
    backgroundColor: '#6366F1',
  },
  
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  
  filterButton: {
    padding: getResponsiveSpacing('sm'),
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  
  // Sort Bar
  sortBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  resultsText: {
    ...TYPOGRAPHY.responsive.body,
    color: '#6B7280',
  },
  
  sortActions: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('sm'),
  },
  
  sortButton: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('xs'),
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  
  viewModeButton: {
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('xs'),
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
  
  viewModeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  
  // Product Grid
  productGrid: {
    padding: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('md'),
  },
  
  productRow: {
    justifyContent: 'space-between',
  },
  
  // Product List
  productList: {
    padding: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('md'),
  },
  
  productListItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: getResponsiveSpacing('md'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: getResponsiveSpacing('md'),
  },
  
  productListImage: {
    width: 100,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  productListInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  productListName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  
  productListBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  
  productListPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('sm'),
    marginBottom: 8,
  },
  
  productListPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  productListDiscount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#EF4444',
  },
  
  productListActions: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('sm'),
  },
  
  productListLikeButton: {
    padding: getResponsiveSpacing('xs'),
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  
  productListCartButton: {
    padding: getResponsiveSpacing('xs'),
    backgroundColor: '#6366F1',
    borderRadius: 8,
  },
});
