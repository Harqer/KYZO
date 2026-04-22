import React, { useState, useCallback } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, FlatList, Text, Image } from 'react-native';
import { Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react-native';
import { GlassCard } from '../atoms/GlassCard';
import { getResponsiveSpacing } from '../../constants/responsive';
import { fashionApi, Product, SearchResult } from '../../services/fashionApi';

interface GlassSearchBarProps {
  onProductSelect?: (product: Product) => void;
  onClose?: () => void;
  placeholder?: string;
  variant?: 'minimal' | 'premium' | 'agent';
  showRecentSearches?: boolean;
  style?: any;
}

export function GlassSearchBar({
  onProductSelect,
  onClose,
  placeholder = 'Search products...',
  variant = 'premium',
  showRecentSearches = true,
  style
}: GlassSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const loadRecentSearches = async () => {
    const mockRecentSearches = ['summer dress', 'denim jacket', 'floral blouse'];
    setRecentSearches(mockRecentSearches);
  };

  const loadTrendingSearches = async () => {
    const mockTrendingSearches = ['vintage style', 'sustainable fashion', 'minimalist design'];
    setTrendingSearches(mockTrendingSearches);
  };

  React.useEffect(() => {
    loadRecentSearches();
    loadTrendingSearches();
  }, []);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fashionApi.searchProducts(searchQuery, {
        limit: 8,
        sort_by: 'rating',
        sort_order: 'desc'
      });
      
      if (response.success && response.data) {
        setResults(response.data.products);
        setShowResults(true);
        
        if (!recentSearches.includes(searchQuery.toLowerCase())) {
          const updatedRecent = [searchQuery.toLowerCase(), ...recentSearches.slice(0, 4)];
          setRecentSearches(updatedRecent);
        }
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  }, [recentSearches]);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => onProductSelect?.(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
      </View>
      {item.discount && (
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>-{item.discount}%</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRecentSearch = (searchTerm: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.recentSearchItem}
      onPress={() => setQuery(searchTerm)}
      activeOpacity={0.7}
    >
      <Clock size={16} color="#9CA3AF" />
      <Text style={styles.recentSearchText}>{searchTerm}</Text>
    </TouchableOpacity>
  );

  const renderTrendingSearch = (searchTerm: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.trendingSearchItem}
      onPress={() => setQuery(searchTerm)}
      activeOpacity={0.7}
    >
      <TrendingUp size={16} color="#6366F1" />
      <Text style={styles.trendingSearchText}>{searchTerm}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {/* Search Input */}
      <GlassCard
        variant={variant === 'minimal' ? 'minimal' : 'card'}
        style={styles.searchContainer}
      >
        <View style={styles.searchInputContainer}>
          <SearchIcon size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearButton} onPress={() => setQuery('')}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
          {onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={20} color="#1F2937" />
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>

      {/* Search Results */}
      {showResults && results.length > 0 && !loading && (
        <View style={styles.resultsContainer}>
          <GlassCard variant="minimal" style={styles.resultsCard}>
            <FlatList
              data={results}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.resultsList}
            />
          </GlassCard>
        </View>
      )}

      {/* Recent Searches */}
      {!query && showRecentSearches && recentSearches.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <GlassCard variant="minimal" style={styles.searchesCard}>
            <View style={styles.searchesList}>
              {recentSearches.map(renderRecentSearch)}
            </View>
          </GlassCard>
        </View>
      )}

      {/* Trending Searches */}
      {!query && trendingSearches.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <GlassCard variant="minimal" style={styles.searchesCard}>
            <View style={styles.searchesList}>
              {trendingSearches.map(renderTrendingSearch)}
            </View>
          </GlassCard>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  searchContainer: {
    margin: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('sm'),
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  searchIcon: {
    marginRight: getResponsiveSpacing('sm'),
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  
  clearButton: {
    padding: getResponsiveSpacing('xs'),
    marginRight: getResponsiveSpacing('xs'),
  },
  
  closeButton: {
    padding: getResponsiveSpacing('xs'),
  },
  
  resultsContainer: {
    marginHorizontal: getResponsiveSpacing('lg'),
    maxHeight: 300,
  },
  
  resultsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  
  resultsList: {
    padding: getResponsiveSpacing('sm'),
  },
  
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: getResponsiveSpacing('md'),
  },
  
  productInfo: {
    flex: 1,
  },
  
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  
  productBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  discountBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  
  discountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  sectionContainer: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingTop: getResponsiveSpacing('lg'),
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: getResponsiveSpacing('md'),
  },
  
  searchesCard: {
    padding: getResponsiveSpacing('sm'),
  },
  
  searchesList: {
    gap: getResponsiveSpacing('sm'),
  },
  
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderRadius: 8,
  },
  
  recentSearchText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: getResponsiveSpacing('sm'),
  },
  
  trendingSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 8,
  },
  
  trendingSearchText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: getResponsiveSpacing('sm'),
  },
});
