import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ResponsiveContainer } from '@/src/components/layouts/ResponsiveContainer';
import { ResponsiveHeader } from '@/src/components/layouts/ResponsiveHeader';
import { ResponsiveButton } from '@/src/components/components/ResponsiveButton';
import { Heading, Body } from '@/src/components/components/ResponsiveText';
import { ScreenDimensions, SPACING } from '@/src/constants/responsive';

export default function AddScreen() {
  const colorScheme = useColorScheme();

  const styles = StyleSheet.create({
    content: {
      gap: SPACING.xl,
    },
    actionButtons: {
      gap: SPACING.lg,
    },
    description: {
      textAlign: 'center',
      marginTop: SPACING.lg,
    },
  });

  return (
    <ResponsiveContainer 
      scrollable={true}
      padding="lg"
      maxWidth="md"
    >
      <ResponsiveHeader
        title="Add New Look"
        showNotifications={false}
      />

      <View style={styles.content}>
        <View style={styles.actionButtons}>
          <ResponsiveButton
            title="Take a Photo"
            variant="primary"
            size="xl"
            icon={<Ionicons name="camera-outline" />}
            onPress={() => console.log('Take photo')}
          />
          
          <ResponsiveButton
            title="Choose from Gallery"
            variant="primary"
            size="xl"
            icon={<Ionicons name="image-outline" />}
            onPress={() => console.log('Choose from gallery')}
          />
          
          <ResponsiveButton
            title="Upload from URL"
            variant="primary"
            size="xl"
            icon={<Ionicons name="cloud-upload-outline" />}
            onPress={() => console.log('Upload from URL')}
          />
        </View>

        <View style={styles.description}>
          <Body color="#666666">
            Add new fashion looks to your collection. 
            Our AI will help you try them on your virtual model.
          </Body>
        </View>
      </View>
    </ResponsiveContainer>
  );
}
