import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols'; // สำหรับไอคอน (iOS) หรือใช้ Ionicons แทนได้
import { Text } from 'react-native';

export default function Layout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#FFD700' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <Text style={{color}}>🎁</Text>,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: 'My Cards',
          tabBarIcon: ({ color }) => <Text style={{color}}>🃏</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <Text style={{color}}>📍</Text>,
        }}
      />
    </Tabs>
  );
}