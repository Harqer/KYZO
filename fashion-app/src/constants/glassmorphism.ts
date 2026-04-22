/**
 * Glassmorphism Design Tokens
 * Implements glassmorphism styling with accessibility and performance considerations
 */

export interface GlassTokens {
  // Blur intensities for different use cases
  blur: {
    subtle: number;      // Light blur for backgrounds
    medium: number;     // Standard blur for cards
    strong: number;      // Heavy blur for overlays
    agent: number;       // Special blur for AI interventions
  };
  
  // Tint colors for different contexts
  tints: {
    light: string;       // Light theme tint
    dark: string;        // Dark theme tint
    agent: string;       // AI intervention tint
    neutral: string;     // Neutral tint for general use
  };
  
  // Opacity levels
  opacity: {
    subtle: number;      // Very transparent
    medium: number;     // Standard transparency
    strong: number;      // More opaque
    solid: number;       // Nearly solid
  };
  
  // Border radius for glass elements
  radius: {
    small: number;       // Small elements (buttons, tags)
    medium: number;      // Cards, panels
    large: number;       // Large containers
    xl: number;          // Full-screen overlays
  };
  
  // Border styling
  border: {
    width: number;       // Border width
    color: string;       // Border color
    opacity: number;     // Border opacity
  };
  
  // Shadow effects for depth
  shadow: {
    light: string;        // Subtle shadow
    medium: string;       // Standard shadow
    strong: string;       // Heavy shadow for depth
    agent: string;       // Special shadow for AI elements
  };
}

export const GLASS_TOKENS: GlassTokens = {
  blur: {
    subtle: 20,      // Light blur for backgrounds
    medium: 50,      // Standard blur for cards  
    strong: 80,      // Heavy blur for overlays
    agent: 60,       // Special blur for AI interventions
  },
  
  tints: {
    light: 'rgba(255, 255, 255, 0.25)',     // Light theme tint
    dark: 'rgba(0, 0, 0, 0.25)',            // Dark theme tint
    agent: 'rgba(99, 102, 241, 0.15)',      // AI intervention tint (indigo)
    neutral: 'rgba(255, 255, 255, 0.1)',   // Neutral tint for general use
  },
  
  opacity: {
    subtle: 0.1,     // Very transparent
    medium: 0.25,    // Standard transparency
    strong: 0.4,     // More opaque
    solid: 0.8,      // Nearly solid
  },
  
  radius: {
    small: 8,        // Small elements (buttons, tags)
    medium: 16,      // Cards, panels
    large: 24,       // Large containers
    xl: 32,          // Full-screen overlays
  },
  
  border: {
    width: 1,        // Border width
    color: 'rgba(255, 255, 255, 0.18)', // Border color
    opacity: 0.18,   // Border opacity
  },
  
  shadow: {
    light: '0 2px 8px rgba(0, 0, 0, 0.06)',      // Subtle shadow
    medium: '0 4px 16px rgba(0, 0, 0, 0.1)',      // Standard shadow
    strong: '0 8px 32px rgba(0, 0, 0, 0.15)',     // Heavy shadow for depth
    agent: '0 4px 20px rgba(99, 102, 241, 0.25)', // Special shadow for AI elements
  },
};

// Glassmorphism variants for different use cases
export interface GlassVariant {
  blur: number;
  tint: string;
  opacity: number;
  radius: number;
  borderWidth: number;
  borderColor: string;
  boxShadow: string;
}

export const GLASS_VARIANTS: Record<string, GlassVariant> = {
  // Standard minimalist view (performance-first)
  minimal: {
    blur: GLASS_TOKENS.blur.subtle,
    tint: GLASS_TOKENS.tints.neutral,
    opacity: GLASS_TOKENS.opacity.subtle,
    radius: GLASS_TOKENS.radius.medium,
    borderWidth: 0,
    borderColor: 'transparent',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
  },
  
  // Standard card for products
  card: {
    blur: GLASS_TOKENS.blur.medium,
    tint: GLASS_TOKENS.tints.neutral,
    opacity: GLASS_TOKENS.opacity.medium,
    radius: GLASS_TOKENS.radius.medium,
    borderWidth: GLASS_TOKENS.border.width,
    borderColor: GLASS_TOKENS.border.color,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
  
  // Agent layer liquid glass bento tiles
  agent: {
    blur: GLASS_TOKENS.blur.agent,
    tint: GLASS_TOKENS.tints.agent,
    opacity: GLASS_TOKENS.opacity.medium,
    radius: GLASS_TOKENS.radius.large,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.25)',
  },
  
  // Modal and overlay glass
  overlay: {
    blur: GLASS_TOKENS.blur.strong,
    tint: GLASS_TOKENS.tints.dark,
    opacity: GLASS_TOKENS.opacity.strong,
    radius: GLASS_TOKENS.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  },
  
  // Navigation and header glass
  navigation: {
    blur: GLASS_TOKENS.blur.medium,
    tint: GLASS_TOKENS.tints.light,
    opacity: GLASS_TOKENS.opacity.medium,
    radius: 0, // No radius for navigation bars
    borderWidth: GLASS_TOKENS.border.width,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  
  // Floating action buttons
  fab: {
    blur: GLASS_TOKENS.blur.medium,
    tint: GLASS_TOKENS.tints.light,
    opacity: GLASS_TOKENS.opacity.strong,
    radius: GLASS_TOKENS.radius.large,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },
};

// High contrast variants for accessibility
export const HIGH_CONTRAST_VARIANTS: Record<string, GlassVariant> = {
  ...GLASS_VARIANTS,
  minimal: {
    ...GLASS_VARIANTS.minimal,
    opacity: 0.8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
  card: {
    ...GLASS_VARIANTS.card,
    opacity: 0.9,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  agent: {
    ...GLASS_VARIANTS.agent,
    opacity: 0.85,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.6)',
    boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
  },
};

// Performance optimization flags
export const GLASS_PERFORMANCE = {
  // Disable blur on low-end devices
  disableBlurOnLowEnd: true,
  // Reduce blur intensity for better performance
  performanceMode: {
    blurMultiplier: 0.7,
    shadowOpacityMultiplier: 0.6,
    reduceAnimations: true,
  },
  // Cache blur views to prevent re-renders
  enableBlurCaching: true,
};
