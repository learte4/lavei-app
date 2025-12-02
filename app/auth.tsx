import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Linking,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/useAuth';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

type UserRole = 'client' | 'provider' | 'partner' | 'admin';

export default function AuthScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const { isAuthenticated, isLoading: authLoading, login, register, error, clearError, getGoogleAuthUrl } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const currentRole = (role as UserRole) || 'client';

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    clearError();
    
    try {
      if (isRegister) {
        const result = await register({ email, password, firstName, lastName, role: currentRole });
        if (result.success) {
          setEmail('');
          setPassword('');
          setFirstName('');
          setLastName('');
          setIsRegister(false);
        }
      } else {
        const result = await login({ email, password });
        if (result.success) {
          setEmail('');
          setPassword('');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const googleUrl = getGoogleAuthUrl();
      await Linking.openURL(googleUrl);
    } catch (err) {
      console.error('Erro ao abrir Google OAuth:', err);
      clearError();
    }
  };

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
        <ActivityIndicator size="large" color={LAVEI_YELLOW} />
      </SafeAreaView>
    );
  }

  const roleLabels: Record<UserRole, string> = {
    client: 'Cliente',
    provider: 'Prestador',
    partner: 'Parceiro',
    admin: 'Admin',
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.roleTag}>{roleLabels[currentRole]}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{isRegister ? 'Criar Conta' : 'Entrar'}</Text>
          <Text style={styles.subtitle}>
            {isRegister 
              ? `Registre-se como ${roleLabels[currentRole].toLowerCase()}` 
              : `Faça login como ${roleLabels[currentRole].toLowerCase()}`}
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!isSubmitting}
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!isSubmitting}
          />

          {isRegister && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Primeiro Nome"
                placeholderTextColor="#666"
                value={firstName}
                onChangeText={setFirstName}
                editable={!isSubmitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Sobrenome"
                placeholderTextColor="#666"
                value={lastName}
                onChangeText={setLastName}
                editable={!isSubmitting}
              />
            </>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: LAVEI_YELLOW }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={LAVEI_DARK} />
            ) : (
              <Text style={styles.buttonText}>{isRegister ? 'Criar Conta' : 'Entrar'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setIsRegister(!isRegister);
              clearError();
              setEmail('');
              setPassword('');
              setFirstName('');
              setLastName('');
            }}
            disabled={isSubmitting}
          >
            <Text style={styles.toggleText}>
              {isRegister ? 'Já tem conta? Entrar' : 'Não tem conta? Criar'}
            </Text>
          </TouchableOpacity>

          {!isRegister && (
            <>
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton]}
                onPress={handleGoogleLogin}
                disabled={isSubmitting}
              >
                <Image source={require('../assets/google.svg')} style={styles.googleLogo} />
                <Text style={styles.googleButtonText}>Entrar com Google</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LAVEI_DARK,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    fontSize: 16,
    color: LAVEI_YELLOW,
    fontWeight: '600',
  },
  roleTag: {
    fontSize: 14,
    color: '#aaa',
    backgroundColor: '#222',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 32,
    lineHeight: 24,
  },
  input: {
    width: '100%',
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    fontSize: 16,
    color: '#fff',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
  button: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  buttonText: {
    color: LAVEI_DARK,
    fontSize: 18,
    fontWeight: '600',
  },
  toggleText: {
    color: LAVEI_YELLOW,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#666',
    fontSize: 14,
    marginHorizontal: 12,
  },
  googleButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  googleLogo: {
    width: 20,
    height: 20,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
