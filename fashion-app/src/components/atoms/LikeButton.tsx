import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface LikeButtonProps {
  isLiked: boolean;
  onLike: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'overlay';
  style?: any;
}

export function LikeButton({ 
  isLiked, 
  onLike, 
  loading = false, 
  size = 'md',
  variant = 'default',
  style 
}: LikeButtonProps) {
  
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 16;
      case 'lg': return 24;
      default: return 20;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 32;
      case 'lg': return 48;
      default: return 40;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        { 
          width: getButtonSize(), 
          height: getButtonSize(),
          borderRadius: getButtonSize() / 2
        },
        style
      ]}
      onPress={onLike}
      disabled={loading}
    >
      <Heart
        size={getIconSize()}
        color={isLiked ? '#EF4444' : (variant === 'overlay' ? '#FFFFFF' : '#FFFFFF')}
        fill={isLiked ? '#EF4444' : 'none'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  default: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  
  overlay: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});
