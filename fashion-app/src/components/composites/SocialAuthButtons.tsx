import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

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
  const { signIn, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSocialAuth = async (provider: string) => {
    if (!isSignInLoaded || !isSignUpLoaded) {
      Alert.alert('Error', 'Authentication not ready');
      return;
    }

    setLoading(provider);
    try {
      const authInstance = mode === 'sign-in' ? signIn : signUp;
      
      if (!authInstance) {
        throw new Error('Auth not initialized');
      }

      // Start OAuth flow - opens browser and redirects back
      await authInstance.authenticateWithRedirect({
        strategy: `oauth_${provider}` as any,
        redirectUrl: 'kyzo://oauth-callback',
        redirectUrlComplete: 'kyzo://oauth-callback',
      });
      
      // OAuth flow completed successfully
      onSuccess?.();
    } catch (error: any) {
      console.error(`${provider} auth error:`, error);
      
      // Try sign up if sign in fails (user doesn't exist)
      if (mode === 'sign-in' && error.errors?.[0]?.code === 'form_identifier_not_found') {
        try {
          await signUp.authenticateWithRedirect({
            strategy: `oauth_${provider}` as any,
            redirectUrl: 'kyzo://oauth-callback',
            redirectUrlComplete: 'kyzo://oauth-callback',
          });
          onSuccess?.();
          return;
        } catch (signUpError: any) {
          error = signUpError;
        }
      }
      
      // Graceful error handling
      if (error.errors?.[0]?.code === 'oauth_access_denied') {
        Alert.alert('Access Denied', `You declined ${provider} authentication.`);
      } else if (error.errors?.[0]?.code === 'strategy_for_user_invalid') {
        Alert.alert(
          'Account Already Exists',
          `This ${provider} account is linked to an existing account with a different sign-in method. Please use your email/password.`
        );
      } else if (error.errors?.[0]?.code === 'oauth_error') {
        Alert.alert(
          'OAuth Error',
          `There was a problem with ${provider} authentication. Please ensure it's enabled in your Clerk Dashboard.`
        );
      } else {
        Alert.alert('Authentication Error', error.message || `Failed to authenticate with ${provider}`);
      }
      
      onError?.(error);
    } finally {
      setLoading(null);
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
              { backgroundColor: provider.color },
              loading === provider.id && styles.socialButtonLoading
            ]}
            onPress={() => handleSocialAuth(provider.id)}
            accessibilityLabel={`Sign ${mode === 'sign-in' ? 'in' : 'up'} with ${provider.name}`}
            disabled={loading !== null}
          >
            {loading === provider.id ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name={provider.icon as any} size={20} color="#fff" />
                <Text style={styles.socialButtonText}>{provider.name}</Text>
              </>
            )}
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
  socialButtonLoading: {
    opacity: 0.7,
  },
});
