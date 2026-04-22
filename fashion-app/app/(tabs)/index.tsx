import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScreenDimensions, SPACING } from '@/src/constants/responsive';

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  const handleTryOn = () => {
    console.log('Try on button pressed');
  };

  const handleLike = () => {
    console.log('Like button pressed');
  };

  const handleBookmark = () => {
    console.log('Bookmark button pressed');
  };

  const handleShare = () => {
    console.log('Share button pressed');
  };

  const handleMore = () => {
    console.log('More options pressed');
  };

  const handleNotificationPress = () => {
    console.log('Notification pressed');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#000000' : '#F8F8F8',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: SPACING.lg,
      paddingTop: StatusBar.currentHeight || 44,
      paddingBottom: SPACING.md,
    },
    headerTitle: {
      fontSize: ScreenDimensions.isMobile() ? 24 : 28,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
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
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      paddingHorizontal: SPACING.lg,
    },
    sectionTitle: {
      fontSize: ScreenDimensions.isMobile() ? 20 : 24,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: SPACING.md,
    },
    currentModel: {
      marginTop: SPACING.xl,
      marginBottom: SPACING.lg,
    },
    modelCard: {
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    },
    modelImage: {
      width: '100%',
      height: ScreenDimensions.isMobile() ? 300 : 400,
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
    },
    socialIcons: {
      position: 'absolute',
      right: SPACING.md,
      top: '50%',
      transform: [{ translateY: -80 }],
      gap: SPACING.sm,
    },
    socialIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 20,
      padding: SPACING.sm,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
      elevation: 3,
    },
    tryOnContainer: {
      position: 'absolute',
      bottom: SPACING.lg,
      left: SPACING.lg,
      alignItems: 'flex-start',
    },
    tryOnButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.sm,
      marginBottom: SPACING.xs,
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.15)',
      elevation: 4,
    },
    tryOnButtonText: {
      color: '#000000',
      fontSize: ScreenDimensions.isMobile() ? 14 : 16,
      fontWeight: '600',
    },
    aiDisclaimer: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: ScreenDimensions.isMobile() ? 10 : 12,
      maxWidth: ScreenDimensions.isMobile() ? 200 : 250,
    },
    modelInfo: {
      marginTop: SPACING.md,
    },
    modelTitle: {
      fontSize: ScreenDimensions.isMobile() ? 16 : 18,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: SPACING.xs,
    },
    modelDescription: {
      fontSize: ScreenDimensions.isMobile() ? 12 : 14,
      color: colorScheme === 'dark' ? '#999999' : '#666666',
      lineHeight: ScreenDimensions.isMobile() ? 18 : 20,
    },
    actionButtons: {
      marginTop: SPACING.xl,
      gap: SPACING.md,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      borderRadius: 12,
      padding: SPACING.md,
      backgroundColor: 'transparent',
    },
    addButtonText: {
      fontSize: ScreenDimensions.isMobile() ? 14 : 16,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginLeft: SPACING.sm,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Doppl Model</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
          <Ionicons 
            name="notifications-outline" 
            size={ScreenDimensions.isMobile() ? 24 : 28} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>4</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentModel}>
          <Text style={styles.sectionTitle}>Current Model</Text>
          <View style={styles.modelCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' }} 
              style={styles.modelImage}
              resizeMode="cover"
            />
            
            {/* Social interaction icons on the right */}
            <View style={styles.socialIcons}>
              <TouchableOpacity style={styles.socialIcon} onPress={handleLike}>
                <Ionicons 
                  name="heart-outline" 
                  size={ScreenDimensions.isMobile() ? 20 : 24} 
                  color="#000000" 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={handleBookmark}>
                <Ionicons 
                  name="bookmark-outline" 
                  size={ScreenDimensions.isMobile() ? 20 : 24} 
                  color="#000000" 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={handleShare}>
                <Ionicons 
                  name="share-outline" 
                  size={ScreenDimensions.isMobile() ? 20 : 24} 
                  color="#000000" 
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialIcon} onPress={handleMore}>
                <Ionicons 
                  name="ellipsis-vertical" 
                  size={ScreenDimensions.isMobile() ? 20 : 24} 
                  color="#000000" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Try on button at bottom left */}
            <View style={styles.tryOnContainer}>
              <TouchableOpacity style={styles.tryOnButton} onPress={handleTryOn}>
                <Text style={styles.tryOnButtonText}>Try on</Text>
              </TouchableOpacity>
              <Text style={styles.aiDisclaimer}>AI generated content can make mistakes</Text>
            </View>
          </View>
          
          <View style={styles.modelInfo}>
            <Text style={styles.modelTitle}>You'll see your looks on this model</Text>
            <Text style={styles.modelDescription}>
              This is your personalized fashion model that will showcase all your uploaded looks and outfits.
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.addButton} onPress={() => console.log('Take photo')}>
            <Ionicons 
              name="camera-outline" 
              size={ScreenDimensions.isMobile() ? 20 : 24} 
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
            />
            <Text style={styles.addButtonText}>Take a photo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButton} onPress={() => console.log('Upload from gallery')}>
            <Ionicons 
              name="image-outline" 
              size={ScreenDimensions.isMobile() ? 20 : 24} 
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
            />
            <Text style={styles.addButtonText}>Upload from gallery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.addButton} onPress={() => console.log('Upload from URL')}>
            <Ionicons 
              name="cloud-upload-outline" 
              size={ScreenDimensions.isMobile() ? 20 : 24} 
              color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
            />
            <Text style={styles.addButtonText}>Upload from URL</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
