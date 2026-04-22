import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { getResponsiveSpacing } from '../../constants/responsive';

interface ProductRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  style?: any;
}

const RATING_SIZES = {
  sm: {
    star: 12,
    text: 10,
  },
  md: {
    star: 16,
    text: 12,
  },
  lg: {
    star: 20,
    text: 14,
  },
};

export function ProductRating({ 
  rating, 
  maxRating = 5, 
  size = 'md', 
  showCount = false, 
  count,
  style 
}: ProductRatingProps) {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < maxRating; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            size={RATING_SIZES[size].star}
            color="#F59E0B"
            fill="#F59E0B"
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Star
            key={i}
            size={RATING_SIZES[size].star}
            color="#F59E0B"
            fill="none"
          />
        );
      } else {
        stars.push(
          <Star
            key={i}
            size={RATING_SIZES[size].star}
            color="#E5E7EB"
            fill="none"
          />
        );
      }
    }
    
    return stars;
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.stars}>
        {renderStars()}
      </View>
      
      {showCount && (
        <Text style={[styles.ratingText, { fontSize: RATING_SIZES[size].text }]}>
          ({count || rating})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getResponsiveSpacing('xs'),
  },
  
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  ratingText: {
    color: '#6B7280',
    fontWeight: '500',
  },
});
