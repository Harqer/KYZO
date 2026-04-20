import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

const { width: screenWidth } = Dimensions.get('window');

export default function HomeScreen() {
  const colorScheme = useColorScheme();

  const recentUploads = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop',
      title: 'Summer Collection',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop',
      title: 'Urban Style',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1441985300917-64674bd600d8?w=400&h=500&fit=crop',
      title: 'Business Casual',
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=500&fit=crop',
      title: 'Weekend Wear',
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#000000' : '#F8F8F8',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: StatusBar.currentHeight || 44,
      paddingBottom: 16,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    },
    notificationButton: {
      position: 'relative',
      padding: 8,
    },
    notificationBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      width: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 16,
    },
    uploadsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    uploadCard: {
      width: (screenWidth - 60) / 2,
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    uploadImage: {
      width: '100%',
      height: 180,
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
    },
    uploadInfo: {
      padding: 12,
    },
    uploadTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
    },
    currentModel: {
      marginTop: 32,
      marginBottom: 24,
    },
    modelCard: {
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    modelImage: {
      width: '100%',
      height: 400,
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
    },
    modelOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 20,
      backgroundColor: 'rgba(0,0,0,0.7)',
    },
    currentButton: {
      backgroundColor: '#FFFFFF',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },
    currentButtonText: {
      color: '#000000',
      fontSize: 14,
      fontWeight: '600',
    },
    modelInfo: {
      marginTop: 12,
      paddingHorizontal: 20,
    },
    modelTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 8,
    },
    modelDescription: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#999999' : '#666666',
      lineHeight: 20,
    },
    actionButton: {
      position: 'absolute',
      top: 16,
      right: 16,
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderRadius: 20,
      padding: 8,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      borderRadius: 12,
      padding: 16,
      marginTop: 24,
      marginBottom: 32,
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginLeft: 8,
    },
    thumbnailSection: {
      marginTop: 24,
      marginBottom: 32,
    },
    thumbnailContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      borderWidth: 2,
      borderColor: colorScheme === 'dark' ? '#333333' : '#E0E0E0',
      borderStyle: 'dashed',
    },
    thumbnailImage: {
      width: 60,
      height: 60,
      borderRadius: 8,
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
      marginRight: 16,
    },
    thumbnailText: {
      fontSize: 16,
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      fontWeight: '500',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Doppl Model</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons 
            name="notifications-outline" 
            size={24} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>4</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.currentModel}>
          <Text style={styles.sectionTitle}>Current Model</Text>
          <View style={styles.modelCard}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' }} 
              style={styles.modelImage}
              resizeMode="cover"
            />
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="trash-outline" size={20} color="#000000" />
            </TouchableOpacity>
            <View style={styles.modelOverlay}>
              <TouchableOpacity style={styles.currentButton}>
                <Text style={styles.currentButtonText}>CURRENT</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.modelInfo}>
            <Text style={styles.modelTitle}>You'll see your looks on this model</Text>
            <Text style={styles.modelDescription}>
              This is your personalized fashion model that will showcase all your uploaded looks and outfits.
            </Text>
          </View>
        </View>

        <View style={styles.thumbnailSection}>
          <TouchableOpacity style={styles.thumbnailContainer}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop' }} 
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
            <Ionicons name="add" size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.addButton}>
          <Ionicons 
            name="camera-outline" 
            size={24} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
          <Text style={styles.addButtonText}>Take a photo</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton}>
          <Ionicons 
            name="cloud-upload-outline" 
            size={24} 
            color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
          />
          <Text style={styles.addButtonText}>Upload</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
