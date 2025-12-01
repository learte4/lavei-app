import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
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
      <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
        <ActivityIndicator size="large" color={LAVEI_DARK} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <Text style={[styles.subtitle, { color: '#fff' }]}>
          Serviços de lavagem automotiva na palma da sua mão
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: LAVEI_YELLOW }]}
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 280,
    height: 280,
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
