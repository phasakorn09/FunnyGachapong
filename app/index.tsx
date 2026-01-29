import React, { useState } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Image, Modal, Animated } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// ข้อมูล Card Pool เดิม
const CARD_POOL = [
  { id: '1', name: 'Mewtwo', rarity: 'UR', chance: 5, img: 'https://placehold.co/300x420/purple/white?text=MEWTWO+UR' },
  { id: '2', name: 'Charizard', rarity: 'SR', chance: 15, img: 'https://placehold.co/300x420/red/white?text=CHARIZARD+SR' },
  { id: '3', name: 'Pikachu', rarity: 'R', chance: 30, img: 'https://placehold.co/300x420/yellow/black?text=PIKACHU+R' },
  { id: '4', name: 'Bulbasaur', rarity: 'C', chance: 50, img: 'https://placehold.co/300x420/green/white?text=BULBASAUR+C' },
];

export default function Index() {
  const [packs, setPacks] = useState([0, 1, 2]); // ลำดับของซอง
  const [isShuffling, setIsShuffling] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pulledCard, setPulledCard] = useState<any>(null);

  // ฟังก์ชันสลับลำดับซอง (Shuffle)
  const shufflePacks = () => {
    setIsShuffling(true);
    
    // จำลองการสลับ 5 ครั้งเพื่อให้ดูสมจริง
    let count = 0;
    const interval = setInterval(() => {
      setPacks(prev => [...prev].sort(() => Math.random() - 0.5));
      count++;
      if (count > 5) {
        clearInterval(interval);
        setIsShuffling(false);
      }
    }, 150);
  };

  const getRandomCard = () => {
    const totalWeight = CARD_POOL.reduce((sum, card) => sum + card.chance, 0);
    let random = Math.random() * totalWeight;
    for (const card of CARD_POOL) {
      if (random < card.chance) return card;
      random -= card.chance;
    }
    return CARD_POOL[0];
  };

  const handleOpenPack = async () => {
    if (isShuffling) return; // ห้ามกดตอนสลับอยู่

    const win = getRandomCard();
    setPulledCard(win);
    setModalVisible(true);

    try {
      const saved = await AsyncStorage.getItem('my_cards');
      const current = saved ? JSON.parse(saved) : [];
      await AsyncStorage.setItem('my_cards', JSON.stringify([...current, { ...win, instanceId: Date.now() }]));
    } catch (e) { console.error(e); }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Card Shop</Text>

      {/* ปุ่มกดสลับซอง */}
      <TouchableOpacity 
        style={[styles.shuffleButton, isShuffling && { backgroundColor: '#555' }]} 
        onPress={shufflePacks}
        disabled={isShuffling}
      >
        <Text style={styles.buttonText}>{isShuffling ? 'กำลังสลับ...' : 'สลับซองการ์ด'}</Text>
      </TouchableOpacity>
      
      <View style={styles.packContainer}>
        {packs.map((id) => (
          <TouchableOpacity 
            key={id} 
            activeOpacity={0.7} 
            onPress={handleOpenPack}
            style={styles.packWrapper}
          >
            <Image 
              source={{ uri: `https://placehold.co/120x180/${id === 1 ? 'gold' : 'blue'}/white?text=PACK` }} 
              style={styles.packImage} 
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Modal แจ้งเตือนเมื่อได้ของ */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.rarityText}>{pulledCard?.rarity}</Text>
            <Image source={{ uri: pulledCard?.img }} style={styles.winImage} />
            <Text style={styles.winName}>{pulledCard?.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>เก็บเข้าคอลเลกชัน</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: '#121212' },
  title: { fontSize: 24, color: 'white', fontWeight: 'bold', marginBottom: 20 },
  shuffleButton: { backgroundColor: '#FF4444', paddingVertical: 10, paddingHorizontal: 25, borderRadius: 25, marginBottom: 40 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  packContainer: { flexDirection: 'row', justifyContent: 'center', width: '100%' },
  packWrapper: { marginHorizontal: 10 },
  packImage: { width: 90, height: 140, borderRadius: 10, borderWidth: 1, borderColor: '#444' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { alignItems: 'center' },
  winImage: { width: 280, height: 400, borderRadius: 15 },
  winName: { fontSize: 24, color: 'white', fontWeight: 'bold', marginTop: 15 },
  rarityText: { fontSize: 32, color: '#FFD700', fontWeight: 'bold', marginBottom: 10 },
  closeButton: { marginTop: 30, backgroundColor: '#FFD700', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  closeButtonText: { fontWeight: 'bold', color: '#000' }
});