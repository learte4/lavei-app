import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

type ServiceStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface ServiceHistoryEntry {
  id: string;
  vehicle: string;
  serviceType: string;
  address: string;
  scheduledFor: string;
  completedAt?: string | null;
  price: number;
  status: ServiceStatus;
  notes?: string | null;
}

const statusLabels: Record<ServiceStatus, string> = {
  scheduled: 'Agendado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

const statusColors: Record<ServiceStatus, string> = {
  scheduled: '#fde68a',
  in_progress: '#bfdbfe',
  completed: '#bbf7d0',
  cancelled: '#fecaca',
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const formatDateTime = (value?: string | null) => {
  if (!value) return '--';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function HistoryScreen() {
  const [services, setServices] = useState<ServiceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/api/history`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Falha ao carregar histórico');
      }
      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      console.error('Erro ao buscar histórico:', err);
      setError('Não foi possível carregar seu histórico agora.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchHistory();
  }, [fetchHistory]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={LAVEI_YELLOW} size="large" />
        <Text style={styles.loadingText}>Carregando histórico...</Text>
      </View>
    );
  }

  if (services.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: `${LAVEI_YELLOW}20` }]}>
          <Ionicons name="time-outline" size={48} color={LAVEI_DARK} />
        </View>
        <Text style={styles.emptyTitle}>Nenhum serviço ainda</Text>
        <Text style={styles.emptyText}>
          Assim que você agendar uma lavagem, ela aparecerá aqui.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: ServiceHistoryEntry }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceHeader}>
        <View>
          <Text style={styles.serviceType}>{item.serviceType}</Text>
          <Text style={styles.serviceVehicle}>{item.vehicle}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: statusColors[item.status] || '#e5e7eb' },
          ]}
        >
          <Text style={styles.statusText}>{statusLabels[item.status]}</Text>
        </View>
      </View>
      <Text style={styles.serviceAddress}>{item.address}</Text>
      <View style={styles.serviceMeta}>
        <Text style={styles.servicePrice}>{currencyFormatter.format(item.price)}</Text>
        <Text style={styles.serviceDate}>
          {item.status === 'completed'
            ? `Concluído em ${formatDateTime(item.completedAt)}`
            : `Agendado para ${formatDateTime(item.scheduledFor)}`}
        </Text>
      </View>
      {item.notes ? <Text style={styles.serviceNotes}>{item.notes}</Text> : null}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={services}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          colors={[LAVEI_YELLOW]}
          tintColor={LAVEI_YELLOW}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      }
      renderItem={renderItem}
      ListHeaderComponent={
        error ? <Text style={styles.errorText}>{error}</Text> : null
      }
      contentContainerStyle={{ paddingBottom: 32 }}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
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
    color: LAVEI_DARK,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  serviceCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceType: {
    fontSize: 18,
    fontWeight: '700',
    color: LAVEI_DARK,
  },
  serviceVehicle: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: LAVEI_DARK,
  },
  serviceAddress: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 12,
  },
  serviceMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: LAVEI_DARK,
  },
  serviceDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  serviceNotes: {
    fontSize: 13,
    color: '#4b5563',
    marginTop: 4,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 12,
    textAlign: 'center',
  },
});
