import React from 'react';
import { View, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScreenDimensions, SPACING, CONTAINER } from '../../constants/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  padding?: keyof typeof SPACING;
  maxWidth?: keyof typeof CONTAINER.maxWidth;
  backgroundColor?: string;
  statusBarStyle?: 'auto' | 'light' | 'dark';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  scrollable = true,
  padding = 'lg',
  maxWidth = 'lg',
  backgroundColor,
  statusBarStyle = 'auto',
}) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor || (colorScheme === 'dark' ? '#000000' : '#F8F8F8'),
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING[padding],
      maxWidth: typeof CONTAINER.maxWidth[maxWidth] === 'number' 
        ? CONTAINER.maxWidth[maxWidth] 
        : ScreenDimensions.width,
      alignSelf: 'center',
      width: '100%',
    },
    scrollContent: {
      flexGrow: 1,
    },
  });

  const Container = scrollable ? ScrollView : View;
  const containerProps = scrollable ? {
    contentContainerStyle: styles.scrollContent,
    showsVerticalScrollIndicator: false,
  } : {};

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        style={statusBarStyle === 'auto' 
          ? (colorScheme === 'dark' ? 'light' : 'dark')
          : statusBarStyle
        } 
      />
      <Container style={styles.content} {...containerProps}>
        {children}
      </Container>
    </SafeAreaView>
  );
};
