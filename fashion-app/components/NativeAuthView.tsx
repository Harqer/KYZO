import React from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { useSignIn, useSignUp } from '@clerk/clerk-expo';

interface NativeAuthViewProps {
  onSignInSuccess?: () => void;
  onSignUpSuccess?: () => void;
}

export default function NativeAuthView({ onSignInSuccess, onSignUpSuccess }: NativeAuthViewProps) {
  const { isLoaded: signInLoaded } = useSignIn();
  const { isLoaded: signUpLoaded } = useSignUp();

  const showNativeAuthInfo = () => {
    Alert.alert(
      'Native AuthView Setup Required',
      'To use the native AuthView component:\n\n1. Requires EAS Build (not Expo Go)\n2. Enable native auth in Clerk Dashboard\n3. Configure app.json with native settings\n4. The AuthView renders SwiftUI on iOS and Jetpack Compose on Android',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Native Authentication</Text>
      <Text style={styles.subtitle}>
        Clerk's native AuthView component provides zero-config authentication with native UI.
      </Text>
      
      <TouchableOpacity 
        style={styles.placeholderButton}
        onPress={showNativeAuthInfo}
      >
        <Text style={styles.placeholderButtonText}>
          Setup Native AuthView
        </Text>
      </TouchableOpacity>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoItem}> SwiftUI on iOS</Text>
        <Text style={styles.infoItem}> Jetpack Compose on Android</Text>
        <Text style={styles.infoItem}> Zero configuration</Text>
        <Text style={styles.infoItem}> All auth methods enabled</Text>
      </View>
      
      <Text style={styles.note}>
        Status: {signInLoaded && signUpLoaded ? 'Ready' : 'Loading...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  placeholderButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  placeholderButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginVertical: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  authViewContainer: {
    flex: 1,
    minHeight: 400,
  },
  note: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
