import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "./supabase";

export interface Deck {
  id: string;
  name: string;
  description: string | null;
  card_ids: string[];
  cover_url: string | null;
  created_at: string;
}

// ── Helper: อ่านไฟล์ → ArrayBuffer ผ่าน expo-file-system (ใช้ได้บน iOS/Android ทุก version)
const uriToArrayBuffer = async (uri: string): Promise<ArrayBuffer> => {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any,
  });
  return decode(base64);
};

// ── Upload ไปยัง Supabase Storage ─────────────────────────
const uploadToStorage = async (
  bucket: string,
  fileName: string,
  uri: string
): Promise<string> => {
  const arrayBuffer = await uriToArrayBuffer(uri);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, arrayBuffer, { contentType: "image/jpeg", upsert: true });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
  return data.publicUrl;
};

// ── Fetch Decks ───────────────────────────────────────────
export const fetchDecks = async (): Promise<Deck[]> => {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as Deck[];
};

// ── Create Deck ───────────────────────────────────────────
export const createDeck = async (
  name: string,
  description: string,
  cardIds: string[] = [],
  coverUrl: string | null = null
): Promise<Deck> => {
  const { data, error } = await supabase
    .from("decks")
    .insert([{ name, description, card_ids: cardIds, cover_url: coverUrl }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as Deck;
};

// ── Delete Deck ───────────────────────────────────────────
export const deleteDeck = async (id: string): Promise<void> => {
  const { error } = await supabase.from("decks").delete().eq("id", id);
  if (error) throw new Error(error.message);
};

// ── Update Deck Cards ─────────────────────────────────────
export const updateDeckCards = async (
  id: string,
  cardIds: string[]
): Promise<void> => {
  const { error } = await supabase
    .from("decks")
    .update({ card_ids: cardIds })
    .eq("id", id);
  if (error) throw new Error(error.message);
};

// ── Upload Cover Image ────────────────────────────────────
export const uploadCoverImage = async (uri: string): Promise<string> => {
  return uploadToStorage("deck-covers", `cover_${Date.now()}.jpg`, uri);
};

// ── Upload Profile Avatar ─────────────────────────────────
export const uploadProfileImage = async (uri: string): Promise<string> => {
  const url = await uploadToStorage(
    "profile-photos",
    `avatar_${Date.now()}.jpg`,
    uri
  );
  await AsyncStorage.setItem("@profile_avatar_url", url);
  return url;
};

// ── Load Profile Avatar URL ───────────────────────────────
export const loadProfileAvatarUrl = async (): Promise<string | null> => {
  return await AsyncStorage.getItem("@profile_avatar_url");
};

// ── Image Picker → Upload Cover ───────────────────────────
// FIX: เปิด ImagePicker ก่อน แล้วค่อย upload — ไม่ set loading ก่อน picker เปิด
export const pickAndUploadCover = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images' as any,
    quality: 0.7,
    allowsEditing: true,
    aspect: [16, 9],
  });

  if (result.canceled || !result.assets[0]) return null;
  return await uploadCoverImage(result.assets[0].uri);
};
