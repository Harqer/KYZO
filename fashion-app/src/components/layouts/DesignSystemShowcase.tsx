import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Heading } from '../base/Heading';
import { Button } from '../base/Button';
import { Card } from '../base/Card';
import { ProductCard } from '../base/ProductCard';
import { getResponsiveSpacing, ScreenDimensions, TYPOGRAPHY, SPACING } from '../../constants/responsive';

export function DesignSystemShowcase() {
  const sampleProducts = [
    {
      id: '1',
      name: 'Classic Denim Jacket',
      price: 89.99,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
      brand: 'Urban Style',
      rating: 4.5,
    },
    {
      id: '2',
      name: 'Floral Summer Dress',
      price: 65.00,
      image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400',
      brand: 'Elegant Wear',
      rating: 4.8,
    },
    {
      id: '3',
      name: 'Leather Ankle Boots',
      price: 120.00,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
      brand: 'Premium Shoes',
      rating: 4.2,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Heading level={1} align="center">
            KYZO Design System
          </Heading>
          <Text style={styles.subtitle}>
            AI-Powered Fashion Discovery Components
          </Text>
        </View>

        {/* Typography Section */}
        <View style={styles.section}>
          <Heading level={2}>Typography</Heading>
          
          <View style={styles.typographyDemo}>
            <Text style={styles.h1}>Heading 1 - 32px Bold</Text>
            <Text style={styles.h2}>Heading 2 - 24px Bold</Text>
            <Text style={styles.h3}>Heading 3 - 20px SemiBold</Text>
            <Text style={styles.body}>Body text - 16px Regular for content and descriptions</Text>
            <Text style={styles.caption}>Caption text - 12px Regular for labels and metadata</Text>
          </View>
        </View>

        {/* Color Palette */}
        <View style={styles.section}>
          <Heading level={2}>Color Palette</Heading>
          
          <View style={styles.colorGrid}>
            <View style={[styles.colorSwatch, { backgroundColor: '#6366F1' }]}>
              <Text style={styles.colorLabel}>Primary</Text>
            </View>
            <View style={[styles.colorSwatch, { backgroundColor: '#1F2937' }]}>
              <Text style={[styles.colorLabel, { color: '#FFFFFF' }]}>Dark</Text>
            </View>
            <View style={[styles.colorSwatch, { backgroundColor: '#F3F4F6' }]}>
              <Text style={styles.colorLabel}>Light</Text>
            </View>
            <View style={[styles.colorSwatch, { backgroundColor: '#EF4444' }]}>
              <Text style={[styles.colorLabel, { color: '#FFFFFF' }]}>Error</Text>
            </View>
            <View style={[styles.colorSwatch, { backgroundColor: '#10B981' }]}>
              <Text style={[styles.colorLabel, { color: '#FFFFFF' }]}>Success</Text>
            </View>
            <View style={[styles.colorSwatch, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.colorLabel}>Warning</Text>
            </View>
          </View>
        </View>

        {/* Button Variants */}
        <View style={styles.section}>
          <Heading level={2}>Buttons</Heading>
          
          <View style={styles.buttonGrid}>
            <Button onPress={() => {}} variant="primary">
              Primary Button
            </Button>
            <Button onPress={() => {}} variant="secondary">
              Secondary Button
            </Button>
            <Button onPress={() => {}} variant="outline">
              Outline Button
            </Button>
          </View>
        </View>

        {/* Card Components */}
        <View style={styles.section}>
          <Heading level={2}>Cards</Heading>
          
          <View style={styles.cardGrid}>
            <Card variant="elevated" padding="md">
              <Text style={styles.cardTitle}>Elevated Card</Text>
              <Text style={styles.cardDescription}>
                This card uses the elevated variant with shadow effects for depth.
              </Text>
            </Card>
            
            <Card variant="outline" padding="md">
              <Text style={styles.cardTitle}>Outline Card</Text>
              <Text style={styles.cardDescription}>
                This card uses the outline variant with a border instead of shadows.
              </Text>
            </Card>
          </View>
        </View>

        {/* Product Cards */}
        <View style={styles.section}>
          <Heading level={2}>Product Cards</Heading>
          
          <View style={styles.productGrid}>
            {sampleProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onLike={() => console.log(`Liked ${product.name}`)}
                onAddToCart={() => console.log(`Added ${product.name} to cart`)}
                onPress={() => console.log(`Pressed ${product.name}`)}
              />
            ))}
          </View>
        </View>

        {/* Spacing Demo */}
        <View style={styles.section}>
          <Heading level={2}>Spacing System</Heading>
          
          <View style={styles.spacingDemo}>
            <View style={[styles.spacingBox, { height: SPACING.xs }]}>
              <Text style={styles.spacingLabel}>XS: 4px</Text>
            </View>
            <View style={[styles.spacingBox, { height: SPACING.sm }]}>
              <Text style={styles.spacingLabel}>SM: 8px</Text>
            </View>
            <View style={[styles.spacingBox, { height: SPACING.md }]}>
              <Text style={styles.spacingLabel}>MD: 16px</Text>
            </View>
            <View style={[styles.spacingBox, { height: SPACING.lg }]}>
              <Text style={styles.spacingLabel}>LG: 24px</Text>
            </View>
            <View style={[styles.spacingBox, { height: SPACING.xl }]}>
              <Text style={styles.spacingLabel}>XL: 32px</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Design System powered by Figma MCP + React Native
          </Text>
          <Text style={styles.footerSubtext}>
            Generated components for KYZO Fashion App
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  
  scrollView: {
    flex: 1,
  },
  
  contentContainer: {
    padding: getResponsiveSpacing('lg'),
  },
  
  header: {
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('xl'),
    paddingTop: getResponsiveSpacing('lg'),
  },
  
  subtitle: {
    ...TYPOGRAPHY.responsive.body,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: getResponsiveSpacing('sm'),
  },
  
  section: {
    marginBottom: getResponsiveSpacing('xl'),
  },
  
  // Typography
  typographyDemo: {
    backgroundColor: '#FFFFFF',
    padding: getResponsiveSpacing('lg'),
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  h1: {
    ...TYPOGRAPHY.responsive.h1,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  h2: {
    ...TYPOGRAPHY.responsive.h2,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  h3: {
    ...TYPOGRAPHY.responsive.h3,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  body: {
    ...TYPOGRAPHY.responsive.body,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  caption: {
    ...TYPOGRAPHY.responsive.caption,
  },
  
  // Colors
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('sm'),
    justifyContent: 'space-between',
  },
  
  colorSwatch: {
    width: ScreenDimensions.isMobile() ? '48%' : '30%',
    height: 80,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  colorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Buttons
  buttonGrid: {
    gap: getResponsiveSpacing('md'),
  },
  
  // Cards
  cardGrid: {
    gap: getResponsiveSpacing('md'),
  },
  
  cardTitle: {
    ...TYPOGRAPHY.responsive.h3,
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  cardDescription: {
    ...TYPOGRAPHY.responsive.body,
    color: '#6B7280',
  },
  
  // Product Cards
  productGrid: {
    flexDirection: ScreenDimensions.isMobile() ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: getResponsiveSpacing('md'),
    justifyContent: 'space-between',
  },
  
  // Spacing
  spacingDemo: {
    backgroundColor: '#FFFFFF',
    padding: getResponsiveSpacing('lg'),
    borderRadius: 12,
    gap: getResponsiveSpacing('sm'),
  },
  
  spacingBox: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  spacingLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xl'),
    marginTop: getResponsiveSpacing('xl'),
  },
  
  footerText: {
    ...TYPOGRAPHY.responsive.body,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  
  footerSubtext: {
    ...TYPOGRAPHY.responsive.caption,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: getResponsiveSpacing('xs'),
  },
});
