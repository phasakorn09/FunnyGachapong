import { Ionicons } from "@expo/vector-icons"; // สำหรับไอคอนปุ่มแทร็ก
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const setupLocation = async () => {
      // 1. ขออนุญาตเข้าถึงตำแหน่ง
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("กรุณาอนุญาตการเข้าถึงตำแหน่งเพื่อใช้งานแผนที่");
        return;
      }

      // 2. ดึงตำแหน่งปัจจุบันครั้งแรก
      let currLocation = await Location.getCurrentPositionAsync({});
      setLocation(currLocation.coords);
    };

    setupLocation(); // เรียกใช้งานฟังก์ชัน async

    // 3. ติดตามตำแหน่งแบบ Real-time
    const subscription = Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (newLoc) => {
        setLocation(newLoc.coords);
      },
    );

    return () => {
      subscription.then((sub) => sub.remove());
    };
  }, []); // <--- ต้องปิดด้วยวงเล็บและคอมม่าแบบนี้บรรทัดสุดท้ายของ useEffect

  // ฟังก์ชันสำหรับกดปุ่มแล้ววาร์ปกลับมาที่ตำแหน่งตัวเอง (Track)
  const trackMyLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.002, // ยิ่งค่าน้อยยิ่งซูมใกล้
          longitudeDelta: 0.002,
        },
        1000,
      ); // 1000ms = 1 วินาที
    }
  };

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
        >
          {/* 4. วงกลมระยะ 100 เมตร */}
          <Circle
            center={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            radius={100} // หน่วยเป็นเมตร
            fillColor="rgba(163, 53, 238, 0.2)" // สีม่วงอ่อน (ตามโทนซองการ์ด)
            strokeColor="rgba(163, 53, 238, 0.5)"
            strokeWidth={2}
          />

          {/* Marker ตัวเรา */}
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="ตำแหน่งของคุณ"
          >
            <Ionicons name="person-circle" size={40} color="#A335EE" />
          </Marker>
        </MapView>
      ) : (
        <View style={styles.loading}>
          <Text>{errorMsg || "กำลังโหลดแผนที่..."}</Text>
        </View>
      )}

      {/* 5. ปุ่มกดเพื่อแทร็กตำแหน่งตัวเอง */}
      <TouchableOpacity style={styles.trackButton} onPress={trackMyLocation}>
        <Ionicons name="locate" size={30} color="#A335EE" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: "100%", height: "100%" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  trackButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
});
