import * as LocalAuthentication from 'expo-local-authentication';

// Biometric authentication helper
export const authenticateWithBiometrics = async () => {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return { success: false, error: 'Device does not support biometric authentication' };
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) {
      return { success: false, error: 'No biometrics enrolled on this device' };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to continue',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
    });

    return { success: result.success, error: result.success ? null : 'Authentication failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
