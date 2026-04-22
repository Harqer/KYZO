# Fashion App Design System Rules

## Design System Structure

### 1. Token Definitions

**Location**: Design tokens are defined in `/src/constants/responsive.ts`

**Structure**: Uses a comprehensive token system with the following categories:

```typescript
// Spacing tokens (8px base system)
export const SPACING = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64
};

// Typography tokens with responsive scaling
export const TYPOGRAPHY = {
  responsive: {
    h1: { fontSize: 28, fontWeight: 'bold', lineHeight: 36 },
    h2: { fontSize: 24, fontWeight: 'bold', lineHeight: 30 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 26 },
    body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 }
  }
};

// Shadow tokens for elevation
export const SHADOWS = {
  sm: { shadowOpacity: 0.05, elevation: 1 },
  md: { shadowOpacity: 0.1, elevation: 3 },
  lg: { shadowOpacity: 0.15, elevation: 6 },
  xl: { shadowOpacity: 0.2, elevation: 10 }
};
```

**Responsive Design**: All tokens are responsive with device-specific scaling using breakpoints:
- xs: 0px, sm: 375px, md: 768px, lg: 1024px, xl: 1280px, xxl: 1536px

### 2. Component Library

**Location**: `/src/components/` with atomic design structure:

```
src/components/
  base/           # Atomic elements (Button, Card, Heading, Input, Label)
  components/     # Simple components (AgentCard, ModelCard, AuthButton)
  composites/    # Complex components (FormField, FaqItem, FeatureCard)
  layouts/       # Layout components (Header, Footer, HeroSection)
  pages/         # Page-level components
```

**Component Architecture**: Uses TypeScript interfaces and React functional components with consistent prop patterns:

```typescript
interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({ onPress, children, variant = 'primary', ... }: ButtonProps) {
  // Implementation with StyleSheet.create
}
```

**Styling**: Uses React Native's `StyleSheet.create` with responsive utilities from constants.

### 3. Frameworks & Libraries

**UI Framework**: React Native with Expo Router for navigation
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Expo**: ~54.0.33
- **Navigation**: React Navigation v7 with expo-router

**Styling Libraries**:
- React Native StyleSheet (primary)
- expo-linear-gradient for gradients
- lucide-react-native for icons

**Build System**: Expo CLI with TypeScript support

### 4. Asset Management

**Storage**: Assets stored in `/assets/` directory
- **Images**: `/assets/images/`
- **Icons**: Primarily using lucide-react-native library
- **Optimization**: Uses expo-image for optimized image loading

**Asset References**:
```typescript
import { Image } from 'expo-image';
<Image source={require('../assets/images/logo.png')} style={styles.logo} />
```

**Responsive Images**: Defined in responsive.ts with device-specific sizing:
```typescript
export const IMAGES = {
  model: { width: width < 768 ? width - 48 : 400, height: 500 },
  thumbnail: { width: 60, height: 60 },
  card: { width: 200, height: 220 }
};
```

### 5. Icon System

**Primary Library**: lucide-react-native
- **Import**: `import { IconName } from 'lucide-react-native';`
- **Usage**: `<IconName size={24} color="#6366f1" />`

**Secondary**: @expo/vector-icons for Expo-specific icons
- **Import**: `import { Ionicons } from '@expo/vector-icons';`

**Icon Sizing**: Responsive sizing defined in BUTTONS.icon:
```typescript
icon: { sm: 16, md: 20, lg: 24, xl: 28 }
```

### 6. Styling Approach

**Methodology**: React Native StyleSheet with responsive utilities
- **Global Styles**: Defined in component files using StyleSheet.create
- **Responsive Design**: Device-specific scaling using responsive.ts utilities
- **Theme Support**: Uses React Navigation's theme system (DarkTheme/DefaultTheme)

**Pattern**:
```typescript
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
  },
  title: {
    ...TYPOGRAPHY.responsive.h1,
    color: colorScheme === 'dark' ? '#FFFFFF' : '#1F2937'
  }
});
```

**Responsive Implementation**:
```typescript
import { getResponsiveSpacing, ScreenDimensions } from '../../constants/responsive';

// Use responsive utilities
const dynamicPadding = getResponsiveSpacing('lg');
const isMobileDevice = ScreenDimensions.isMobile();
```

### 7. Project Structure

**Organization**:
```
fashion-app/
  app/                    # Expo Router pages and layouts
  src/
    components/          # Reusable UI components
    constants/           # Design tokens and responsive utilities
    context/            # React context providers
    services/           # API and business logic
    utils/              # Helper functions
  assets/               # Static assets
```

**Feature Organization**: Components organized by complexity (atomic design)
- **Base**: Atomic elements (Button, Input, etc.)
- **Components**: Simple combinations
- **Composites**: Complex components with business logic
- **Layouts**: Page structure components

**Navigation**: Expo Router with file-based routing:
- `app/_layout.tsx` - Root layout with authentication
- `app/(tabs)/` - Main app navigation
- `app/(auth)/` - Authentication flows

## Figma Integration Guidelines

### Design Token Mapping
- **Colors**: Map Figma color styles to React Native color values
- **Typography**: Use TYPOGRAPHY.responsive tokens for text styles
- **Spacing**: Apply SPACING tokens for margins and padding
- **Shadows**: Use SHADOWS tokens for elevation effects

### Component Naming
- **PascalCase**: Component names should match Figma component names
- **Descriptive**: Use semantic names (e.g., `ProductCard` not `CardVariant1`)
- **Consistent**: Follow existing naming patterns in the codebase

### Responsive Design
- **Mobile-First**: Design for mobile breakpoints first
- **Progressive Enhancement**: Add complexity for larger screens
- **Token-Based**: Use responsive tokens rather than hardcoded values

### Code Generation
- **TypeScript**: Generate TypeScript interfaces for all props
- **StyleSheet**: Use StyleSheet.create for performance
- **Responsive**: Apply responsive utilities from constants/responsive.ts

### Asset Export
- **Format**: Export assets in appropriate formats (PNG for images, SVG for icons)
- **Sizing**: Use responsive image sizes from IMAGES tokens
- **Optimization**: Leverage expo-image for lazy loading and caching
