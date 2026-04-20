import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Sparkles, Smartphone, Shield, Zap, ArrowRight, Mail, MessageCircle } from 'lucide-react-native';
import { Link } from 'expo-router';

export default function LandingPage() {
  const features = [
    {
      icon: <Sparkles size={32} color="#6366f1" />,
      title: 'AI-Powered Discovery',
      description: 'Our advanced AI learns your style preferences and curates personalized fashion recommendations just for you.',
    },
    {
      icon: <Smartphone size={32} color="#6366f1" />,
      title: 'Mobile First',
      description: 'Take KYZO with you everywhere. Available on iOS and Android for fashion discovery on the go.',
    },
    {
      icon: <Shield size={32} color="#6366f1" />,
      title: 'Privacy Focused',
      description: 'Your data is encrypted and secure. We never share your personal information with third parties.',
    },
    {
      icon: <Zap size={32} color="#6366f1" />,
      title: 'Instant Recommendations',
      description: 'Get real-time fashion suggestions powered by Claude AI and LangChain technology.',
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.heroContent}>
          <Text style={styles.badge}>✨ AI-POWERED FASHION</Text>
          <Text style={styles.heroTitle}>Discover Your Style with KYZO</Text>
          <Text style={styles.heroSubtitle}>
            The future of fashion discovery is here. Let our AI find the perfect pieces 
            that match your unique taste and style preferences.
          </Text>
          
          <View style={styles.ctaButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Download the App</Text>
              <ArrowRight size={20} color="#ffffff" />
            </TouchableOpacity>
            
            <Link href="/support" asChild>
              <TouchableOpacity style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Contact Support</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>50K+</Text>
          <Text style={styles.statLabel}>Active Users</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>1M+</Text>
          <Text style={styles.statLabel}>Items Recommended</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>4.9</Text>
          <Text style={styles.statLabel}>App Store Rating</Text>
        </View>
      </View>

      {/* Features Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Choose KYZO?</Text>
        <Text style={styles.sectionSubtitle}>
          Experience fashion discovery like never before
        </Text>
        
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>{feature.icon}</View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* How It Works */}
      <View style={[styles.section, styles.howItWorksSection]}>
        <Text style={styles.sectionTitle}>How KYZO Works</Text>
        
        <View style={styles.stepsContainer}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Create Your Profile</Text>
            <Text style={styles.stepDescription}>
              Sign up and tell us about your style preferences
            </Text>
          </View>
          
          <View style={styles.stepConnector} />
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepTitle}>AI Analysis</Text>
            <Text style={styles.stepDescription}>
              Our AI learns your unique fashion taste
            </Text>
          </View>
          
          <View style={styles.stepConnector} />
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepTitle}>Get Recommendations</Text>
            <Text style={styles.stepDescription}>
              Receive personalized fashion suggestions
            </Text>
          </View>
        </View>
      </View>

      {/* Support CTA Section */}
      <View style={styles.supportSection}>
        <Text style={styles.supportTitle}>Need Help?</Text>
        <Text style={styles.supportDescription}>
          Our support team is here to assist you with any questions or concerns
        </Text>
        
        <View style={styles.supportButtons}>
          <Link href="/support" asChild>
            <TouchableOpacity style={styles.supportButton}>
              <Mail size={20} color="#6366f1" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
          </Link>
          
          <TouchableOpacity style={styles.supportButton}>
            <MessageCircle size={20} color="#6366f1" />
            <Text style={styles.supportButtonText}>Live Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Download CTA */}
      <View style={styles.downloadSection}>
        <Text style={styles.downloadTitle}>Get KYZO Today</Text>
        <Text style={styles.downloadDescription}>
          Download the app and start your AI-powered fashion journey
        </Text>
        
        <View style={styles.storeButtons}>
          <TouchableOpacity style={styles.storeButton}>
            <Text style={styles.storeButtonTitle}>App Store</Text>
            <Text style={styles.storeButtonSubtitle}>Download on iOS</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.storeButton}>
            <Text style={styles.storeButtonTitle}>Google Play</Text>
            <Text style={styles.storeButtonSubtitle}>Download on Android</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>KYZO</Text>
        <Text style={styles.footerTagline}>AI-Powered Fashion Discovery</Text>
        
        <View style={styles.footerLinks}>
          <Link href="/support" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Support</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity onPress={() => window.open('/privacy', '_blank')}>
            <Text style={styles.footerLink}>Privacy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => window.open('/terms', '_blank')}>
            <Text style={styles.footerLink}>Terms</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.footerCopyright}>
          © 2026 KYZO. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  hero: {
    backgroundColor: '#6366f1',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  heroContent: {
    maxWidth: 800,
    alignSelf: 'center',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#e0e7ff',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 28,
    maxWidth: 600,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#f9fafb',
    gap: 40,
    flexWrap: 'wrap',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
  section: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 48,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  featureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    width: '45%',
    minWidth: 280,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  featureIcon: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  howItWorksSection: {
    backgroundColor: '#f9fafb',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 24,
    flexWrap: 'wrap',
    marginTop: 32,
  },
  step: {
    alignItems: 'center',
    width: 200,
  },
  stepNumber: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginTop: 24,
  },
  supportSection: {
    backgroundColor: '#6366f1',
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 16,
    color: '#e0e7ff',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 500,
  },
  supportButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  supportButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supportButtonText: {
    color: '#6366f1',
    fontSize: 16,
    fontWeight: '600',
  },
  downloadSection: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  downloadTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  downloadDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 500,
  },
  storeButtons: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  storeButton: {
    backgroundColor: '#1f2937',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    minWidth: 180,
    alignItems: 'center',
  },
  storeButtonTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  storeButtonSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    backgroundColor: '#1f2937',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  footerLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  footerTagline: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
  },
  footerLinks: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  footerLink: {
    color: '#6366f1',
    fontSize: 14,
  },
  footerCopyright: {
    color: '#6b7280',
    fontSize: 12,
  },
});
