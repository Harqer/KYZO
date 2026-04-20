/**
 * AuthFlow - Molecular Component
 * Groups of atoms bonded together with distinct properties
 * Combines AuthButton atoms into complete authentication flows
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthButton } from '../ui/AuthButton';

interface AuthFlowProps {
  onAuthSuccess?: (provider: string, token: string) => void;
  onAuthError?: (error: string) => void;
  loading?: boolean;
  style?: any;
}

interface ProviderConfig {
  id: string;
  name: string;
  icon?: React.ReactNode;
  description: string;
  color: string;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({
  onAuthSuccess,
  onAuthError,
  loading = false,
  style,
}) => {
  const [authLoading, setAuthLoading] = useState<string | null>(null);

  const providers: ProviderConfig[] = [
    {
      id: 'google',
      name: 'Google',
      description: 'Sign in with your Google account',
      color: '#4285F4',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Sign in with your GitHub account',
      color: '#24292E',
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      description: 'Sign in with your Microsoft account',
      color: '#0078D4',
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Sign in with your Slack workspace',
      color: '#4A154B',
    },
  ];

  const handleProviderAuth = async (providerId: string) => {
    try {
      setAuthLoading(providerId);
      
      // Simulate OAuth flow - in real app, this would open OAuth provider
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful authentication
      const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      setAuthLoading(null);
      onAuthSuccess?.(providerId, mockToken);
      
    } catch (error) {
      setAuthLoading(null);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      onAuthError?.(errorMessage);
      
      Alert.alert('Authentication Error', errorMessage);
    }
  };

  const handleGuestAccess = () => {
    // Allow guest access without authentication
    onAuthSuccess?.('guest', 'guest_token');
  };

  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar style="auto" />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Fashion LangChain</Text>
          <Text style={styles.subtitle}>
            Connect your AI agents and unlock powerful fashion insights
          </Text>
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Sign in with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.providersContainer}>
          {providers.map((provider) => (
            <View key={provider.id} style={styles.providerItem}>
              <AuthButton
                title={`Continue with ${provider.name}`}
                onPress={() => handleProviderAuth(provider.id)}
                variant="primary"
                size="large"
                loading={authLoading === provider.id}
                provider={provider.id as any}
                style={styles.providerButton}
              />
              <Text style={styles.providerDescription}>
                {provider.description}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.guestSection}>
          <View style={styles.guestDivider}>
            <View style={styles.guestDividerLine} />
            <Text style={styles.guestDividerText}>or</Text>
            <View style={styles.guestDividerLine} />
          </View>
          
          <AuthButton
            title="Continue as Guest"
            onPress={handleGuestAccess}
            variant="outline"
            size="large"
            style={styles.guestButton}
          />
          
          <Text style={styles.guestDescription}>
            Try the app with limited features
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  providersContainer: {
    gap: 16,
  },
  providerItem: {
    gap: 8,
  },
  providerButton: {
    width: '100%',
  },
  providerDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  guestSection: {
    marginTop: 32,
    gap: 16,
  },
  guestDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  guestDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  guestDividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  guestButton: {
    width: '100%',
  },
  guestDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default AuthFlow;
