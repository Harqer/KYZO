import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface Offer {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  variant: 'primary' | 'secondary';
  onPress?: () => void;
}

interface SpecialOffersProps {
  offers: Offer[];
  style?: any;
}

export function SpecialOffers({ offers, style }: SpecialOffersProps) {
  
  const renderOffer = (offer: Offer) => {
    const isPrimary = offer.variant === 'primary';
    
    return (
      <View key={offer.id} style={[styles.offerCard, isPrimary ? styles.offerCardPrimary : styles.offerCardSecondary]}>
        <Text style={[styles.offerTitle, isPrimary ? styles.offerTitlePrimary : styles.offerTitleSecondary]}>
          {offer.title}
        </Text>
        <Text style={[styles.offerSubtitle, isPrimary ? styles.offerSubtitlePrimary : styles.offerSubtitleSecondary]}>
          {offer.subtitle}
        </Text>
        <Text style={[styles.offerDescription, isPrimary ? styles.offerDescriptionPrimary : styles.offerDescriptionSecondary]}>
          {offer.description}
        </Text>
        <TouchableOpacity 
          style={[styles.offerButton, isPrimary ? styles.offerButtonPrimary : styles.offerButtonSecondary]}
          onPress={offer.onPress}
        >
          <Text style={[styles.offerButtonText, isPrimary ? styles.offerButtonTextPrimary : styles.offerButtonTextSecondary]}>
            {offer.buttonText}
          </Text>
          <ChevronRight 
            size={16} 
            color={isPrimary ? '#FFFFFF' : '#6366F1'} 
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <View style={[styles.container, style]}>
      {offers.map(renderOffer)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: getResponsiveSpacing('md'),
  },
  
  offerCard: {
    borderRadius: 12,
    padding: getResponsiveSpacing('lg'),
    position: 'relative',
    overflow: 'hidden',
  },
  
  offerCardPrimary: {
    backgroundColor: '#1F2937',
  },
  
  offerCardSecondary: {
    backgroundColor: '#F3F4F6',
  },
  
  offerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  offerTitlePrimary: {
    color: '#FFFFFF',
  },
  
  offerTitleSecondary: {
    color: '#1F2937',
  },
  
  offerSubtitle: {
    fontSize: 14,
    marginBottom: getResponsiveSpacing('xs'),
  },
  
  offerSubtitlePrimary: {
    color: '#F3F4F6',
  },
  
  offerSubtitleSecondary: {
    color: '#6B7280',
  },
  
  offerDescription: {
    fontSize: 12,
    marginBottom: getResponsiveSpacing('md'),
  },
  
  offerDescriptionPrimary: {
    color: '#9CA3AF',
  },
  
  offerDescriptionSecondary: {
    color: '#9CA3AF',
  },
  
  offerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('sm'),
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: getResponsiveSpacing('xs'),
  },
  
  offerButtonPrimary: {
    backgroundColor: '#6366F1',
  },
  
  offerButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  
  offerButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  offerButtonTextPrimary: {
    color: '#FFFFFF',
  },
  
  offerButtonTextSecondary: {
    color: '#6366F1',
  },
});
