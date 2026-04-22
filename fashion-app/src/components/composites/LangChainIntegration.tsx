/**
 * LangChainIntegration - Organism Component
 * Complex component combining molecular components
 * Complete LangChain integration experience with authentication and agent management
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import AuthFlow from './AuthFlow';
import AgentList from './AgentList';
import { useApiManager } from './ApiManager';

// Define Agent interface locally since it's not exported
interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  provider?: string;
  lastActive?: string;
}

interface LangChainIntegrationProps {
  onIntegrationComplete?: () => void;
  style?: any;
}

interface AuthState {
  isAuthenticated: boolean;
  provider: string | null;
  token: string | null;
  user: any | null;
}

export const LangChainIntegration: React.FC<LangChainIntegrationProps> = ({
  onIntegrationComplete,
  style,
}) => {
  const [currentView, setCurrentView] = useState<'auth' | 'agents'>('auth');
  
  const {
    isAuthenticated,
    user,
    agents,
    loading,
    error,
    authenticate,
    signOut,
    loadAgents,
    createAgent,
    selectAgent,
    clearError,
  } = useApiManager();

  useEffect(() => {
    if (isAuthenticated && agents.length === 0) {
      loadAgents();
    }
  }, [isAuthenticated, agents.length, loadAgents]);

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('agents');
      onIntegrationComplete?.();
    } else {
      setCurrentView('auth');
    }
  }, [isAuthenticated, onIntegrationComplete]);

  const handleAuthSuccess = async (provider: string, token: string) => {
    try {
      await authenticate(provider, token);
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  const handleAuthError = (error: string) => {
    console.error('Auth error:', error);
    clearError();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleAgentPress = (agent: Agent) => {
    // Navigate to agent details
    console.log('Agent pressed:', agent);
    Alert.alert('Agent Details', `Selected: ${agent.name}\nStatus: ${agent.status}`);
  };

  const handleAgentStatusPress = (agent: Agent) => {
    // Toggle agent status
    console.log('Agent status pressed:', agent);
    Alert.alert('Agent Status', `Toggle status for: ${agent.name}`);
  };

  const handleCreateAgent = () => {
    // Navigate to agent creation
    console.log('Create agent pressed');
    Alert.alert('Create Agent', 'Navigate to agent creation screen');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'auth':
        return (
          <AuthFlow
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
            loading={loading}
          />
        );
      
      case 'agents':
        return (
          <AgentList
            onAgentPress={handleAgentPress}
            onAgentStatusPress={handleAgentStatusPress}
            onCreateAgent={handleCreateAgent}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar style="auto" />
      
      {isAuthenticated && (
        <View style={styles.authHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.providerText}>
              Signed in with {user?.email || 'Unknown'}
            </Text>
          </View>
          
          <View style={styles.authActions}>
            <TouchableOpacity onPress={handleSignOut}>
              <Text style={styles.signOutText}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <View style={styles.content}>
        {renderCurrentView()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  authHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  providerText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  authActions: {
    alignItems: 'flex-end',
  },
  signOutText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
});

export default LangChainIntegration;
