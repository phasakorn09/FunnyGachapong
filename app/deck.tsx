import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Deck,
  createDeck,
  deleteDeck,
  fetchDecks,
  loadProfileAvatarUrl,
  pickAndUploadCover,
  updateDeckCards,
  uploadProfileImage,
} from "../lib/deckService";

// ประเภทการ์ดในคลัง (ตาม structure ของ collection)
interface CollectionCard {
  id: string;
  name: string;
  image: any;
  rarity: string;
  color: string;
  rank: number;
}

export default function DeckScreen() {
  const insets = useSafeAreaInsets();
  // ── State หลัก ──────────────────────────────────────────
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── State โปรไฟล์ ────────────────────────────────────────
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // ── State Modal สร้าง Deck ────────────────────────────────
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckDesc, setDeckDesc] = useState("");
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  // ── State Modal Deck Detail ───────────────────────────────
  const [detailDeck, setDetailDeck] = useState<Deck | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [savingCards, setSavingCards] = useState(false);

  // ── State Card Picker ────────────────────────────────────
  const [cardPickerVisible, setCardPickerVisible] = useState(false);
  const [collection, setCollection] = useState<CollectionCard[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);

  const isFocused = useIsFocused();

  // ── โหลดข้อมูลเริ่มต้น ────────────────────────────────────
  const loadDecks = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchDecks();
      setDecks(data);
    } catch (e: any) {
      setError(e.message ?? "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const url = await loadProfileAvatarUrl();
    setAvatarUrl(url);
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadDecks();
      loadProfile();
    }
  }, [isFocused]);

  // ── โหลดคลังการ์ดจาก AsyncStorage ────────────────────────
  const loadCollection = async () => {
    const raw = await AsyncStorage.getItem("@my_collection");
    if (raw) {
      const parsed: CollectionCard[] = JSON.parse(raw);
      setCollection(parsed.sort((a, b) => b.rank - a.rank));
    } else {
      setCollection([]);
    }
  };

  // ── อัปโหลด Avatar ────────────────────────────────────────
  // FIX: เปิด ImagePicker ก่อน รอผล แล้วค่อย set loading เพื่อกัน button ล็อค
  const handlePickAvatar = async () => {
    if (uploadingAvatar) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    // set loading หลังจาก picker ปิดแล้วเท่านั้น
    setUploadingAvatar(true);
    try {
      const url = await uploadProfileImage(result.assets[0].uri);
      setAvatarUrl(url);
    } catch (e: any) {
      Alert.alert("อัปโหลดรูปไม่สำเร็จ", e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // ── สร้าง Deck ────────────────────────────────────────────
  const handleCreate = async () => {
    if (!deckName.trim()) {
      Alert.alert("กรุณากรอกชื่อ Deck");
      return;
    }
    setSaving(true);
    try {
      await createDeck(deckName.trim(), deckDesc.trim(), [], coverUrl);
      setCreateModalVisible(false);
      setDeckName("");
      setDeckDesc("");
      setCoverUrl(null);
      await loadDecks();
    } catch (e: any) {
      Alert.alert("บันทึกไม่สำเร็จ", e.message);
    } finally {
      setSaving(false);
    }
  };

  // FIX: pickAndUploadCover จัดการ picker เอง ดังนั้น handlePickCover แค่รับ URI มาแล้ว set loading
  const handlePickCover = async () => {
    if (uploadingCover) return;
    // pickAndUploadCover เปิด picker ก่อน ถ้า cancel จะคืน null ทันที
    setUploadingCover(true);
    try {
      const url = await pickAndUploadCover();
      if (url) setCoverUrl(url);
    } catch (e: any) {
      Alert.alert("อัปโหลดรูปไม่สำเร็จ", e.message);
    } finally {
      setUploadingCover(false);
    }
  };

  // ── ลบ Deck ───────────────────────────────────────────────
  const handleDelete = (deck: Deck) => {
    Alert.alert("ลบ Deck", `ต้องการลบ "${deck.name}" ใช่ไหม?`, [
      { text: "ยกเลิก" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDeck(deck.id);
            setDecks((prev) => prev.filter((d) => d.id !== deck.id));
            if (detailDeck?.id === deck.id) setDetailModalVisible(false);
          } catch (e: any) {
            Alert.alert("ลบไม่สำเร็จ", e.message);
          }
        },
      },
    ]);
  };

  // ── เปิด Deck Detail ──────────────────────────────────────
  const openDetail = (deck: Deck) => {
    setDetailDeck(deck);
    setDetailModalVisible(true);
  };

  // ── เปิด Card Picker ──────────────────────────────────────
  const openCardPicker = async () => {
    await loadCollection();
    setSelectedCardIds([...(detailDeck?.card_ids ?? [])]);
    setCardPickerVisible(true);
  };

  const toggleCardSelect = (id: string) => {
    setSelectedCardIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // ── บันทึกการ์ดที่เลือกลง Deck ───────────────────────────
  const handleSaveCards = async () => {
    if (!detailDeck) return;
    setSavingCards(true);
    try {
      await updateDeckCards(detailDeck.id, selectedCardIds);
      // อัปเดต local state
      const updatedDeck = { ...detailDeck, card_ids: selectedCardIds };
      setDetailDeck(updatedDeck);
      setDecks((prev) =>
        prev.map((d) => (d.id === detailDeck.id ? updatedDeck : d))
      );
      setCardPickerVisible(false);
    } catch (e: any) {
      Alert.alert("บันทึกไม่สำเร็จ", e.message);
    } finally {
      setSavingCards(false);
    }
  };

  // ── ลบการ์ดออกจาก Deck ───────────────────────────────────
  const removeCardFromDeck = async (cardId: string) => {
    if (!detailDeck) return;
    const newIds = (detailDeck.card_ids ?? []).filter((id) => id !== cardId);
    try {
      await updateDeckCards(detailDeck.id, newIds);
      const updatedDeck = { ...detailDeck, card_ids: newIds };
      setDetailDeck(updatedDeck);
      setDecks((prev) =>
        prev.map((d) => (d.id === detailDeck.id ? updatedDeck : d))
      );
    } catch (e: any) {
      Alert.alert("ลบการ์ดไม่สำเร็จ", e.message);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  // ── Render การ์ดในคลัง (Card Picker) ─────────────────────
  const renderPickerCard = ({ item }: { item: CollectionCard }) => {
    const isSelected = selectedCardIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.pickerCard, isSelected && styles.pickerCardSelected]}
        onPress={() => toggleCardSelect(item.id)}
        activeOpacity={0.8}
      >
        <Image source={item.image} style={styles.pickerThumb} resizeMode="contain" />
        <Text style={styles.pickerCardName} numberOfLines={2}>{item.name}</Text>
        <Text style={[styles.pickerRarity, { color: item.color }]}>{item.rarity}</Text>
        {isSelected && (
          <View style={styles.pickerCheckOverlay}>
            <Ionicons name="checkmark-circle" size={26} color="#A335EE" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ── Render การ์ดใน Deck Detail ────────────────────────────
  const renderDeckCard = ({ item: cardId }: { item: string }) => {
    const card = collection.find((c) => c.id === cardId);
    if (!card) return null;
    return (
      <View style={styles.deckCardItem}>
        <Image source={card.image} style={styles.deckCardThumb} resizeMode="contain" />
        <View style={styles.deckCardItemInfo}>
          <Text style={styles.deckCardItemName} numberOfLines={1}>{card.name}</Text>
          <Text style={[styles.deckCardItemRarity, { color: card.color }]}>{card.rarity}</Text>
        </View>
        <TouchableOpacity onPress={() => removeCardFromDeck(cardId)}>
          <Ionicons name="close-circle" size={22} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Render Deck row ────────────────────────────────────────
  const renderDeck = ({ item }: { item: Deck }) => (
    <TouchableOpacity
      style={styles.deckCard}
      onPress={() => openDetail(item)}
      activeOpacity={0.85}
    >
      {item.cover_url ? (
        <Image source={{ uri: item.cover_url }} style={styles.deckCover} resizeMode="cover" />
      ) : (
        <View style={[styles.deckCover, styles.deckCoverPlaceholder]}>
          <Ionicons name="layers-outline" size={36} color="#A335EE" />
        </View>
      )}
      <View style={styles.deckInfo}>
        <Text style={styles.deckName} numberOfLines={1}>{item.name}</Text>
        {item.description ? (
          <Text style={styles.deckDesc} numberOfLines={1}>{item.description}</Text>
        ) : null}
        <View style={styles.deckMeta}>
          <Ionicons name="card-outline" size={13} color="#A335EE" />
          <Text style={styles.deckMetaText}> {(item.card_ids ?? []).length} การ์ด</Text>
          <Ionicons name="calendar-outline" size={13} color="#666" style={{ marginLeft: 10 }} />
          <Text style={styles.deckMetaText}> {formatDate(item.created_at)}</Text>
        </View>
      </View>
      <View style={{ alignItems: "center", gap: 10, paddingRight: 4 }}>
        <Ionicons name="chevron-forward" size={18} color="#555" />
        <TouchableOpacity onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={18} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // ─────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Profile Header ── */}
      <View style={[styles.profileHeader, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper}>
          {uploadingAvatar ? (
            <ActivityIndicator color="#A335EE" size="small" />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={38} color="#A335EE" />
            </View>
          )}
          <View style={styles.avatarEditBadge}>
            <Ionicons name="camera" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileLabel}>โปรไฟล์ของฉัน</Text>
          <Text style={styles.profileSubLabel}>
            {uploadingAvatar ? "กำลังอัปโหลด..." : "แตะรูปเพื่อเปลี่ยนโปรไฟล์"}
          </Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>สร้าง Deck</Text>
        </TouchableOpacity>
      </View>

      {/* ── Deck List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#A335EE" />
          <Text style={styles.loadingText}>กำลังโหลดจาก Supabase...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadDecks()}>
            <Text style={styles.retryText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={decks}
          keyExtractor={(item) => item.id}
          renderItem={renderDeck}
          contentContainerStyle={decks.length === 0 ? styles.emptyContainer : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadDecks(true)} colors={["#A335EE"]} tintColor="#A335EE" />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="layers-outline" size={72} color="#333" />
              <Text style={styles.emptyTitle}>ยังไม่มี Deck</Text>
              <Text style={styles.emptySubtitle}>กด "สร้าง Deck" เพื่อเริ่มต้น</Text>
            </View>
          }
        />
      )}

      {/* ══════════════════════════════════════════════
          Modal: สร้าง Deck ใหม่
      ══════════════════════════════════════════════ */}
      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>สร้าง Deck ใหม่</Text>

            {/* Cover */}
            <TouchableOpacity style={styles.coverPicker} onPress={handlePickCover} disabled={uploadingCover}>
              {uploadingCover ? (
                <ActivityIndicator color="#A335EE" />
              ) : coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.coverPreview} resizeMode="cover" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={32} color="#A335EE" />
                  <Text style={styles.coverPickerText}>เลือกรูป Cover</Text>
                </>
              )}
            </TouchableOpacity>

            <TextInput style={styles.input} placeholder="ชื่อ Deck *" placeholderTextColor="#555" value={deckName} onChangeText={setDeckName} maxLength={50} />
            <TextInput style={[styles.input, styles.inputMultiline]} placeholder="คำอธิบาย (ไม่บังคับ)" placeholderTextColor="#555" value={deckDesc} onChangeText={setDeckDesc} multiline numberOfLines={3} maxLength={200} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setCreateModalVisible(false); setDeckName(""); setDeckDesc(""); setCoverUrl(null); }}>
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleCreate} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>บันทึก</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          Modal: Deck Detail (แสดงการ์ดในDeck)
      ══════════════════════════════════════════════ */}
      <Modal visible={detailModalVisible} transparent animationType="slide" onRequestClose={() => setDetailModalVisible(false)}>
        <View style={styles.modalOverlay}>
          {/* FIX: ใช้ maxHeight + ScrollView ให้เลื่อนได้บน iOS */}
          <View style={[styles.modalBox, { maxHeight: "88%", paddingBottom: insets.bottom + 12 }]}>
            {detailDeck && (
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={{ gap: 12 }}
              >
                {/* Cover ของ Deck */}
                <View style={styles.detailCoverWrapper}>
                  {detailDeck.cover_url ? (
                    <Image source={{ uri: detailDeck.cover_url }} style={styles.detailCover} resizeMode="cover" />
                  ) : (
                    <View style={[styles.detailCover, styles.deckCoverPlaceholder]}>
                      <Ionicons name="layers-outline" size={48} color="#A335EE" />
                    </View>
                  )}
                  <TouchableOpacity style={styles.detailCloseBtn} onPress={() => setDetailModalVisible(false)}>
                    <Ionicons name="close" size={22} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.detailTitle}>{detailDeck.name}</Text>
                {detailDeck.description ? (
                  <Text style={styles.detailDesc}>{detailDeck.description}</Text>
                ) : null}

                {/* Header รายการการ์ด */}
                <View style={styles.cardListHeader}>
                  <Text style={styles.cardListTitle}>
                    การ์ดในDeck ({(detailDeck.card_ids ?? []).length})
                  </Text>
                  <TouchableOpacity style={styles.addCardBtn} onPress={openCardPicker}>
                    <Ionicons name="add-circle" size={18} color="#A335EE" />
                    <Text style={styles.addCardBtnText}>เพิ่มการ์ด</Text>
                  </TouchableOpacity>
                </View>

                {/* รายการการ์ดใน Deck — ใช้ map แทน FlatList เพราะอยู่ใน ScrollView แล้ว */}
                {(detailDeck.card_ids ?? []).length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 24, gap: 6 }}>
                    <Ionicons name="card-outline" size={40} color="#444" />
                    <Text style={{ color: "#555", fontSize: 13 }}>ยังไม่มีการ์ด กดเพิ่มการ์ดได้เลย</Text>
                  </View>
                ) : (
                  <View style={{ gap: 6 }}>
                    {(detailDeck.card_ids ?? []).map((cardId) => {
                      const card = collection.find((c) => c.id === cardId);
                      if (!card) return null;
                      return (
                        <View key={cardId} style={styles.deckCardItem}>
                          <Image source={card.image} style={styles.deckCardThumb} resizeMode="contain" />
                          <View style={styles.deckCardItemInfo}>
                            <Text style={styles.deckCardItemName} numberOfLines={1}>{card.name}</Text>
                            <Text style={[styles.deckCardItemRarity, { color: card.color }]}>{card.rarity}</Text>
                          </View>
                          <TouchableOpacity onPress={() => removeCardFromDeck(cardId)}>
                            <Ionicons name="close-circle" size={22} color="#FF3B30" />
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                )}

                <TouchableOpacity
                  style={[styles.deleteBtn]}
                  onPress={() => handleDelete(detailDeck)}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={[styles.saveText, { marginLeft: 6 }]}>ลบ Deck นี้</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════
          Modal: Card Picker (เลือกการ์ดจากคลัง)
      ══════════════════════════════════════════════ */}
      <Modal visible={cardPickerVisible} transparent animationType="slide" onRequestClose={() => setCardPickerVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: "88%", paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.pickerHeader}>
              <Text style={styles.modalTitle}>เลือกการ์ดจากคลัง</Text>
              <Text style={styles.pickerCountText}>เลือกแล้ว {selectedCardIds.length} ใบ</Text>
            </View>

            {collection.length === 0 ? (
              <View style={[styles.center, { paddingVertical: 40 }]}>
                <Ionicons name="alert-circle-outline" size={48} color="#555" />
                <Text style={{ color: "#aaa", marginTop: 8 }}>ยังไม่มีการ์ดในคลัง</Text>
                <Text style={{ color: "#555", fontSize: 12 }}>ไปสุ่มการ์ดก่อนได้เลยครับ</Text>
              </View>
            ) : (
              <FlatList
                data={collection}
                keyExtractor={(item) => item.id}
                numColumns={3}
                renderItem={renderPickerCard}
                style={{ maxHeight: 400 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
                columnWrapperStyle={{ marginBottom: 8, justifyContent: "flex-start" }}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCardPickerVisible(false)}>
                <Text style={styles.cancelText}>ยกเลิก</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, savingCards && { opacity: 0.6 }]} onPress={handleSaveCards} disabled={savingCards}>
                {savingCards ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveText}>บันทึก ({selectedCardIds.length})</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#1a1a2e",
    borderBottomWidth: 1,
    borderBottomColor: "#2a2a4a",
    gap: 12,
  },
  avatarWrapper: { position: "relative", width: 62, height: 62 },
  avatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 2, borderColor: "#A335EE" },
  avatarPlaceholder: {
    width: 62, height: 62, borderRadius: 31,
    backgroundColor: "#1e0035", borderWidth: 2, borderColor: "#A335EE",
    justifyContent: "center", alignItems: "center",
  },
  avatarEditBadge: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: "#A335EE", borderRadius: 10,
    width: 20, height: 20, justifyContent: "center", alignItems: "center",
  },
  profileLabel: { color: "#fff", fontWeight: "bold", fontSize: 15 },
  profileSubLabel: { color: "#777", fontSize: 11, marginTop: 2 },

  addBtn: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#A335EE", paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, gap: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  // List
  listContent: { padding: 14, gap: 10 },
  emptyContainer: { flex: 1 },

  // Deck Card Row
  deckCard: {
    flexDirection: "row", backgroundColor: "#1e1e35",
    borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: "#2a2a4a",
    elevation: 4,
  },
  deckCover: { width: 85, height: 85 },
  deckCoverPlaceholder: { backgroundColor: "#12002b", justifyContent: "center", alignItems: "center" },
  deckInfo: { flex: 1, padding: 10, justifyContent: "center" },
  deckName: { fontSize: 15, fontWeight: "bold", color: "#fff", marginBottom: 3 },
  deckDesc: { fontSize: 11, color: "#888", marginBottom: 6 },
  deckMeta: { flexDirection: "row", alignItems: "center" },
  deckMetaText: { fontSize: 11, color: "#888" },

  // State screens
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
  loadingText: { color: "#aaa", marginTop: 8, fontSize: 14 },
  errorText: { color: "#FF3B30", textAlign: "center", fontSize: 14, paddingHorizontal: 30 },
  retryBtn: { backgroundColor: "#A335EE", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: "#fff", fontWeight: "bold" },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#444" },
  emptySubtitle: { fontSize: 13, color: "#333" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "flex-end" },
  modalBox: {
    backgroundColor: "#1a1a2e", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#fff", textAlign: "center" },

  // Cover Picker
  coverPicker: {
    height: 120, borderRadius: 12, borderWidth: 1.5, borderColor: "#A335EE",
    borderStyle: "dashed", justifyContent: "center", alignItems: "center",
    backgroundColor: "#12002a", overflow: "hidden", gap: 6,
  },
  coverPreview: { width: "100%", height: "100%" },
  coverPickerText: { color: "#A335EE", fontSize: 13 },

  // Inputs
  input: {
    backgroundColor: "#0f0f1a", borderRadius: 10, borderWidth: 1, borderColor: "#333",
    paddingHorizontal: 14, paddingVertical: 10, color: "#fff", fontSize: 15,
  },
  inputMultiline: { height: 75, textAlignVertical: "top" },

  // Actions
  modalActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#444", alignItems: "center" },
  cancelText: { color: "#aaa", fontWeight: "bold" },
  saveBtn: {
    flex: 2, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#A335EE", alignItems: "center",
    flexDirection: "row", justifyContent: "center",
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  // ── delete button style (แยกออกมาให้ชัด)
  deleteBtn: {
    paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#3a0010", alignItems: "center",
    flexDirection: "row", justifyContent: "center",
    borderWidth: 1, borderColor: "#FF3B30",
  },
  // Deck Detail Modal
  detailCoverWrapper: { borderRadius: 14, overflow: "hidden", position: "relative" },
  detailCover: { width: "100%", height: 160 },
  detailCloseBtn: {
    position: "absolute", top: 10, right: 10,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20,
    width: 36, height: 36, justifyContent: "center", alignItems: "center",
  },
  detailTitle: { fontSize: 20, fontWeight: "bold", color: "#fff" },
  detailDesc: { fontSize: 13, color: "#888" },

  cardListHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardListTitle: { color: "#ccc", fontWeight: "bold", fontSize: 14 },
  addCardBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  addCardBtnText: { color: "#A335EE", fontWeight: "bold", fontSize: 13 },

  // Cards in Deck
  deckCardItem: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#12122a",
    borderRadius: 10, padding: 8, marginBottom: 6,
    borderWidth: 1, borderColor: "#2a2a4a",
  },
  deckCardThumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: "#1e0035" },
  deckCardItemInfo: { flex: 1, marginLeft: 10 },
  deckCardItemName: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  deckCardItemRarity: { fontSize: 11, marginTop: 2 },

  // Card Picker
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pickerCountText: { color: "#A335EE", fontWeight: "bold", fontSize: 13 },
  pickerCard: {
    flex: 1,
    backgroundColor: "#12122a",
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#2a2a4a",
    position: "relative",
    marginRight: 8,
  },
  pickerCardSelected: { borderColor: "#A335EE", backgroundColor: "#1e0035" },
  pickerThumb: { width: 56, height: 56, borderRadius: 8, marginBottom: 4 },
  pickerCardName: { color: "#ccc", fontSize: 10, textAlign: "center", marginBottom: 2 },
  pickerRarity: { fontSize: 10, fontWeight: "bold" },
  pickerCheckOverlay: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 13,
  },
});
