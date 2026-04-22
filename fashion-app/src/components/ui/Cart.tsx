import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';
import { fashionApi, Cart, CartItem, Product } from '../../services/fashionApi';
import { webhookService } from '../../services/webhookService';

interface CartProps {
  onCheckout?: () => void;
  onContinueShopping?: () => void;
}

export function Cart({ onCheckout, onContinueShopping }: CartProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

  // Load cart data on mount
  useEffect(() => {
    loadCart();
    
    // Setup webhook listeners for real-time cart updates
    const handleCartUpdate = (data: any) => {
      console.log('Real-time cart update:', data);
      loadCart(); // Refresh cart when backend updates
    };

    webhookService.registerEventHandler('cart_update', handleCartUpdate);
    webhookService.registerEventHandler('inventory_change', handleInventoryChange);

    return () => {
      webhookService.removeEventHandler('cart_update', handleCartUpdate);
      webhookService.removeEventHandler('inventory_change', handleInventoryChange);
    };
  }, []);

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

  const handleInventoryChange = (data: any) => {
    // Check if any items in cart are affected by inventory changes
    if (cart && data.product_id) {
      const affectedItem = cart.items.find(item => item.product_id === data.product_id);
      if (affectedItem) {
        loadCart(); // Refresh cart to show updated stock status
      }
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (updatingItems.has(itemId)) return;
    
    setUpdatingItems(prev => new Set(prev).add(itemId));
    
    try {
      if (newQuantity === 0) {
        // Remove item
        await fashionApi.removeFromCart(itemId);
        Alert.alert('Success', 'Item removed from cart');
      } else {
        // Update quantity
        await fashionApi.updateCartItem(itemId, newQuantity);
      }
      
      // Refresh cart
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

  const renderCartItem = (item: CartItem) => {
    const isUpdating = updatingItems.has(item.id);
    const isOutOfStock = !item.product.in_stock;
    
    return (
      <View key={item.id} style={styles.cartItem}>
        <View style={styles.itemInfo}>
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.itemBrand}>{item.product.brand}</Text>
            <View style={styles.itemVariants}>
              {item.size && <Text style={styles.variantText}>Size: {item.size}</Text>}
              {item.color && <Text style={styles.variantText}>Color: {item.color}</Text>}
            </View>
            {isOutOfStock && (
              <Text style={styles.outOfStockText}>Out of Stock</Text>
            )}
          </View>
          
          <View style={styles.itemPricing}>
            <Text style={styles.itemPrice}>
              ${(item.product.price * item.quantity).toFixed(2)}
            </Text>
            <Text style={styles.itemUnitPrice}>
              ${item.product.price.toFixed(2)} each
            </Text>
          </View>
        </View>

        <View style={styles.itemActions}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[
                styles.quantityButton,
                item.quantity <= 1 && styles.disabledButton,
                isUpdating && styles.disabledButton
              ]}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={item.quantity <= 1 || isUpdating}
            >
              <Minus size={16} color={item.quantity <= 1 || isUpdating ? '#9CA3AF' : '#1F2937'} />
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>{item.quantity}</Text>
            
            <TouchableOpacity
              style={[
                styles.quantityButton,
                (isOutOfStock || isUpdating) && styles.disabledButton
              ]}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
              disabled={isOutOfStock || isUpdating}
            >
              <Plus size={16} color={isOutOfStock || isUpdating ? '#9CA3AF' : '#1F2937'} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.removeButton, isUpdating && styles.disabledButton]}
            onPress={() => updateQuantity(item.id, 0)}
            disabled={isUpdating}
          >
            <Trash2 size={16} color={isUpdating ? '#9CA3AF' : '#EF4444'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ShoppingBag size={32} color="#9CA3AF" />
        <Text style={styles.loadingText}>Loading cart...</Text>
      </View>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
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
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Shopping Cart</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearButton}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {cart.items.map(renderCartItem)}
      </ScrollView>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>
            ${cart.total_amount.toFixed(2)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Shipping</Text>
          <Text style={styles.summaryValue}>Calculated at checkout</Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ${cart.total_amount.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.checkoutButton} 
          onPress={onCheckout}
        >
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout ({cart.total_items} items)
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.continueShoppingButton} onPress={onContinueShopping}>
          <Text style={styles.continueShoppingButtonText}>Continue Shopping</Text>
        </TouchableOpacity>
      </View>
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
  
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  itemInfo: {
    flex: 1,
    marginRight: getResponsiveSpacing('md'),
  },
  
  itemDetails: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  
  itemBrand: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  
  itemVariants: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('sm'),
  },
  
  variantText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  outOfStockText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 4,
  },
  
  itemPricing: {
    alignItems: 'flex-end',
  },
  
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  itemUnitPrice: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  itemActions: {
    alignItems: 'center',
    gap: getResponsiveSpacing('sm'),
  },
  
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('xs'),
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  quantityButton: {
    padding: getResponsiveSpacing('xs'),
  },
  
  quantityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 24,
    textAlign: 'center',
  },
  
  removeButton: {
    padding: getResponsiveSpacing('xs'),
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  summary: {
    padding: getResponsiveSpacing('lg'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: getResponsiveSpacing('sm'),
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
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
