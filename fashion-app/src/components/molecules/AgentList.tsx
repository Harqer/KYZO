/**
 * AgentList - Molecular Component
 * Groups of atoms bonded together with distinct properties
 * Combines AgentCard atoms into a complete agent management interface
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AgentCard } from '../atoms/AgentCard';
import { AuthButton } from '../atoms/AuthButton';
import { useApiManager } from './ApiManager';

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  provider?: string;
  lastActive?: string;
}

interface AgentListProps {
  onAgentPress?: (agent: Agent) => void;
  onAgentStatusPress?: (agent: Agent) => void;
  onCreateAgent?: () => void;
  style?: any;
}

export const AgentList: React.FC<AgentListProps> = ({
  onAgentPress,
  onAgentStatusPress,
  onCreateAgent,
  style,
}) => {
  const {
    agents,
    loading,
    loadAgents,
    createAgent,
  } = useApiManager();

  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (agents.length === 0) {
      loadAgents();
    }
  }, [agents.length, loadAgents]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadAgents();
    } finally {
      setRefreshing(false);
    }
  };

  const handleAgentPress = (agent: Agent) => {
    onAgentPress?.(agent);
  };

  const handleAgentStatusPress = (agent: Agent) => {
    onAgentStatusPress?.(agent);
  };

  const handleCreateAgent = () => {
    onCreateAgent?.();
  };

  const getStats = () => {
    const activeCount = agents.filter((a: any) => a.status === 'active').length;
    const totalCount = agents.length;
    return { activeCount, totalCount };
  };

  const renderAgentCard = ({ item }: { item: Agent }) => (
    <AgentCard
      id={item.id}
      name={item.name}
      description={item.description}
      status={item.status}
      provider={item.provider}
      lastActive={item.lastActive}
      onPress={() => handleAgentPress(item)}
      onStatusPress={() => handleAgentStatusPress(item)}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>No Agents Yet</Text>
      <Text style={styles.emptyDescription}>
        Create your first AI agent to get started with fashion recommendations
      </Text>
      <AuthButton
        title="Create Agent"
        onPress={handleCreateAgent}
        variant="primary"
        size="medium"
        style={styles.createButton}
      />
    </View>
  );

  const stats = getStats();

  return (
    <SafeAreaView style={[styles.container, style]}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>AI Agents</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {stats.activeCount} of {stats.totalCount} active
            </Text>
          </View>
        </View>
        
        <AuthButton
          title="Create Agent"
          onPress={handleCreateAgent}
          variant="primary"
          size="small"
          style={styles.createButton}
        />
      </View>

      <FlatList
        data={agents}
        renderItem={renderAgentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
          />
        }
        ListEmptyComponent={loading ? null : renderEmptyState}
        ListHeaderComponent={
          loading ? null : (
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                Your AI fashion assistants
              </Text>
            </View>
          )
        }
        ListFooterComponent={loading ? (
          <View style={styles.loadingFooter}>
            <Text style={styles.loadingText}>Loading agents...</Text>
          </View>
        ) : agents.length > 0 ? (
          <View style={styles.listFooter}>
            <Text style={styles.footerText}>
              Swipe down to refresh
            </Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statsContainer: {
    marginTop: 4,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  createButton: {
    minWidth: 100,
  },
  listContent: {
    paddingVertical: 8,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listHeaderText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default AgentList;
