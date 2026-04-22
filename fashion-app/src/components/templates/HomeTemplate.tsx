import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Header } from '../organisms/Header';
import { ProductGrid } from '../organisms/ProductGrid';
import { getResponsiveSpacing } from '../../constants/responsive';

interface HomeTemplateProps {
  children?: React.ReactNode;
  headerProps?: any;
  showHeader?: boolean;
  contentStyle?: any;
}

export function HomeTemplate({ 
  children, 
  headerProps, 
  showHeader = true,
  contentStyle 
}: HomeTemplateProps) {
  return (
    <View style={styles.container}>
      {showHeader && <Header {...headerProps} />}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  scrollView: {
    flex: 1,
  },
  
  contentContainer: {
    paddingBottom: getResponsiveSpacing('xl'),
  },
});
