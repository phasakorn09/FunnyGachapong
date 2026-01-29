import React, { useState, useEffect } from 'react';
import { FlatList, View, Image, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. เพิ่ม Interface เพื่อบอก TypeScript ว่า "การ์ด" มีหน้าตายังไง
interface Card {
  instanceId: number;
  name: string;
  img: string;
}

export default function CollectionScreen() {
  // 2. ระบุ Type ให้กับ useState เป็นอาเรย์ของการ์ด <Card[]>
  const [myCards, setMyCards] = useState<Card[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const data = await AsyncStorage.getItem('my_cards');
      if (data) setMyCards(JSON.parse(data));
    };
    loadData();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={myCards}
        numColumns={3}
        keyExtractor={(item) => item.instanceId.toString()}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <Image source={{ uri: item.img }} style={styles.image} />
            <Text style={styles.name}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
}

// 3. อย่าลืมเพิ่ม Styles ด้านล่างเพื่อหายตัวแดงที่ styles.xxx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  cardItem: { flex: 1/3, margin: 5, alignItems: 'center' },
  image: { width: 100, height: 140, borderRadius: 10 },
  name: { fontSize: 12, fontWeight: 'bold', marginTop: 5 }
});