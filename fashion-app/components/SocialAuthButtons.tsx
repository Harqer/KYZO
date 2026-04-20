import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

interface SocialAuthButtonsProps {
  mode: 'sign-in' | 'sign-up';
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

// Social providers configuration
const providers = [
  { id: 'google', name: 'Google', icon: 'logo-google', color: '#DB4437' },
  { id: 'apple', name: 'Apple', icon: 'logo-apple', color: '#000000' },
  { id: 'twitter', name: 'X', icon: 'logo-twitter', color: '#000000' },
  { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  { id: 'github', name: 'GitHub', icon: 'logo-github', color: '#333333' },
];

export function SocialAuthButtons({ mode, onSuccess, onError }: SocialAuthButtonsProps) {
  const { signIn, setActive: setSignInActive } = useSignIn();
  const { signUp, setActive: setSignUpActive } = useSignUp();

  const handleSocialAuth = async (provider: string) => {
    try {
      const authInstance = mode === 'sign-in' ? signIn : signUp;
      
      if (!authInstance) {
        throw new Error('Auth not initialized');
      }

      // Start OAuth flow
      const result = await authInstance.authenticateWithRedirect({
        strategy: `oauth_${provider}`,
        redirectUrl: AuthSession.makeRedirectUri({
          native: 'kyzo://oauth-callback',
          web: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });

      if (result.status === 'complete') {
        const setActive = mode === 'sign-in' ? setSignInActive : setSignUpActive;
        await setActive({ session: result.createdSessionId });
        onSuccess?.();
      } else if (result.status === 'missing_requirements') {
        // Handle cases where additional info is needed
        Alert.alert(
          'Additional Information Required',
          'Please complete your profile to continue.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error(`${provider} auth error:`, error);
      
      // Graceful error handling
      if (error.errors?.[0]?.code === 'oauth_access_denied') {
        Alert.alert('Access Denied', `You declined ${provider} authentication.`);
      } else if (error.errors?.[0]?.code === 'strategy_for_user_invalid') {
        Alert.alert(
          'Account Already Exists',
          'This email is already associated with another account. Please sign in instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => onSuccess?.() }
          ]
        );
      } else {
        Alert.alert('Authentication Error', error.message || `Failed to authenticate with ${provider}`);
      }
      
      onError?.(error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.buttonsContainer}>
        {providers.map((provider) => (
          <TouchableOpacity
            key={provider.id}
            style={[
              styles.socialButton,
              { backgroundColor: provider.color }
            ]}
            onPress={() => handleSocialAuth(provider.id)}
            accessibilityLabel={`Sign ${mode === 'sign-in' ? 'in' : 'up'} with ${provider.name}`}
          >
            <Ionicons name={provider.icon as any} size={20} color="#fff" />
            <Text style={styles.socialButtonText}>{provider.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    minWidth: 100,
  },
  socialButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
