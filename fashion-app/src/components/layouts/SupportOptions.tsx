import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Mail, MessageCircle, FileText, Shield } from 'lucide-react-native';
import { SupportCard } from '../features/SupportCard';

interface SupportOption {
  icon: React.ReactNode;
  title: string;
  description: string;
  action: () => void;
}

export function SupportOptions() {
  const options: SupportOption[] = [
    {
      icon: <Mail size={24} color="#6366f1" />,
      title: 'Email Support',
      description: 'support@kyzo.com',
      action: () => window.open('mailto:support@kyzo.com'),
    },
    {
      icon: <MessageCircle size={24} color="#6366f1" />,
      title: 'Live Chat',
      description: 'Available 9AM-6PM EST',
      action: () => Alert.alert('Coming Soon', 'Live chat will be available soon!'),
    },
    {
      icon: <FileText size={24} color="#6366f1" />,
      title: 'Documentation',
      description: 'Read our help center',
      action: () => window.open('https://docs.kyzo.com', '_blank'),
    },
    {
      icon: <Shield size={24} color="#6366f1" />,
      title: 'Privacy & Security',
      description: 'View our policies',
      action: () => window.open('/privacy', '_blank'),
    },
  ];

  return (
    <View style={styles.container}>
      {options.map((option, index) => (
        <SupportCard
          key={index}
          icon={option.icon}
          title={option.title}
          description={option.description}
          onPress={option.action}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
});
