import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Heading } from '../components/ResponsiveText';
import { ScreenDimensions, SPACING } from '../../constants/responsive';

interface ResponsiveHeaderProps {
  title: string;
  showNotifications?: boolean;
  notificationCount?: number;
  onNotificationPress?: () => void;
  backgroundColor?: string;
}

export const ResponsiveHeader: React.FC<ResponsiveHeaderProps> = ({
  title,
  showNotifications = false,
  notificationCount = 0,
  onNotificationPress,
  backgroundColor,
}) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingTop: SPACING.xxl, // Status bar height
      paddingBottom: SPACING.md,
      backgroundColor: backgroundColor || (colorScheme === 'dark' ? '#000000' : '#F8F8F8'),
    },
    title: {
      flex: 1,
    },
    notificationButton: {
      position: 'relative',
      padding: SPACING.sm,
    },
    notificationBadge: {
      position: 'absolute',
      top: SPACING.xs,
      right: SPACING.xs,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
  });

  return (
    <View style={styles.header}>
      <Heading style={styles.title} textAlign="center">
        {title}
      </Heading>
      
      {showNotifications && (
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={onNotificationPress}
        >
          <Ionicons 
            name="notifications-outline" 
            size={ScreenDimensions.isMobile() ? 24 : 28} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
          {notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Ionicons 
                name="ellipsis-vertical" 
                size={10} 
                color="#FFFFFF" 
                style={styles.notificationBadgeText}
              />
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};
