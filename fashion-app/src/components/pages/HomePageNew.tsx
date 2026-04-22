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

const SAMPLE_OFFERS = [
  {
    id: '1',
    title: 'Summer Sale',
    subtitle: 'Up to 50% off',
    description: 'Selected items only',
    buttonText: 'Shop Now',
    variant: 'primary' as const,
  },
  {
    id: '2',
    title: 'New Arrivals',
    subtitle: 'Free Shipping',
    description: 'On orders over $100',
    buttonText: 'Explore',
    variant: 'secondary' as const,
  },
];

export function HomePage({ navigation }: any) {
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

  const headerProps = {
    title: 'KYZO',
    cartCount,
    onCartPress: () => navigation.navigate('Cart'),
    onSearch: (query: string) => console.log('Search:', query),
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <HomeTemplate headerProps={headerProps}>
        <HeroSection 
          onButtonPress={() => navigation.navigate('Collection')}
        />
        
        <CategoryGrid 
          categories={SAMPLE_CATEGORIES}
          onCategoryPress={handleCategoryPress}
        />
        
        <ProductGrid
          products={SAMPLE_PRODUCTS}
          likedItems={likedItems}
          onLike={handleLike}
          onAddToCart={handleAddToCart}
          onProductPress={handleProductPress}
        />
        
        <SpecialOffers offers={SAMPLE_OFFERS} />
      </HomeTemplate>
    </SafeAreaView>
  );
}
