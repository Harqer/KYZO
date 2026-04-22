import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useOrganization, useUser, useOrganizationList } from '@clerk/expo';
import { Ionicons } from '@expo/vector-icons';

export default function OrganizationManager() {
  const { organization, isLoaded: orgLoaded } = useOrganization();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'settings'>('overview');

  if (!orgLoaded) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading organization data...</Text>
      </View>
    );
  }

  const handleCreateOrganization = () => {
    Alert.alert(
      'Create Organization',
      'To create an organization:\n\n1. Enable organizations in Clerk Dashboard\n2. Configure organization settings\n3. Use the organization creation flow',
      [{ text: 'OK' }]
    );
  };

  const handleInviteMember = () => {
    Alert.alert(
      'Invite Member',
      'Organization invitations require:\n\n1. Organization admin role\n2. Email addresses to invite\n3. Role assignments for new members',
      [{ text: 'OK' }]
    );
  };

  const renderOverview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Organization Overview</Text>
      
      <View style={styles.infoCard}>
        <Ionicons name="business" size={24} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Organization Name</Text>
          <Text style={styles.infoValue}>
            {organization?.name || 'No organization'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="people" size={24} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Your Role</Text>
          <Text style={styles.infoValue}>
            {organization ? 'Admin' : 'No Organization'}
          </Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="mail" size={24} color="#007AFF" />
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Organization Email</Text>
          <Text style={styles.infoValue}>
            {organization?.slug || 'Not set'}
          </Text>
        </View>
      </View>

      {!organization && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleCreateOrganization}
        >
          <Ionicons name="add-circle" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.actionButtonText}>Create Organization</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderMembers = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Team Members</Text>
        {organization && (
          <TouchableOpacity 
            style={styles.smallButton}
            onPress={handleInviteMember}
          >
            <Ionicons name="person-add" size={16} color="#007AFF" />
            <Text style={styles.smallButtonText}>Invite</Text>
          </TouchableOpacity>
        )}
      </View>

      {organization ? (
        <>
          <View style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>
                {user?.fullName || 'Current User'}
              </Text>
              <Text style={styles.memberEmail}>
                {user?.primaryEmailAddress?.emailAddress || 'No email'}
              </Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.roleText}>ADMIN</Text>
            </View>
          </View>
          <View style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Text style={styles.memberName}>Team Member</Text>
              <Text style={styles.memberEmail}>member@example.com</Text>
            </View>
            <View style={[styles.roleBadge, { backgroundColor: '#666' }]}>
              <Text style={styles.roleText}>MEMBER</Text>
            </View>
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>No organization found</Text>
      )}
    </View>
  );

  const renderSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Organization Settings</Text>
      
      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="shield-checkmark" size={20} color="#666" />
        <Text style={styles.settingText}>Security & Permissions</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="people" size={20} color="#666" />
        <Text style={styles.settingText}>Member Management</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="settings" size={20} color="#666" />
        <Text style={styles.settingText}>Organization Profile</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <Ionicons name="key" size={20} color="#666" />
        <Text style={styles.settingText}>API Keys & Integrations</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Organization Management</Text>
      
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'members' && styles.activeTab]}
          onPress={() => setActiveTab('members')}
        >
          <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
            Members
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'members' && renderMembers()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#fff',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  infoContent: {
    marginLeft: 15,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  smallButtonText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  settingText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#000',
  },
});
