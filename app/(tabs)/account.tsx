import { StyleSheet, View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../lib/useAuth';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

export default function AccountScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          {user?.profileImageUrl ? (
            <Image
              source={{ uri: user.profileImageUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.avatarText}>
              {user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          )}
        </View>
        <Text style={styles.name}>{user?.firstName || 'Usuário'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="person-outline" size={24} color={LAVEI_DARK} />
          <Text style={styles.menuText}>Editar Perfil</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={24} color={LAVEI_DARK} />
          <Text style={styles.menuText}>Notificações</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="card-outline" size={24} color={LAVEI_DARK} />
          <Text style={styles.menuText}>Pagamentos</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="help-circle-outline" size={24} color={LAVEI_DARK} />
          <Text style={styles.menuText}>Ajuda</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#dc2626" />
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
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
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    color: LAVEI_DARK,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginLeft: 8,
  },
});
