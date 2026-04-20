import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

interface MagicLinkAuthProps {
  onSuccess?: () => void;
}

export function MagicLinkAuth({ onSuccess }: MagicLinkAuthProps) {
  const { signIn } = useSignIn();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const sendMagicLink = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      // Prepare email link sign-in
      await signIn?.create({
        strategy: 'email_link',
        identifier: email,
      });

      setEmailSent(true);
      setResendTimer(60); // 60 second cooldown
      
      // Start countdown
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      Alert.alert(
        'Check Your Email',
        `We've sent a magic link to ${email}. Tap the link to sign in.`,
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      console.error('Magic link error:', error);
      
      // Handle specific errors
      if (error.errors?.[0]?.code === 'form_identifier_not_found') {
        Alert.alert(
          'Account Not Found',
          'No account found with this email. Would you like to create one?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign Up', onPress: () => onSuccess?.() }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to send magic link');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendLink = () => {
    if (resendTimer === 0) {
      sendMagicLink();
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="mail-outline" size={48} color="#6366f1" style={styles.icon} />
      
      <Text style={styles.title}>
        {emailSent ? 'Check Your Email' : 'Sign in with Magic Link'}
      </Text>
      
      <Text style={styles.subtitle}>
        {emailSent 
          ? `We've sent a secure link to ${email}. Click the link in your email to sign in instantly.`
          : 'Enter your email and we\'ll send you a secure link to sign in without a password.'
        }
      </Text>

      {!emailSent ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="your@email.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={sendMagicLink}
            disabled={loading || !email}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Magic Link</Text>
            )}
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.emailSentContainer}>
            <View style={styles.checkIcon}>
              <Ionicons name="checkmark-circle" size={48} color="#10b981" />
            </View>
            <Text style={styles.emailSentText}>Link sent to {email}</Text>
          </View>

          <TouchableOpacity 
            style={[styles.resendButton, resendTimer > 0 && styles.resendButtonDisabled]}
            onPress={resendLink}
            disabled={resendTimer > 0}
          >
            <Text style={[styles.resendButtonText, resendTimer > 0 && styles.resendButtonTextDisabled]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Link'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.changeEmailButton} onPress={() => setEmailSent(false)}>
            <Text style={styles.changeEmailText}>Use a different email</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.hintContainer}>
        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
        <Text style={styles.hintText}>
          Magic links expire in 10 minutes and can only be used once.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 24,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
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
  emailSentContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  checkIcon: {
    marginBottom: 12,
  },
  emailSentText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  resendButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#6366f1',
    marginBottom: 12,
  },
  resendButtonDisabled: {
    borderColor: '#e5e7eb',
  },
  resendButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#9ca3af',
  },
  changeEmailButton: {
    padding: 8,
  },
  changeEmailText: {
    color: '#6366f1',
    fontSize: 14,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#6b7280',
    flex: 1,
    lineHeight: 16,
  },
});
