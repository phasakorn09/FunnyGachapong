import { Tabs } from "expo-router";
import { Text } from "react-native";

export default function Layout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#FFD700" }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Roll",
          tabBarIcon: ({ color }) => <Text style={{ color }}>🎁</Text>,
        }}
      />
      <Tabs.Screen
        name="collection"
        options={{
          title: "My Cards",
          tabBarIcon: ({ color }) => <Text style={{ color }}>🃏</Text>,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color }) => <Text style={{ color }}>📍</Text>,
        }}
      />
      <Tabs.Screen
        name="deck"
        options={{
          title: "Deck",
          tabBarIcon: ({ color }) => <Text style={{ color }}>🗂️</Text>,
        }}
      />
    </Tabs>
  );
}
