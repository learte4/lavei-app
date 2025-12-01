import { StyleSheet, View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

export default function HistoryScreen() {
  const services: any[] = [];

  if (services.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: `${LAVEI_YELLOW}20` }]}>
          <Ionicons name="time-outline" size={48} color={LAVEI_DARK} />
        </View>
        <Text style={styles.emptyTitle}>Nenhum serviço ainda</Text>
        <Text style={styles.emptyText}>
          Seus serviços de lavagem aparecerão aqui
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      data={services}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.serviceCard}>
          <Text>{item.name}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#071121',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
  },
});
