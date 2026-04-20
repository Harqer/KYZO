import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProtectionSetting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

export default function BotProtectionSettings() {
  const [settings, setSettings] = useState<ProtectionSetting[]>([
    {
      id: 'fingerprinting',
      title: 'Device Fingerprinting',
      description: 'Analyze device and network characteristics to identify automated access',
      enabled: true,
      icon: 'finger-print',
    },
    {
      id: 'captcha',
      title: 'Invisible CAPTCHA',
      description: 'Cloudflare Turnstile protection that only appears when suspicious activity is detected',
      enabled: true,
      icon: 'shield-checkmark',
    },
    {
      id: 'rateLimiting',
      title: 'Rate Limiting',
      description: 'Limit sign-up attempts per IP address to prevent abuse',
      enabled: true,
      icon: 'timer',
    },
    {
      id: 'disposableEmail',
      title: 'Disposable Email Detection',
      description: 'Block sign-ups from known disposable email providers',
      enabled: true,
      icon: 'mail',
    },
    {
      id: 'botDetection',
      title: 'Advanced Bot Detection',
      description: 'Machine learning-based bot detection and prevention',
      enabled: true,
      icon: 'analytics',
    },
    {
      id: 'ipBlocking',
      title: 'IP Blocking',
      description: 'Block known malicious IP addresses and VPNs',
      enabled: false,
      icon: 'ban',
    },
  ]);

  const toggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id 
          ? { ...setting, enabled: !setting.enabled }
          : setting
      )
    );
  };

  const showProtectionInfo = (setting: ProtectionSetting) => {
    Alert.alert(
      setting.title,
      `${setting.description}\n\nThis feature helps protect your application from automated attacks and abuse attempts.`,
      [{ text: 'OK' }]
    );
  };

  const handleSaveSettings = () => {
    const enabledFeatures = settings.filter(s => s.enabled).map(s => s.title);
    Alert.alert(
      'Settings Saved',
      `Protection features enabled:\n\n${enabledFeatures.join('\n')}`,
      [{ text: 'OK' }]
    );
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? '#34C759' : '#FF3B30';
  };

  const getStatusText = (enabled: boolean) => {
    return enabled ? 'Active' : 'Disabled';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bot Protection & Abuse Prevention</Text>
        <Text style={styles.subtitle}>
          Configure security settings to protect against automated attacks and abuse
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons name="shield-checkmark" size={24} color="#34C759" />
            <Text style={styles.statusTitle}>Protection Status</Text>
          </View>
          <Text style={styles.statusDescription}>
            {settings.filter(s => s.enabled).length} of {settings.length} features active
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(settings.filter(s => s.enabled).length / settings.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Features</Text>
          
          {settings.map((setting) => (
            <View key={setting.id} style={styles.settingCard}>
              <TouchableOpacity 
                style={styles.settingHeader}
                onPress={() => showProtectionInfo(setting)}
              >
                <View style={styles.settingInfo}>
                  <Ionicons 
                    name={setting.icon} 
                    size={20} 
                    color={getStatusColor(setting.enabled)} 
                  />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>{setting.title}</Text>
                    <Text style={styles.settingDescription}>{setting.description}</Text>
                  </View>
                </View>
                <View style={styles.settingStatus}>
                  <Text style={[styles.statusText, { color: getStatusColor(setting.enabled) }]}>
                    {getStatusText(setting.enabled)}
                  </Text>
                  <Ionicons name="information-circle-outline" size={16} color="#999" />
                </View>
              </TouchableOpacity>
              
              <View style={styles.settingControl}>
                <Text style={styles.controlLabel}>Enable Feature</Text>
                <Switch
                  value={setting.enabled}
                  onValueChange={() => toggleSetting(setting.id)}
                  trackColor={{ false: '#E5E5E7', true: '#34C759' }}
                  thumbColor={setting.enabled ? '#fff' : '#fff'}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced Options</Text>
          
          <TouchableOpacity style={styles.advancedOption}>
            <Ionicons name="settings" size={20} color="#007AFF" />
            <Text style={styles.advancedOptionText}>Custom Protection Rules</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.advancedOption}>
            <Ionicons name="list" size={20} color="#007AFF" />
            <Text style={styles.advancedOptionText}>Blocked IPs & Domains</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.advancedOption}>
            <Ionicons name="analytics" size={20} color="#007AFF" />
            <Text style={styles.advancedOptionText}>Security Analytics</Text>
            <Ionicons name="chevron-forward" size={16} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.saveButtonText}>Save Protection Settings</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    color: '#000',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5E7',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#000',
  },
  settingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  settingStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  controlLabel: {
    fontSize: 14,
    color: '#666',
  },
  advancedOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  advancedOptionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  buttonIcon: {
    marginRight: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
