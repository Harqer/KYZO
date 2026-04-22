import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { GlassCard } from '../atoms/GlassCard';
import { QuantitySelector } from '../atoms/QuantitySelector';
import { RemoveButton } from '../atoms/RemoveButton';
import { getResponsiveSpacing } from '../../constants/responsive';
import { fashionApi, Cart } from '../../services/fashionApi';
import { webhookService } from '../../services/webhookService';

interface GlassCartProps {
  onCheckout?: () => void;
  onContinueShopping?: () => void;
  variant?: 'minimal' | 'premium' | 'agent';
}

export function GlassCart({ 
  onCheckout, 
  onContinueShopping,
  variant = 'premium'
}: GlassCartProps) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set());

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

  const renderCartItem = (item: any) => {
    const isUpdating = updatingItems.has(item.id);
    const isOutOfStock = !item.product.in_stock;
    
    return (
      <GlassCard
        key={item.id}
        variant={variant === 'minimal' ? 'minimal' : 'card'}
        style={styles.cartItem}
      >
        <View style={styles.itemContent}>
          {/* Product Image */}
          <View style={styles.itemImage}>
            <Image
              source={{ uri: item.product.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          </View>
          
          {/* Product Details */}
          <View style={styles.itemDetails}>
            <Text style={styles.itemName}>{item.product.name}</Text>
            <Text style={styles.itemBrand}>{item.product.brand}</Text>
            
            <View style={styles.variants}>
              {item.size && (
                <Text style={styles.variantText}>Size: {item.size}</Text>
              )}
              {item.color && (
                <Text style={styles.variantText}>Color: {item.color}</Text>
              )}
            </View>
            
            {isOutOfStock && (
              <Text style={styles.outOfStock}>Out of Stock</Text>
            )}
          </View>
          
          {/* Pricing */}
          <View style={styles.itemPricing}>
            <Text style={styles.itemPrice}>
              ${(item.product.price * item.quantity).toFixed(2)}
            </Text>
            <Text style={styles.itemUnitPrice}>
              ${item.product.price.toFixed(2)} each
            </Text>
          </View>
          
          {/* Actions */}
          <View style={styles.itemActions}>
            <QuantitySelector
              quantity={item.quantity}
              onIncrease={() => updateQuantity(item.id, item.quantity + 1)}
              onDecrease={() => updateQuantity(item.id, item.quantity - 1)}
              disabled={isUpdating || !item.product.in_stock}
              size="sm"
            />
            
            <RemoveButton
              onPress={() => updateQuantity(item.id, 0)}
              disabled={isUpdating}
              size="sm"
              variant="danger"
            />
          </View>
        </View>
      </GlassCard>
    );
  };

  const renderCartSummary = () => {
    if (!cart) return null;
    
    return (
      <GlassCard
        variant={variant === 'minimal' ? 'minimal' : 'card'}
        style={styles.summary}
      >
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
        
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            ${cart.total_amount.toFixed(2)}
          </Text>
        </View>
      </GlassCard>
    );
  };

  const renderActions = () => (
    <View style={styles.actions}>
      <GlassCard variant="card" style={styles.checkoutCard}>
        <TouchableOpacity 
          style={styles.checkoutButton} 
          onPress={onCheckout}
        >
          <Text style={styles.checkoutButtonText}>
            Proceed to Checkout ({cart?.total_items || 0} items)
          </Text>
        </TouchableOpacity>
      </GlassCard>
      
      <TouchableOpacity style={styles.continueButton} onPress={onContinueShopping}>
        <Text style={styles.continueButtonText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

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
        <GlassCard variant="card" style={styles.emptyCard}>
          <ShoppingBag size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>
            Add some items to get started!
          </Text>
          <TouchableOpacity style={styles.continueButton} onPress={onContinueShopping}>
            <Text style={styles.continueButtonText}>Continue Shopping</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {cart.items.map(renderCartItem)}
      </ScrollView>
      
      {renderCartSummary()}
      {renderActions()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  },
  
  emptyCard: {
    padding: getResponsiveSpacing('xl'),
    alignItems: 'center',
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
  
  itemsList: {
    flex: 1,
    padding: getResponsiveSpacing('lg'),
  },
  
  cartItem: {
    marginBottom: getResponsiveSpacing('md'),
  },
  
  itemContent: {
    flexDirection: 'row',
    padding: getResponsiveSpacing('md'),
    gap: getResponsiveSpacing('md'),
  },
  
  itemImage: {
    marginRight: getResponsiveSpacing('md'),
  },
  
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  itemDetails: {
    flex: 1,
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
  
  variants: {
    flexDirection: 'row',
    gap: getResponsiveSpacing('sm'),
  },
  
  variantText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  outOfStock: {
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: getResponsiveSpacing('sm'),
  },
  
  summary: {
    margin: getResponsiveSpacing('lg'),
    padding: getResponsiveSpacing('lg'),
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  totalRow: {
    marginTop: getResponsiveSpacing('sm'),
    paddingTop: getResponsiveSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  summaryValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
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
  
  checkoutCard: {
    overflow: 'hidden',
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
  
  continueButton: {
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  continueButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
