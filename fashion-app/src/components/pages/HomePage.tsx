import React, { useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { HomeTemplate } from '../templates/HomeTemplate';
import { Header } from '../organisms/Header';
import { ProductGrid } from '../organisms/ProductGrid';
import { HeroSection } from '../organisms/HeroSection';
import { CategoryGrid } from '../organisms/CategoryGrid';
import { SpecialOffers } from '../organisms/SpecialOffers';
import { getResponsiveSpacing } from '../../constants/responsive';

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

interface Category {
  id: string;
  name: string;
  image: string;
  itemCount: number;
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
    name: 'Classic Denim Jacket',
    price: 120.00,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    brand: 'Urban Wear',
    rating: 4.5,
    category: 'Jackets',
    discount: 20,
  },
  {
    id: '3',
    name: 'Floral Print Blouse',
    price: 65.00,
    image: 'https://images.unsplash.com/photo-1469335391462-70e9eeee489c?w=400',
    brand: 'Bloom Fashion',
    rating: 4.7,
    category: 'Tops',
  },
  {
    id: '4',
    name: 'High-Waist Jeans',
    price: 95.00,
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
    brand: 'Denim Co',
    rating: 4.6,
    category: 'Bottoms',
  },
];

const SAMPLE_CATEGORIES: Category[] = [
  {
    id: '1',
    name: 'Dresses',
    image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=200',
    itemCount: 156,
  },
  {
    id: '2',
    name: 'Tops',
    image: 'https://images.unsplash.com/photo-1469335391462-70e9eeee489c?w=200',
    itemCount: 234,
  },
  {
    id: '3',
    name: 'Bottoms',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=200',
    itemCount: 189,
  },
  {
    id: '4',
    name: 'Accessories',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200',
    itemCount: 98,
  },
];

