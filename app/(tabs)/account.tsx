import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/useAuth';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

interface AccountPreferences {
  notificationsEnabled: boolean;
  emailUpdates: boolean;
  preferredVehicle?: string;
  paymentMethodLast4?: string;
}

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [preferences, setPreferences] = useState<AccountPreferences | null>(null);
  const [preferredVehicleInput, setPreferredVehicleInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/account`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Falha ao buscar dados da conta');
      }
      const data = await response.json();
      setPreferences(data.preferences);
      setPreferredVehicleInput(data.preferences?.preferredVehicle || '');
    } catch (err) {
      console.error('Erro ao buscar conta:', err);
      setError('Não foi possível carregar suas preferências agora.');
    } finally {
      setIsLoading(false);
      setSavingField(null);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  const updatePreferences = useCallback(
    async (changes: Partial<AccountPreferences>, fieldKey: string) => {
      setSavingField(fieldKey);
      try {
        const response = await fetch(`${API_URL}/api/account/preferences`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(changes),
        });
        if (!response.ok) {
          throw new Error('Falha ao salvar preferências');
        }
        const data = await response.json();
        setPreferences(data.preferences);
        if (typeof data.preferences?.preferredVehicle === 'string') {
          setPreferredVehicleInput(data.preferences.preferredVehicle);
        }
        setError(null);
      } catch (err) {
        console.error('Erro ao atualizar preferências:', err);
        setError('Não foi possível salvar as suas preferências agora.');
      } finally {
        setSavingField(null);
      }
    },
    [],
  );

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/');
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={LAVEI_YELLOW} size="large" />
        <Text style={styles.loadingText}>Carregando sua conta...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {user?.profileImageUrl ? (
            <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          )}
        </View>
        <Text style={styles.name}>{user?.firstName || 'Usuário'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Preferências</Text>
        <View style={styles.preferenceRow}>
          <View>
            <Text style={styles.preferenceLabel}>Notificações push</Text>
            <Text style={styles.preferenceDescription}>
              Receba alertas sobre chegada e fim do serviço
            </Text>
          </View>
          <Switch
            value={preferences?.notificationsEnabled ?? false}
            onValueChange={(value) => updatePreferences({ notificationsEnabled: value }, 'notifications')}
            thumbColor={LAVEI_YELLOW}
            trackColor={{ false: '#d1d5db', true: '#fef3c7' }}
            disabled={savingField === 'notifications'}
          />
        </View>

        <View style={styles.preferenceRow}>
          <View>
            <Text style={styles.preferenceLabel}>Email & SMS</Text>
            <Text style={styles.preferenceDescription}>
              Atualizações sobre promoções e recibos
            </Text>
          </View>
          <Switch
            value={preferences?.emailUpdates ?? false}
            onValueChange={(value) => updatePreferences({ emailUpdates: value }, 'emailUpdates')}
            thumbColor={LAVEI_YELLOW}
            trackColor={{ false: '#d1d5db', true: '#fef3c7' }}
            disabled={savingField === 'emailUpdates'}
          />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Veículo favorito</Text>
        <TextInput
          style={styles.input}
          value={preferredVehicleInput}
          onChangeText={setPreferredVehicleInput}
          placeholder="Ex: Chevrolet Onix • ABC1D23"
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            savingField === 'preferredVehicle' && { opacity: 0.7 },
          ]}
          onPress={() => updatePreferences({ preferredVehicle: preferredVehicleInput.trim() }, 'preferredVehicle')}
          disabled={savingField === 'preferredVehicle'}
        >
          <Text style={styles.primaryButtonText}>
            {savingField === 'preferredVehicle' ? 'Salvando...' : 'Salvar veículo'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pagamento</Text>
        <View style={styles.paymentRow}>
          <Ionicons name="card-outline" size={24} color={LAVEI_DARK} />
          <Text style={styles.paymentText}>
            Cartão final {preferences?.paymentMethodLast4 || '----'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() =>
            Alert.alert(
              'Pagamentos',
              'A atualização de pagamento será liberada na próxima versão.',
            )
          }
        >
          <Text style={styles.secondaryButtonText}>Gerenciar pagamento</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#dc2626" />
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: LAVEI_YELLOW,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: LAVEI_DARK,
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: LAVEI_DARK,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: LAVEI_DARK,
    marginBottom: 16,
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: LAVEI_DARK,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: LAVEI_DARK,
    marginBottom: 12,
    backgroundColor: '#f9fafb',
  },
  primaryButton: {
    backgroundColor: LAVEI_YELLOW,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: LAVEI_DARK,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  paymentText: {
    fontSize: 16,
    color: '#111827',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: LAVEI_DARK,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
});
