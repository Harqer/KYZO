import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ClerkProvider, ClerkLoaded, SignedIn, SignedOut } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

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

// Biometric authentication helper
export const authenticateWithBiometrics = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { success: false, error: 'Device does not support biometric authentication' };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return { success: false, error: 'No biometrics enrolled on this device' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
    });

    return { success: result.success, error: result.success ? null : 'Authentication failed' };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ClerkProvider 
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <ClerkLoaded>
          <SignedIn>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack>
          </SignedIn>
          <SignedOut>
            <Stack>
              <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
          </SignedOut>
          <StatusBar style="auto" />
        </ClerkLoaded>
      </ThemeProvider>
    </ClerkProvider>
  );
}
