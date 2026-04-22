import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, ShoppingBag, Heart, User } from 'lucide-react-native';
import { GlassCard } from '../atoms/GlassCard';
import { getResponsiveSpacing } from '../../constants/responsive';

interface GlassNavigationProps {
  cartCount?: number;
  onSearchPress?: () => void;
  onCartPress?: () => void;
  onProfilePress?: () => void;
  onWishlistPress?: () => void;
  style?: any;
}

export function GlassNavigation({
  cartCount = 0,
  onSearchPress,
  onCartPress,
  onProfilePress,
  onWishlistPress,
  style
}: GlassNavigationProps) {
  
  const renderNavItem = (icon: React.ReactNode, label: string, onPress?: () => void, badge?: number) => (
    <TouchableOpacity
      style={styles.navItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        {icon}
        {badge !== undefined && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.navLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <GlassCard variant="navigation" style={styles.navBar}>
        <View style={styles.navContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>KYZO</Text>
          </View>

          {/* Navigation Items */}
          <View style={styles.navItems}>
            {renderNavItem(
              <Search size={20} color="#1F2937" />,
              "Search",
              onSearchPress
            )}
            
            {renderNavItem(
              <Heart size={20} color="#1F2937" />,
              "Wishlist",
              onWishlistPress
            )}
            
            {renderNavItem(
              <ShoppingBag size={20} color="#1F2937" />,
              "Cart",
              onCartPress,
              cartCount
            )}
            
            {renderNavItem(
              <User size={20} color="#1F2937" />,
              "Profile",
              onProfilePress
            )}
          </View>
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: getResponsiveSpacing('sm'),
  },
  
  navBar: {
    marginHorizontal: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: getResponsiveSpacing('md'),
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  
  logoContainer: {
    flex: 1,
  },
  
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 2,
  },
  
  navItems: {
    flexDirection: 'row',
    flex: 2,
    justifyContent: 'space-around',
    maxWidth: 300,
  },
  
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  iconContainer: {
    position: 'relative',
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  
  navLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
});