export function HomePage({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(3);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

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

  const handleCategoryPress = (category: Category) => {
    navigation.navigate('Category', { categoryId: category.id });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity style={styles.menuButton}>
          <Menu size={24} color="#1F2937" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>KYZO</Text>
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
          placeholder="Search for products..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );

  const renderHeroSection = () => (
    <View style={styles.heroSection}>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>New Collection</Text>
        <Text style={styles.heroSubtitle}>Summer 2024</Text>
        <Text style={styles.heroDescription}>
          Discover our latest fashion trends with up to 50% off
        </Text>
        <Button 
          onPress={() => navigation.navigate('Collection')}
          style={styles.heroButton}
        >
          Shop Now
        </Button>
      </View>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400' }}
        style={styles.heroImage}
        resizeMode="cover"
      />
    </View>
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AllCategories')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={SAMPLE_CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.categoryCard}
            onPress={() => handleCategoryPress(item)}
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
        )}
      />
    </View>
  );

  const renderFeaturedProducts = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AllProducts')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={SAMPLE_PRODUCTS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.productsContainer}
        renderItem={({ item }) => (
          <ProductCard
            {...item}
            variant="default"
            isLiked={likedItems.has(item.id)}
            onLike={() => handleLike(item.id)}
            onAddToCart={() => handleAddToCart(item.id)}
            onPress={() => handleProductPress(item)}
          />
        )}
      />
    </View>
  );

  const renderSpecialOffers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Special Offers</Text>
      </View>
      
      <View style={styles.offerCards}>
        <View style={[styles.offerCard, styles.offerCardPrimary]}>
          <Text style={[styles.offerTitle, styles.offerTitlePrimary]}>Summer Sale</Text>
          <Text style={[styles.offerSubtitle, styles.offerSubtitlePrimary]}>Up to 50% off</Text>
          <Text style={[styles.offerDescription, styles.offerDescriptionPrimary]}>Selected items only</Text>
          <TouchableOpacity style={styles.offerButton}>
            <Text style={styles.offerButtonText}>Shop Now</Text>
            <ChevronRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.offerCard, styles.offerCardSecondary]}>
          <Text style={[styles.offerTitle, styles.offerTitleSecondary]}>New Arrivals</Text>
          <Text style={[styles.offerSubtitle, styles.offerSubtitleSecondary]}>Free Shipping</Text>
          <Text style={[styles.offerDescription, styles.offerDescriptionSecondary]}>On orders over $100</Text>
          <TouchableOpacity style={[styles.offerButton, styles.offerButtonSecondary]}>
            <Text style={[styles.offerButtonText, styles.offerButtonTextSecondary]}>Explore</Text>
            <ChevronRight size={16} color="#6366F1" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderHeader()}
        {renderHeroSection()}
        {renderCategories()}
        {renderFeaturedProducts()}
        {renderSpecialOffers()}
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
  
  scrollContent: {
    paddingBottom: getResponsiveSpacing('xl'),
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
  
  menuButton: {
    padding: getResponsiveSpacing('xs'),
  },
  
  logoContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
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
  },
  
  searchIcon: {
    marginRight: getResponsiveSpacing('sm'),
  },
  
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  
  // Hero Section
  heroSection: {
    marginHorizontal: getResponsiveSpacing('lg'),
    marginBottom: getResponsiveSpacing('xl'),
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    overflow: 'hidden',
    height: ScreenDimensions.isMobile() ? 200 : 250,
  },
  
  heroContent: {
    position: 'absolute',
    left: getResponsiveSpacing('lg'),
    top: getResponsiveSpacing('lg'),
    zIndex: 1,
    width: ScreenDimensions.isMobile() ? '60%' : '50%',
  },
  
  heroTitle: {
    ...TYPOGRAPHY.responsive.h2,
    color: '#92400E',
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  heroSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#B45309',
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  heroDescription: {
    ...TYPOGRAPHY.responsive.body,
    color: '#78350F',
    marginBottom: getResponsiveSpacing('md'),
  },
  
  heroButton: {
    backgroundColor: '#92400E',
  },
  
  heroImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: ScreenDimensions.isMobile() ? '50%' : '60%',
    height: '100%',
  },
  
  // Section
  section: {
    marginBottom: getResponsiveSpacing('xl'),
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    marginBottom: getResponsiveSpacing('md'),
  },
  
  sectionTitle: {
    ...TYPOGRAPHY.responsive.h2,
    color: '#1F2937',
  },
  
  seeAll: {
    ...TYPOGRAPHY.responsive.body,
    color: '#6366F1',
    fontWeight: '500',
  },
  
  // Categories
  categoriesContainer: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('md'),
  },
  
  categoryCard: {
    width: ScreenDimensions.isMobile() ? 120 : 140,
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
  
  // Products
  productsContainer: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('md'),
  },
  
  // Special Offers
  offerCards: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('md'),
  },
  
  offerCard: {
    borderRadius: 12,
    padding: getResponsiveSpacing('lg'),
    position: 'relative',
    overflow: 'hidden',
  },
  
  offerCardPrimary: {
    backgroundColor: '#1F2937',
  },
  
  offerCardSecondary: {
    backgroundColor: '#F3F4F6',
  },
  
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  offerTitlePrimary: {
    color: '#FFFFFF',
  },
  
  offerTitleSecondary: {
    color: '#1F2937',
  },
  
  offerSubtitle: {
    fontSize: 14,
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  offerSubtitlePrimary: {
    color: '#F3F4F6',
  },
  
  offerSubtitleSecondary: {
    color: '#6B7280',
  },
  
  offerDescription: {
    fontSize: 12,
    marginBottom: getResponsiveSpacing('md'),
  },
  
  offerDescriptionPrimary: {
    color: '#9CA3AF',
  },
  
  offerDescriptionSecondary: {
    color: '#9CA3AF',
  },
  
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  
  offerButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  
  offerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: getResponsiveSpacing('xs'),
  },
  
  offerButtonTextSecondary: {
    color: '#6366F1',
  },
});
