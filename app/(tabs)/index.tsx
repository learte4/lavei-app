import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../lib/useAuth';
import { useEffect } from 'react';
import { registerForPushNotifications, registerTokenWithBackend } from '../../lib/notifications';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

export default function HomeScreen() {
  const { user } = useAuth();

  useEffect(() => {
    async function setupPushNotifications() {
      if (user) {
        const token = await registerForPushNotifications();
        if (token) {
          await registerTokenWithBackend(token);
        }
      }
    }
    setupPushNotifications();
  }, [user]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Olá, {user?.firstName || 'usuário'}!
        </Text>
        <Text style={styles.subGreeting}>
          O que você precisa hoje?
        </Text>
      </View>

      <View style={styles.cards}>
        <TouchableOpacity style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: `${LAVEI_YELLOW}30` }]}>
            <Ionicons name="car" size={28} color={LAVEI_DARK} />
          </View>
          <Text style={styles.cardTitle}>Meus Veículos</Text>
          <Text style={styles.cardDescription}>Gerencie seus veículos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: `${LAVEI_YELLOW}30` }]}>
            <Ionicons name="water" size={28} color={LAVEI_DARK} />
          </View>
          <Text style={styles.cardTitle}>Solicitar Lavagem</Text>
          <Text style={styles.cardDescription}>Agende um serviço</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: `${LAVEI_YELLOW}30` }]}>
            <Ionicons name="location" size={28} color={LAVEI_DARK} />
          </View>
          <Text style={styles.cardTitle}>Encontrar Lava-Rápido</Text>
          <Text style={styles.cardDescription}>Parceiros próximos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={[styles.cardIcon, { backgroundColor: `${LAVEI_YELLOW}30` }]}>
            <Ionicons name="star" size={28} color={LAVEI_DARK} />
          </View>
          <Text style={styles.cardTitle}>Avaliações</Text>
          <Text style={styles.cardDescription}>Veja e avalie serviços</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#071121',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  cards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '47%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#071121',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
  },
});
