import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

interface FooterProps {
  logo?: string;
  tagline?: string;
  links?: FooterLink[];
  copyright?: string;
}

export function Footer({
  logo = 'KYZO',
  tagline = 'AI-Powered Fashion Discovery',
  links = [
    { label: 'Support', href: '/support' },
    { label: 'Privacy', href: '/privacy', external: true },
    { label: 'Terms', href: '/terms', external: true },
  ],
  copyright = '© 2026 KYZO. All rights reserved.',
}: FooterProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>{logo}</Text>
      {tagline && <Text style={styles.tagline}>{tagline}</Text>}
      
      <View style={styles.links}>
        {links.map((link, index) => (
          link.external ? (
            <TouchableOpacity 
              key={index} 
              onPress={() => window.open(link.href, '_blank')}
            >
              <Text style={styles.link}>{link.label}</Text>
            </TouchableOpacity>
          ) : (
            <Link key={index} href={link.href as any}>
              <Text style={styles.link}>{link.label}</Text>
            </Link>
          )
        ))}
      </View>
      
      <Text style={styles.copyright}>{copyright}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1f2937',
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 24,
  },
  links: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  link: {
    color: '#6366f1',
    fontSize: 14,
  },
  copyright: {
    color: '#6b7280',
    fontSize: 12,
  },
});
