import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useUser, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const menuItems = [
    { icon: 'person' as const, title: 'Personal Info', subtitle: 'Update your personal information' },
    { icon: 'settings' as const, title: 'Settings', subtitle: 'App preferences and settings' },
    { icon: 'shield-checkmark' as const, title: 'Privacy', subtitle: 'Privacy and security settings' },
    { icon: 'help-circle' as const, title: 'Help & Support', subtitle: 'Get help with the app' },
    { icon: 'log-out' as const, title: 'Sign Out', subtitle: 'Sign out of your account', onPress: handleSignOut },
  ];

  function handleSignOut() {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  }

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
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    profileSection: {
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
    },
    profileImage: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0',
      marginBottom: 16,
    },
    profileName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 8,
    },
    profileEmail: {
      fontSize: 16,
      color: colorScheme === 'dark' ? '#999999' : '#666666',
    },
    menuSection: {
      marginTop: 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    menuIcon: {
      marginRight: 16,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colorScheme === 'dark' ? '#FFFFFF' : '#000000',
      marginBottom: 2,
    },
    menuSubtitle: {
      fontSize: 14,
      color: colorScheme === 'dark' ? '#999999' : '#666666',
    },
    menuArrow: {
      marginLeft: 16,
    },
    versionInfo: {
      textAlign: 'center',
      fontSize: 12,
      color: colorScheme === 'dark' ? '#666666' : '#999999',
      marginTop: 40,
      marginBottom: 20,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Image 
            source={{ uri: user?.imageUrl || 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=120&h=120&fit=crop&crop=face' }} 
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>
            {user?.fullName || user?.username || 'Fashion User'}
          </Text>
          <Text style={styles.profileEmail}>
            {user?.primaryEmailAddress?.emailAddress || 'user@example.com'}
          </Text>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.menuItem}
              onPress={item.onPress || undefined}
            >
              <Ionicons 
                name={item.icon} 
                size={24} 
                color={colorScheme === 'dark' ? '#FFFFFF' : '#000000'} 
                style={styles.menuIcon}
              />
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={colorScheme === 'dark' ? '#666666' : '#999999'} 
                style={styles.menuArrow}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.versionInfo}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
