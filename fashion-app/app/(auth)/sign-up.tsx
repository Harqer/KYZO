import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SocialAuthButtons } from '@/components/SocialAuthButtons';

type SignUpStep = 'email' | 'verification' | 'password' | 'complete';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [step, setStep] = useState<SignUpStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Email validation
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Password strength check
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['#ef4444', '#f59e0b', '#10b981', '#10b981'];

  // Start sign up process
  const startSignUp = async () => {
    if (!isLoaded) return;
    
    if (!isValidEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to continue');
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setStep('verification');
    } catch (err: any) {
      if (err.errors?.[0]?.code === 'form_identifier_exists') {
        Alert.alert(
          'Account Already Exists',
          'An account with this email already exists. Would you like to sign in instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.replace('/(auth)/sign-in') }
          ]
        );
      } else {
        Alert.alert('Error', err.message || 'Sign up failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify email code
  const verifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit code from your email');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        // Email verified, now set password
        setStep('password');
      } else {
        Alert.alert('Error', 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      if (err.errors?.[0]?.code === 'form_code_incorrect') {
        Alert.alert('Incorrect Code', 'The code you entered is incorrect. Please check your email and try again.');
      } else {
        Alert.alert('Error', err.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Set password and complete signup
  const completeSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password Too Short', 'Password must be at least 8 characters');
      return;
    }

    if (passwordStrength < 2) {
      Alert.alert(
        'Weak Password',
        'Please use a stronger password with uppercase, lowercase, numbers, and special characters',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);
    try {
      // Update password
      await signUp.update({ password });

      // Complete signup
      const result = await signUp.completeSignUp();

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        
        // Show welcome message with security tip
        Alert.alert(
          'Welcome to KYZO!',
          'Your account has been created successfully. Consider enabling two-factor authentication for added security.',
          [
            { 
              text: 'Go to App', 
              onPress: () => router.replace('/(tabs)')
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Sign up failed. Please try again.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to complete sign up');
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const resendCode = async () => {
    setLoading(true);
    try {
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code Sent', 'A new verification code has been sent to your email');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Social auth success handler
  const handleSocialSuccess = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join the KYZO fashion community</Text>

        {step === 'email' && (
          <>
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!loading}
              />

              {/* Terms acceptance */}
              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={() => setAcceptTerms(!acceptTerms)}
              >
                <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                  {acceptTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.termsText}>
                  I agree to the Terms of Service and Privacy Policy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]} 
                onPress={startSignUp}
                disabled={loading || !email}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialAuthButtons 
              mode="sign-up" 
              onSuccess={handleSocialSuccess}
            />

            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => router.replace('/(auth)/sign-in')}
            >
              <Text style={styles.linkText}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </>
        )}

        {step === 'verification' && (
          <View style={styles.form}>
            <Ionicons name="mail-open-outline" size={64} color="#6366f1" style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Verify Your Email</Text>
            <Text style={styles.stepSubtitle}>
              We sent a 6-digit code to {email}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="000000"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              fontSize={24}
              letterSpacing={8}
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={verifyEmail}
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.resendButton} onPress={resendCode} disabled={loading}>
              <Text style={styles.resendText}>Didn't receive it? Resend code</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => setStep('email')}>
              <Text style={styles.backText}>Use different email</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'password' && (
          <View style={styles.form}>
            <Ionicons name="lock-closed-outline" size={64} color="#6366f1" style={styles.stepIcon} />
            <Text style={styles.stepTitle}>Create Password</Text>
            <Text style={styles.stepSubtitle}>
              Choose a strong password to protect your account
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            {/* Password strength indicator */}
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBars}>
                {[0, 1, 2, 3].map((index) => (
                  <View 
                    key={index}
                    style={[
                      styles.strengthBar,
                      index < passwordStrength && { backgroundColor: strengthColors[passwordStrength - 1] }
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthText, { color: strengthColors[passwordStrength - 1] || '#e5e7eb' }]}>
                {password ? strengthLabels[passwordStrength - 1] || 'Too weak' : 'Enter password'}
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={completeSignUp}
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  form: {
    gap: 16,
  },
  stepIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  termsText: {
    fontSize: 14,
    color: '#4b5563',
    flex: 1,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '500',
  },
  resendButton: {
    alignItems: 'center',
    padding: 12,
  },
  resendText: {
    color: '#6366f1',
    fontSize: 14,
  },
  backButton: {
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#6b7280',
    fontSize: 14,
  },
  strengthContainer: {
    marginBottom: 8,
  },
  strengthBars: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
