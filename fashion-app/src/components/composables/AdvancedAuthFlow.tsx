import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useLocalCredentials } from '@clerk/clerk-expo';
import { useAuth, useUser, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { authenticateWithBiometrics } from '../app/_layout';
import { AuthButton } from '../ui/AuthButton';

interface AdvancedAuthFlowProps {
  onSignInSuccess?: () => void;
  onSignUpSuccess?: () => void;
}

export const AdvancedAuthFlow: React.FC<AdvancedAuthFlowProps> = ({
  onSignInSuccess,
  onSignUpSuccess,
}) => {
  const { isSignedIn, signOut } = useAuth();
  const { user } = useUser();
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();
  const { 
    createLocalCredentials, 
    signInWithLocalCredentials, 
    hasLocalCredentials,
    isLoading: credentialsLoading 
  } = useLocalCredentials();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      const result = await authenticateWithBiometrics();
      setBiometricEnabled(result.success);
    } catch (error) {
      console.log('Biometric check failed:', error);
      setBiometricEnabled(false);
    }
  };

  const handleEmailSignIn = async () => {
    if (!signInLoaded) return;

    try {
      setIsLoading(true);
      
      const completeSignIn = await signIn.create({
        identifier: email,
        password,
      });

      await setActive({ session: completeSignIn.createdSessionId });

      // Check if user wants to enable biometric authentication
      if (biometricEnabled) {
        await enableBiometricAuth();
      }

      onSignInSuccess?.();
    } catch (err) {
      Alert.alert('Error', 'Failed to sign in. Please check your credentials.');
      console.error('Sign in error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    if (!signUpLoaded) return;

    try {
      setIsLoading(true);
      
      const completeSignUp = await signUp.create({
        emailAddress: email,
        password,
      });

      await setSignUpActive({ session: completeSignUp.createdSessionId });

      onSignUpSuccess?.();
    } catch (err) {
      Alert.alert('Error', 'Failed to sign up. Please try again.');
      console.error('Sign up error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const enableBiometricAuth = async () => {
    if (!isSignedIn || !user) return;

    try {
      // Create local credentials for biometric authentication
      await createLocalCredentials({
        password: password,
      });
      
      Alert.alert('Success', 'Biometric authentication enabled!');
    } catch (error) {
      console.error('Failed to enable biometric auth:', error);
      Alert.alert('Error', 'Failed to enable biometric authentication.');
    }
  };

  const handleBiometricSignIn = async () => {
    if (!hasLocalCredentials) {
      Alert.alert('Info', 'Please sign in with email/password first to enable biometric authentication.');
      return;
    }

    try {
      setIsLoading(true);
      
      // First authenticate with biometrics
      const biometricResult = await authenticateWithBiometrics();
      if (!biometricResult.success) {
        Alert.alert('Error', biometricResult.error || 'Biometric authentication failed.');
        return;
      }

      // Then sign in with local credentials
      await signInWithLocalCredentials();
      
      onSignInSuccess?.();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign in with biometrics.');
      console.error('Biometric sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (isSignedIn && user) {
    return (
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome, {user.firstName || user.emailAddresses[0]?.emailAddress}!</Text>
        
        <View style={styles.userInfo}>
          <Text style={styles.userInfoText}>Email: {user.emailAddresses[0]?.emailAddress}</Text>
          <Text style={styles.userInfoText}>Biometric Auth: {hasLocalCredentials ? 'Enabled' : 'Disabled'}</Text>
        </View>

        {!hasLocalCredentials && biometricEnabled && (
          <TouchableOpacity 
            style={[styles.button, styles.enableButton]} 
            onPress={enableBiometricAuth}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Enable Biometric Auth</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={[styles.button, styles.signOutButton]} 
          onPress={handleSignOut}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advanced Authentication</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email:</Text>
        <Text style={styles.input}>{email}</Text>
      </View>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password:</Text>
        <Text style={styles.input}>{'*'.repeat(password.length)}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <AuthButton
          provider="email"
          onPress={handleEmailSignIn}
          disabled={isLoading || !email || !password}
          style={styles.button}
        />
        
        <TouchableOpacity 
          style={[styles.button, styles.signUpButton]} 
          onPress={handleEmailSignUp}
          disabled={isLoading || !email || !password}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>

        {hasLocalCredentials && (
          <TouchableOpacity 
            style={[styles.button, styles.biometricButton]} 
            onPress={handleBiometricSignIn}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Sign In with Biometrics</Text>
          </TouchableOpacity>
        )}
      </View>

      {biometricEnabled && !hasLocalCredentials && (
        <Text style={styles.hintText}>
          Sign in with email/password first to enable biometric authentication
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  userInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  userInfoText: {
    fontSize: 16,
    marginBottom: 5,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    fontSize: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    gap: 10,
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  signUpButton: {
    backgroundColor: '#28a745',
  },
  biometricButton: {
    backgroundColor: '#17a2b8',
  },
  enableButton: {
    backgroundColor: '#ffc107',
    marginBottom: 10,
  },
  signOutButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hintText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 15,
    fontSize: 14,
  },
});
