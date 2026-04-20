import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { signIn, isLoaded } = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded } = useSignUp();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !isSignUpLoaded) {
      Alert.alert('Error', 'Authentication not ready. Please try again.');
      return;
    }

    setLoading(true);
    try {
      // Clerk handles the OAuth flow - it opens browser and returns to app
      // The redirect is handled by Clerk's backend
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: 'kyzo://oauth-callback',
        redirectUrlComplete: 'kyzo://oauth-callback',
      });
      
      // If we get here, the OAuth flow completed successfully
      // Clerk's useOAuth hook handles the session automatically
      onSuccess?.();
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      // Check if user doesn't exist, try sign up
      if (error.errors?.[0]?.code === 'form_identifier_not_found') {
        try {
          await signUp.authenticateWithRedirect({
            strategy: 'oauth_google',
            redirectUrl: 'kyzo://oauth-callback',
            redirectUrlComplete: 'kyzo://oauth-callback',
          });
          onSuccess?.();
          return;
        } catch (signUpError: any) {
          error = signUpError;
        }
      }
      
      // Handle specific Clerk errors
      if (error.errors?.[0]?.code === 'oauth_access_denied') {
        Alert.alert('Access Denied', 'You declined Google authentication.');
      } else if (error.errors?.[0]?.code === 'strategy_for_user_invalid') {
        Alert.alert(
          'Account Already Exists',
          'This Google account is linked to an existing account with a different sign-in method. Please use your email/password to sign in.'
        );
      } else if (error.errors?.[0]?.code === 'oauth_error') {
        Alert.alert(
          'Google Sign-In Error',
          'There was a problem signing in with Google. Please ensure:\n1. Google OAuth is enabled in Clerk Dashboard\n2. Your app is using EAS Build (not Expo Go)'
        );
      } else {
        Alert.alert('Error', error.message || 'Google Sign-In failed');
      }
      
      onError?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.googleButton, loading && styles.buttonDisabled]} 
      onPress={handleGoogleSignIn}
      disabled={!isLoaded || loading}
    >
      {loading ? (
        <ActivityIndicator color="#000" />
      ) : (
        <>
          <Ionicons name="logo-google" size={20} color="#000" style={styles.googleIcon} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// Required for OAuth - handle the redirect back to app
WebBrowser.maybeCompleteAuthSession();

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
});
