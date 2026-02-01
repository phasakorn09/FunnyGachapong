import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CollectionScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("ทั้งหมด");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) loadData();
  }, [isFocused]);

  const loadData = async () => {
    const data = await AsyncStorage.getItem("@my_collection");
    if (data) {
      const parsed = JSON.parse(data);
      setItems(parsed.sort((a: any, b: any) => b.rank - a.rank));
    }
    setSelectedIds([]);
  };

  const getFilteredData = () =>
    filter === "ทั้งหมด" ? items : items.filter((i) => i.rarity === filter);

  const toggleSelectAll = () => {
    const data = getFilteredData();
    setSelectedIds(
      selectedIds.length === data.length ? [] : data.map((i) => i.id),
    );
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const deleteSelected = () => {
    Alert.alert("ยืนยัน", `ลบการ์ด ${selectedIds.length} ใบ?`, [
      { text: "ยกเลิก" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          const updated = items.filter(
            (item) => !selectedIds.includes(item.id),
          );
          setItems(updated);
          await AsyncStorage.setItem("@my_collection", JSON.stringify(updated));
          setSelectedIds([]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {["ทั้งหมด", "เทพเจ้า", "ราชา", "คนสันโดษ", "คนแปลก", "คนธรรมดา"].map(
          (cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setFilter(cat)}
              style={[styles.tab, filter === cat && styles.activeTab]}
            >
              <Text
                style={{
                  color: filter === cat ? "white" : "black",
                  fontSize: 11,
                }}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </View>

      <View style={styles.actionHeader}>
        <TouchableOpacity style={styles.selectAllBtn} onPress={toggleSelectAll}>
          <Ionicons
            name={
              selectedIds.length === getFilteredData().length &&
              items.length > 0
                ? "checkbox"
                : "square-outline"
            }
            size={22}
            color="#007AFF"
          />
          <Text style={styles.selectAllText}>เลือกทั้งหมด</Text>
        </TouchableOpacity>
        {selectedIds.length > 0 && (
          <TouchableOpacity style={styles.deleteBtn} onPress={deleteSelected}>
            <Text style={styles.deleteText}>ลบรายการที่เลือก</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={getFilteredData()}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <View
              style={[
                styles.cardRow,
                isSelected && styles.selectedRow,
                { borderLeftColor: item.color, borderLeftWidth: 5 },
              ]}
            >
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => toggleSelect(item.id)}
              >
                <Ionicons
                  name={isSelected ? "checkbox" : "square-outline"}
                  size={26}
                  color={isSelected ? "#FF3B30" : "#ccc"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cardContent}
                onPress={() => setSelectedCard(item)}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={item.image}
                    style={styles.thumbnail}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text
                    style={{
                      color: item.color,
                      fontWeight: "bold",
                      fontSize: 12,
                    }}
                  >
                    {item.rarity}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#ddd" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Modal visible={!!selectedCard} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCard && (
              <>
                <View style={styles.detailFrame}>
                  <Image
                    source={selectedCard.image}
                    style={styles.detailImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.detailTitle}>{selectedCard.name}</Text>
                <Button title="ปิด" onPress={() => setSelectedCard(null)} />
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  filterBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    padding: 10,
  },
  tab: { padding: 8, margin: 3, backgroundColor: "#e9ecef", borderRadius: 15 },
  activeTab: { backgroundColor: "#007AFF" },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 15,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  selectAllBtn: { flexDirection: "row", alignItems: "center" },
  selectAllText: { marginLeft: 10, color: "#007AFF", fontWeight: "bold" },
  deleteBtn: { backgroundColor: "#FF3B30", padding: 8, borderRadius: 8 },
  deleteText: { color: "#fff", fontWeight: "bold", fontSize: 12 },
  cardRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 15,
    marginVertical: 5,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    elevation: 2,
  },
  selectedRow: { backgroundColor: "#fff5f5" },
  checkbox: { paddingRight: 10 },
  cardContent: { flex: 1, flexDirection: "row", alignItems: "center" },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  thumbnail: { width: "100%", height: "100%" },
  cardInfo: { flex: 1, marginLeft: 15 },
  cardName: { fontSize: 16, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
  },
  detailFrame: {
    width: "100%",
    height: 350,
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
    marginBottom: 15,
  },
  detailImage: { width: "100%", height: "100%" },
  detailTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
});
