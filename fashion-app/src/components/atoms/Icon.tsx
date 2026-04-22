import React from 'react';
import { View, StyleSheet, StyleProp } from 'react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface IconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  style?: StyleProp<any>;
  onPress?: () => void;
}

const ICON_SIZES = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export function Icon({ name, size = 'md', color = '#1F2937', style, onPress }: IconProps) {
  const iconSize = ICON_SIZES[size];
  
  // This is a placeholder icon component
  // In a real implementation, you'd use a proper icon library like lucide-react-native
  const IconComponent = ({ name, size, color }: any) => (
    <View
      style={[
        styles.iconPlaceholder,
        {
          width: size,
          height: size,
          backgroundColor: color,
        },
      ]}
    />
  );
  
  const Wrapper = onPress ? View : React.Fragment;
  const wrapperProps = onPress ? { style: [styles.pressable, style] } : {};
  
  return (
    <Wrapper {...wrapperProps}>
      <IconComponent name={name} size={iconSize} color={color} />
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  iconPlaceholder: {
    borderRadius: 2,
  },
  
  pressable: {
    padding: getResponsiveSpacing('xs'),
  },
});
