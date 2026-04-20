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

export default function CollectionsScreen() {
  const colorScheme = useColorScheme();
  const [selectedTab, setSelectedTab] = useState('Looks');

  const tabs = ['Looks', 'Inspo', 'Products'];

  const collections = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop',
      title: 'Street Style',
      items: 12,
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=500&fit=crop',
      title: 'Casual Wear',
      items: 8,
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop',
      title: 'Business',
      items: 15,
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop',
      title: 'Evening',
      items: 6,
    },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colorScheme === 'dark' ? '#000000' : '#F5F5F5',
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
      fontSize: 32,
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
    tabsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 24,
    },
    tab: {
      marginRight: 24,
      paddingBottom: 8,
    },
    tabText: {
      fontSize: 16,
      color: colorScheme === 'dark' ? '#999999' : '#666666',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: '#000000',
    },
    activeTabText: {
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    collectionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    collectionCard: {
      width: (screenWidth - 60) / 2,
      marginBottom: 20,
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    collectionImage: {
      width: '100%',
      height: 200,
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
    },
    collectionInfo: {
      padding: 12,
    },
    collectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 4,
    },
    collectionItems: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#999999' : '#666666',
    },
    saveButton: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFFFFF',
      borderRadius: 20,
      padding: 8,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    footerText: {
      textAlign: 'center',
      fontSize: 16,
      color: colorScheme === 'dark' ? '#999999' : '#666666',
      marginTop: 20,
      marginBottom: 40,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Collections</Text>
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

      <View style={styles.tabsContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text 
              style={[
                styles.tabText, 
                selectedTab === tab && styles.activeTabText
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.collectionsGrid}>
          {collections.map((collection) => (
            <View key={collection.id} style={styles.collectionCard}>
              <Image 
                source={{ uri: collection.image }} 
                style={styles.collectionImage}
                resizeMode="cover"
              />
              <View style={styles.collectionInfo}>
                <Text style={styles.collectionTitle}>{collection.title}</Text>
                <Text style={styles.collectionItems}>{collection.items} items</Text>
              </View>
              <TouchableOpacity style={styles.saveButton}>
                <Ionicons 
                  name="bookmark-outline" 
                  size={20} 
                  color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        <Text style={styles.footerText}>
          Save looks to explore later
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
