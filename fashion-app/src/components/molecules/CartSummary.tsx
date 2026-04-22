import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';
import { Cart } from '../../services/fashionApi';

interface CartSummaryProps {
  cart: Cart;
  showShipping?: boolean;
  showTax?: boolean;
  taxRate?: number;
  shippingCost?: number;
  style?: any;
}

export function CartSummary({
  cart,
  showShipping = true,
  showTax = false,
  taxRate = 0.08,
  shippingCost = 0,
  style
}: CartSummaryProps) {
  
  const calculateTax = () => {
    if (!showTax) return 0;
    return cart.total_amount * taxRate;
  };

  const calculateShipping = () => {
    if (!showShipping) return 0;
    return shippingCost;
  };

  const calculateTotal = () => {
    return cart.total_amount + calculateTax() + calculateShipping();
  };

  const renderSummaryRow = (label: string, value: string, isTotal = false) => (
    <View style={[styles.summaryRow, isTotal && styles.totalRow]}>
      <Text style={[styles.summaryLabel, isTotal && styles.totalLabel]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, isTotal && styles.totalValue]}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {renderSummaryRow('Subtotal', `$${cart.total_amount.toFixed(2)}`)}
      
      {showShipping && renderSummaryRow(
        'Shipping',
        shippingCost === 0 ? 'Calculated at checkout' : `$${shippingCost.toFixed(2)}`
      )}
      
      {showTax && renderSummaryRow(
        'Tax',
        `$${calculateTax().toFixed(2)}`
      )}
      
      {renderSummaryRow(
        'Total',
        `$${calculateTotal().toFixed(2)}`,
        true
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  
  totalRow: {
    marginTop: getResponsiveSpacing('sm'),
    paddingTop: getResponsiveSpacing('sm'),
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
});
