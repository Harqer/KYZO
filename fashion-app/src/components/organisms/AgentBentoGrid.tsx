import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { GlassCard } from '../atoms/GlassCard';
import { getResponsiveSpacing, ScreenDimensions } from '../../constants/responsive';

interface AgentSuggestion {
  id: string;
  type: 'size' | 'discount' | 'style' | 'recommendation';
  title: string;
  subtitle: string;
  action?: string;
  onPress?: () => void;
  priority: 'low' | 'medium' | 'high';
}

interface AgentBentoGridProps {
  suggestions: AgentSuggestion[];
  onSuggestionPress?: (suggestion: AgentSuggestion) => void;
  onDismiss?: (suggestionId: string) => void;
  style?: any;
}

export function AgentBentoGrid({
  suggestions,
  onSuggestionPress,
  onDismiss,
  style
}: AgentBentoGridProps) {
  
  const renderSuggestionTile = (suggestion: AgentSuggestion, index: number) => {
    const getTileSize = () => {
      switch (suggestion.type) {
        case 'size':
          return { width: '48%', height: 120 }; // Small tile
        case 'discount':
          return { width: '48%', height: 140 }; // Medium tile
        case 'style':
          return { width: '100%', height: 100 }; // Wide tile
        case 'recommendation':
          return { width: '100%', height: 160 }; // Large tile
        default:
          return { width: '48%', height: 120 };
      }
    };

    const getPriorityColor = () => {
      switch (suggestion.priority) {
        case 'high':
          return 'rgba(239, 68, 68, 0.15)'; // Red tint
        case 'medium':
          return 'rgba(99, 102, 241, 0.15)'; // Indigo tint
        case 'low':
          return 'rgba(34, 197, 94, 0.15)'; // Green tint
        default:
          return 'rgba(99, 102, 241, 0.15)';
      }
    };

    const tileSize = getTileSize();
    const priorityColor = getPriorityColor();

    return (
      <TouchableOpacity
        key={suggestion.id}
        style={[
          styles.suggestionTile,
          tileSize,
          { marginRight: index % 2 === 0 ? getResponsiveSpacing('sm') : 0 }
        ]}
        onPress={() => onSuggestionPress?.(suggestion)}
        activeOpacity={0.8}
      >
        <GlassCard
          variant="agent"
          style={[
            styles.tileContent,
            { backgroundColor: priorityColor }
          ]}
        >
          <View style={styles.tileHeader}>
            <Text style={styles.tileType}>{suggestion.type.toUpperCase()}</Text>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => onDismiss?.(suggestion.id)}
            >
              <Text style={styles.dismissText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.tileTitle}>{suggestion.title}</Text>
          <Text style={styles.tileSubtitle}>{suggestion.subtitle}</Text>
          
          {suggestion.action && (
            <View style={styles.actionContainer}>
              <Text style={styles.actionText}>{suggestion.action}</Text>
            </View>
          )}
        </GlassCard>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, sectionSuggestions: AgentSuggestion[]) => (
    <View key={title} style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionGrid}>
        {sectionSuggestions.map((suggestion, index) => renderSuggestionTile(suggestion, index))}
      </View>
    </View>
  );

  // Group suggestions by priority
  const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
  const mediumPrioritySuggestions = suggestions.filter(s => s.priority === 'medium');
  const lowPrioritySuggestions = suggestions.filter(s => s.priority === 'low');

  return (
    <ScrollView
      style={[styles.container, style]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* AI Assistant Header */}
      <View style={styles.header}>
        <GlassCard variant="agent" style={styles.headerCard}>
          <Text style={styles.headerTitle}>AI Style Assistant</Text>
          <Text style={styles.headerSubtitle}>
            Personalized suggestions based on your preferences
          </Text>
        </GlassCard>
      </View>

      {/* High Priority Suggestions */}
      {highPrioritySuggestions.length > 0 && renderSection('Priority', highPrioritySuggestions)}
      
      {/* Medium Priority Suggestions */}
      {mediumPrioritySuggestions.length > 0 && renderSection('Recommended', mediumPrioritySuggestions)}
      
      {/* Low Priority Suggestions */}
      {lowPrioritySuggestions.length > 0 && renderSection('Explore', lowPrioritySuggestions)}

      {/* Empty State */}
      {suggestions.length === 0 && (
        <View style={styles.emptyState}>
          <GlassCard variant="agent" style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No suggestions yet</Text>
            <Text style={styles.emptySubtitle}>
              Browse more products to get personalized AI recommendations
            </Text>
          </GlassCard>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  contentContainer: {
    padding: getResponsiveSpacing('md'),
    gap: getResponsiveSpacing('lg'),
  },
  
  // Header
  header: {
    marginBottom: getResponsiveSpacing('md'),
  },
  
  headerCard: {
    padding: getResponsiveSpacing('lg'),
    alignItems: 'center',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  
  // Sections
  section: {
    marginBottom: getResponsiveSpacing('lg'),
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: getResponsiveSpacing('md'),
  },
  
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  // Suggestion Tiles
  suggestionTile: {
    marginBottom: getResponsiveSpacing('md'),
  },
  
  tileContent: {
    flex: 1,
    padding: getResponsiveSpacing('md'),
    justifyContent: 'space-between',
  },
  
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  tileType: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6366F1',
    letterSpacing: 0.5,
  },
  
  dismissButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  dismissText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  
  tileTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: getResponsiveSpacing('xs'),
    lineHeight: 18,
  },
  
  tileSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  actionContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: getResponsiveSpacing('sm'),
    paddingVertical: getResponsiveSpacing('xs'),
    borderRadius: 12,
  },
  
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6366F1',
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('xl'),
  },
  
  emptyCard: {
    padding: getResponsiveSpacing('xl'),
    alignItems: 'center',
    minWidth: '80%',
  },
  
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: getResponsiveSpacing('sm'),
  },
  
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
