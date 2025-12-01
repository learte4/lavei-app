import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const LAVEI_YELLOW = '#f0b100';
const LAVEI_DARK = '#071121';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: LAVEI_DARK,
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e5e5',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerStyle: {
          backgroundColor: LAVEI_YELLOW,
        },
        headerTintColor: LAVEI_DARK,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Conta',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
