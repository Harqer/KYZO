import React from 'react';
import { Image, ImageStyle, View, ViewStyle } from 'react-native';
import { ScreenDimensions, IMAGES, SHADOWS } from '../../constants/responsive';

interface ResponsiveImageProps {
  source: { uri: string } | number;
  variant?: 'model' | 'thumbnail' | 'card' | 'avatar' | 'banner';
  aspectRatio?: number;
  rounded?: boolean;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  onLoad?: () => void;
  onError?: () => void;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  source,
  variant = 'model',
  aspectRatio,
  rounded = false,
  shadow = 'none',
  style,
  containerStyle,
  onLoad,
  onError,
}) => {
  const getImageDimensions = () => {
    switch (variant) {
      case 'model':
        return IMAGES.model;
      case 'thumbnail':
        return IMAGES.thumbnail;
      case 'card':
        return IMAGES.card;
      case 'avatar':
        return {
          width: ScreenDimensions.isMobile() ? 40 : 60,
          height: ScreenDimensions.isMobile() ? 40 : 60,
        };
      case 'banner':
        return {
          width: ScreenDimensions.width,
          height: ScreenDimensions.isMobile() ? 200 : 300,
        };
      default:
        return {
          width: 100,
          height: 100,
        };
    }
  };

  const getImageStyles = (): ImageStyle => {
    const dimensions = getImageDimensions();
    const baseStyle: ImageStyle = {
      width: dimensions.width,
      height: aspectRatio ? dimensions.width / aspectRatio : dimensions.height,
      backgroundColor: '#F0F0F0',
    };

    if (rounded) {
      return {
        ...baseStyle,
        borderRadius: variant === 'avatar' ? dimensions.width / 2 : 12,
      };
    }

    return baseStyle;
  };

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    if (shadow !== 'none') {
      return {
        ...baseStyle,
        ...SHADOWS[shadow],
      };
    }

    return baseStyle;
  };

  return (
    <View style={[getContainerStyles(), containerStyle]}>
      <Image
        source={source}
        style={[getImageStyles(), style]}
        onLoad={onLoad}
        onError={onError}
        resizeMode="cover"
      />
    </View>
  );
};
