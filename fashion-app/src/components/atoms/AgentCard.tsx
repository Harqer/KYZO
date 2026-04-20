/**
 * AgentCard - Atomic Component
 * Basic card component for displaying LangChain agent information
 * Can't be broken down further - fundamental UI building block
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  provider?: string;
  lastActive?: string;
  onPress?: () => void;
  onStatusPress?: () => void;
  style?: any;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  id,
  name,
  description,
  status,
  provider,
  lastActive,
  onPress,
  onStatusPress,
  style,
}) => {

  const getStatusColor = (): string => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'inactive':
        return '#6B7280';
      case 'error':
        return '#EF4444';
      case 'loading':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = (): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'error':
        return 'Error';
      case 'loading':
        return 'Loading';
      default:
        return 'Unknown';
    }
  };

  const formatLastActive = (date?: string): string => {
    if (!date) return 'Never';
    
    const now = new Date();
    const lastActive = new Date(date);
    const diffMs = now.getTime() - lastActive.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getBackgroundColor = (): string => {
    return status === 'active' ? '#1E40AF' : '#374151';
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.gradient, { backgroundColor: getBackgroundColor() }]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {name}
            </Text>
            {provider && (
              <Text style={styles.provider} numberOfLines={1}>
                {provider}
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}
            onPress={onStatusPress}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.statusText}>{getStatusText()}</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.lastActive}>
            Last active: {formatLastActive(lastActive)}
          </Text>
          <Text style={styles.agentId}>ID: {id.slice(0, 8)}...</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  provider: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastActive: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  agentId: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'monospace',
  },
});

export default AgentCard;
