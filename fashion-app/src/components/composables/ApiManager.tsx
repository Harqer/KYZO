/**
 * API Manager - Molecular Component
 * Groups of atoms bonded together with distinct properties
 * Simplified API service integration with state management
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import { apiService, ApiResponse, Agent, AuthResponse, ApiError } from '../../services/api';

// State interface
interface ApiManagerState {
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  user: any | null;
  agents: Agent[];
  selectedAgent: Agent | null;
}

// Context interface
interface ApiContextValue extends ApiManagerState {
  // Auth methods
  authenticate: (provider: string, code?: string) => Promise<AuthResponse>;
  signOut: () => void;
  
  // Agent methods
  loadAgents: () => Promise<void>;
  createAgent: (name: string, description: string, provider: string) => Promise<Agent>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<Agent>;
  deleteAgent: (id: string) => Promise<void>;
  selectAgent: (agent: Agent | null) => void;
  
  // Utility methods
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState: ApiManagerState = {
  loading: false,
  error: null,
  isAuthenticated: false,
  user: null,
  agents: [],
  selectedAgent: null,
};

// Create context
const ApiContext = createContext<ApiContextValue | null>(null);

// Provider component
interface ApiManagerProviderProps {
  children: ReactNode;
}

export const ApiManagerProvider: React.FC<ApiManagerProviderProps> = ({ children }) => {
  const [state, setState] = useState<ApiManagerState>(initialState);

  // Utility functions
  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Error handler
  const handleError = useCallback((error: any) => {
    console.error('API Error:', error);
    let errorMessage = 'An unexpected error occurred';

    if (error instanceof ApiError) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  }, [setError]);

  // Auth methods
  const authenticate = useCallback(async (provider: string, code?: string): Promise<AuthResponse> => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.authenticate(provider, code);

      if (response.success && response.data) {
        const authData = response.data;
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: authData.user || null,
          loading: false,
        }));
        return response.data;
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, handleError]);

  const signOut = useCallback(async () => {
    try {
      await apiService.clearAuthToken();
      setState({
        ...initialState,
      });
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  // Agent methods
  const loadAgents = useCallback(async () => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.getAgents();

      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          agents: response.data || [],
          loading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to load agents');
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, handleError]);

  const createAgent = useCallback(async (name: string, description: string, provider: string): Promise<Agent> => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.createAgent({ name, description, provider });

      if (response.success && response.data) {
        const newAgent = response.data;
        setState(prev => ({
          ...prev,
          agents: [...prev.agents, newAgent],
          loading: false,
        }));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create agent');
      }
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, handleError]);

  const updateAgent = useCallback(async (id: string, updates: Partial<Agent>): Promise<Agent> => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.updateAgent(id, updates);

      if (response.success && response.data) {
        const updatedAgent = response.data;
        setState(prev => ({
          ...prev,
          agents: prev.agents.map(agent =>
            agent.id === updatedAgent.id ? updatedAgent : agent
          ),
          selectedAgent: prev.selectedAgent?.id === updatedAgent.id
            ? updatedAgent
            : prev.selectedAgent,
          loading: false,
        }));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update agent');
      }
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, handleError]);

  const deleteAgent = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      clearError();

      const response = await apiService.deleteAgent(id);

      if (response.success) {
        setState(prev => ({
          ...prev,
          agents: prev.agents.filter(agent => agent.id !== id),
          selectedAgent: prev.selectedAgent?.id === id ? null : prev.selectedAgent,
          loading: false,
        }));
      } else {
        throw new Error(response.error || 'Failed to delete agent');
      }
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setLoading, clearError, handleError]);

  const selectAgent = useCallback((agent: Agent | null) => {
    setState(prev => ({
      ...prev,
      selectedAgent: agent,
    }));
  }, []);

  // Context value
  const contextValue: ApiContextValue = {
    ...state,
    authenticate,
    signOut,
    loadAgents,
    createAgent,
    updateAgent,
    deleteAgent,
    selectAgent,
    clearError,
    setLoading,
  };

  return (
    <ApiContext.Provider value={contextValue}>
      {children}
    </ApiContext.Provider>
  );
};

// Hook to use API context
export const useApiManager = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApiManager must be used within an ApiManagerProvider');
  }
  return context;
};

export default ApiManagerProvider;
