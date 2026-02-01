import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { CARD_DATABASE } from "../constants/Cards";
import { rollGacha } from "../utils/gachaLogic";

const { width } = Dimensions.get("window");

export default function GachaScreen() {
  const [card, setCard] = useState<any>(null);
  const [isRolling, setIsRolling] = useState(false);
  const glowOpacity = useSharedValue(0);

  const handleRoll = async () => {
    setIsRolling(true);
    setCard(null);
    glowOpacity.value = withRepeat(withTiming(1, { duration: 500 }), 4, true);

    setTimeout(async () => {
      const boostStatus = await AsyncStorage.getItem("@luck_boost");
      const result = rollGacha(boostStatus === "true");
      const cardsInRarity = CARD_DATABASE[result.label];
      const randomCard =
        cardsInRarity[Math.floor(Math.random() * cardsInRarity.length)];

      const newCard = {
        ...randomCard,
        id: Date.now().toString() + Math.random().toString(),
        rarity: result.label,
        color: result.color,
        rank: result.rank,
      };

      setCard(newCard);
      setIsRolling(false);
      glowOpacity.value = 0;

      const existing = await AsyncStorage.getItem("@my_collection");
      const collection = existing ? JSON.parse(existing) : [];
      await AsyncStorage.setItem(
        "@my_collection",
        JSON.stringify([...collection, newCard]),
      );
    }, 1500);
  };

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Roll</Text>

      <View style={styles.displayArea}>
        {!card && (
          <View style={styles.packWrapper}>
            <Animated.View style={[styles.glowEffect, glowStyle]} />
            <Image
              source={require("../assets/images/304975217_582301360352163_1358590354186708283_n.jpg")}
              style={styles.packImage}
            />
          </View>
        )}

        {card && (
          <View style={[styles.cardContainer, { borderColor: card.color }]}>
            <View style={styles.imageFrame}>
              <Image
                source={card.image}
                style={styles.characterImage}
                resizeMode="contain" // ใช้ cover แต่เฟรมสูงขึ้นทำให้หัวไม่ขาด
              />
            </View>
            <View style={styles.cardDetail}>
              <Text style={[styles.rarityLabel, { color: card.color }]}>
                {card.rarity}
              </Text>
              <Text style={styles.characterName}>{card.name}</Text>
            </View>
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.rollButton, isRolling && { backgroundColor: "#ccc" }]}
        onPress={handleRoll}
        disabled={isRolling}
      >
        <Text style={styles.rollButtonText}>
          {isRolling ? "กำลังเปิดซอง..." : "เริ่มสุ่มการ์ด!"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    paddingVertical: 50,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 30,
  },
  displayArea: {
    height: 450,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },

  // โซนซองการ์ด
  packWrapper: { alignItems: "center", justifyContent: "center" },
  packImage: { width: 200, height: 300, resizeMode: "contain", zIndex: 2 },
  glowEffect: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(163, 53, 238, 0.4)",
    zIndex: 1,
    elevation: 20,
  },

  // โซนการ์ดที่สุ่มได้ (แก้หัวขาด)
  cardContainer: {
    width: width * 0.75,
    height: 420,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 6,
    overflow: "hidden",
    elevation: 10,
  },
  imageFrame: { width: "100%", height: "75%", backgroundColor: "#f0f0f0" },
  characterImage: { width: "100%", height: "75%" }, // รูปจะเต็มเฟรมและหัวไม่ขาดเพราะความสูงเฟรม 75%
  cardDetail: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  rarityLabel: { fontSize: 22, fontWeight: "bold", marginBottom: 5 },
  characterName: { fontSize: 18, color: "#333" },

  rollButton: {
    marginTop: 40,
    backgroundColor: "#A335EE",
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 5,
  },
  rollButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
});
