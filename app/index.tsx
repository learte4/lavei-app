import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/useAuth';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, checkAuth } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';
      await WebBrowser.openBrowserAsync(`${apiUrl}/api/login`);
      await checkAuth();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_YELLOW }]}>
        <ActivityIndicator size="large" color={LAVEI_DARK} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_YELLOW }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Ionicons name="car-sport" size={64} color={LAVEI_DARK} />
        </View>

        <Text style={[styles.title, { color: LAVEI_DARK }]}>Lavei</Text>
        <Text style={[styles.subtitle, { color: LAVEI_DARK }]}>
          Serviços de lavagem automotiva na palma da sua mão
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: LAVEI_DARK }]}
        onPress={handleLogin}
        disabled={isLoggingIn}
      >
        {isLoggingIn ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 26,
  },
  button: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
