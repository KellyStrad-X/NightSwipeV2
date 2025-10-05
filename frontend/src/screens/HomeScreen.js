import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🌙 NightSwipe</Text>
        <Text style={styles.subtitle}>Welcome to your Home Screen</Text>

        {userProfile && (
          <View style={styles.profileCard}>
            <Text style={styles.profileLabel}>Display Name:</Text>
            <Text style={styles.profileValue}>{userProfile.display_name}</Text>

            <Text style={styles.profileLabel}>Email:</Text>
            <Text style={styles.profileValue}>{currentUser?.email}</Text>

            {userProfile.phone && (
              <>
                <Text style={styles.profileLabel}>Phone:</Text>
                <Text style={styles.profileValue}>{userProfile.phone}</Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.comingSoon}>
          Deck creation and matching features coming soon!
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 32,
  },
  profileCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    marginBottom: 24,
  },
  profileLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 12,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  comingSoon: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
