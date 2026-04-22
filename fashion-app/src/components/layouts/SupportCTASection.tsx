import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Mail, MessageCircle } from 'lucide-react-native';
import { Button } from '@/src/components/base/Button';
import { Heading } from '@/src/components/base/Heading';

export function SupportCTASection() {
  return (
    <View style={styles.container}>
      <Heading level={2} align="center" color="#ffffff">Need Help?</Heading>
      <Text style={styles.description}>
        Our support team is here to assist you with any questions or concerns
      </Text>
      
      <View style={styles.buttons}>
        <Button 
          variant="secondary" 
          icon={<Mail size={20} color="#6366f1" />}
          onPress={() => window.open('/support', '_self')}
        >
          Contact Support
        </Button>
        
        <Button 
          variant="secondary" 
          icon={<MessageCircle size={20} color="#6366f1" />}
          onPress={() => {}}
        >
          Live Chat
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#6366f1',
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  description: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    maxWidth: 500,
  },
  buttons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
