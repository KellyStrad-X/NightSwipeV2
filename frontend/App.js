import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import { useState, useEffect } from 'react';
import { checkHealth } from './src/services/api';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [firebaseStatus, setFirebaseStatus] = useState('Not configured');

  useEffect(() => {
    testBackendConnection();
    checkFirebaseConfig();
  }, []);

  const testBackendConnection = async () => {
    const result = await checkHealth();
    if (result.success) {
      setBackendStatus(`✅ Connected: ${result.data.service}`);
    } else {
      setBackendStatus(`❌ Failed: ${result.error}`);
    }
  };

  const checkFirebaseConfig = () => {
    // Check if Firebase env vars are set
    if (process.env.EXPO_PUBLIC_FIREBASE_API_KEY) {
      setFirebaseStatus('✅ Configured');
    } else {
      setFirebaseStatus('⚠️ Not configured - add to .env');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌙 NightSwipe MVP</Text>
      <Text style={styles.subtitle}>Development Environment</Text>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Backend API:</Text>
        <Text style={styles.status}>{backendStatus}</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.label}>Firebase:</Text>
        <Text style={styles.status}>{firebaseStatus}</Text>
      </View>

      <Button title="Retest Backend" onPress={testBackendConnection} />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
    marginBottom: 40,
  },
  statusContainer: {
    marginVertical: 12,
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 4,
  },
  status: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
});
