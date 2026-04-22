import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ResponsiveImage } from './ResponsiveImage';
import { ResponsiveButton } from './ResponsiveButton';
import { Caption } from './ResponsiveText';
import { ScreenDimensions, SPACING, SHADOWS } from '../../constants/responsive';

interface ModelCardProps {
  imageUrl: string;
  onTryOn?: () => void;
  onLike?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onMore?: () => void;
  showSocialIcons?: boolean;
  tryOnText?: string;
  disclaimerText?: string;
}

export const ModelCard: React.FC<ModelCardProps> = ({
  imageUrl,
  onTryOn,
  onLike,
  onBookmark,
  onShare,
  onMore,
  showSocialIcons = true,
  tryOnText = 'Try on',
  disclaimerText = 'AI generated content can make mistakes',
}) => {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
      borderRadius: ScreenDimensions.isMobile() ? 12 : 16,
      overflow: 'hidden',
      ...SHADOWS.lg,
    },
    socialIcons: {
      position: 'absolute',
      right: SPACING.md,
      top: '50%',
      transform: [{ translateY: -80 }],
      gap: SPACING.sm,
      zIndex: 1,
    },
    socialIcon: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 20,
      padding: SPACING.sm,
      ...SHADOWS.sm,
    },
    tryOnContainer: {
      position: 'absolute',
      bottom: SPACING.lg,
      left: SPACING.lg,
      alignItems: 'flex-start',
      zIndex: 1,
    },
    disclaimerContainer: {
      marginTop: SPACING.xs,
      maxWidth: ScreenDimensions.isMobile() ? 200 : 250,
    },
  });

  return (
    <View style={styles.container}>
      <ResponsiveImage
        source={{ uri: imageUrl }}
        variant="model"
      />
      
      {showSocialIcons && (
        <View style={styles.socialIcons}>
          <TouchableOpacity style={styles.socialIcon} onPress={onLike}>
            <Ionicons 
              name="heart-outline" 
              size={ScreenDimensions.isMobile() ? 20 : 24} 
              color="#000000" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon} onPress={onBookmark}>
            <Ionicons 
              name="bookmark-outline" 
              size={ScreenDimensions.isMobile() ? 20 : 24} 
              color="#000000" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon} onPress={onShare}>
            <Ionicons 
              name="share-outline" 
              size={ScreenDimensions.isMobile() ? 20 : 24} 
              color="#000000" 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialIcon} onPress={onMore}>
            <Ionicons 
              name="ellipsis-vertical" 
              size={ScreenDimensions.isMobile() ? 20 : 24} 
              color="#000000" 
            />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.tryOnContainer}>
        <ResponsiveButton
          title={tryOnText}
          variant="primary"
          size={ScreenDimensions.isMobile() ? 'md' : 'lg'}
          onPress={onTryOn}
        />
        <View style={styles.disclaimerContainer}>
          <Caption color="rgba(255, 255, 255, 0.8)">
            {disclaimerText}
          </Caption>
        </View>
      </View>
    </View>
  );
};
