import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Mail, MessageCircle, FileText, Shield, HelpCircle, Send } from 'lucide-react-native';

export default function SupportPage() {
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
    
    // In production, this would send to your backend or a third-party service
    // like Formspree, Typeform, or your own API endpoint
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

  const supportOptions = [
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
    <ScrollView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>KYZO</Text>
        <Text style={styles.tagline}>AI-Powered Fashion Discovery</Text>
      </View>

      {/* Support Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How Can We Help?</Text>
        <View style={styles.optionsGrid}>
          {supportOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionCard}
              onPress={option.action}
            >
              <View style={styles.iconContainer}>{option.icon}</View>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Contact Form */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Send Us a Message</Text>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Your name"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="your@email.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={formData.subject}
              onChangeText={(text) => setFormData({ ...formData, subject: text })}
              placeholder="What's this about?"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.message}
              onChangeText={(text) => setFormData({ ...formData, message: text })}
              placeholder="Tell us how we can help you..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Send size={20} color="#ffffff" />
            <Text style={styles.submitButtonText}>
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* FAQ Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.faqItem}>
          <View style={styles.faqHeader}>
            <HelpCircle size={20} color="#6366f1" />
            <Text style={styles.faqQuestion}>How does KYZO AI work?</Text>
          </View>
          <Text style={styles.faqAnswer}>
            KYZO uses advanced AI to analyze your style preferences and recommend 
            fashion items that match your unique taste. Simply create an account 
            and start discovering personalized recommendations.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <View style={styles.faqHeader}>
            <HelpCircle size={20} color="#6366f1" />
            <Text style={styles.faqQuestion}>Is my data secure?</Text>
          </View>
          <Text style={styles.faqAnswer}>
            Absolutely. We use enterprise-grade encryption and never share your 
            personal information with third parties. Your privacy is our priority.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <View style={styles.faqHeader}>
            <HelpCircle size={20} color="#6366f1" />
            <Text style={styles.faqQuestion}>How do I get the mobile app?</Text>
          </View>
          <Text style={styles.faqAnswer}>
            KYZO is available on the App Store and Google Play. Download it now 
            for the best AI fashion experience on your mobile device.
          </Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>KYZO</Text>
        <Text style={styles.footerText}>
          © 2026 KYZO. All rights reserved.{'\n'}
          AI-powered fashion discovery for everyone.
        </Text>
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={() => window.open('/privacy', '_blank')}>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>|</Text>
          <TouchableOpacity onPress={() => window.open('/terms', '_blank')}>
            <Text style={styles.footerLink}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    backgroundColor: '#6366f1',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
  },
  tagline: {
    fontSize: 16,
    color: '#e0e7ff',
    marginTop: 8,
    letterSpacing: 1,
  },
  section: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '45%',
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  faqItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  faqQuestion: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 22,
    paddingLeft: 32,
  },
  footer: {
    backgroundColor: '#1f2937',
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  footerLogo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  footerLink: {
    fontSize: 14,
    color: '#6366f1',
  },
  footerDivider: {
    color: '#6b7280',
  },
});
