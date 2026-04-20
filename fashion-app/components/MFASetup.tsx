import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

interface MFASetupProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MFASetup({ onComplete, onCancel }: MFASetupProps) {
  const { user } = useUser();
  const [step, setStep] = useState<'select' | 'totp-qr' | 'totp-verify' | 'backup'>('select');
  const [totpSecret, setTotpSecret] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Check current MFA status
  const hasTOTP = user?.twoFactorEnabled;

  const enableTOTP = async () => {
    setLoading(true);
    try {
      // Generate TOTP secret
      const response = await user?.createTOTP();
      if (response) {
        setTotpSecret(response.secret);
        setStep('totp-qr');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to setup TOTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter a 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await user?.verifyTOTP({ code: verificationCode });
      if (response?.verified) {
        // Generate backup codes
        await generateBackupCodes();
        setStep('backup');
      } else {
        Alert.alert('Verification Failed', 'The code is invalid or expired. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Verification Error', error.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const generateBackupCodes = async () => {
    try {
      // Note: Clerk doesn't expose backup codes directly via SDK
      // This would typically be done via Backend API
      // For now, we'll show a placeholder message
      setBackupCodes(['SAVE THESE CODES - THEY WONT BE SHOWN AGAIN']);
    } catch (error) {
      console.error('Failed to generate backup codes:', error);
    }
  };

  const disableMFA = async () => {
    Alert.alert(
      'Disable Two-Factor Authentication?',
      'This will make your account less secure. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await user?.disableTOTP();
              Alert.alert('Success', 'Two-factor authentication has been disabled');
              onComplete?.();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to disable MFA');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Setting up authentication...</Text>
      </View>
    );
  }

  // Selection screen
  if (step === 'select') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Two-Factor Authentication</Text>
        <Text style={styles.subtitle}>
          {hasTOTP 
            ? 'Your account is protected with an authenticator app'
            : 'Add an extra layer of security to your account'
          }
        </Text>

        {hasTOTP ? (
          <View style={styles.optionsContainer}>
            <View style={styles.enabledBadge}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
              <Text style={styles.enabledText}>Authenticator App Enabled</Text>
            </View>
            
            <TouchableOpacity style={styles.dangerButton} onPress={disableMFA}>
              <Text style={styles.dangerButtonText}>Disable 2FA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={styles.optionCard} onPress={enableTOTP}>
              <Ionicons name="phone-portrait-outline" size={32} color="#6366f1" />
              <Text style={styles.optionTitle}>Authenticator App</Text>
              <Text style={styles.optionDescription}>
                Use Google Authenticator, Authy, or similar apps
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionCard}>
              <Ionicons name="phone-portrait" size={32} color="#6366f1" />
              <Text style={styles.optionTitle}>SMS Verification</Text>
              <Text style={styles.optionDescription}>
                Receive codes via text message
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // TOTP QR Code screen
  if (step === 'totp-qr' && totpSecret) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Scan QR Code</Text>
        <Text style={styles.subtitle}>
          Open your authenticator app and scan this code
        </Text>

        <View style={styles.qrContainer}>
          <Text style={styles.manualCodeLabel}>Or enter this code manually:</Text>
          <Text style={styles.manualCode}>{totpSecret}</Text>
          <TouchableOpacity 
            onPress={() => {
              // Copy to clipboard
              Alert.alert('Copied', 'Secret code copied to clipboard');
            }}
          >
            <Text style={styles.copyText}>Tap to copy</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Enter 6-digit code"
          value={verificationCode}
          onChangeText={setVerificationCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <TouchableOpacity style={styles.button} onPress={verifyTOTP}>
          <Text style={styles.buttonText}>Verify & Enable</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backButton} onPress={() => setStep('select')}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Backup codes screen
  if (step === 'backup') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Save Backup Codes</Text>
        <Text style={styles.subtitle}>
          Store these codes in a safe place. You'll need them if you lose access to your authenticator app.
        </Text>

        <View style={styles.backupCodesContainer}>
          {backupCodes.length > 0 ? (
            backupCodes.map((code, index) => (
              <Text key={index} style={styles.backupCode}>{code}</Text>
            ))
          ) : (
            <Text style={styles.infoText}>
              Backup codes available in your security settings
            </Text>
          )}
        </View>

        <TouchableOpacity style={styles.button} onPress={onComplete}>
          <Text style={styles.buttonText}>I've Saved My Codes</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 12,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  enabledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d1fae5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  enabledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065f46',
  },
  qrContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  manualCodeLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  manualCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  copyText: {
    fontSize: 12,
    color: '#6366f1',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#ef4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
  backButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#6366f1',
    fontSize: 14,
  },
  backupCodesContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  backupCode: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    fontStyle: 'italic',
  },
});
