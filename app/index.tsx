import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/useAuth';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login, register, error, clearError } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    clearError();
    
    try {
      if (isRegister) {
        const result = await register({ email, password, firstName, lastName });
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

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
        <ActivityIndicator size="large" color={LAVEI_YELLOW} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/icon.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <Text style={[styles.subtitle, { color: '#fff' }]}>
            O jeito mais fácil de lavar o seu carro
          </Text>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            editable={!isSubmitting}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
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
                value={firstName}
                onChangeText={setFirstName}
                editable={!isSubmitting}
              />
              <TextInput
                style={styles.input}
                placeholder="Sobrenome"
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
        </View>
      </ScrollView>
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
