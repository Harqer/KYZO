import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
  active: boolean;
}

export default function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'pk_live_...masked...',
      createdAt: '2024-01-15',
      lastUsed: '2024-04-18',
      permissions: ['read', 'write'],
      active: true,
    },
    {
      id: '2', 
      name: 'Development API Key',
      key: 'pk_test_...masked...',
      createdAt: '2024-02-20',
      lastUsed: '2024-04-17',
      permissions: ['read', 'write'],
      active: true,
    },
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(['read']);

  const permissions = [
    { id: 'read', label: 'Read Access', description: 'View data and resources' },
    { id: 'write', label: 'Write Access', description: 'Create and modify data' },
    { id: 'delete', label: 'Delete Access', description: 'Remove data and resources' },
    { id: 'admin', label: 'Admin Access', description: 'Full administrative control' },
  ];

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const createAPIKey = () => {
    if (!newKeyName.trim()) {
      Alert.alert('Error', 'Please enter a name for the API key');
      return;
    }

    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `pk_${Date.now() % 2 === 0 ? 'live' : 'test'}_${Math.random().toString(36).substr(2, 9)}...masked...`,
      createdAt: new Date().toISOString().split('T')[0],
      permissions: selectedPermissions,
      active: true,
    };

    setApiKeys(prev => [newKey, ...prev]);
    setNewKeyName('');
    setSelectedPermissions(['read']);
    setShowCreateForm(false);

    Alert.alert(
      'API Key Created',
      `New API key "${newKeyName}" has been created. Save the key securely as it won't be shown again.`,
      [{ text: 'OK' }]
    );
  };

  const revokeAPIKey = (keyId: string) => {
    Alert.alert(
      'Revoke API Key',
      'Are you sure you want to revoke this API key? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: () => {
            setApiKeys(prev => prev.map(key => 
              key.id === keyId ? { ...key, active: false } : key
            ));
            Alert.alert('Success', 'API key has been revoked');
          },
        },
      ]
    );
  };

  const deleteAPIKey = (keyId: string) => {
    Alert.alert(
      'Delete API Key',
      'Are you sure you want to delete this API key? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setApiKeys(prev => prev.filter(key => key.id !== keyId));
            Alert.alert('Success', 'API key has been deleted');
          },
        },
      ]
    );
  };

  const showAPIKeyInfo = () => {
    Alert.alert(
      'API Key Management',
      'API keys allow machine-to-machine authentication:\n\n' +
      'Usage: 1,000 free key creations per month\n' +
      'Price: $0.001 per creation after free tier\n' +
      'Verification: 100,000 free per month\n' +
      'Price: $0.00001 per verification after free tier',
      [{ text: 'OK' }]
    );
  };

  const renderCreateForm = () => (
    <View style={styles.createForm}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>Create New API Key</Text>
        <TouchableOpacity onPress={() => setShowCreateForm(false)}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Key Name</Text>
        <TextInput
          style={styles.input}
          value={newKeyName}
          onChangeText={setNewKeyName}
          placeholder="Enter a descriptive name"
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Permissions</Text>
        {permissions.map(permission => (
          <TouchableOpacity
            key={permission.id}
            style={styles.permissionItem}
            onPress={() => togglePermission(permission.id)}
          >
            <View style={[styles.checkbox, selectedPermissions.includes(permission.id) && styles.checkboxChecked]}>
              {selectedPermissions.includes(permission.id) && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
            <View style={styles.permissionInfo}>
              <Text style={styles.permissionLabel}>{permission.label}</Text>
              <Text style={styles.permissionDescription}>{permission.description}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.createButton} onPress={createAPIKey}>
        <Ionicons name="key" size={20} color="#fff" style={styles.buttonIcon} />
        <Text style={styles.createButtonText}>Create API Key</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Key Management</Text>
        <TouchableOpacity onPress={showAPIKeyInfo}>
          <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{apiKeys.length}</Text>
            <Text style={styles.statLabel}>Total Keys</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{apiKeys.filter(k => k.active).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{apiKeys.filter(k => !k.active).length}</Text>
            <Text style={styles.statLabel}>Revoked</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.createKeyButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Ionicons name="add-circle" size={20} color="#007AFF" />
          <Text style={styles.createKeyButtonText}>Create New API Key</Text>
        </TouchableOpacity>

        {apiKeys.map(key => (
          <View key={key.id} style={styles.keyCard}>
            <View style={styles.keyHeader}>
              <View style={styles.keyInfo}>
                <Text style={styles.keyName}>{key.name}</Text>
                <Text style={styles.keyValue}>{key.key}</Text>
              </View>
              <View style={[styles.statusBadge, { 
                backgroundColor: key.active ? '#34C759' : '#FF3B30' 
              }]}>
                <Text style={styles.statusText}>
                  {key.active ? 'Active' : 'Revoked'}
                </Text>
              </View>
            </View>

            <View style={styles.keyDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.detailText}>Created: {key.createdAt}</Text>
              </View>
              {key.lastUsed && (
                <View style={styles.detailItem}>
                  <Ionicons name="time" size={16} color="#666" />
                  <Text style={styles.detailText}>Last used: {key.lastUsed}</Text>
                </View>
              )}
              <View style={styles.detailItem}>
                <Ionicons name="key" size={16} color="#666" />
                <Text style={styles.detailText}>
                  Permissions: {key.permissions.join(', ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.keyActions}>
              {key.active && (
                <TouchableOpacity 
                  style={[styles.actionButton, styles.revokeButton]}
                  onPress={() => revokeAPIKey(key.id)}
                >
                  <Ionicons name="pause-circle" size={16} color="#FF9500" />
                  <Text style={styles.revokeButtonText}>Revoke</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteAPIKey(key.id)}
              >
                <Ionicons name="trash" size={16} color="#FF3B30" />
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {showCreateForm && renderCreateForm()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  createKeyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
  },
  createKeyButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  keyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  keyValue: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  keyDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  keyActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  revokeButton: {
    backgroundColor: '#FFF3CD',
  },
  revokeButtonText: {
    color: '#FF9500',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  createForm: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    padding: 20,
    zIndex: 1000,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  permissionDescription: {
    fontSize: 12,
    color: '#666',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
