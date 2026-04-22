import React, { useState, useEffect, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, FlatList, Text, Image } from 'react-native';
import { Search as SearchIcon, X, Clock, TrendingUp } from 'lucide-react-native';
import { getResponsiveSpacing, ScreenDimensions } from '../../constants/responsive';
import { fashionApi, Product, SearchResult } from '../../services/fashionApi';

interface SearchProps {
  onProductSelect?: (product: Product) => void;
  onClose?: () => void;
  placeholder?: string;
  showRecentSearches?: boolean;
  showTrending?: boolean;
}

export function Search({ 
  onProductSelect, 
  onClose, 
  placeholder = 'Search for products...',
  showRecentSearches = true,
  showTrending = true 
}: SearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
    loadTrendingSearches();
  }, []);

  const loadRecentSearches = async () => {
    try {
      // In a real app, this would come from local storage or backend
      const mockRecentSearches = ['summer dress', 'denim jacket', 'floral blouse', 'leather boots'];
      setRecentSearches(mockRecentSearches);
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  };

  const loadTrendingSearches = async () => {
    try {
      // In a real app, this would come from backend analytics
      const mockTrendingSearches = ['vintage style', 'sustainable fashion', 'minimalist design'];
      setTrendingSearches(mockTrendingSearches);
    } catch (error) {
      console.error('Failed to load trending searches:', error);
    }
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fashionApi.searchProducts(searchQuery, {
        limit: 10,
        sort_by: 'rating',
        sort_order: 'desc'
      });
      
      if (response.success && response.data) {
        setResults(response.data.products);
        setShowResults(true);
        
        // Save to recent searches
        if (!recentSearches.includes(searchQuery.toLowerCase())) {
          const updatedRecent = [searchQuery.toLowerCase(), ...recentSearches.slice(0, 4)];
          setRecentSearches(updatedRecent);
          // In a real app, save to local storage
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

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleRecentSearchPress = (searchTerm: string) => {
    setQuery(searchTerm);
  };

  const handleClearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productItem}
      onPress={() => onProductSelect?.(item)}
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
      onPress={() => handleRecentSearchPress(searchTerm)}
    >
      <Clock size={16} color="#9CA3AF" />
      <Text style={styles.recentSearchText}>{searchTerm}</Text>
    </TouchableOpacity>
  );

  const renderTrendingSearch = (searchTerm: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.trendingSearchItem}
      onPress={() => handleRecentSearchPress(searchTerm)}
    >
      <TrendingUp size={16} color="#6366F1" />
      <Text style={styles.trendingSearchText}>{searchTerm}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
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
          <TouchableOpacity style={styles.clearButton} onPress={handleClearSearch}>
            <X size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#1F2937" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Search Results */}
      {showResults && results.length > 0 && !loading && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* No Results */}
      {showResults && results.length === 0 && !loading && query.length > 0 && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No products found for "{query}"</Text>
          <Text style={styles.noResultsSubtext}>
            Try different keywords or browse categories
          </Text>
        </View>
      )}

      {/* Recent Searches */}
      {!query && showRecentSearches && recentSearches.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <View style={styles.searchesList}>
            {recentSearches.map(renderRecentSearch)}
          </View>
        </View>
      )}

      {/* Trending Searches */}
      {!query && showTrending && trendingSearches.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Trending Now</Text>
          <View style={styles.searchesList}>
            {trendingSearches.map(renderTrendingSearch)}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    margin: getResponsiveSpacing('lg'),
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
  
  loadingContainer: {
    padding: getResponsiveSpacing('lg'),
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  resultsContainer: {
    flex: 1,
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  
  productImage: {
    width: 60,
    height: 60,
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
  
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing('xl'),
  },
  
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: getResponsiveSpacing('sm'),
    textAlign: 'center',
  },
  
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  
  searchesList: {
    gap: getResponsiveSpacing('sm'),
  },
  
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('sm'),
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  
  trendingSearchText: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: getResponsiveSpacing('sm'),
  },
});
