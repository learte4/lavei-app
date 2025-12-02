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
    label: 'Prestador',
    description: 'Oferço serviço de lavagem',
    icon: '🧼',
  },
  {
    id: 'partner',
    label: 'Parceiro',
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
        <Text style={styles.title}>Lavei</Text>
        <Text style={styles.subtitle}>O jeito mais fácil de lavar o seu carro</Text>

        <View style={styles.divider} />

        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={styles.roleButton}
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

      <View style={styles.footer}>
        <Text style={styles.footerText}>Super Admin?</Text>
        <TouchableOpacity>
          <Text style={styles.adminLink}>Acessar Portal</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
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
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  adminLink: {
    fontSize: 14,
    color: LAVEI_YELLOW,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
