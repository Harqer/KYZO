import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { CartItem as CartItemComponent } from '../molecules/CartItem';
import { CartSummary } from '../molecules/CartSummary';
import { getResponsiveSpacing } from '../../constants/responsive';
import { fashionApi, Cart } from '../../services/fashionApi';
import { webhookService } from '../../services/webhookService';

interface CartProps {
  onCheckout?: () => void;
  onContinueShopping?: () => void;
}

export function CartRefactored({ onCheckout, onContinueShopping }: CartProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Load cart data on mount
  useEffect(() => {
    loadCart();
    setupWebhookListeners();
  }, []);

  const setupWebhookListeners = () => {
    const handleCartUpdate = (data: any) => {
      console.log('Real-time cart update:', data);
      loadCart();
    };

    const handleInventoryChange = (data: any) => {
      if (cart && data.product_id) {
        const affectedItem = cart.items.find(item => item.product_id === data.product_id);
        if (affectedItem) {
          loadCart();
        }
      }
    };

    webhookService.registerEventHandler('cart_update', handleCartUpdate);
    webhookService.registerEventHandler('inventory_change', handleInventoryChange);

    return () => {
      webhookService.removeEventHandler('cart_update', handleCartUpdate);
      webhookService.removeEventHandler('inventory_change', handleInventoryChange);
    };
  };

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await fashionApi.getCart();
      if (response.success && response.data) {
        setCart(response.data);
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
      Alert.alert('Error', 'Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (updatingItems.has(itemId)) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      if (newQuantity === 0) {
        await fashionApi.removeFromCart(itemId);
        Alert.alert('Success', 'Item removed from cart');
      } else {
        await fashionApi.updateCartItem(itemId, newQuantity);
      }
      
      await loadCart();
    } catch (error) {
      console.error('Failed to update cart item:', error);
      Alert.alert('Error', 'Failed to update cart. Please try again.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  const clearCart = async () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await fashionApi.clearCart();
              await loadCart();
              Alert.alert('Success', 'Cart cleared');
            } catch (error) {
              console.error('Failed to clear cart:', error);
              Alert.alert('Error', 'Failed to clear cart. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ShoppingBag size={32} color="#9CA3AF" />
      <Text style={styles.loadingText}>Loading cart...</Text>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <ShoppingBag size={48} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>Your cart is empty</Text>
      <Text style={styles.emptySubtitle}>
        Add some items to get started!
      </Text>
      <TouchableOpacity style={styles.continueButton} onPress={onContinueShopping}>
        <Text style={styles.continueButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Shopping Cart</Text>
      <TouchableOpacity onPress={clearCart}>
        <Text style={styles.clearButton}>Clear All</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCartItems = () => (
    <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
      {cart!.items.map(item => (
        <CartItemComponent
          key={item.id}
          item={item}
          onQuantityChange={updateQuantity}
          onRemove={() => updateQuantity(item.id, 0)}
          updating={updatingItems.has(item.id)}
        />
      ))}
    </ScrollView>
  );

  const renderActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity 
        style={styles.checkoutButton} 
        onPress={onCheckout}
      >
        <Text style={styles.checkoutButtonText}>
          Proceed to Checkout ({cart!.total_items} items)
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.continueShoppingButton} onPress={onContinueShopping}>
        <Text style={styles.continueShoppingButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return renderLoading();
  }

  if (!cart || cart.items.length === 0) {
    return renderEmpty();
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderCartItems()}
      <CartSummary cart={cart} />
      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: getResponsiveSpacing('md'),
  },
  
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing('xl'),
    gap: getResponsiveSpacing('md'),
  },
  
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  continueButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: 8,
    marginTop: getResponsiveSpacing('lg'),
  },
  
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  clearButton: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  
  itemsList: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
  },
  
  actions: {
    padding: getResponsiveSpacing('lg'),
    gap: getResponsiveSpacing('sm'),
  },
  
  checkoutButton: {
    backgroundColor: '#6366F1',
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: 8,
    alignItems: 'center',
  },
  
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  continueShoppingButton: {
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  continueShoppingButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
