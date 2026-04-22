import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useSignIn, useAuth, useClerk } from '@clerk/expo';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import GoogleSignInButton from '@/src/components/composites/GoogleSignInButton';

export default function SignInScreen() {
  const { signIn } = useSignIn();
  const { setActive } = useClerk();
  const { isSignedIn, isLoaded } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  // Check biometric availability and stored credentials on component mount
  useEffect(() => {
    checkBiometricAvailability();
    checkStoredCredentials();
  }, []);

  const checkStoredCredentials = async () => {
    try {
      const hasCredentials = await SecureStore.getItemAsync('biometric_enabled');
      setHasStoredCredentials(hasCredentials === 'true');
    } catch (error) {
      console.log('Error checking stored credentials:', error);
      setHasStoredCredentials(false);
    }
  };

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricAvailable(true);
        
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else {
          setBiometricType('Biometric');
        }
      }
    } catch (error) {
      console.log('Biometric check failed:', error);
    }
  };

  const onSignInPress = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      const result = await (signIn as any).create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Offer to store credentials for biometric login
        if (biometricAvailable) {
          Alert.alert(
            'Enable Biometric Login?',
            `Would you like to enable ${biometricType} for faster sign-in next time?`,
            [
              { text: 'No', style: 'cancel' },
              { 
                text: 'Yes', 
                onPress: () => storeCredentialsForBiometric(email, password)
              },
            ]
          );
        }
        
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', 'Sign in failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const storeCredentialsForBiometric = async (identifier: string, password: string) => {
    try {
      // Store credentials securely for biometric authentication
      await SecureStore.setItemAsync('biometric_email', identifier);
      await SecureStore.setItemAsync('biometric_password', password);
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      
      Alert.alert('Success', `${biometricType} login enabled!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to enable biometric login');
    }
  };

  const onBiometricSignInPress = async () => {
    if (!biometricAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available on this device');
      return;
    }

    try {
      // First authenticate with biometrics
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in with ${biometricType}`,
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Retrieve stored credentials
        const storedEmail = await SecureStore.getItemAsync('biometric_email');
        const storedPassword = await SecureStore.getItemAsync('biometric_password');
        
        if (storedEmail && storedPassword) {
          setLoading(true);
          
          // Sign in with stored credentials
          const completeSignIn = await (signIn as any).create({
            identifier: storedEmail,
            password: storedPassword,
          });

          if (completeSignIn.status === 'complete') {
            await setActive({ session: completeSignIn.createdSessionId });
            router.replace('/(tabs)');
          } else {
            Alert.alert('Error', 'Stored credentials are no longer valid. Please sign in again.');
            // Clear invalid credentials
            await SecureStore.deleteItemAsync('biometric_email');
            await SecureStore.deleteItemAsync('biometric_password');
            await SecureStore.deleteItemAsync('biometric_enabled');
          }
        } else {
          Alert.alert('Error', 'No stored credentials found. Please sign in with email/password first.');
        }
      } else {
        Alert.alert('Failed', 'Biometric authentication failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Biometric authentication error');
      console.error('Biometric sign in error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={onSignInPress}
          disabled={loading || !email || !password}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <GoogleSignInButton 
          onSuccess={() => router.replace('/(tabs)')}
          onError={(error) => console.error('Google Sign-In error:', error)}
        />

        {biometricAvailable && hasStoredCredentials && (
          <TouchableOpacity 
            style={styles.biometricButton}
            onPress={onBiometricSignInPress}
            disabled={loading}
          >
            <Ionicons 
              name={biometricType === 'Face ID' ? 'finger-print' : 'finger-print'} 
              size={20} 
              color="#000" 
              style={styles.biometricIcon}
            />
            <Text style={styles.biometricButtonText}>
              Sign in with {biometricType}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.linkText}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  biometricIcon: {
    marginRight: 8,
  },
  biometricButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
