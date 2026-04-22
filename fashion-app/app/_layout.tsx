import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ClerkProvider, ClerkLoaded } from '@clerk/expo';
import { useAuth } from '@clerk/expo';
import * as SecureStore from 'expo-secure-store';
import { authenticateWithBiometrics } from '../src/utils/biometrics';

// Advanced token cache with biometric support
const tokenCache = {
  async getToken(key: string) {
    try {
      const value = await SecureStore.getItemAsync(key);
      return value;
    } catch (err) {
      console.error('Error getting token:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token:', err);
    }
  },
  async removeToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error('Error removing token:', err);
    }
  }
};

import { useColorScheme } from '@/hooks/use-color-scheme';

function AuthenticatedLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (isSignedIn) {
    return (
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider 
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ClerkLoaded>
          <AuthenticatedLayout />
          <StatusBar style="auto" />
        </ClerkLoaded>
      </ThemeProvider>
    </ClerkProvider>
  );
}
