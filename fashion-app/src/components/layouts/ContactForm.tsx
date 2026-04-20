import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Send } from 'lucide-react-native';
import { Card } from '../elements/Card';
import { Button } from '../elements/Button';
import { FormField } from '../features/FormField';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.message) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      Alert.alert(
        'Message Sent',
        'Thank you for contacting KYZO support. We will get back to you within 24 hours.',
        [{ text: 'OK' }]
      );
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  const updateField = (field: string) => (text: string) => {
    setFormData(prev => ({ ...prev, [field]: text }));
  };

  return (
    <Card variant="elevated" padding="lg" style={styles.container}>
      <FormField
        label="Name"
        required
        placeholder="Your name"
        value={formData.name}
        onChangeText={updateField('name')}
      />

      <FormField
        label="Email"
        required
        placeholder="your@email.com"
        value={formData.email}
        onChangeText={updateField('email')}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <FormField
        label="Subject"
        placeholder="What's this about?"
        value={formData.subject}
        onChangeText={updateField('subject')}
      />

      <FormField
        label="Message"
        required
        placeholder="Tell us how we can help you..."
        value={formData.message}
        onChangeText={updateField('message')}
        multiline
        rows={4}
      />

      <Button
        onPress={handleSubmit}
        loading={isSubmitting}
        icon={<Send size={20} color="#ffffff" />}
      >
        Send Message
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 600,
  },
});
