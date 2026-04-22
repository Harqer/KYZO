import { Dimensions as RNDimensions, Platform } from 'react-native';

// Get device dimensions
const { width, height } = RNDimensions.get('window');

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 0,      // Extra small devices
  sm: 375,    // Small devices (iPhone SE, etc.)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (landscape tablets)
  xl: 1280,   // Extra large devices
  xxl: 1536,  // 2XL devices
} as const;

// Device type detection
export const getDeviceType = () => {
  if (width < BREAKPOINTS.sm) return 'mobile';
  if (width < BREAKPOINTS.md) return 'mobile-large';
  if (width < BREAKPOINTS.lg) return 'tablet';
  if (width < BREAKPOINTS.xl) return 'tablet-large';
  return 'desktop';
};

// Responsive utilities
export const isMobile = () => width < BREAKPOINTS.md;
export const isTablet = () => width >= BREAKPOINTS.md && width < BREAKPOINTS.xl;
export const isDesktop = () => width >= BREAKPOINTS.xl;

// Responsive spacing scale
export const SPACING = {
  // Base spacing (8px system)
  base: 8,
  // Responsive spacing
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// Responsive spacing utility function
export const getResponsiveSpacing = (size: keyof typeof SPACING, customWidth?: number) => {
  const deviceWidth = customWidth || width;
  const multiplier = deviceWidth < BREAKPOINTS.md ? 0.75 : 
                     deviceWidth < BREAKPOINTS.lg ? 1 : 1.25;
  return SPACING[size] * multiplier;
};

// Responsive typography scale
export const TYPOGRAPHY = {
  // Font sizes
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  
  // Responsive font sizes
  responsive: {
    h1: {
      fontSize: Platform.select({
        ios: width < BREAKPOINTS.md ? 28 : 32,
        android: width < BREAKPOINTS.md ? 26 : 30,
        default: width < BREAKPOINTS.md ? 24 : 28,
      }),
      fontWeight: 'bold' as const,
      lineHeight: Platform.select({
        ios: width < BREAKPOINTS.md ? 36 : 40,
        android: width < BREAKPOINTS.md ? 34 : 38,
        default: width < BREAKPOINTS.md ? 32 : 36,
      }),
    },
    h2: {
      fontSize: Platform.select({
        ios: width < BREAKPOINTS.md ? 24 : 28,
        android: width < BREAKPOINTS.md ? 22 : 26,
        default: width < BREAKPOINTS.md ? 20 : 24,
      }),
      fontWeight: 'bold' as const,
      lineHeight: Platform.select({
        ios: width < BREAKPOINTS.md ? 30 : 34,
        android: width < BREAKPOINTS.md ? 28 : 32,
        default: width < BREAKPOINTS.md ? 26 : 30,
      }),
    },
    h3: {
      fontSize: Platform.select({
        ios: width < BREAKPOINTS.md ? 20 : 24,
        android: width < BREAKPOINTS.md ? 18 : 22,
        default: width < BREAKPOINTS.md ? 16 : 20,
      }),
      fontWeight: '600' as const,
      lineHeight: Platform.select({
        ios: width < BREAKPOINTS.md ? 26 : 30,
        android: width < BREAKPOINTS.md ? 24 : 28,
        default: width < BREAKPOINTS.md ? 22 : 26,
      }),
    },
    body: {
      fontSize: Platform.select({
        ios: width < BREAKPOINTS.md ? 14 : 16,
        android: width < BREAKPOINTS.md ? 13 : 15,
        default: width < BREAKPOINTS.md ? 12 : 14,
      }),
      fontWeight: '400' as const,
      lineHeight: Platform.select({
        ios: width < BREAKPOINTS.md ? 20 : 22,
        android: width < BREAKPOINTS.md ? 18 : 20,
        default: width < BREAKPOINTS.md ? 16 : 18,
      }),
    },
    caption: {
      fontSize: Platform.select({
        ios: width < BREAKPOINTS.md ? 12 : 14,
        android: width < BREAKPOINTS.md ? 11 : 13,
        default: width < BREAKPOINTS.md ? 10 : 12,
      }),
      fontWeight: '400' as const,
      lineHeight: Platform.select({
        ios: width < BREAKPOINTS.md ? 16 : 18,
        android: width < BREAKPOINTS.md ? 14 : 16,
        default: width < BREAKPOINTS.md ? 12 : 14,
      }),
    },
  },
} as const;

// Responsive container sizes
export const CONTAINER = {
  maxWidth: {
    xs: '100%',
    sm: '100%',
    md: 728,
    lg: 960,
    xl: 1140,
    xxl: 1320,
  },
  padding: {
    xs: SPACING.sm,
    sm: SPACING.sm,
    md: SPACING.md,
    lg: SPACING.lg,
    xl: SPACING.xl,
  },
} as const;

// Responsive grid system
export const GRID = {
  columns: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 4,
    xxl: 6,
  },
  gap: {
    xs: SPACING.sm,
    sm: SPACING.md,
    md: SPACING.lg,
    lg: SPACING.xl,
    xl: SPACING.xl,
  },
} as const;

// Responsive image sizes
export const IMAGES = {
  model: {
    width: width < BREAKPOINTS.md ? width - SPACING.lg * 2 : 
           width < BREAKPOINTS.lg ? (width - SPACING.xl * 2) * 0.8 : 400,
    height: width < BREAKPOINTS.md ? (width - SPACING.lg * 2) * 1.25 : 
            width < BREAKPOINTS.lg ? (width - SPACING.xl * 2) : 500,
  },
  thumbnail: {
    width: width < BREAKPOINTS.md ? 60 : 80,
    height: width < BREAKPOINTS.md ? 60 : 80,
  },
  card: {
    width: width < BREAKPOINTS.md ? (width - SPACING.lg * 2 - SPACING.md) / 2 : 
           width < BREAKPOINTS.lg ? (width - SPACING.xl * 2 - SPACING.lg) / 3 : 200,
    height: width < BREAKPOINTS.md ? 180 : 220,
  },
} as const;

// Responsive button sizes
export const BUTTONS = {
  sizes: {
    sm: {
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      fontSize: TYPOGRAPHY.sm,
      borderRadius: 8,
    },
    md: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      fontSize: TYPOGRAPHY.base,
      borderRadius: 12,
    },
    lg: {
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      fontSize: TYPOGRAPHY.lg,
      borderRadius: 16,
    },
    xl: {
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.lg,
      fontSize: TYPOGRAPHY.xl,
      borderRadius: 20,
    },
  },
  icon: {
    sm: 16,
    md: 20,
    lg: 24,
    xl: 28,
  },
} as const;

// Responsive shadow system
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

// Export current dimensions for use in components
export const ScreenDimensions = {
  width,
  height,
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
} as const;
