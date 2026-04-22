import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { QuantitySelector } from '../atoms/QuantitySelector';
import { RemoveButton } from '../atoms/RemoveButton';
import { getResponsiveSpacing } from '../../constants/responsive';
import { CartItem as CartItemType } from '../../services/fashionApi';

interface CartItemComponentProps {
  item: CartItemType;
  onQuantityChange: (itemId: string, newQuantity: number) => void;
  onRemove: (itemId: string) => void;
  updating?: boolean;
  style?: any;
}

export function CartItemComponent({
  item,
  onQuantityChange,
  onRemove,
  updating = false,
  style
}: CartItemComponentProps) {
  
  const handleQuantityIncrease = () => {
    if (item.product.in_stock) {
      onQuantityChange(item.id, item.quantity + 1);
    }
  };

  const handleQuantityDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    onRemove(item.id);
  };

  const renderProductInfo = () => (
    <View style={styles.productInfo}>
      <Text style={styles.productName}>{item.product.name}</Text>
      <Text style={styles.productBrand}>{item.product.brand}</Text>
      
      <View style={styles.variants}>
        {item.size && (
          <Text style={styles.variantText}>Size: {item.size}</Text>
        )}
        {item.color && (
          <Text style={styles.variantText}>Color: {item.color}</Text>
        )}
      </View>
      
      {!item.product.in_stock && (
        <Text style={styles.outOfStock}>Out of Stock</Text>
      )}
    </View>
  );

  const renderPricing = () => (
    <View style={styles.pricing}>
      <Text style={styles.totalPrice}>
        ${(item.product.price * item.quantity).toFixed(2)}
      </Text>
      <Text style={styles.unitPrice}>
        ${item.product.price.toFixed(2)} each
      </Text>
    </View>
  );

  const renderActions = () => (
    <View style={styles.actions}>
      <QuantitySelector
        quantity={item.quantity}
        onIncrease={handleQuantityIncrease}
        onDecrease={handleQuantityDecrease}
        disabled={updating || !item.product.in_stock}
        size="sm"
      />
      
      <RemoveButton
        onPress={handleRemove}
        disabled={updating}
        size="sm"
        variant="danger"
      />
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftSection}>
        <Image
          source={{ uri: item.product.image }}
          style={styles.productImage}
          resizeMode="cover"
        />
      </View>
      
      <View style={styles.rightSection}>
        <View style={styles.mainContent}>
          {renderProductInfo()}
          {renderPricing()}
        </View>
        
        {renderActions()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: getResponsiveSpacing('md'),
    marginBottom: getResponsiveSpacing('md'),
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  
  leftSection: {
    marginRight: getResponsiveSpacing('md'),
  },
  
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  
  mainContent: {
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  productInfo: {
    marginBottom: getResponsiveSpacing('xs'),
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
  
  pricing: {
    alignItems: 'flex-end',
  },
  
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  
  unitPrice: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
