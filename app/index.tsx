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
import { useAuth } from '../lib/useAuth';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

type UserRole = 'client' | 'provider' | 'partner' | 'admin';

interface RoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: string;
}

const roles: RoleOption[] = [
  {
    id: 'client',
    label: 'Cliente',
    description: 'Procuro lavar meu carro',
    icon: '🚗',
  },
  {
    id: 'provider',
    label: 'Prestador (Lavador)',
    description: 'Ofereço serviço de lavagem',
    icon: '🧼',
  },
  {
    id: 'partner',
    label: 'Parceiro (Lava rápido)',
    description: 'Gerencio prestadores',
    icon: '👔',
  },
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
        <ActivityIndicator size="large" color={LAVEI_YELLOW} />
      </SafeAreaView>
    );
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    router.push({
      pathname: '/auth',
      params: { role },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: LAVEI_DARK }]}>
      <View style={styles.header}>
        <Image source={require('../assets/icon.png')} style={styles.headerLogo} resizeMode="contain" />
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Image source={require('../assets/icon.png')} style={styles.titleLogo} resizeMode="contain" />
          <Text style={styles.title}>Lavei</Text>
        </View>
        <Text style={styles.subtitle}>O jeito mais fácil de lavar o seu carro</Text>

        <View style={styles.divider} />

        {roles.map((role, index) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleButton, index === 2 && styles.partnerButtonSpacing]}
            onPress={() => handleRoleSelect(role.id)}
            activeOpacity={0.7}
          >
            <View style={styles.roleContent}>
              <Text style={styles.roleIcon}>{role.icon}</Text>
              <View style={styles.roleText}>
                <Text style={styles.roleLabel}>{role.label}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
            </View>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LAVEI_DARK,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLogo: {
    width: 60,
    height: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  titleLogo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 32,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginBottom: 24,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  partnerButtonSpacing: {
    marginTop: 24,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  roleContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roleIcon: {
    fontSize: 32,
  },
  roleText: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#888',
  },
  arrow: {
    fontSize: 24,
    color: LAVEI_YELLOW,
    fontWeight: '300',
  },
});
