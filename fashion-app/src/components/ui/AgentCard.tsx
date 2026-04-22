import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GlassCard } from '../atoms/GlassCard';
import { getResponsiveSpacing } from '../../constants/responsive';

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

export function AgentCard({
  id,
  name,
  description,
  status,
  provider,
  lastActive,
  onPress,
  onStatusPress,
  style
}: AgentCardProps) {
  
  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#10B981';
      case 'inactive': return '#6B7280';
      case 'error': return '#EF4444';
      case 'loading': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'inactive': return 'Inactive';
      case 'error': return 'Error';
      case 'loading': return 'Loading';
      default: return 'Unknown';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <GlassCard variant="card" style={[styles.card, style]}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.provider}>{provider}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}
            onPress={onStatusPress}
          >
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.description}>{description}</Text>
        
        {lastActive && (
          <Text style={styles.lastActive}>Last active: {lastActive}</Text>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: getResponsiveSpacing('md'),
  },
  
  card: {
    padding: getResponsiveSpacing('md'),
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  titleContainer: {
    flex: 1,
  },
  
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  
  provider: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  statusBadge: {
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  lastActive: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
