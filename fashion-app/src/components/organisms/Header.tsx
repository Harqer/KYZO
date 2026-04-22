import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Menu, Search, ShoppingBag, Heart } from 'lucide-react-native';
import { Avatar } from '../atoms/Avatar';
import { Badge } from '../atoms/Badge';
import { SearchForm } from '../molecules/SearchForm';
import { getResponsiveSpacing, ScreenDimensions } from '../../constants/responsive';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showUser?: boolean;
  showCart?: boolean;
  cartCount?: number;
  onMenuPress?: () => void;
  onSearch?: (query: string) => void;
  onCartPress?: () => void;
  onUserPress?: () => void;
  variant?: 'default' | 'minimal' | 'centered';
}

export function Header({
  title = 'KYZO',
  showSearch = true,
  showUser = true,
  showCart = true,
  cartCount = 0,
  onMenuPress,
  onSearch,
  onCartPress,
  onUserPress,
  variant = 'default'
}: HeaderProps) {
  
  const renderLeftSection = () => {
    if (variant === 'minimal') {
      return null;
    }
    
    return (
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.menuButton} onPress={onMenuPress}>
          <Menu size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
    );
  };
  
  const renderCenterSection = () => {
    if (variant === 'minimal') {
      return (
        <View style={styles.centerSection}>
          <Text style={styles.logo}>KYZO</Text>
        </View>
      );
    }
    
    if (variant === 'centered') {
      return (
        <View style={styles.centerSection}>
          <Text style={styles.logo}>{title}</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.centerSection}>
        <Text style={styles.logo}>{title}</Text>
      </View>
    );
  };
  
  const renderRightSection = () => {
    return (
      <View style={styles.rightSection}>
        {showSearch && variant !== 'centered' && (
          <TouchableOpacity style={styles.actionButton}>
            <Search size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        
        {showUser && (
          <TouchableOpacity style={styles.actionButton} onPress={onUserPress}>
            <Avatar 
              source="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40" 
              size="sm" 
            />
          </TouchableOpacity>
        )}
        
        {showCart && (
          <TouchableOpacity style={styles.cartButton} onPress={onCartPress}>
            <ShoppingBag size={20} color="#1F2937" />
            {cartCount > 0 && (
              <Badge variant="error" size="sm" style={styles.cartBadge}>
                {cartCount}
              </Badge>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const renderSearchSection = () => {
    if (!showSearch || variant === 'minimal') {
      return null;
    }
    
    return (
      <View style={styles.searchSection}>
        <SearchForm 
          onSearch={onSearch}
          placeholder="Search for products..."
        />
      </View>
    );
  };
  
  return (
    <View style={[styles.container, styles[variant]]}>
      <View style={styles.headerTop}>
        {renderLeftSection()}
        {renderCenterSection()}
        {renderRightSection()}
      </View>
      {renderSearchSection()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingTop: getResponsiveSpacing('md'),
    paddingBottom: getResponsiveSpacing('sm'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  default: {},
  
  minimal: {
    paddingTop: getResponsiveSpacing('sm'),
    paddingBottom: getResponsiveSpacing('sm'),
  },
  
  centered: {
    paddingTop: getResponsiveSpacing('lg'),
    paddingBottom: getResponsiveSpacing('md'),
  },
  
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('sm'),
    width: 60,
    justifyContent: 'flex-end',
  },
  
  menuButton: {
    padding: getResponsiveSpacing('xs'),
  },
  
  actionButton: {
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
  },
  
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  
  searchSection: {
    marginTop: getResponsiveSpacing('md'),
  },
});
