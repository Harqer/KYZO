import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function GoogleSignInButton({ onSuccess, onError }: GoogleSignInButtonProps) {
  const { signIn, isLoaded } = useSignIn();

  const handleGoogleSignIn = async () => {
    if (!isLoaded) {
      Alert.alert('Error', 'Sign-In is not ready');
      return;
    }

    try {
      // For now, we'll show a placeholder since native Google Sign-In requires additional setup
      Alert.alert(
        'Google Sign-In Setup Required',
        'Native Google Sign-In requires additional configuration:\n\n1. Enable Google OAuth in Clerk Dashboard\n2. Set up Google Cloud Console\n3. Configure app.json with Google credentials\n4. Use EAS Build (not Expo Go)',
        [{ text: 'OK' }]
      );
      
      // In a fully implemented version, you would use:
      // const result = await signIn.authenticateWithGoogle();
      // if (result.status === 'complete') {
      //   await setActive({ session: result.createdSessionId });
      //   onSuccess?.();
      // }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      Alert.alert('Error', error.message || 'Google Sign-In failed');
      onError?.(error);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.googleButton} 
      onPress={handleGoogleSignIn}
      disabled={!isLoaded}
    >
      <Ionicons name="logo-google" size={20} color="#000" style={styles.googleIcon} />
      <Text style={styles.googleButtonText}>Continue with Google</Text>
    </TouchableOpacity>
  );
}

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
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
});
