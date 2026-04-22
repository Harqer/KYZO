import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface SearchFormProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onSubmit?: (query: string) => void;
  style?: any;
}

export function SearchForm({ 
  placeholder = 'Search...', 
  onSearch, 
  onSubmit,
  style 
}: SearchFormProps) {
  const [query, setQuery] = useState('');
  
  const handleSubmit = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      onSubmit?.(trimmedQuery);
      onSearch?.(trimmedQuery);
    }
  };
  
  return (
    <View style={[styles.container, style]}>
      <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
      <TouchableOpacity 
        style={styles.searchButton} 
        onPress={handleSubmit}
        disabled={!query.trim()}
      >
        <Search size={16} color={query.trim() ? '#FFFFFF' : '#9CA3AF'} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  
  input: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  
  searchButton: {
    padding: getResponsiveSpacing('xs'),
    borderRadius: 8,
    backgroundColor: '#6366F1',
    marginLeft: getResponsiveSpacing('sm'),
  },
});
