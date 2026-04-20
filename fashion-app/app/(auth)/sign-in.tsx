import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { SocialAuthButtons } from '@/src/components/composables/SocialAuthButtons';
import { MagicLinkAuth } from '@/src/components/composables/MagicLinkAuth';
import { MFASetup } from '@/src/components/composables/MFASetup';

type AuthMethod = 'password' | 'magic-link' | 'social';

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, user } = useAuth();
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  
  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [showMFASetup, setShowMFASetup] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [hasStoredCredentials, setHasStoredCredentials] = useState(false);

  // Check biometric availability
  useEffect(() => {
    checkBiometricAvailability();
    checkStoredCredentials();
  }, []);

  const checkStoredCredentials = async () => {
    try {
      const hasCredentials = await SecureStore.getItemAsync('biometric_enabled');
      setHasStoredCredentials(hasCredentials === 'true');
    } catch (error) {
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

  // Email/Password Sign In
  const onSignInPress = async () => {
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        
        // Offer biometric for next time
        if (biometricAvailable && !hasStoredCredentials) {
          Alert.alert(
            'Enable Biometric Login?',
            `Enable ${biometricType} for faster sign-in?`,
            [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', onPress: () => storeCredentialsForBiometric(email, password) }
            ]
          );
        }
        
        router.replace('/(tabs)');
      } else if (completeSignIn.status === 'needs_second_factor') {
        setMfaRequired(true);
      } else {
        Alert.alert('Error', 'Sign in failed. Please try again.');
      }
    } catch (err: any) {
      // Handle specific Clerk errors
      if (err.errors?.[0]?.code === 'form_identifier_not_found') {
        Alert.alert('Account Not Found', 'No account exists with this email. Please sign up first.');
      } else if (err.errors?.[0]?.code === 'form_password_incorrect') {
        Alert.alert('Incorrect Password', 'The password you entered is incorrect. Please try again.');
      } else if (err.errors?.[0]?.code === 'session_exists') {
        Alert.alert('Already Signed In', 'You are already signed in on this device.');
      } else {
        Alert.alert('Error', err.message || 'Sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // MFA Verification
  const verifyMFA = async () => {
    if (!mfaCode || mfaCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: 'totp',
        code: mfaCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Verification Failed', 'Invalid code. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Biometric Sign In
  const onBiometricSignInPress = async () => {
    if (!biometricAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not available');
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in with ${biometricType}`,
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        const storedEmail = await SecureStore.getItemAsync('biometric_email');
        const storedPassword = await SecureStore.getItemAsync('biometric_password');
        
        if (storedEmail && storedPassword) {
          setEmail(storedEmail);
          setPassword(storedPassword);
          await onSignInPress();
        } else {
          Alert.alert('Error', 'No stored credentials found. Please sign in manually first.');
        }
      }
    } catch (error) {
      console.error('Biometric error:', error);
    }
  };

  const storeCredentialsForBiometric = async (identifier: string, pass: string) => {
    try {
      await SecureStore.setItemAsync('biometric_email', identifier);
      await SecureStore.setItemAsync('biometric_password', pass);
      await SecureStore.setItemAsync('biometric_enabled', 'true');
      Alert.alert('Success', `${biometricType} login enabled!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to enable biometric login');
    }
  };

  // Render MFA Input
  if (mfaRequired) {
    return (
      <View style={styles.container}>
        <Ionicons name="shield-outline" size={64} color="#6366f1" style={styles.mfaIcon} />
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code from your authenticator app
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="000000"
          value={mfaCode}
          onChangeText={setMfaCode}
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={verifyMFA}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={() => setMfaRequired(false)}>
          <Text style={styles.linkText}>Use different method</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {/* Auth Method Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, authMethod === 'password' && styles.activeTab]}
            onPress={() => setAuthMethod('password')}
          >
            <Ionicons 
              name="key-outline" 
              size={20} 
              color={authMethod === 'password' ? '#6366f1' : '#6b7280'} 
            />
            <Text style={[styles.tabText, authMethod === 'password' && styles.activeTabText]}>
              Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, authMethod === 'magic-link' && styles.activeTab]}
            onPress={() => setAuthMethod('magic-link')}
          >
            <Ionicons 
              name="mail-outline" 
              size={20} 
              color={authMethod === 'magic-link' ? '#6366f1' : '#6b7280'} 
            />
            <Text style={[styles.tabText, authMethod === 'magic-link' && styles.activeTabText]}>
              Magic Link
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tab, authMethod === 'social' && styles.activeTab]}
            onPress={() => setAuthMethod('social')}
          >
            <Ionicons 
              name="share-social-outline" 
              size={20} 
              color={authMethod === 'social' ? '#6366f1' : '#6b7280'} 
            />
            <Text style={[styles.tabText, authMethod === 'social' && styles.activeTabText]}>
              Social
            </Text>
          </TouchableOpacity>
        </View>

        {/* Auth Method Content */}
        {authMethod === 'password' && (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={onSignInPress}
              disabled={loading || !email || !password}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {biometricAvailable && hasStoredCredentials && (
              <TouchableOpacity 
                style={styles.biometricButton}
                onPress={onBiometricSignInPress}
              >
                <Ionicons name="finger-print" size={24} color="#6366f1" />
                <Text style={styles.biometricButtonText}>
                  Sign in with {biometricType}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {authMethod === 'magic-link' && (
          <MagicLinkAuth onSuccess={() => router.replace('/(tabs)')} />
        )}

        {authMethod === 'social' && (
          <SocialAuthButtons 
            mode="sign-in" 
            onSuccess={() => router.replace('/(tabs)')}
          />
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.mfaLink}
            onPress={() => setShowMFASetup(true)}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color="#6366f1" />
            <Text style={styles.mfaLinkText}>Security Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* MFA Setup Modal */}
      <Modal
        visible={showMFASetup}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Security Settings</Text>
            <TouchableOpacity onPress={() => setShowMFASetup(false)}>
              <Ionicons name="close" size={28} color="#1f2937" />
            </TouchableOpacity>
          </View>
          <MFASetup 
            onComplete={() => setShowMFASetup(false)}
            onCancel={() => setShowMFASetup(false)}
          />
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#6366f1',
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
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
    backgroundColor: '#ede9fe',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  biometricButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '500',
  },
  mfaIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  footer: {
    marginTop: 32,
    gap: 16,
    alignItems: 'center',
  },
  linkButton: {
    padding: 8,
  },
  linkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  mfaLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
  },
  mfaLinkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
});
